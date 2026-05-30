const prisma = require('../../config/prisma');
const { generateInvoiceNumber } = require('../../utils/generateNumber');

const generateQuoteNumber = async (tenantId) => {
  const count = await prisma.quotation.count({ where: { tenantId } });
  return `QT-${String(count + 1).padStart(4, '0')}`;
};

const list = (tenantId, { customerId, status, branchId } = {}) => {
  const where = { tenantId };
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;
  if (branchId) where.branchId = branchId;
  return prisma.quotation.findMany({
    where,
    include: { customer: { select: { id: true, name: true } }, items: true },
    orderBy: { createdAt: 'desc' },
  });
};

const get = (tenantId, id) =>
  prisma.quotation.findUnique({
    where: { id, tenantId },
    include: { customer: true, items: true },
  });

const create = async (tenantId, { customerId, branchId, expiryDate, notes, terms, items = [], discountAmount = 0 }) => {
  const quotationNumber = await generateQuoteNumber(tenantId);
  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const taxAmount = items.reduce((s, i) => s + (i.taxAmount || 0), 0);
  const total = subtotal + taxAmount - Number(discountAmount);

  return prisma.quotation.create({
    data: {
      tenantId, customerId: customerId || null, quotationNumber,
      ...(branchId && { branchId }),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      notes, terms, subtotal, discountAmount: Number(discountAmount), taxAmount, total,
      items: {
        create: items.map(i => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discount: i.discount || 0,
          taxRate: i.taxRate || 0,
          taxAmount: i.taxAmount || 0,
          total: Number(i.quantity) * Number(i.unitPrice) + (i.taxAmount || 0),
        })),
      },
    },
    include: { customer: true, items: true },
  });
};

const updateStatus = (tenantId, id, status) =>
  prisma.quotation.update({ where: { id, tenantId }, data: { status } });

// Convert accepted quotation → Invoice
const convertToInvoice = async (tenantId, id) => {
  const quote = await prisma.quotation.findUnique({ where: { id, tenantId }, include: { items: true } });
  if (!quote) throw Object.assign(new Error('Quotation not found'), { statusCode: 404 });
  if (quote.status === 'CONVERTED') throw Object.assign(new Error('Already converted'), { statusCode: 400 });

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      customerId: quote.customerId,
      invoiceNumber,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      total: quote.total,
      balanceDue: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      items: {
        create: quote.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
          taxRate: i.taxRate,
          taxAmount: i.taxAmount,
          total: i.total,
        })),
      },
    },
    include: { customer: true, items: true },
  });

  await prisma.quotation.update({
    where: { id },
    data: { status: 'CONVERTED', convertedInvoiceId: invoice.id },
  });

  return invoice;
};

module.exports = { list, get, create, updateStatus, convertToInvoice };
