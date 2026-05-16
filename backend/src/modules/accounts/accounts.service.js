const prisma = require('../../config/prisma');

const listAccounts = (tenantId) =>
  prisma.bankAccount.findMany({ where: { tenantId, isActive: true }, include: { _count: { select: { transactions: true } } }, orderBy: { createdAt: 'asc' } });

const createAccount = (tenantId, { name, bankName, accountNumber, ifscCode, accountType = 'CURRENT', openingBalance = 0 }) =>
  prisma.bankAccount.create({
    data: { tenantId, name, bankName, accountNumber, ifscCode, accountType, openingBalance: Number(openingBalance), currentBalance: Number(openingBalance) },
  });

const updateAccount = (tenantId, id, data) =>
  prisma.bankAccount.update({ where: { id, tenantId }, data });

const deleteAccount = (tenantId, id) =>
  prisma.bankAccount.update({ where: { id, tenantId }, data: { isActive: false } });

const getTransactions = (accountId, { from, to } = {}) => {
  const where = { accountId };
  if (from || to) { where.date = {}; if (from) where.date.gte = new Date(from); if (to) where.date.lte = new Date(to); }
  return prisma.bankTransaction.findMany({ where, orderBy: { date: 'desc' } });
};

const addTransaction = async (tenantId, accountId, { type, amount, description, reference, category, date }) => {
  const account = await prisma.bankAccount.findUnique({ where: { id: accountId, tenantId } });
  if (!account) throw Object.assign(new Error('Account not found'), { statusCode: 404 });

  const amt = Number(amount);
  const newBalance = type === 'CREDIT' ? account.currentBalance + amt : account.currentBalance - amt;

  const [txn] = await prisma.$transaction([
    prisma.bankTransaction.create({ data: { accountId, type, amount: amt, description, reference, category, date: date ? new Date(date) : new Date() } }),
    prisma.bankAccount.update({ where: { id: accountId }, data: { currentBalance: newBalance } }),
  ]);
  return txn;
};

const totalBalance = async (tenantId) => {
  const accounts = await prisma.bankAccount.findMany({ where: { tenantId, isActive: true }, select: { currentBalance: true } });
  return accounts.reduce((s, a) => s + a.currentBalance, 0);
};

module.exports = { listAccounts, createAccount, updateAccount, deleteAccount, getTransactions, addTransaction, totalBalance };
