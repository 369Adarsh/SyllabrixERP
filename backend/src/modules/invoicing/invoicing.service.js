const prisma = require('../../config/prisma');
const { generateInvoiceNumber } = require('../../utils/generateNumber');
const { calculateLineItem, formatInvoiceTotals } = require('../../utils/gst');

const list = (tenantId, { status, customerId, from, to } = {}) => {
  const where = { tenantId };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (from || to) {
    where.issueDate = {};
    if (from) where.issueDate.gte = new Date(from);
    if (to) where.issueDate.lte = new Date(to);
  }
  return prisma.invoice.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });
};

const get = (tenantId, id) =>
  prisma.invoice.findUnique({
    where: { id, tenantId },
    include: { customer: true, items: { include: { product: true } }, payments: true },
  });

const create = async (tenantId, data) => {
  const invoiceNumber = await generateInvoiceNumber(tenantId);
  const { customerId, items: rawItems, dueDate, notes, terms, isInterState = false, discountAmount = 0 } = data;

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

  const gstDetails = {
    isInterState,
    items: items.map((i) => ({
      description: i.description,
      taxRate: i.taxRate,
      taxableAmount: i._subtotal - (i._subtotal * (i.discount / 100)),
      taxAmount: i.taxAmount,
    })),
  };

  return prisma.invoice.create({
    data: {
      tenantId, customerId, invoiceNumber, dueDate: dueDate ? new Date(dueDate) : null,
      notes, terms, gstDetails,
      subtotal: totals.subtotal,
      discountAmount,
      taxAmount: totals.taxAmount,
      total: totals.total - discountAmount,
      balanceDue: totals.total - discountAmount,
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

  const newPaid = invoice.amountPaid + amount;
  const newBalance = invoice.total - newPaid;
  const status = newBalance <= 0 ? 'PAID' : 'SENT';

  const [payment] = await prisma.$transaction([
    prisma.payment.create({ data: { invoiceId, amount, method, reference, notes } }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { amountPaid: newPaid, balanceDue: Math.max(0, newBalance), status },
    }),
  ]);

  return payment;
};

const remove = (tenantId, id) =>
  prisma.invoice.update({ where: { id, tenantId }, data: { status: 'CANCELLED' } });

module.exports = { list, get, create, updateStatus, recordPayment, remove };
