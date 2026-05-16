const prisma = require('../../config/prisma');

const dateRange = (from, to) => ({
  gte: from ? new Date(from) : new Date(new Date().setDate(1)),
  lte: to ? new Date(to) : new Date(),
});

// ── Dashboard profile group constants ────────────────────────────────────────
const PROFILE_POS_RETAIL    = ['RETAIL', 'KIRANA', 'RESTAURANT', 'WORKSHOP', 'MEDICAL_STORE', 'STATIONARY', 'SWEET_SHOP', 'BAKERY', 'JEWELLERY', 'HARDWARE', 'ELECTRICAL', 'CLOTHING', 'FOOTWEAR', 'ELECTRONICS', 'BOOKSTORE', 'FLORIST', 'DHABA', 'CLOUD_KITCHEN', 'JUICE_BAR', 'CANTEEN_MESS', 'DEALER', 'COURIER', 'OTHER'];
const PROFILE_SALON_POS     = ['SALON', 'BEAUTY_PARLOUR', 'BARBERSHOP', 'MOBILE_REPAIR', 'OPTICAL', 'VET_CLINIC', 'LAUNDRY'];
const PROFILE_CLINIC        = ['CLINIC', 'DENTAL', 'DIAGNOSTIC_LAB', 'AYURVEDA', 'HOSPITAL', 'PHYSIOTHERAPY'];
const PROFILE_COACHING      = ['COACHING', 'HOME_TUITION', 'MUSIC_SCHOOL', 'DANCE_ACADEMY', 'DRIVING_SCHOOL', 'COMPUTER_TRAINING'];
const PROFILE_GYM           = ['GYM', 'SPA'];
const PROFILE_EVENT         = ['EVENT_PLANNER', 'DECORATOR', 'TENT_HOUSE', 'CATERING', 'PHOTOGRAPHY', 'TAILORING'];
const PROFILE_INVOICE       = ['FREELANCER', 'DIGITAL_AGENCY', 'CA_FIRM', 'LAW_FIRM', 'CONSTRUCTION', 'INTERIOR_DESIGN', 'TRANSPORT', 'PACKERS_MOVERS', 'CAR_RENTAL', 'TRAVEL_AGENCY', 'INSURANCE_AGENCY', 'PEST_CONTROL', 'REAL_ESTATE'];
const PROFILE_PROPERTY      = ['MALL', 'CO_WORKING'];
const PROFILE_SUPPLIER      = ['SUPPLIER', 'WHOLESALE'];
const PROFILE_CAB           = ['CAB_SERVICE'];

// Business Adaptation Engine — dashboard stats per business type
const dashboard = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { businessType: true } });
  const btype = tenant?.businessType || 'OTHER';

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const next14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ago60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [pendingInvoices, overdueInvoices] = await Promise.all([
    prisma.invoice.count({ where: { tenantId, status: 'SENT' } }),
    prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
  ]);
  const base = { businessType: btype, pendingInvoices, overdueInvoices };

  // ── Profile 1: POS Retail ─────────────────────────────────────────────────
  if (PROFILE_POS_RETAIL.includes(btype)) {
    const now30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [todaySales, monthSales, customers, products, lowStock, expiringProducts, expiredProducts, lowStockItems, paymentMethods, weekItems] = await Promise.all([
      prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: 5 } } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { gt: now, lte: now30 } } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { lte: now } } }),
      prisma.$queryRaw`SELECT id, name, stock, "lowStockAlert", unit FROM "Product" WHERE "tenantId" = ${tenantId} AND "isActive" = true AND stock <= "lowStockAlert" ORDER BY stock ASC LIMIT 6`,
      prisma.transaction.groupBy({ by: ['paymentMethod'], where: { tenantId, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      prisma.transactionItem.findMany({ where: { transaction: { tenantId, createdAt: { gte: ago7 } } }, include: { product: { select: { name: true } } } }),
    ]);
    // Aggregate top sellers
    const sellMap = {};
    for (const it of weekItems) {
      if (!it.productId) continue;
      if (!sellMap[it.productId]) sellMap[it.productId] = { name: it.product?.name || '—', qty: 0, revenue: 0 };
      sellMap[it.productId].qty += it.quantity;
      sellMap[it.productId].revenue += it.total;
    }
    const weekTopSellers = Object.values(sellMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const paymentMethodBreakdown = paymentMethods.map(m => ({ method: m.paymentMethod, total: m._sum.total || 0, count: m._count }));
    return { ...base, today: { revenue: todaySales._sum.total || 0, transactions: todaySales._count }, month: { revenue: monthSales._sum.total || 0, transactions: monthSales._count }, customers, products, lowStockProducts: lowStock, expiringProducts, expiredProducts, lowStockItems, paymentMethodBreakdown, weekTopSellers };
  }

  // ── Profile 2: Salon + POS (appointments + counter sales) ─────────────────
  if (PROFILE_SALON_POS.includes(btype)) {
    const now30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [todaySales, monthSales, customers, todayAppts, lowStock, expiringProducts, expiredProducts, todaySchedule] = await Promise.all([
      prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.appointment.count({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } } }),
      prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: 5 } } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { gt: now, lte: now30 } } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { lte: now } } }),
      prisma.appointment.findMany({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } }, include: { customer: { select: { name: true } }, service: { select: { name: true } } }, orderBy: { startTime: 'asc' }, take: 10 }),
    ]);
    return { ...base, today: { revenue: todaySales._sum.total || 0, transactions: todaySales._count }, month: { revenue: monthSales._sum.total || 0, transactions: monthSales._count }, customers, lowStockProducts: lowStock, todayAppointments: todayAppts, expiringProducts, expiredProducts, todaySchedule };
  }

  // ── Profile 3: Clinic / Medical Appointments ──────────────────────────────
  if (PROFILE_CLINIC.includes(btype)) {
    const [todayAppts, pendingAppts, customers, monthAppts, todaySchedule] = await Promise.all([
      prisma.appointment.count({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } } }),
      prisma.appointment.count({ where: { tenantId, status: 'SCHEDULED' } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.appointment.count({ where: { tenantId, startTime: { gte: startOfMonth }, status: { not: 'CANCELLED' } } }),
      prisma.appointment.findMany({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } }, include: { customer: { select: { name: true, phone: true } }, service: { select: { name: true } } }, orderBy: { startTime: 'asc' }, take: 12 }),
    ]);
    return { ...base, todayAppointments: todayAppts, pendingAppointments: pendingAppts, patients: customers, monthAppointments: monthAppts, todaySchedule };
  }

  // ── Profile 4: Coaching / Education (fee-based) ───────────────────────────
  if (PROFILE_COACHING.includes(btype)) {
    const [students, activeStudents, feesDue, overdueFees, collectedMonth, overdueList] = await Promise.all([
      prisma.student.count({ where: { tenantId } }),
      prisma.student.count({ where: { tenantId, isActive: true } }),
      prisma.feeRecord.aggregate({ where: { tenantId, status: { in: ['PENDING', 'PARTIAL'] } }, _sum: { netAmount: true }, _count: true }),
      prisma.feeRecord.count({ where: { tenantId, status: 'OVERDUE' } }),
      prisma.feeRecord.aggregate({ where: { tenantId, status: 'PAID', paidAt: { gte: startOfMonth } }, _sum: { paidAmount: true }, _count: true }),
      prisma.feeRecord.findMany({ where: { tenantId, status: { in: ['OVERDUE', 'PENDING'] } }, include: { student: { select: { id: true, name: true, phone: true } } }, orderBy: { dueDate: 'asc' }, take: 8, select: { id: true, dueDate: true, netAmount: true, paidAmount: true, status: true, description: true, student: { select: { id: true, name: true, phone: true } } } }),
    ]);
    return { ...base, students, activeStudents, feesDue: feesDue._sum.netAmount || 0, feesDueCount: feesDue._count, overdueFees, collectedThisMonth: collectedMonth._sum.paidAmount || 0, collectedCount: collectedMonth._count, overdueList };
  }

  // ── Profile 5: Gym / Membership ───────────────────────────────────────────
  if (PROFILE_GYM.includes(btype)) {
    const [members, todayAppts, feesDue, overdueFees, collectedMonth, expiringMembers] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.appointment.count({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } } }),
      prisma.feeRecord.count({ where: { tenantId, status: { in: ['PENDING', 'PARTIAL'] } } }),
      prisma.feeRecord.count({ where: { tenantId, status: 'OVERDUE' } }),
      prisma.feeRecord.aggregate({ where: { tenantId, status: 'PAID', paidAt: { gte: startOfMonth } }, _sum: { paidAmount: true }, _count: true }),
      prisma.customerSubscription.findMany({ where: { tenantId, status: 'ACTIVE', expiryDate: { gte: now, lte: next7Days } }, include: { customer: { select: { id: true, name: true, phone: true } } }, orderBy: { expiryDate: 'asc' }, take: 8 }),
    ]);
    return { ...base, members, todayAppointments: todayAppts, feesDue, overdueFees, collectedThisMonth: collectedMonth._sum.paidAmount || 0, expiringMembers };
  }

  // ── Profile 6: Event / Booking businesses ─────────────────────────────────
  if (PROFILE_EVENT.includes(btype)) {
    const [upcomingEvents, monthBookings, monthInvoiced, balanceDue, customers, upcomingEventList] = await Promise.all([
      prisma.appointment.count({ where: { tenantId, startTime: { gte: now, lte: next7Days }, status: { not: 'CANCELLED' } } }),
      prisma.appointment.count({ where: { tenantId, startTime: { gte: startOfMonth }, status: { not: 'CANCELLED' } } }),
      prisma.invoice.aggregate({ where: { tenantId, issueDate: { gte: startOfMonth } }, _sum: { total: true, amountPaid: true }, _count: true }),
      prisma.invoice.aggregate({ where: { tenantId, status: { in: ['SENT', 'OVERDUE'] } }, _sum: { balanceDue: true } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.appointment.findMany({ where: { tenantId, startTime: { gte: now, lte: next14Days }, status: { not: 'CANCELLED' } }, include: { customer: { select: { name: true, phone: true } } }, orderBy: { startTime: 'asc' }, take: 8 }),
    ]);
    return { ...base, upcomingEvents, monthBookings, monthInvoiced: monthInvoiced._sum.total || 0, monthCollected: monthInvoiced._sum.amountPaid || 0, invoiceCount: monthInvoiced._count, balanceDue: balanceDue._sum.balanceDue || 0, clients: customers, upcomingEventList };
  }

  // ── Profile 7: Invoice-only service businesses ────────────────────────────
  if (PROFILE_INVOICE.includes(btype)) {
    const [monthInvoiced, customers, ageCurrent, ageLate, ageOverdue, topOutstanding] = await Promise.all([
      prisma.invoice.aggregate({ where: { tenantId, issueDate: { gte: startOfMonth } }, _sum: { total: true, amountPaid: true }, _count: true }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.invoice.aggregate({ where: { tenantId, status: { in: ['SENT', 'OVERDUE'] }, issueDate: { gte: ago30 } }, _sum: { balanceDue: true } }),
      prisma.invoice.aggregate({ where: { tenantId, status: { in: ['SENT', 'OVERDUE'] }, issueDate: { gte: ago60, lt: ago30 } }, _sum: { balanceDue: true } }),
      prisma.invoice.aggregate({ where: { tenantId, status: { in: ['SENT', 'OVERDUE'] }, issueDate: { lt: ago60 } }, _sum: { balanceDue: true } }),
      prisma.invoice.findMany({ where: { tenantId, status: { in: ['SENT', 'OVERDUE'] } }, select: { id: true, invoiceNumber: true, balanceDue: true, issueDate: true, status: true, customer: { select: { name: true } } }, orderBy: { balanceDue: 'desc' }, take: 5 }),
    ]);
    const agingBuckets = { current: ageCurrent._sum.balanceDue || 0, late: ageLate._sum.balanceDue || 0, overdue: ageOverdue._sum.balanceDue || 0 };
    return { ...base, monthInvoiced: monthInvoiced._sum.total || 0, monthCollected: monthInvoiced._sum.amountPaid || 0, invoiceCount: monthInvoiced._count, clients: customers, agingBuckets, topOutstanding };
  }

  // ── Profile 8: Property / Lease ───────────────────────────────────────────
  if (PROFILE_PROPERTY.includes(btype)) {
    const [totalUnits, occupiedUnits, activeLeases, overdueLeases, monthCollection, unitList, invoicesByStatus] = await Promise.all([
      prisma.leaseUnit.count({ where: { tenantId } }),
      prisma.leaseUnit.count({ where: { tenantId, isOccupied: true } }),
      prisma.leaseTenant.aggregate({ where: { tenantId, status: 'ACTIVE' }, _sum: { monthlyRent: true }, _count: true }),
      prisma.leaseTenant.count({ where: { tenantId, status: 'EXPIRED' } }),
      prisma.invoice.aggregate({ where: { tenantId, status: 'PAID', issueDate: { gte: startOfMonth } }, _sum: { total: true } }),
      prisma.leaseUnit.findMany({ where: { tenantId }, include: { leases: { where: { status: 'ACTIVE' }, select: { businessName: true, monthlyRent: true, endDate: true }, take: 1 } }, orderBy: { unitNumber: 'asc' }, take: 30 }),
      prisma.invoice.groupBy({ by: ['status'], where: { tenantId, issueDate: { gte: startOfMonth } }, _count: true, _sum: { total: true } }),
    ]);
    const rentCollection = invoicesByStatus.map(s => ({ status: s.status, count: s._count, total: s._sum.total || 0 }));
    return { ...base, totalUnits, occupiedUnits, vacantUnits: totalUnits - occupiedUnits, monthlyRentDue: activeLeases._sum.monthlyRent || 0, activeTenants: activeLeases._count, overdueLeases, monthCollection: monthCollection._sum.total || 0, unitList, rentCollection };
  }

  // ── Profile 9: Supplier / Wholesale B2B ───────────────────────────────────
  if (PROFILE_SUPPLIER.includes(btype)) {
    const [monthInvoiced, outstanding, products, customers, topOutstanding, recentPOs] = await Promise.all([
      prisma.invoice.aggregate({ where: { tenantId, issueDate: { gte: startOfMonth } }, _sum: { total: true, amountPaid: true }, _count: true }),
      prisma.invoice.aggregate({ where: { tenantId, status: { in: ['SENT', 'OVERDUE'] } }, _sum: { balanceDue: true }, _count: true }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.invoice.findMany({ where: { tenantId, status: { in: ['SENT', 'OVERDUE'] } }, select: { id: true, invoiceNumber: true, balanceDue: true, issueDate: true, status: true, customer: { select: { name: true } } }, orderBy: { balanceDue: 'desc' }, take: 5 }),
      prisma.purchaseOrder.findMany({ where: { tenantId }, select: { id: true, poNumber: true, status: true, orderDate: true, subtotal: true, vendor: { select: { name: true } } }, orderBy: { orderDate: 'desc' }, take: 5 }),
    ]);
    return { ...base, monthInvoiced: monthInvoiced._sum.total || 0, monthCollected: monthInvoiced._sum.amountPaid || 0, invoiceCount: monthInvoiced._count, outstanding: outstanding._sum.balanceDue || 0, outstandingCount: outstanding._count, products, clients: customers, topOutstanding, recentPurchaseOrders: recentPOs };
  }

  // ── Profile 10: Cab Service ───────────────────────────────────────────────
  if (PROFILE_CAB.includes(btype)) {
    const [todaySales, monthSales, customers] = await Promise.all([
      prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
      prisma.customer.count({ where: { tenantId } }),
    ]);
    return { ...base, today: { revenue: todaySales._sum.total || 0, transactions: todaySales._count }, month: { revenue: monthSales._sum.total || 0, transactions: monthSales._count }, customers };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  const [todaySales, monthSales, customers] = await Promise.all([
    prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
    prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
    prisma.customer.count({ where: { tenantId } }),
  ]);
  return { ...base, today: { revenue: todaySales._sum.total || 0, transactions: todaySales._count }, month: { revenue: monthSales._sum.total || 0, transactions: monthSales._count }, customers };
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

// ── Profit & Loss Statement ───────────────────────────────────────────────────
const profitLoss = async (tenantId, { from, to } = {}) => {
  const range = dateRange(from, to);

  const [posRevenue, invoiceRevenue, feeRevenue, leaseRevenue,
         expenses, vendorBillsPaid, payrollCost] = await Promise.all([
    // Income sources
    prisma.transaction.aggregate({ where: { tenantId, createdAt: range }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { tenantId, status: 'PAID', issueDate: range }, _sum: { amountPaid: true } }),
    prisma.feeRecord.aggregate({ where: { tenantId, status: 'PAID', paidAt: range }, _sum: { paidAmount: true } }),
    prisma.invoice.aggregate({ where: { tenantId, status: 'PAID', issueDate: range }, _sum: { amountPaid: true } }),
    // Expenses
    prisma.expense.aggregate({ where: { tenantId, date: range }, _sum: { amount: true } }),
    prisma.vendorBillPayment.aggregate({ where: { bill: { tenantId }, paidAt: range }, _sum: { amount: true } }),
    prisma.payrollEntry.aggregate({ where: { payrollRun: { tenantId }, status: 'PAID', paidAt: range }, _sum: { grossSalary: true } }),
  ]);

  const totalRevenue =
    (posRevenue._sum.total || 0) +
    (invoiceRevenue._sum.amountPaid || 0) +
    (feeRevenue._sum.paidAmount || 0);

  const totalExpenses =
    (expenses._sum.amount || 0) +
    (vendorBillsPaid._sum.amount || 0) +
    (payrollCost._sum.grossSalary || 0);

  const grossProfit = totalRevenue - totalExpenses;

  // Expense breakdown by category
  const expenseByCategory = await prisma.expense.groupBy({
    by: ['category'],
    where: { tenantId, date: range },
    _sum: { amount: true },
  });

  return {
    period: { from: range.gte, to: range.lte },
    revenue: {
      posRevenue: posRevenue._sum.total || 0,
      invoiceRevenue: invoiceRevenue._sum.amountPaid || 0,
      feeRevenue: feeRevenue._sum.paidAmount || 0,
      total: totalRevenue,
    },
    expenses: {
      operationalExpenses: expenses._sum.amount || 0,
      vendorPayments: vendorBillsPaid._sum.amount || 0,
      payroll: payrollCost._sum.grossSalary || 0,
      total: totalExpenses,
      byCategory: expenseByCategory.map(e => ({ category: e.category, amount: e._sum.amount || 0 })),
    },
    grossProfit,
    profitMargin: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100 * 100) / 100 : 0,
  };
};

// ── Cash Flow Statement ───────────────────────────────────────────────────────
const cashFlow = async (tenantId, { from, to, groupBy = 'month' } = {}) => {
  const range = dateRange(from, to);

  const [inflows, outflows] = await Promise.all([
    prisma.transaction.findMany({ where: { tenantId, createdAt: range }, select: { total: true, createdAt: true } }),
    prisma.expense.findMany({ where: { tenantId, date: range }, select: { amount: true, date: true } }),
  ]);

  const key = (d) => {
    const dt = new Date(d);
    if (groupBy === 'day') return dt.toISOString().split('T')[0];
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  };

  const periods = {};
  for (const t of inflows) {
    const k = key(t.createdAt);
    if (!periods[k]) periods[k] = { period: k, inflow: 0, outflow: 0, net: 0 };
    periods[k].inflow += t.total;
  }
  for (const e of outflows) {
    const k = key(e.date);
    if (!periods[k]) periods[k] = { period: k, inflow: 0, outflow: 0, net: 0 };
    periods[k].outflow += e.amount;
  }

  const data = Object.values(periods)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map(p => ({ ...p, net: p.inflow - p.outflow }));

  const totalInflow = inflows.reduce((s, t) => s + t.total, 0);
  const totalOutflow = outflows.reduce((s, e) => s + e.amount, 0);

  return { summary: { totalInflow, totalOutflow, netCashFlow: totalInflow - totalOutflow }, data };
};

// ── GSTR-1 Export ─────────────────────────────────────────────────────────────
const gstr1 = async (tenantId, { month, year } = {}) => {
  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0, 23, 59, 59);

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, gstin: true } });

  const invoices = await prisma.invoice.findMany({
    where: { tenantId, issueDate: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
    include: { customer: { select: { name: true, gstin: true, state: true } }, items: true },
    orderBy: { issueDate: 'asc' },
  });

  const b2b = []; // GST-registered customers (have GSTIN)
  const b2c = []; // Unregistered customers

  for (const inv of invoices) {
    const taxable = inv.subtotal - inv.discountAmount;
    const cgst = !inv.gstDetails?.isInterState ? inv.taxAmount / 2 : 0;
    const sgst = !inv.gstDetails?.isInterState ? inv.taxAmount / 2 : 0;
    const igst = inv.gstDetails?.isInterState ? inv.taxAmount : 0;

    const row = {
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.issueDate.toISOString().split('T')[0],
      customerName: inv.customer?.name || 'Walk-in',
      customerGSTIN: inv.customer?.gstin || '',
      taxableValue: Math.round(taxable * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      totalTax: Math.round(inv.taxAmount * 100) / 100,
      invoiceValue: Math.round(inv.total * 100) / 100,
    };

    if (inv.customer?.gstin) b2b.push(row);
    else b2c.push(row);
  }

  const summary = {
    period: `${String(m).padStart(2, '0')}/${y}`,
    gstin: tenant.gstin || 'Not registered',
    totalInvoices: invoices.length,
    totalTaxableValue: invoices.reduce((s, i) => s + i.subtotal - i.discountAmount, 0),
    totalTax: invoices.reduce((s, i) => s + i.taxAmount, 0),
    totalInvoiceValue: invoices.reduce((s, i) => s + i.total, 0),
  };

  return { summary, b2b, b2c };
};

module.exports = { dashboard, salesReport, invoiceReport, topProducts, topCustomers, profitLoss, cashFlow, gstr1 };
