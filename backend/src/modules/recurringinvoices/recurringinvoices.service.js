const prisma = require('../../config/prisma');

const NEXT_RUN = {
  WEEKLY:    (d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; },
  MONTHLY:   (d) => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; },
  QUARTERLY: (d) => { const n = new Date(d); n.setMonth(n.getMonth() + 3); return n; },
  YEARLY:    (d) => { const n = new Date(d); n.setFullYear(n.getFullYear() + 1); return n; },
};

const list = async (tenantId) =>
  prisma.recurringInvoice.findMany({
    where: { tenantId },
    include: { customer: { select: { id: true, name: true, phone: true } } },
    orderBy: { nextRunDate: 'asc' },
  });

const create = async (tenantId, data) => {
  const { customerId, frequency, nextRunDate, items, notes, terms } = data;
  if (!frequency || !nextRunDate || !items?.length) {
    throw Object.assign(new Error('frequency, nextRunDate and items are required'), { status: 400 });
  }
  return prisma.recurringInvoice.create({
    data: { tenantId, customerId: customerId || null, frequency, nextRunDate: new Date(nextRunDate), items, notes, terms },
    include: { customer: { select: { id: true, name: true } } },
  });
};

const update = async (tenantId, id, data) => {
  await prisma.recurringInvoice.findFirstOrThrow({ where: { id, tenantId } });
  const { frequency, nextRunDate, items, notes, terms, customerId } = data;
  return prisma.recurringInvoice.update({
    where: { id },
    data: {
      ...(frequency && { frequency }),
      ...(nextRunDate && { nextRunDate: new Date(nextRunDate) }),
      ...(items && { items }),
      ...(notes !== undefined && { notes }),
      ...(terms !== undefined && { terms }),
      ...(customerId !== undefined && { customerId: customerId || null }),
    },
  });
};

const toggle = async (tenantId, id) => {
  const rec = await prisma.recurringInvoice.findFirstOrThrow({ where: { id, tenantId } });
  return prisma.recurringInvoice.update({ where: { id }, data: { isActive: !rec.isActive } });
};

const remove = async (tenantId, id) => {
  await prisma.recurringInvoice.findFirstOrThrow({ where: { id, tenantId } });
  return prisma.recurringInvoice.delete({ where: { id } });
};

// Called by cron or manually — generates invoices for all due recurring invoices
const generateDue = async (tenantId) => {
  const now = new Date();
  const where = tenantId
    ? { tenantId, isActive: true, nextRunDate: { lte: now } }
    : { isActive: true, nextRunDate: { lte: now } };

  const due = await prisma.recurringInvoice.findMany({
    where,
    include: { customer: true, tenant: { select: { id: true, name: true } } },
  });

  const created = [];

  for (const rec of due) {
    try {
      const items = Array.isArray(rec.items) ? rec.items : [];
      const subtotal = items.reduce((s, it) => s + Number(it.quantity || 1) * Number(it.unitPrice || 0), 0);
      const taxAmount = items.reduce((s, it) => s + Number(it.quantity || 1) * Number(it.unitPrice || 0) * Number(it.taxRate || 0) / 100, 0);
      const total = subtotal + taxAmount;

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const seq = await prisma.invoice.count({ where: { tenantId: rec.tenantId } }) + 1;
      const invoiceNumber = `INV-${year}${month}-${String(seq).padStart(4, '0')}`;

      const invoice = await prisma.invoice.create({
        data: {
          tenantId: rec.tenantId,
          customerId: rec.customerId,
          invoiceNumber,
          issueDate: now,
          dueDate: new Date(now.getTime() + 30 * 86400000),
          status: 'SENT',
          subtotal,
          discountAmount: 0,
          taxAmount,
          total,
          balanceDue: total,
          amountPaid: 0,
          notes: rec.notes,
          terms: rec.terms,
          items: {
            create: items.map(it => ({
              description: it.description || 'Service',
              quantity: Number(it.quantity || 1),
              unitPrice: Number(it.unitPrice || 0),
              taxRate: Number(it.taxRate || 0),
              taxAmount: Number(it.quantity || 1) * Number(it.unitPrice || 0) * Number(it.taxRate || 0) / 100,
              total: Number(it.quantity || 1) * Number(it.unitPrice || 0) * (1 + Number(it.taxRate || 0) / 100),
            })),
          },
        },
      });

      const nextRun = NEXT_RUN[rec.frequency]?.(rec.nextRunDate) || NEXT_RUN.MONTHLY(rec.nextRunDate);
      await prisma.recurringInvoice.update({
        where: { id: rec.id },
        data: { lastRunDate: now, nextRunDate: nextRun },
      });

      created.push({ recurringId: rec.id, invoiceId: invoice.id, invoiceNumber });
    } catch (err) {
      console.error(`Failed to generate invoice for recurring ${rec.id}:`, err.message);
    }
  }

  return { generated: created.length, invoices: created };
};

module.exports = { list, create, update, toggle, remove, generateDue };
