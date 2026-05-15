const prisma = require('../../config/prisma');

const dateRange = (from, to) => ({
  gte: from ? new Date(from) : new Date(new Date().setDate(1)), // default: start of current month
  lte: to ? new Date(to) : new Date(),
});

const dashboard = async (tenantId) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todaySales, monthSales, totalCustomers, totalProducts,
    pendingInvoices, overdueInvoices, lowStockCount,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { tenantId, createdAt: { gte: startOfDay } },
      _sum: { total: true }, _count: true,
    }),
    prisma.transaction.aggregate({
      where: { tenantId, createdAt: { gte: startOfMonth } },
      _sum: { total: true }, _count: true,
    }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.product.count({ where: { tenantId, isActive: true } }),
    prisma.invoice.count({ where: { tenantId, status: 'SENT' } }),
    prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
    prisma.product.count({
      where: { tenantId, isActive: true, stock: { lte: 5 } },
    }),
  ]);

  return {
    today: {
      revenue: todaySales._sum.total || 0,
      transactions: todaySales._count,
    },
    month: {
      revenue: monthSales._sum.total || 0,
      transactions: monthSales._count,
    },
    customers: totalCustomers,
    products: totalProducts,
    pendingInvoices,
    overdueInvoices,
    lowStockProducts: lowStockCount,
  };
};

const salesReport = async (tenantId, { from, to, groupBy = 'day' } = {}) => {
  const range = dateRange(from, to);
  const transactions = await prisma.transaction.findMany({
    where: { tenantId, createdAt: range },
    select: { total: true, taxAmount: true, discountAmount: true, paymentMethod: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = {};
  for (const t of transactions) {
    let key;
    const d = new Date(t.createdAt);
    if (groupBy === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    else key = d.toISOString().split('T')[0];

    if (!grouped[key]) grouped[key] = { date: key, revenue: 0, transactions: 0, tax: 0, discount: 0 };
    grouped[key].revenue += t.total;
    grouped[key].transactions += 1;
    grouped[key].tax += t.taxAmount;
    grouped[key].discount += t.discountAmount;
  }

  const summary = {
    totalRevenue: transactions.reduce((s, t) => s + t.total, 0),
    totalTransactions: transactions.length,
    totalTax: transactions.reduce((s, t) => s + t.taxAmount, 0),
    byPaymentMethod: transactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
      return acc;
    }, {}),
  };

  return { summary, data: Object.values(grouped) };
};

const invoiceReport = async (tenantId, { from, to } = {}) => {
  const range = dateRange(from, to);
  const [totals, byStatus] = await Promise.all([
    prisma.invoice.aggregate({
      where: { tenantId, issueDate: range },
      _sum: { total: true, amountPaid: true, balanceDue: true },
      _count: true,
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: { tenantId, issueDate: range },
      _count: true,
      _sum: { total: true },
    }),
  ]);
  return { totals, byStatus };
};

const topProducts = async (tenantId, { from, to, limit = 10 } = {}) => {
  const range = dateRange(from, to);
  const items = await prisma.transactionItem.findMany({
    where: { transaction: { tenantId, createdAt: range } },
    include: { product: { select: { name: true, sku: true } } },
  });

  const aggregated = {};
  for (const i of items) {
    const k = i.productId;
    if (!aggregated[k]) aggregated[k] = { product: i.product, qty: 0, revenue: 0 };
    aggregated[k].qty += i.quantity;
    aggregated[k].revenue += i.total;
  }

  return Object.values(aggregated)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, Number(limit));
};

const topCustomers = async (tenantId, { limit = 10 } = {}) =>
  prisma.customer.findMany({
    where: { tenantId },
    orderBy: { totalSpent: 'desc' },
    take: Number(limit),
  });

module.exports = { dashboard, salesReport, invoiceReport, topProducts, topCustomers };
