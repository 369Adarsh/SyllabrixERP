const prisma = require('../../config/prisma');

const list = (tenantId, { category, from, to, method } = {}) => {
  const where = { tenantId };
  if (category) where.category = category;
  if (method) where.method = method;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  return prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
};

const create = (tenantId, data) =>
  prisma.expense.create({
    data: { ...data, tenantId, date: data.date ? new Date(data.date) : new Date(), amount: Number(data.amount) },
  });

const update = (tenantId, id, data) => {
  const allowed = ['category', 'description', 'amount', 'date', 'method', 'reference', 'notes'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  if (payload.date) payload.date = new Date(payload.date);
  if (payload.amount) payload.amount = Number(payload.amount);
  return prisma.expense.update({ where: { id, tenantId }, data: payload });
};

const remove = (tenantId, id) =>
  prisma.expense.delete({ where: { id, tenantId } });

const summary = async (tenantId, { from, to } = {}) => {
  const where = { tenantId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  const [total, byCategory] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
    prisma.expense.groupBy({ by: ['category'], where, _sum: { amount: true }, _count: true }),
  ]);
  return { total: total._sum.amount || 0, count: total._count, byCategory };
};

module.exports = { list, create, update, remove, summary };
