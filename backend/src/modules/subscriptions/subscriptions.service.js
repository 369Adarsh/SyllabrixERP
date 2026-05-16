const prisma = require('../../config/prisma');

const list = (tenantId, customerId) =>
  prisma.customerSubscription.findMany({
    where: { tenantId, customerId },
    orderBy: { expiryDate: 'desc' },
  });

const create = (tenantId, customerId, data) => {
  const { planName, startDate, expiryDate, amount, autoRenew, notes } = data;
  return prisma.customerSubscription.create({
    data: {
      tenantId,
      customerId,
      planName,
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      amount: parseFloat(amount),
      autoRenew: autoRenew !== false,
      notes,
    },
  });
};

const updateStatus = (tenantId, id, status) =>
  prisma.customerSubscription.update({
    where: { id, tenantId },
    data: { status },
  });

const remove = (tenantId, id) =>
  prisma.customerSubscription.delete({ where: { id, tenantId } });

// Find subscriptions expiring within `days` days (for reminders)
const getExpiring = async (tenantId, days = 7) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return prisma.customerSubscription.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      expiryDate: { gte: now, lte: cutoff },
    },
    include: { customer: true },
    orderBy: { expiryDate: 'asc' },
  });
};

// Auto-expire subscriptions past their expiryDate
const autoExpire = async (tenantId) => {
  const result = await prisma.customerSubscription.updateMany({
    where: { tenantId, status: 'ACTIVE', expiryDate: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
  return result.count;
};

module.exports = { list, create, updateStatus, remove, getExpiring, autoExpire };
