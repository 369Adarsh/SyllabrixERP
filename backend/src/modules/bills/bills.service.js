const prisma = require('../../config/prisma');

let billCounter = {};

const generateBillNumber = async (tenantId) => {
  const count = await prisma.vendorBill.count({ where: { tenantId } });
  return `BILL-${String(count + 1).padStart(4, '0')}`;
};

const list = (tenantId, { vendorId, status } = {}) => {
  const where = { tenantId };
  if (vendorId) where.vendorId = vendorId;
  if (status) where.status = status;
  return prisma.vendorBill.findMany({
    where,
    include: { vendor: { select: { id: true, name: true } }, items: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });
};

const get = (tenantId, id) =>
  prisma.vendorBill.findUnique({
    where: { id, tenantId },
    include: { vendor: true, items: true, payments: true },
  });

const create = async (tenantId, { vendorId, dueDate, notes, items = [], taxAmount = 0 }) => {
  const billNumber = await generateBillNumber(tenantId);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const itemTax = items.reduce((s, i) => s + (i.taxAmount || 0), 0);
  const tax = taxAmount || itemTax;
  const total = subtotal + tax;

  return prisma.vendorBill.create({
    data: {
      tenantId, vendorId: vendorId || null, billNumber,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes, subtotal, taxAmount: tax, total, balanceDue: total,
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
    include: { vendor: true, items: true },
  });
};

const recordPayment = async (tenantId, billId, { amount, method = 'BANK', reference, notes }) => {
  const bill = await prisma.vendorBill.findUnique({ where: { id: billId, tenantId } });
  if (!bill) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });

  const newPaid = bill.amountPaid + Number(amount);
  const newBalance = Math.max(0, bill.total - newPaid);
  const status = newBalance <= 0 ? 'PAID' : 'PARTIAL';

  const [payment] = await prisma.$transaction([
    prisma.vendorBillPayment.create({ data: { billId, amount: Number(amount), method, reference, notes } }),
    prisma.vendorBill.update({ where: { id: billId }, data: { amountPaid: newPaid, balanceDue: newBalance, status } }),
  ]);
  return payment;
};

const markOverdue = async () => {
  await prisma.vendorBill.updateMany({
    where: { status: 'PENDING', dueDate: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  });
};

const remove = (tenantId, id) =>
  prisma.vendorBill.update({ where: { id, tenantId }, data: { status: 'CANCELLED' } });

const summary = async (tenantId) => {
  const [pending, overdue, paidMonth] = await Promise.all([
    prisma.vendorBill.aggregate({ where: { tenantId, status: { in: ['PENDING', 'PARTIAL'] } }, _sum: { balanceDue: true }, _count: true }),
    prisma.vendorBill.aggregate({ where: { tenantId, status: 'OVERDUE' }, _sum: { balanceDue: true }, _count: true }),
    prisma.vendorBill.aggregate({ where: { tenantId, status: 'PAID', updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { total: true } }),
  ]);
  return {
    pendingAmount: pending._sum.balanceDue || 0,
    pendingCount: pending._count,
    overdueAmount: overdue._sum.balanceDue || 0,
    overdueCount: overdue._count,
    paidThisMonth: paidMonth._sum.total || 0,
  };
};

module.exports = { list, get, create, recordPayment, remove, summary };
