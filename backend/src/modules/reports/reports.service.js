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
const PROFILE_GYM           = ['GYM', 'SPA', 'YOGA_STUDIO', 'MARTIAL_ARTS', 'SPORTS_ACADEMY', 'SWIMMING_ACADEMY', 'CROSSFIT_STUDIO'];
const PROFILE_EVENT         = ['EVENT_PLANNER', 'DECORATOR', 'TENT_HOUSE', 'CATERING', 'PHOTOGRAPHY', 'TAILORING'];
const PROFILE_INVOICE       = ['FREELANCER', 'DIGITAL_AGENCY', 'CA_FIRM', 'LAW_FIRM', 'CONSTRUCTION', 'INTERIOR_DESIGN', 'TRANSPORT', 'PACKERS_MOVERS', 'CAR_RENTAL', 'TRAVEL_AGENCY', 'INSURANCE_AGENCY', 'PEST_CONTROL', 'REAL_ESTATE'];
const PROFILE_PROPERTY      = ['MALL', 'CO_WORKING'];
const PROFILE_SUPPLIER      = ['SUPPLIER', 'WHOLESALE'];
const PROFILE_CAB           = ['CAB_SERVICE'];

// Business Adaptation Engine — dashboard stats per business type
const dashboard = async (tenantId, { branchId } = {}) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { businessType: true } });
  const btype = tenant?.businessType || 'OTHER';
  const bw = branchId ? { branchId } : {}; // branch-scoped where clause fragment

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
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const [todaySales, monthSales, lastMonthSales, customers, products, expiringProducts, expiredProducts, paymentMethods, weekItems, last7Txns, recentTxns] = await Promise.all([
      prisma.transaction.aggregate({ where: { tenantId, ...bw, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenantId, ...bw, createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenantId, ...bw, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { total: true } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { gt: now, lte: now30 } } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { lte: now } } }),
      prisma.transaction.groupBy({ by: ['paymentMethod'], where: { tenantId, ...bw, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      prisma.transactionItem.findMany({ where: { transaction: { tenantId, ...bw, createdAt: { gte: ago7 } } }, include: { product: { select: { name: true } } } }),
      prisma.transaction.findMany({ where: { tenantId, ...bw, createdAt: { gte: ago7 } }, select: { total: true, createdAt: true } }),
      prisma.transaction.findMany({ where: { tenantId, ...bw }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, total: true, paymentMethod: true, createdAt: true, customer: { select: { name: true } } } }),
    ]);

    // Low stock: branch-specific if branchId provided, else global
    let lowStock, lowStockItems;
    if (branchId) {
      const branchStocks = await prisma.branchStock.findMany({
        where: { tenantId, branchId },
        include: { product: true },
      });
      const alertItems = branchStocks.filter(bs => bs.quantity <= bs.product.lowStockAlert);
      lowStock = alertItems.length;
      lowStockItems = alertItems
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 6)
        .map(bs => ({ id: bs.product.id, name: bs.product.name, stock: bs.quantity, lowStockAlert: bs.product.lowStockAlert, unit: bs.product.unit }));
    } else {
      [lowStock] = await Promise.all([
        prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: 5 } } }),
      ]);
      lowStockItems = await prisma.$queryRaw`SELECT id, name, stock, "lowStockAlert", unit FROM products WHERE "tenantId" = ${tenantId} AND "isActive" = true AND stock <= "lowStockAlert" ORDER BY stock ASC LIMIT 6`;
    }

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

    // 7-day daily revenue array
    const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0);
      const dayStr = d.toISOString().slice(0, 10);
      return { date: dayStr, day: d.toLocaleDateString('en-IN', { weekday: 'short' }), revenue: last7Txns.filter(t => new Date(t.createdAt).toISOString().slice(0, 10) === dayStr).reduce((s, t) => s + (t.total || 0), 0) };
    });

    return { ...base, today: { revenue: todaySales._sum.total || 0, transactions: todaySales._count }, month: { revenue: monthSales._sum.total || 0, transactions: monthSales._count }, lastMonthRevenue: lastMonthSales._sum.total || 0, customers, products, lowStockProducts: lowStock, expiringProducts, expiredProducts, lowStockItems, paymentMethodBreakdown, weekTopSellers, weeklyRevenue, recentTransactions: recentTxns, branchId: branchId || null };
  }

  // ── Profile 2: Salon + POS (appointments + counter sales) ─────────────────
  if (PROFILE_SALON_POS.includes(btype)) {
    const now30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const [todaySales, monthSales, lastMonthSales, customers, todayAppts, lowStock, expiringProducts, expiredProducts, todaySchedule, last7Txns, recentTxns] = await Promise.all([
      prisma.transaction.aggregate({ where: { tenantId, ...bw, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenantId, ...bw, createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenantId, ...bw, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { total: true } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.appointment.count({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } } }),
      prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: 5 } } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { gt: now, lte: now30 } } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { lte: now } } }),
      prisma.appointment.findMany({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } }, include: { customer: { select: { name: true } }, service: { select: { name: true } } }, orderBy: { startTime: 'asc' }, take: 10 }),
      prisma.transaction.findMany({ where: { tenantId, ...bw, createdAt: { gte: ago7 } }, select: { total: true, createdAt: true } }),
      prisma.transaction.findMany({ where: { tenantId, ...bw }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, total: true, paymentMethod: true, createdAt: true, customer: { select: { name: true } } } }),
    ]);
    const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0);
      const dayStr = d.toISOString().slice(0, 10);
      return { date: dayStr, day: d.toLocaleDateString('en-IN', { weekday: 'short' }), revenue: last7Txns.filter(t => new Date(t.createdAt).toISOString().slice(0, 10) === dayStr).reduce((s, t) => s + (t.total || 0), 0) };
    });
    return { ...base, today: { revenue: todaySales._sum.total || 0, transactions: todaySales._count }, month: { revenue: monthSales._sum.total || 0, transactions: monthSales._count }, lastMonthRevenue: lastMonthSales._sum.total || 0, customers, lowStockProducts: lowStock, todayAppointments: todayAppts, expiringProducts, expiredProducts, todaySchedule, weeklyRevenue, recentTransactions: recentTxns };
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
      prisma.feeRecord.findMany({ where: { tenantId, status: { in: ['OVERDUE', 'PENDING'] } }, orderBy: { dueDate: 'asc' }, take: 8, select: { id: true, dueDate: true, netAmount: true, paidAmount: true, status: true, description: true, student: { select: { id: true, name: true, phone: true } } } }),
    ]);
    return { ...base, students, activeStudents, feesDue: feesDue._sum.netAmount || 0, feesDueCount: feesDue._count, overdueFees, collectedThisMonth: collectedMonth._sum.paidAmount || 0, collectedCount: collectedMonth._count, overdueList };
  }

  // ── Profile 5: Gym / Membership ───────────────────────────────────────────
  if (PROFILE_GYM.includes(btype)) {
    const [members, newMembersThisMonth, todayAppts, monthRevenue, expiringMembers, todaySchedule] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      prisma.appointment.count({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } } }),
      prisma.invoice.aggregate({ where: { tenantId, status: 'PAID', issueDate: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
      prisma.customerSubscription.findMany({ where: { tenantId, status: 'ACTIVE', expiryDate: { gte: now, lte: next7Days } }, include: { customer: { select: { id: true, name: true, phone: true } } }, orderBy: { expiryDate: 'asc' }, take: 10 }),
      prisma.appointment.findMany({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } }, include: { customer: { select: { name: true, phone: true } }, service: { select: { name: true } } }, orderBy: { startTime: 'asc' }, take: 12 }),
    ]);
    return {
      ...base,
      members,
      newMembersThisMonth,
      todayAppointments: todayAppts,
      collectedThisMonth: monthRevenue._sum.total || 0,
      collectedCount: monthRevenue._count,
      feesDue: base.pendingInvoices,
      overdueFees: base.overdueInvoices,
      expiringMembers,
      todaySchedule,
    };
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

const salesReport = async (tenantId, { from, to, groupBy = 'day', branchId } = {}) => {
  const range = dateRange(from, to);
  const branchWhere = branchId ? { branchId } : {};

  const [transactions, invoicePayments] = await Promise.all([
    prisma.transaction.findMany({
      where: { tenantId, createdAt: range, ...branchWhere },
      select: { total: true, taxAmount: true, discountAmount: true, paymentMethod: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.payment.findMany({
      where: { invoice: { tenantId }, paidAt: range },
      select: { amount: true, paidAt: true },
    }),
  ]);

  const dayKey = (d) => groupBy === 'month'
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    : d.toISOString().split('T')[0];

  const grouped = {};
  for (const t of transactions) {
    const key = dayKey(new Date(t.createdAt));
    if (!grouped[key]) grouped[key] = { date: key, revenue: 0, transactions: 0, tax: 0, discount: 0 };
    grouped[key].revenue += t.total;
    grouped[key].transactions += 1;
    grouped[key].tax += t.taxAmount;
    grouped[key].discount += t.discountAmount;
  }
  for (const p of invoicePayments) {
    const key = dayKey(new Date(p.paidAt));
    if (!grouped[key]) grouped[key] = { date: key, revenue: 0, transactions: 0, tax: 0, discount: 0 };
    grouped[key].revenue += p.amount;
    grouped[key].transactions += 1;
  }

  const summary = {
    totalRevenue:
      transactions.reduce((s, t) => s + t.total, 0) +
      invoicePayments.reduce((s, p) => s + p.amount, 0),
    totalTransactions: transactions.length + invoicePayments.length,
    totalTax: transactions.reduce((s, t) => s + t.taxAmount, 0),
    byPaymentMethod: transactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
      return acc;
    }, {}),
  };

  return { summary, data: Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)) };
};

const invoiceReport = async (tenantId, { from, to, branchId } = {}) => {
  const range = dateRange(from, to);
  const bw = branchId ? { branchId } : {};
  const [totals, byStatus] = await Promise.all([
    prisma.invoice.aggregate({
      where: { tenantId, issueDate: range, ...bw },
      _sum: { total: true, amountPaid: true, balanceDue: true },
      _count: true,
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: { tenantId, issueDate: range, ...bw },
      _count: true,
      _sum: { total: true },
    }),
  ]);
  return { totals, byStatus };
};

const topProducts = async (tenantId, { from, to, limit = 10, branchId } = {}) => {
  const range = dateRange(from, to);
  const txWhere = { tenantId, createdAt: range, ...(branchId && { branchId }) };

  const [posItems, invoiceItems] = await Promise.all([
    prisma.transactionItem.findMany({
      where: { transaction: txWhere },
      include: { product: { select: { name: true, sku: true } } },
    }),
    prisma.invoiceItem.findMany({
      where: { productId: { not: null }, invoice: { tenantId, payments: { some: { paidAt: range } } } },
      include: { product: { select: { name: true, sku: true } } },
    }),
  ]);

  const aggregated = {};
  for (const i of [...posItems, ...invoiceItems]) {
    const k = i.productId;
    if (!k) continue;
    if (!aggregated[k]) aggregated[k] = { product: i.product, qty: 0, revenue: 0 };
    aggregated[k].qty += i.quantity;
    aggregated[k].revenue += i.total;
  }

  return Object.values(aggregated)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, Number(limit));
};

const topCustomers = async (tenantId, { from, to, limit = 10, branchId } = {}) => {
  const range = dateRange(from, to);
  const branchWhere = branchId ? { branchId } : {};

  const [txGroups, invoices] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['customerId'],
      where: { tenantId, customerId: { not: null }, createdAt: range, ...branchWhere },
      _sum: { total: true },
    }),
    prisma.invoice.findMany({
      where: { tenantId, customerId: { not: null }, payments: { some: { paidAt: range } } },
      select: {
        customerId: true,
        payments: { where: { paidAt: range }, select: { amount: true } },
      },
    }),
  ]);

  const spendMap = {};
  for (const g of txGroups) {
    if (!g.customerId) continue;
    spendMap[g.customerId] = (spendMap[g.customerId] || 0) + (g._sum.total || 0);
  }
  for (const inv of invoices) {
    if (!inv.customerId) continue;
    const paid = inv.payments.reduce((s, p) => s + (p.amount || 0), 0);
    spendMap[inv.customerId] = (spendMap[inv.customerId] || 0) + paid;
  }

  const topIds = Object.entries(spendMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Number(limit))
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const customers = await prisma.customer.findMany({
    where: { id: { in: topIds } },
    select: { id: true, name: true, phone: true },
  });

  return customers
    .map(c => ({ ...c, totalSpent: spendMap[c.id] || 0 }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
};

// ── Profit & Loss Statement (Trading Account + P&L) ──────────────────────────
const profitLoss = async (tenantId, { from, to, branchId } = {}) => {
  const range = dateRange(from, to);
  const branchWhere = branchId ? { branchId } : {};
  const fromDate = range.gte;
  const toDate   = range.lte;

  // Period length in months (for depreciation pro-rating)
  const monthsDiff = Math.max(1,
    (toDate.getFullYear() - fromDate.getFullYear()) * 12
    + toDate.getMonth() - fromDate.getMonth() + 1
  );

  const [
    posRevenue, invoiceRevenue, feeRevenue,
    vendorPurchases,
    expensesList,
    payrollAgg,
    activeAssets,
    closingStockItems,
  ] = await Promise.all([
    // ── Revenue sources ──────────────────────────────────────────────────
    prisma.transaction.aggregate({ where: { tenantId, createdAt: range, ...branchWhere }, _sum: { total: true } }),
    prisma.payment.aggregate({ where: { invoice: { tenantId }, paidAt: range }, _sum: { amount: true } }),
    prisma.feeRecord.aggregate({ where: { tenantId, status: 'PAID', paidAt: range }, _sum: { paidAmount: true } }),

    // ── COGS: vendor bills raised in period (accrual-basis purchases) ────
    prisma.vendorBill.aggregate({
      where: { tenantId, issueDate: range, status: { not: 'CANCELLED' } },
      _sum: { subtotal: true },
      _count: true,
    }),

    // ── Operating expenses (rent, utilities, etc.) ───────────────────────
    prisma.expense.findMany({
      where: { tenantId, date: range, ...branchWhere },
      select: { category: true, amount: true, tdsAmount: true },
    }),

    // ── Payroll (employer's full cost) ───────────────────────────────────
    prisma.payrollEntry.aggregate({
      where: { payrollRun: { tenantId }, status: 'PAID', paidAt: range },
      _sum: { grossSalary: true, pfEmployer: true, esiEmployer: true, tds: true, professionalTax: true },
    }),

    // ── Fixed assets for depreciation ────────────────────────────────────
    prisma.asset.findMany({
      where: { tenantId, status: { not: 'DISPOSED' }, purchaseDate: { lte: toDate } },
      select: {
        purchasePrice: true, currentValue: true, salvageValue: true,
        usefulLifeYears: true, depreciationMethod: true,
        category: { select: { wdvRate: true } },
      },
    }),

    // ── Closing stock value ───────────────────────────────────────────────
    prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: { stock: true, costPrice: true },
    }),
  ]);

  // ── Revenue ───────────────────────────────────────────────────────────
  const posRev = posRevenue._sum.total || 0;
  const invRev = invoiceRevenue._sum.amount || 0;
  const feeRev = feeRevenue._sum.paidAmount || 0;
  const totalRevenue = posRev + invRev + feeRev;

  // ── Trading Account ───────────────────────────────────────────────────
  const purchases = vendorPurchases._sum.subtotal || 0;
  const closingStock = closingStockItems.reduce((s, p) => s + (p.stock || 0) * (p.costPrice || 0), 0);
  // COGS = Purchases (opening stock not tracked; closing stock shown for reference)
  const cogs = purchases;
  const grossProfit = totalRevenue - cogs;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0;

  // ── Operating Expenses ────────────────────────────────────────────────
  const expenseByCategory = {};
  let totalOpex = 0;
  for (const e of expensesList) {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + (e.amount || 0);
    totalOpex += e.amount || 0;
  }
  const byCategoryArr = Object.entries(expenseByCategory)
    .map(([k, v]) => ({ category: k, amount: Math.round(v * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  // ── Payroll ───────────────────────────────────────────────────────────
  const payrollGross  = payrollAgg._sum.grossSalary || 0;
  const payrollBurden = payrollGross + (payrollAgg._sum.pfEmployer || 0) + (payrollAgg._sum.esiEmployer || 0);

  // ── Depreciation (pro-rated for period) ──────────────────────────────
  const periodDepreciation = activeAssets.reduce((sum, asset) => {
    let annualDep;
    if (asset.depreciationMethod === 'WDV') {
      const rate = (asset.category?.wdvRate || 15) / 100;
      annualDep = (asset.currentValue || 0) * rate;
    } else {
      annualDep = ((asset.purchasePrice || 0) - (asset.salvageValue || 0)) / Math.max(1, asset.usefulLifeYears || 5);
    }
    return sum + annualDep * monthsDiff / 12;
  }, 0);

  // ── Net Profit ────────────────────────────────────────────────────────
  const totalOpexFull = totalOpex + payrollBurden + periodDepreciation;
  const netProfit  = grossProfit - totalOpexFull;
  const netMargin  = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0;
  const r2 = (n) => Math.round(n * 100) / 100;

  return {
    period: { from: fromDate, to: toDate },
    // ── Structured (new) ──────────────────────────────────────────────
    tradingAccount: {
      revenue: { posRevenue: r2(posRev), invoiceRevenue: r2(invRev), feeRevenue: r2(feeRev), total: r2(totalRevenue) },
      purchases: r2(purchases),
      purchaseCount: vendorPurchases._count,
      closingStock: r2(closingStock),
      cogs: r2(cogs),
      grossProfit: r2(grossProfit),
      grossMargin,
    },
    plAccount: {
      grossProfit: r2(grossProfit),
      operatingExpenses: {
        byCategory: byCategoryArr,
        operational: r2(totalOpex),
        payroll: r2(payrollBurden),
        payrollGross: r2(payrollGross),
        depreciation: r2(periodDepreciation),
        total: r2(totalOpexFull),
      },
      netProfit: r2(netProfit),
      netMargin,
    },
    // ── Legacy fields (backward-compat) ──────────────────────────────
    revenue: { posRevenue: r2(posRev), invoiceRevenue: r2(invRev), feeRevenue: r2(feeRev), total: r2(totalRevenue) },
    expenses: {
      operationalExpenses: r2(totalOpex),
      vendorPayments: r2(purchases),
      payroll: r2(payrollBurden),
      depreciation: r2(periodDepreciation),
      total: r2(totalOpexFull),
      byCategory: byCategoryArr,
    },
    grossProfit: r2(netProfit), // legacy — was "net profit" mislabelled as grossProfit
    profitMargin: netMargin,
  };
};

// ── Balance Sheet ─────────────────────────────────────────────────────────────
const balanceSheet = async (tenantId, { branchId } = {}) => {
  const now = new Date();
  const bw = branchId ? { branchId } : {};
  const [
    bankAccounts,
    receivables,
    inventoryItems,
    activeAssets,
    vendorPayables,
    loanAccounts,
  ] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { tenantId, isActive: true, accountType: { not: 'LOAN' } },
      select: { name: true, bankName: true, currentBalance: true, accountType: true },
    }),
    prisma.invoice.aggregate({
      where: { tenantId, status: { in: ['SENT', 'OVERDUE'] }, ...bw },
      _sum: { balanceDue: true }, _count: true,
    }),
    prisma.product.findMany({
      where: { tenantId, isActive: true, stock: { gt: 0 } },
      select: { name: true, stock: true, costPrice: true },
    }),
    prisma.asset.findMany({
      where: { tenantId, status: { not: 'DISPOSED' } },
      select: { name: true, purchasePrice: true, currentValue: true, purchaseDate: true, category: { select: { name: true } } },
    }),
    prisma.vendorBill.aggregate({
      where: { tenantId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }, ...bw },
      _sum: { balanceDue: true }, _count: true,
    }),
    prisma.bankAccount.findMany({
      where: { tenantId, accountType: 'LOAN', isActive: true },
      select: { name: true, bankName: true, currentBalance: true },
    }),
  ]);

  const r2 = (n) => Math.round((n || 0) * 100) / 100;
  const cashAndBank     = bankAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
  const receivablesAmt  = receivables._sum.balanceDue || 0;
  const inventoryValue  = inventoryItems.reduce((s, p) => s + (p.stock || 0) * (p.costPrice || 0), 0);
  const grossBlock      = activeAssets.reduce((s, a) => s + (a.purchasePrice || 0), 0);
  const netBlock        = activeAssets.reduce((s, a) => s + (a.currentValue || 0), 0);
  const accDep          = grossBlock - netBlock;
  const totalCurrentAssets = cashAndBank + receivablesAmt + inventoryValue;
  const totalAssets     = totalCurrentAssets + netBlock;
  const vendorPayAmt    = vendorPayables._sum.balanceDue || 0;
  const loanTotal       = loanAccounts.reduce((s, l) => s + Math.abs(l.currentBalance || 0), 0);
  const totalLiabilities = vendorPayAmt + loanTotal;
  const ownersEquity    = totalAssets - totalLiabilities;

  return {
    asOf: now.toISOString().split('T')[0],
    currentAssets: {
      cashAndBank: r2(cashAndBank),
      bankAccounts,
      receivables: r2(receivablesAmt),
      receivablesCount: receivables._count,
      inventory: r2(inventoryValue),
      inventoryTopItems: inventoryItems
        .map(p => ({ name: p.name, stock: p.stock, costPrice: p.costPrice, value: r2(p.stock * p.costPrice) }))
        .sort((a, b) => b.value - a.value).slice(0, 10),
      total: r2(totalCurrentAssets),
    },
    fixedAssets: {
      grossBlock: r2(grossBlock),
      accumulatedDepreciation: r2(accDep),
      netBlock: r2(netBlock),
      assets: activeAssets,
      total: r2(netBlock),
    },
    totalAssets: r2(totalAssets),
    currentLiabilities: {
      vendorPayables: r2(vendorPayAmt),
      vendorPayablesCount: vendorPayables._count,
      total: r2(vendorPayAmt),
    },
    longTermLiabilities: {
      loans: r2(loanTotal),
      loanAccounts,
      total: r2(loanTotal),
    },
    totalLiabilities: r2(totalLiabilities),
    ownersEquity: {
      note: 'Capital accounts not tracked. Equity = Assets − Liabilities.',
      total: r2(ownersEquity),
    },
  };
};

// ── TDS Report ────────────────────────────────────────────────────────────────
const TDS_RULES = {
  RENT:              { section: '194I', rate: 10, threshold: 240000, label: 'Rent Payments' },
  PROFESSIONAL_FEES: { section: '194J', rate: 10, threshold: 30000,  label: 'Professional / Technical Fees' },
  CONTRACT_LABOR:    { section: '194C', rate: 2,  threshold: 30000,  label: 'Contractor / Labour Payments' },
};

const tdsReport = async (tenantId, { from, to, branchId } = {}) => {
  const range = dateRange(from, to);
  const bw = branchId ? { branchId } : {};
  const [expenseGroups, payrollEntries] = await Promise.all([
    prisma.expense.groupBy({
      by: ['category'],
      where: { tenantId, date: range, category: { in: Object.keys(TDS_RULES) }, ...bw },
      _sum: { amount: true, tdsAmount: true },
      _count: true,
    }),
    prisma.payrollEntry.findMany({
      where: { payrollRun: { tenantId }, status: 'PAID', paidAt: range },
      select: { grossSalary: true, tds: true, professionalTax: true, netSalary: true, staff: { select: { name: true } } },
    }),
  ]);

  const r2 = (n) => Math.round((n || 0) * 100) / 100;
  const tdsLiability = expenseGroups.map(row => {
    const rule = TDS_RULES[row.category];
    const total = row._sum.amount || 0;
    const deducted = row._sum.tdsAmount || 0;
    const due = total >= rule.threshold ? r2(total * rule.rate / 100) : 0;
    return {
      category: row.category,
      section: rule.section,
      label: rule.label,
      totalPayments: r2(total),
      count: row._count,
      threshold: rule.threshold,
      exceeded: total >= rule.threshold,
      tdsRate: rule.rate,
      tdsDue: due,
      tdsDeducted: r2(deducted),
      shortfall: r2(Math.max(0, due - deducted)),
    };
  });

  const totalSalaryGross = payrollEntries.reduce((s, e) => s + (e.grossSalary || 0), 0);
  const totalSalaryTds   = payrollEntries.reduce((s, e) => s + (e.tds || 0), 0);
  const totalSalaryPt    = payrollEntries.reduce((s, e) => s + (e.professionalTax || 0), 0);

  return {
    period: { from: range.gte, to: range.lte },
    expenseTds: tdsLiability,
    salaryTds: {
      totalGrossSalary: r2(totalSalaryGross),
      tdsDeducted: r2(totalSalaryTds),
      professionalTax: r2(totalSalaryPt),
      employeeCount: payrollEntries.length,
      entries: payrollEntries.map(e => ({ name: e.staff?.name || '—', grossSalary: r2(e.grossSalary), tds: r2(e.tds), pt: r2(e.professionalTax), netSalary: r2(e.netSalary) })),
    },
    summary: {
      totalTdsDue: r2(tdsLiability.reduce((s, t) => s + t.tdsDue, 0)),
      totalTdsDeducted: r2(tdsLiability.reduce((s, t) => s + t.tdsDeducted, 0)),
      totalShortfall: r2(tdsLiability.reduce((s, t) => s + t.shortfall, 0)),
      salaryTds: r2(totalSalaryTds),
      professionalTax: r2(totalSalaryPt),
    },
  };
};

// ── Cash Book ─────────────────────────────────────────────────────────────────
const cashBook = async (tenantId, { from, to, branchId } = {}) => {
  const range = dateRange(from, to);
  const bw = branchId ? { branchId } : {};
  const [posCash, invoiceCash, cashExpenses] = await Promise.all([
    prisma.transaction.findMany({
      where: { tenantId, paymentMethod: 'CASH', createdAt: range, ...bw },
      select: { receiptNumber: true, total: true, createdAt: true, customer: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.payment.findMany({
      where: { method: 'CASH', paidAt: range, invoice: { tenantId, ...bw } },
      select: { amount: true, paidAt: true, invoice: { select: { invoiceNumber: true, customer: { select: { name: true } } } } },
      orderBy: { paidAt: 'asc' },
    }),
    prisma.expense.findMany({
      where: { tenantId, method: 'CASH', date: range, ...bw },
      select: { description: true, amount: true, category: true, date: true },
      orderBy: { date: 'asc' },
    }),
  ]);

  const entries = [];
  for (const t of posCash)     entries.push({ date: t.createdAt, type: 'IN',  narration: `POS Sale — ${t.customer?.name || 'Walk-in'} [${t.receiptNumber}]`, amount: t.total });
  for (const p of invoiceCash) entries.push({ date: p.paidAt,    type: 'IN',  narration: `Invoice Rcpt — ${p.invoice?.customer?.name || '—'} [${p.invoice?.invoiceNumber || '—'}]`, amount: p.amount });
  for (const e of cashExpenses) entries.push({ date: e.date,     type: 'OUT', narration: `${e.category} — ${e.description}`, amount: e.amount });
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalIn  = posCash.reduce((s, t) => s + t.total, 0) + invoiceCash.reduce((s, p) => s + p.amount, 0);
  const totalOut = cashExpenses.reduce((s, e) => s + e.amount, 0);
  return { period: { from: range.gte, to: range.lte }, entries, summary: { totalIn, totalOut, netCash: totalIn - totalOut, entryCount: entries.length } };
};

// ── Creditors Aging (Vendor Bills Outstanding) ────────────────────────────────
const creditorAging = async (tenantId, { branchId } = {}) => {
  const now = new Date();
  const bw = branchId ? { branchId } : {};
  const bills = await prisma.vendorBill.findMany({
    where: { tenantId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }, ...bw },
    select: { id: true, billNumber: true, issueDate: true, dueDate: true, balanceDue: true, total: true, status: true, vendor: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
  });

  const buckets = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
  const rows = bills.map(bill => {
    const due = new Date(bill.dueDate || bill.issueDate);
    const daysPast = Math.floor((now - due) / 86400000);
    let bucket;
    if (daysPast <= 0)       { bucket = 'current'; buckets.current += bill.balanceDue; }
    else if (daysPast <= 30) { bucket = '1-30';    buckets.days30  += bill.balanceDue; }
    else if (daysPast <= 60) { bucket = '31-60';   buckets.days60  += bill.balanceDue; }
    else if (daysPast <= 90) { bucket = '61-90';   buckets.days90  += bill.balanceDue; }
    else                     { bucket = '90+';     buckets.over90  += bill.balanceDue; }
    return { ...bill, daysPast: Math.max(0, daysPast), bucket };
  });

  const r2 = (n) => Math.round((n || 0) * 100) / 100;
  return {
    asOf: now.toISOString().split('T')[0],
    bills: rows,
    buckets: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, r2(v)])),
    totalOutstanding: r2(bills.reduce((s, b) => s + b.balanceDue, 0)),
  };
};

// ── Cash Flow Statement ───────────────────────────────────────────────────────
const cashFlow = async (tenantId, { from, to, groupBy = 'month', branchId } = {}) => {
  const range = dateRange(from, to);
  const bw = branchId ? { branchId } : {};

  const [posInflows, invoicePayments, feeCollections,
         expenseOutflows, vendorPayments, payrollOutflows] = await Promise.all([
    prisma.transaction.findMany({ where: { tenantId, createdAt: range, ...bw }, select: { total: true, createdAt: true } }),
    prisma.payment.findMany({ where: { invoice: { tenantId, ...bw }, paidAt: range }, select: { amount: true, paidAt: true } }),
    prisma.feeRecord.findMany({ where: { tenantId, status: 'PAID', paidAt: range, ...bw }, select: { paidAmount: true, paidAt: true } }),
    prisma.expense.findMany({ where: { tenantId, date: range, ...bw }, select: { amount: true, date: true } }),
    prisma.vendorBillPayment.findMany({ where: { bill: { tenantId, ...bw }, paidAt: range }, select: { amount: true, paidAt: true } }),
    prisma.payrollEntry.findMany({ where: { payrollRun: { tenantId }, status: 'PAID', paidAt: range }, select: { grossSalary: true, pfEmployer: true, esiEmployer: true, paidAt: true } }),
  ]);

  const periodKey = (d) => {
    const dt = new Date(d);
    if (groupBy === 'day') return dt.toISOString().split('T')[0];
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  };

  const periods = {};
  const add = (dateVal, type, amount) => {
    const k = periodKey(dateVal);
    if (!periods[k]) periods[k] = { period: k, inflow: 0, outflow: 0, net: 0 };
    periods[k][type] += amount;
  };

  for (const t of posInflows)      add(t.createdAt, 'inflow',  t.total);
  for (const p of invoicePayments) add(p.paidAt,    'inflow',  p.amount);
  for (const f of feeCollections)  add(f.paidAt,    'inflow',  f.paidAmount);
  for (const e of expenseOutflows) add(e.date,      'outflow', e.amount);
  for (const v of vendorPayments)  add(v.paidAt,    'outflow', v.amount);
  for (const pr of payrollOutflows) if (pr.paidAt) add(pr.paidAt, 'outflow', (pr.grossSalary || 0) + (pr.pfEmployer || 0) + (pr.esiEmployer || 0));

  const data = Object.values(periods)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map(p => ({ ...p, net: p.inflow - p.outflow }));

  const totalInflow =
    posInflows.reduce((s, t) => s + t.total, 0) +
    invoicePayments.reduce((s, p) => s + p.amount, 0) +
    feeCollections.reduce((s, f) => s + f.paidAmount, 0);

  const totalOutflow =
    expenseOutflows.reduce((s, e) => s + e.amount, 0) +
    vendorPayments.reduce((s, v) => s + v.amount, 0) +
    payrollOutflows.reduce((s, pr) => s + pr.grossSalary, 0);

  return { summary: { totalInflow, totalOutflow, netCashFlow: totalInflow - totalOutflow }, data };
};

// ── GSTR-1 Export ─────────────────────────────────────────────────────────────
const gstr1 = async (tenantId, { month, year, branchId } = {}) => {
  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0, 23, 59, 59);
  const bw = branchId ? { branchId } : {};

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, gstin: true } });

  const [invoices, posTxns] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId, issueDate: { gte: from, lte: to }, status: { not: 'CANCELLED' }, ...bw },
      include: {
        customer: { select: { name: true, gstin: true } },
        items: { include: { product: { select: { hsnCode: true } } } },
      },
      orderBy: { issueDate: 'asc' },
    }),
    prisma.transaction.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to }, ...bw },
      include: { customer: { select: { name: true } }, items: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const b2b = [];
  const b2c = [];
  const hsnMap = {};

  const addHsn = (hsnCode, description, qty, taxableValue, cgst, sgst, igst, rate) => {
    const key = hsnCode || 'MISC';
    if (!hsnMap[key]) hsnMap[key] = { hsnCode: key, description: description || 'Miscellaneous', totalQty: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, rate: rate || 0 };
    hsnMap[key].totalQty += qty;
    hsnMap[key].taxableValue += taxableValue;
    hsnMap[key].cgst += cgst;
    hsnMap[key].sgst += sgst;
    hsnMap[key].igst += igst;
  };

  // ── Invoices (B2B / B2C) ──────────────────────────────────────────────
  for (const inv of invoices) {
    const isInterState = !!(inv.gstDetails?.isInterState);
    const taxable = inv.subtotal - inv.discountAmount;
    const cgst = !isInterState ? inv.taxAmount / 2 : 0;
    const sgst = !isInterState ? inv.taxAmount / 2 : 0;
    const igst = isInterState  ? inv.taxAmount     : 0;

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
    if (inv.customer?.gstin) b2b.push(row); else b2c.push(row);

    for (const item of inv.items) {
      const itemTaxable = (item.total || 0) - (item.taxAmount || 0);
      const iCgst = !isInterState ? (item.taxAmount || 0) / 2 : 0;
      const iSgst = !isInterState ? (item.taxAmount || 0) / 2 : 0;
      const iIgst = isInterState  ? (item.taxAmount || 0)     : 0;
      addHsn(item.product?.hsnCode, item.description, item.quantity, itemTaxable, iCgst, iSgst, iIgst, item.taxRate);
    }
  }

  // ── POS Transactions → always B2C ────────────────────────────────────
  for (const txn of posTxns) {
    const txnCgst = txn.items.reduce((s, i) => s + (i.cgst || 0), 0);
    const txnSgst = txn.items.reduce((s, i) => s + (i.sgst || 0), 0);
    const txnIgst = txn.items.reduce((s, i) => s + (i.igst || 0), 0);
    const taxable = (txn.subtotal || 0) - (txn.discountAmount || 0);

    b2c.push({
      invoiceNumber: txn.receiptNumber,
      invoiceDate: txn.createdAt.toISOString().split('T')[0],
      customerName: txn.customer?.name || 'Walk-in',
      customerGSTIN: '',
      taxableValue: Math.round(taxable * 100) / 100,
      cgst: Math.round(txnCgst * 100) / 100,
      sgst: Math.round(txnSgst * 100) / 100,
      igst: Math.round(txnIgst * 100) / 100,
      totalTax: Math.round(txn.taxAmount * 100) / 100,
      invoiceValue: Math.round(txn.total * 100) / 100,
      type: 'POS',
    });

    for (const item of txn.items) {
      const itemTaxable = (item.total || 0) - (item.taxAmount || 0);
      addHsn(item.hsnCode, item.name, item.quantity, itemTaxable, item.cgst || 0, item.sgst || 0, item.igst || 0, item.gstRate);
    }
  }

  // ── Totals ────────────────────────────────────────────────────────────
  const allRows = [...b2b, ...b2c];
  const totalTaxableValue = allRows.reduce((s, r) => s + r.taxableValue, 0);
  const totalCgst = allRows.reduce((s, r) => s + r.cgst, 0);
  const totalSgst = allRows.reduce((s, r) => s + r.sgst, 0);
  const totalIgst = allRows.reduce((s, r) => s + r.igst, 0);

  const summary = {
    period: `${String(m).padStart(2, '0')}/${y}`,
    gstin: tenant.gstin || 'Not registered',
    totalInvoices: invoices.length,
    totalPosTransactions: posTxns.length,
    totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalTax: Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100,
    totalInvoiceValue: Math.round(allRows.reduce((s, r) => s + r.invoiceValue, 0) * 100) / 100,
  };

  const hsnSummary = Object.values(hsnMap)
    .map(h => ({
      hsnCode: h.hsnCode,
      description: h.description,
      totalQty: Math.round(h.totalQty * 1000) / 1000,
      taxableValue: Math.round(h.taxableValue * 100) / 100,
      cgst: Math.round(h.cgst * 100) / 100,
      sgst: Math.round(h.sgst * 100) / 100,
      igst: Math.round(h.igst * 100) / 100,
      totalTax: Math.round((h.cgst + h.sgst + h.igst) * 100) / 100,
      rate: h.rate,
    }))
    .sort((a, b) => b.taxableValue - a.taxableValue);

  return { summary, b2b, b2c, hsnSummary };
};

// ── GSTR-3B Return ────────────────────────────────────────────────────────────
const gstr3b = async (tenantId, { month, year, branchId } = {}) => {
  const m = Number(month) || new Date().getMonth() + 1;
  const y = Number(year) || new Date().getFullYear();
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0, 23, 59, 59);
  const bw = branchId ? { branchId } : {};

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, gstin: true } });

  const [invoices, posTxns, vendorBills] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId, issueDate: { gte: from, lte: to }, status: { not: 'CANCELLED' }, ...bw },
      select: { taxAmount: true, gstDetails: true, subtotal: true, discountAmount: true },
    }),
    prisma.transaction.findMany({
      where: { tenantId, createdAt: { gte: from, lte: to }, ...bw },
      select: { subtotal: true, discountAmount: true, items: { select: { cgst: true, sgst: true, igst: true } } },
    }),
    prisma.vendorBill.findMany({
      where: { tenantId, issueDate: { gte: from, lte: to }, status: { not: 'CANCELLED' }, ...bw },
      select: { items: { select: { taxAmount: true, total: true, taxRate: true } } },
    }),
  ]);

  // ── Table 3.1 — Output Tax Liability ──────────────────────────────────
  let outCgst = 0, outSgst = 0, outIgst = 0;
  let outTaxableIntra = 0, outTaxableInter = 0;

  for (const inv of invoices) {
    const isInterState = !!(inv.gstDetails?.isInterState);
    const taxable = (inv.subtotal || 0) - (inv.discountAmount || 0);
    if (isInterState) {
      outIgst += inv.taxAmount || 0;
      outTaxableInter += taxable;
    } else {
      outCgst += (inv.taxAmount || 0) / 2;
      outSgst += (inv.taxAmount || 0) / 2;
      outTaxableIntra += taxable;
    }
  }

  for (const txn of posTxns) {
    for (const item of txn.items) {
      outCgst += item.cgst || 0;
      outSgst += item.sgst || 0;
      outIgst += item.igst || 0;
    }
    outTaxableIntra += (txn.subtotal || 0) - (txn.discountAmount || 0);
  }

  // ── Table 4 — ITC Available ───────────────────────────────────────────
  let itcCgst = 0, itcSgst = 0, itcIgst = 0, itcTaxable = 0;

  for (const bill of vendorBills) {
    for (const item of bill.items) {
      // VendorBillItem has no cgst/sgst/igst columns; estimate as intra-state (split 50/50)
      itcCgst += (item.taxAmount || 0) / 2;
      itcSgst += (item.taxAmount || 0) / 2;
      itcTaxable += (item.total || 0) - (item.taxAmount || 0);
    }
  }

  const outTotal = outCgst + outSgst + outIgst;
  const itcTotal = itcCgst + itcSgst + itcIgst;
  const round2 = (n) => Math.round(n * 100) / 100;

  return {
    period: `${String(m).padStart(2, '0')}/${y}`,
    gstin: tenant.gstin || 'Not registered',
    // Table 3.1
    outputTax: {
      intraState: { taxableValue: round2(outTaxableIntra), cgst: round2(outCgst), sgst: round2(outSgst) },
      interState: { taxableValue: round2(outTaxableInter), igst: round2(outIgst) },
      totalTaxableValue: round2(outTaxableIntra + outTaxableInter),
      totalCgst: round2(outCgst),
      totalSgst: round2(outSgst),
      totalIgst: round2(outIgst),
      total: round2(outTotal),
      invoiceCount: invoices.length,
      posCount: posTxns.length,
    },
    // Table 4
    itcAvailable: {
      cgst: round2(itcCgst),
      sgst: round2(itcSgst),
      igst: round2(itcIgst),
      total: round2(itcTotal),
      taxableValue: round2(itcTaxable),
      vendorBillsCount: vendorBills.length,
      note: 'ITC estimated as intra-state (50/50 CGST/SGST). Update vendor bills with GSTIN for accurate split.',
    },
    // Table 6.1 — Net Tax Payable
    netTaxPayable: {
      cgst: round2(Math.max(0, outCgst - itcCgst)),
      sgst: round2(Math.max(0, outSgst - itcSgst)),
      igst: round2(Math.max(0, outIgst - itcIgst)),
      total: round2(Math.max(0, outTotal - itcTotal)),
    },
  };
};

// ── Demand Trends ─────────────────────────────────────────────────────────────
// Compares two equal-length periods to find rising / declining / new products.
const demandTrends = async (tenantId, { interval = '3m', branchId } = {}) => {
  const now = new Date();
  const days = { '1m': 30, '3m': 90, '6m': 180, '1y': 365 }[interval] || 90;
  const MS = 864e5; // ms per day
  const bw = branchId ? { branchId } : {};

  const curStart  = new Date(now.getTime() - days * MS);
  const prevStart = new Date(now.getTime() - 2 * days * MS);

  const [curItems, prevItems] = await Promise.all([
    prisma.transactionItem.findMany({
      where: { transaction: { tenantId, createdAt: { gte: curStart, lte: now }, ...bw } },
      select: { productId: true, quantity: true, total: true, product: { select: { name: true, sku: true } } },
    }),
    prisma.transactionItem.findMany({
      where: { transaction: { tenantId, createdAt: { gte: prevStart, lt: curStart }, ...bw } },
      select: { productId: true, quantity: true, total: true, product: { select: { name: true, sku: true } } },
    }),
  ]);

  const agg = (items) => {
    const m = {};
    for (const i of items) {
      if (!i.productId) continue;
      if (!m[i.productId]) m[i.productId] = { product: i.product, qty: 0, revenue: 0 };
      m[i.productId].qty += i.quantity;
      m[i.productId].revenue += Number(i.total);
    }
    return m;
  };

  const cur  = agg(curItems);
  const prev = agg(prevItems);
  const allIds = new Set([...Object.keys(cur), ...Object.keys(prev)]);

  const trends = [];
  for (const id of allIds) {
    const c = cur[id]  || { qty: 0, revenue: 0 };
    const p = prev[id] || { qty: 0, revenue: 0 };
    const product = (cur[id] || prev[id]).product;
    if (!product) continue;

    let changePercent;
    let isNew = false;
    if (p.revenue === 0 && c.revenue > 0) {
      changePercent = 100;
      isNew = true;
    } else if (p.revenue === 0) {
      continue; // never sold in either window
    } else {
      changePercent = Math.round(((c.revenue - p.revenue) / p.revenue) * 100);
    }

    trends.push({ id, product, currentRevenue: c.revenue, previousRevenue: p.revenue, currentQty: c.qty, previousQty: p.qty, changePercent, isNew });
  }

  const rising   = trends.filter(t => t.changePercent >  5).sort((a, b) => b.changePercent - a.changePercent).slice(0, 8);
  const declining = trends.filter(t => t.changePercent <= -5).sort((a, b) => a.changePercent - b.changePercent).slice(0, 8);

  return { rising, declining, interval, periodDays: days };
};

module.exports = { dashboard, salesReport, invoiceReport, topProducts, topCustomers, profitLoss, balanceSheet, cashFlow, gstr1, gstr3b, tdsReport, cashBook, creditorAging, demandTrends };
