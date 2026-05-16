const prisma = require('../../config/prisma');

const generateCNNumber = async (tenantId) => {
  const count = await prisma.creditNote.count({ where: { tenantId } });
  return `CN-${String(count + 1).padStart(4, '0')}`;
};

const list = (tenantId, { customerId, status } = {}) => {
  const where = { tenantId };
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;
  return prisma.creditNote.findMany({
    where,
    include: { customer: { select: { id: true, name: true } }, invoice: { select: { id: true, invoiceNumber: true } }, items: true },
    orderBy: { createdAt: 'desc' },
  });
};

const get = (tenantId, id) =>
  prisma.creditNote.findUnique({
    where: { id, tenantId },
    include: { customer: true, invoice: true, items: true },
  });

const create = async (tenantId, { invoiceId, customerId, reason, notes, items = [] }) => {
  const creditNoteNumber = await generateCNNumber(tenantId);
  const total = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice) + (i.taxAmount || 0)), 0);

  return prisma.creditNote.create({
    data: {
      tenantId,
      invoiceId: invoiceId || null,
      customerId: customerId || null,
      creditNoteNumber,
      total,
      reason,
      notes,
      items: {
        create: items.map(i => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          taxRate: i.taxRate || 0,
          taxAmount: i.taxAmount || 0,
          total: Number(i.quantity) * Number(i.unitPrice) + (i.taxAmount || 0),
        })),
      },
    },
    include: { customer: true, invoice: true, items: true },
  });
};

const updateStatus = (tenantId, id, status) =>
  prisma.creditNote.update({ where: { id, tenantId }, data: { status } });

module.exports = { list, get, create, updateStatus };
