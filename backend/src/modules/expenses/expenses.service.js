const prisma = require('../../config/prisma');

const list = (tenantId, { category, from, to, method, branchId } = {}) => {
  const where = { tenantId };
  if (category) where.category = category;
  if (method)   where.method   = method;
  if (branchId) where.branchId = branchId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }
  return prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
};

const create = (tenantId, data) => {
  const tdsApplicable = !!data.tdsApplicable;
  const tdsRate  = tdsApplicable ? Number(data.tdsRate  || 0) : 0;
  const tdsAmount = tdsApplicable ? Number(data.tdsAmount || 0) : 0;
  const { branchId, ...rest } = data;
  return prisma.expense.create({
    data: { ...rest, tenantId, date: data.date ? new Date(data.date) : new Date(), amount: Number(data.amount), tdsApplicable, tdsRate, tdsAmount, ...(branchId && { branchId }) },
  });
};

const update = (tenantId, id, data) => {
  const allowed = ['category', 'description', 'amount', 'date', 'method', 'reference', 'notes', 'tdsApplicable', 'tdsRate', 'tdsAmount'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  if (payload.date) payload.date = new Date(payload.date);
  if (payload.amount) payload.amount = Number(payload.amount);
  if (payload.tdsApplicable !== undefined) payload.tdsApplicable = !!payload.tdsApplicable;
  if (payload.tdsRate)   payload.tdsRate   = Number(payload.tdsRate);
  if (payload.tdsAmount) payload.tdsAmount = Number(payload.tdsAmount);
  return prisma.expense.update({ where: { id, tenantId }, data: payload });
};

const remove = (tenantId, id) =>
  prisma.expense.delete({ where: { id, tenantId } });

const setReceipt = (tenantId, id, receiptUrl) =>
  prisma.expense.update({ where: { id, tenantId }, data: { receipt: receiptUrl } });

const clearReceipt = (tenantId, id) =>
  prisma.expense.update({ where: { id, tenantId }, data: { receipt: null } });

const summary = async (tenantId, { from, to, category, method, branchId } = {}) => {
  const where = { tenantId };
  if (category) where.category = category;
  if (method)   where.method   = method;
  if (branchId) where.branchId = branchId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const [total, byCategory, monthAgg] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
    prisma.expense.groupBy({ by: ['category'], where, _sum: { amount: true }, _count: true }),
    prisma.expense.aggregate({ where: { tenantId, date: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
  ]);
  return { total: total._sum.amount || 0, count: total._count, byCategory, thisMonth: monthAgg._sum.amount || 0 };
};

module.exports = { list, create, update, remove, summary, setReceipt, clearReceipt };
