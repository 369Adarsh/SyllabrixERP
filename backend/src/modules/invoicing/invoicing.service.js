const prisma = require('../../config/prisma');
const config = require('../../config/env');
const { generateInvoiceNumber } = require('../../utils/generateNumber');
const { calculateLineItem, formatInvoiceTotals } = require('../../utils/gst');

const list = async (tenantId, { status, customerId, from, to, page, limit = 50, branchId } = {}) => {
  const where = { tenantId };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (branchId) where.branchId = branchId;
  if (from || to) {
    where.issueDate = {};
    if (from) where.issueDate.gte = new Date(from);
    if (to) where.issueDate.lte = new Date(to);
  }
  if (!page) {
    return prisma.invoice.findMany({ where, include: { customer: true }, orderBy: { createdAt: 'desc' } });
  }
  const p = Number(page), l = Number(limit);
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({ where, include: { customer: true }, orderBy: { createdAt: 'desc' }, skip: (p - 1) * l, take: l }),
    prisma.invoice.count({ where }),
  ]);
  return { invoices, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
};

const get = (tenantId, id) =>
  prisma.invoice.findUnique({
    where: { id, tenantId },
    include: { customer: true, items: { include: { product: true } }, payments: true },
  });

const create = async (tenantId, data) => {
  const invoiceNumber = await generateInvoiceNumber();
  const { customerId, branchId, items: rawItems, dueDate, notes, terms, isInterState = false, discountAmount = 0 } = data;

  const items = rawItems.map((i) => {
    const calc = calculateLineItem(i.quantity, i.unitPrice, i.discount || 0, i.taxRate || 0, isInterState);
    return {
      productId: i.productId || null,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount || 0,
      taxRate: i.taxRate || 0,
      taxAmount: calc.taxAmount,
      total: calc.total,
      _subtotal: calc.subtotal,
    };
  });

  const totals = formatInvoiceTotals(items.map((i) => ({
    subtotal: i._subtotal, discountAmount: 0, taxAmount: i.taxAmount, total: i.total,
  })));

  // Indian GST compliance: header discount reduces the taxable base, not applied post-tax
  const headerDisc = Number(discountAmount) || 0;
  const preTaxBase = totals.total - totals.taxAmount; // sum of per-line taxable amounts
  const adjustedTaxableBase = Math.max(0, preTaxBase - headerDisc);
  const adjustedTaxAmount = preTaxBase > 0
    ? Math.round(adjustedTaxableBase * (totals.taxAmount / preTaxBase) * 100) / 100
    : 0;
  const finalTotal = Math.round((adjustedTaxableBase + adjustedTaxAmount) * 100) / 100;

  const gstDetails = {
    isInterState,
    items: items.map((i) => ({
      description: i.description,
      taxRate: i.taxRate,
      taxableAmount: i._subtotal - (i._subtotal * (i.discount / 100)),
      taxAmount: i.taxAmount,
    })),
    headerDiscount: headerDisc,
    adjustedTaxableBase,
    adjustedTax: adjustedTaxAmount,
  };

  return prisma.invoice.create({
    data: {
      tenantId, customerId, invoiceNumber, dueDate: dueDate ? new Date(dueDate) : null,
      notes, terms, gstDetails, ...(branchId && { branchId }),
      subtotal: totals.subtotal,
      discountAmount: headerDisc,
      taxAmount: adjustedTaxAmount,
      total: finalTotal,
      balanceDue: finalTotal,
      items: { create: items.map(({ _subtotal, ...i }) => i) },
    },
    include: { customer: true, items: true },
  });
};

const updateStatus = async (tenantId, id, status) => {
  return prisma.invoice.update({ where: { id, tenantId }, data: { status } });
};

const recordPayment = async (tenantId, invoiceId, { amount, method, reference, notes }) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId, tenantId } });
  if (!invoice) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  if (invoice.status === 'CANCELLED') throw Object.assign(new Error('Cannot record payment on a cancelled invoice'), { statusCode: 400 });
  if (invoice.status === 'DRAFT') throw Object.assign(new Error('Send the invoice before recording payment'), { statusCode: 400 });

  const newPaid = invoice.amountPaid + Number(amount);
  const newBalance = invoice.total - newPaid;
  // Preserve OVERDUE status on partial payment; only PAID clears it
  const status = newBalance <= 0 ? 'PAID' : (invoice.status === 'OVERDUE' ? 'OVERDUE' : 'SENT');

  const ops = [
    prisma.payment.create({ data: { invoiceId, amount, method, reference, notes } }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { amountPaid: newPaid, balanceDue: Math.max(0, newBalance), status },
    }),
  ];

  // Keep customer lifetime value accurate
  if (invoice.customerId) {
    ops.push(prisma.customer.update({
      where: { id: invoice.customerId },
      data: { totalSpent: { increment: amount } },
    }));
  }

  const [payment] = await prisma.$transaction(ops);
  return payment;
};

const remove = (tenantId, id) =>
  prisma.invoice.update({ where: { id, tenantId }, data: { status: 'CANCELLED' } });

const createPaymentLink = async (tenantId, invoiceId) => {
  const keyId = config.razorpayKeyId;
  const keySecret = config.razorpayKeySecret;
  if (!keyId || !keySecret) throw Object.assign(new Error('Razorpay keys not configured. Add them via Nerve Center → API Keys.'), { statusCode: 503 });

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId },
    include: { customer: { select: { name: true, phone: true, email: true } } },
  });
  if (!invoice) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  if (invoice.status === 'PAID') throw Object.assign(new Error('Invoice is already paid'), { statusCode: 400 });

  // Return existing active link without creating a new one
  if (invoice.razorpayLinkUrl && !['expired', 'cancelled'].includes(invoice.razorpayLinkStatus)) {
    return { linkUrl: invoice.razorpayLinkUrl, linkId: invoice.razorpayLinkId, isExisting: true };
  }

  const amountPaise = Math.round((invoice.balanceDue || invoice.total) * 100);
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const payload = {
    amount: amountPaise,
    currency: 'INR',
    accept_partial: false,
    description: `Invoice ${invoice.invoiceNumber}`,
    reference_id: invoice.id,
    notify: { sms: false, email: false },
    reminder_enable: true,
    callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/invoices`,
    callback_method: 'get',
  };

  if (invoice.customer) {
    payload.customer = { name: invoice.customer.name };
    if (invoice.customer.phone) {
      payload.customer.contact = `+91${invoice.customer.phone.replace(/^\+91|^0/, '')}`;
      payload.notify.sms = true;
    }
    if (invoice.customer.email) {
      payload.customer.email = invoice.customer.email;
      payload.notify.email = true;
    }
  }

  const rzpRes = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify(payload),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.json();
    throw Object.assign(new Error(err.error?.description || 'Razorpay returned an error'), { statusCode: 502 });
  }

  const data = await rzpRes.json();

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      razorpayLinkId: data.id,
      razorpayLinkUrl: data.short_url,
      razorpayLinkStatus: data.status,
      status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
    },
  });

  return { linkUrl: data.short_url, linkId: data.id };
};

const handlePaymentLinkPaid = async (payload) => {
  const linkId = payload?.payment_link?.entity?.id;
  const amountPaid = (payload?.payment_link?.entity?.amount_paid || 0) / 100;
  const paymentId = payload?.payment?.entity?.id;
  if (!linkId || amountPaid <= 0) return;

  const invoice = await prisma.invoice.findFirst({ where: { razorpayLinkId: linkId } });
  if (!invoice) return;

  const newPaid = Math.min(invoice.total, invoice.amountPaid + amountPaid);
  const newBalance = Math.max(0, invoice.total - newPaid);
  const status = newBalance <= 0 ? 'PAID' : 'SENT';

  await prisma.$transaction([
    prisma.payment.create({
      data: { invoiceId: invoice.id, amount: amountPaid, method: 'UPI', reference: paymentId || linkId, notes: 'Razorpay payment link' },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid: newPaid, balanceDue: newBalance, status, razorpayLinkStatus: 'paid' },
    }),
  ]);
};

module.exports = { list, get, create, updateStatus, recordPayment, remove, createPaymentLink, handlePaymentLinkPaid };
