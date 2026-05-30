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

  const ops = [
    prisma.creditNote.create({
      data: {
        tenantId,
        invoiceId: invoiceId || null,
        customerId: customerId || null,
        creditNoteNumber,
        total,
        status: 'DRAFT',
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
    }),
  ];

  // Immediately reduce invoice outstanding balance when CN is linked to an invoice
  if (invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId, tenantId } });
    if (invoice) {
      const newBalance = Math.max(0, invoice.balanceDue - total);
      const newStatus = newBalance <= 0 ? 'PAID' : invoice.status;
      ops.push(
        prisma.invoice.update({
          where: { id: invoiceId },
          data: { balanceDue: newBalance, status: newStatus },
        })
      );
    }
  }

  const [creditNote] = await prisma.$transaction(ops);
  return creditNote;
};

const updateStatus = async (tenantId, id, status) => {
  const cn = await prisma.creditNote.findUnique({
    where: { id, tenantId },
    select: { id: true, invoiceId: true, total: true, status: true },
  });
  if (!cn) throw Object.assign(new Error('Credit note not found'), { statusCode: 404 });

  const ops = [prisma.creditNote.update({ where: { id, tenantId }, data: { status } })];

  // Voiding a credit note restores the invoice balance it had reduced
  if (status === 'VOID' && cn.status !== 'VOID' && cn.invoiceId) {
    ops.push(
      prisma.invoice.update({
        where: { id: cn.invoiceId },
        data: { balanceDue: { increment: cn.total }, status: 'SENT' },
      })
    );
  }

  const [updated] = await prisma.$transaction(ops);
  return updated;
};

module.exports = { list, get, create, updateStatus };
