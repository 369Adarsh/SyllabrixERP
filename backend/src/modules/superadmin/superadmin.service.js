const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');

const config = require('../../config/env');
const SA_SECRET = config.saJwtSecret;

// ── Auth ───────────────────────────────────────────────────────────────────

const login = async ({ email, password }) => {
  const admin = await prisma.superAdmin.findUnique({ where: { email } });
  if (!admin || !admin.isActive) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const token = jwt.sign({ adminId: admin.id, role: admin.role }, SA_SECRET, { expiresIn: '12h' });
  await prisma.superAdmin.update({ where: { id: admin.id }, data: { lastLogin: new Date() } });
  await prisma.auditLog.create({
    data: { actorType: 'SUPER_ADMIN', actorId: admin.id, actorName: admin.name, action: 'ADMIN_LOGIN', resource: 'superAdmin', resourceId: admin.id },
  }).catch(() => {});

  const { password: _, ...safe } = admin;
  return { token, admin: safe };
};

const verifyToken = (token) => jwt.verify(token, SA_SECRET);

const getMe = (id) => prisma.superAdmin.findUnique({
  where: { id },
  select: { id: true, name: true, email: true, role: true, lastLogin: true },
});

// ── Platform Dashboard ─────────────────────────────────────────────────────

const getDashboard = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totalTenants, activeTenants, suspendedTenants,
    newThisMonth, newLast7Days,
    planGroups, recentTenants,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.tenant.count({ where: { isActive: false } }),
    prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.tenant.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.tenant.groupBy({ by: ['plan'], where: { isActive: true }, _count: true }),
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, businessType: true, plan: true, createdAt: true, isActive: true, syllabrixId: true },
    }),
  ]);

  const priceMap = await getPlanPriceMap();
  let mrrToday = 0;
  const planBreakdown = {};
  planGroups.forEach(g => {
    planBreakdown[g.plan] = g._count;
    mrrToday += g._count * (priceMap[g.plan] || 0);
  });

  return {
    totalTenants,
    activeTenants,
    suspendedTenants,
    newThisMonth,
    newLast7Days,
    mrrToday,
    planBreakdown,
    recentTenants: recentTenants.map(t => ({ ...t, businessName: t.name })),
  };
};

// ── Tenant Management ──────────────────────────────────────────────────────

const listTenants = ({ search, businessType, plan, isActive, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
  if (businessType) where.businessType = businessType;
  if (plan) where.plan = plan;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  return Promise.all([
    prisma.tenant.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, businessType: true,
        plan: true, isActive: true, gstin: true, city: true, state: true, createdAt: true,
        syllabrixId: true, hasBranches: true,
        branches: { select: { id: true, name: true, code: true, isHQ: true, syllabrixId: true, city: true }, orderBy: { isHQ: 'desc' } },
        _count: { select: { users: true, invoices: true, transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: Number(limit),
    }),
    prisma.tenant.count({ where }),
  ]);
};

const getTenant = async (id) => {
  const [tenant, compliance, notes, recentTickets, roleReqs, stats] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true } },
        _count: { select: { invoices: true, transactions: true, products: true, customers: true, expenses: true } },
      },
    }),
    prisma.complianceRecord.findUnique({ where: { tenantId: id } }),
    prisma.tenantNote.findMany({ where: { tenantId: id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.supportTicket.findMany({ where: { tenantId: id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.roleRequest.findMany({ where: { tenantId: id }, orderBy: { createdAt: 'desc' } }),
    // Revenue proxy: sum of invoice totals
    prisma.invoice.aggregate({ where: { tenantId: id, status: 'PAID' }, _sum: { total: true }, _count: true }),
  ]);

  return { tenant, compliance, notes, recentTickets, roleReqs, stats: { paidInvoiceTotal: stats._sum.total || 0, paidInvoiceCount: stats._count } };
};

const toggleTenant = async (id, adminName) => {
  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { isActive: true, name: true } });
  const updated = await prisma.tenant.update({ where: { id }, data: { isActive: !tenant.isActive } });
  await prisma.auditLog.create({
    data: { tenantId: id, actorType: 'SUPER_ADMIN', actorId: 'system', actorName: adminName, action: tenant.isActive ? 'DEACTIVATE_TENANT' : 'ACTIVATE_TENANT', resource: 'tenant', resourceId: id },
  });
  return updated;
};

const changePlan = async (id, plan, adminName) => {
  const updated = await prisma.tenant.update({ where: { id }, data: { plan } });
  await prisma.auditLog.create({
    data: { tenantId: id, actorType: 'SUPER_ADMIN', actorId: 'system', actorName: adminName, action: 'CHANGE_PLAN', resource: 'tenant', resourceId: id, details: { plan } },
  });
  return updated;
};

const addTenantNote = (tenantId, content, createdBy) =>
  prisma.tenantNote.create({ data: { tenantId, content, createdBy } });

const terminateTenant = async (id, adminName) => {
  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { name: true, email: true, syllabrixId: true } });
  if (!tenant) throw Object.assign(new Error('Tenant not found'), { statusCode: 404 });
  // Log before delete (audit record won't survive cascade)
  await prisma.auditLog.create({
    data: {
      tenantId: id,
      actorType: 'SUPER_ADMIN',
      actorId: 'system',
      actorName: adminName,
      action: 'TERMINATE_TENANT',
      resource: 'tenant',
      resourceId: id,
      details: { name: tenant.name, email: tenant.email, syllabrixId: tenant.syllabrixId },
    },
  }).catch(() => {}); // best-effort — if audit fails don't block deletion
  await prisma.tenant.delete({ where: { id } });
  return { terminated: true, name: tenant.name };
};

// ── Role Requests ──────────────────────────────────────────────────────────

const listRoleRequests = (status) =>
  prisma.roleRequest.findMany({
    where: status ? { status } : undefined,
    include: { tenant: { select: { name: true, email: true, businessType: true } } },
    orderBy: { createdAt: 'desc' },
  });

const resolveRoleRequest = async (id, { status, adminNote }, adminName) => {
  const updated = await prisma.roleRequest.update({ where: { id }, data: { status, adminNote } });
  await prisma.auditLog.create({
    data: { actorType: 'SUPER_ADMIN', actorId: 'system', actorName: adminName, action: `ROLE_REQUEST_${status}`, resource: 'role_request', resourceId: id, details: { adminNote } },
  });
  return updated;
};

// ── Audit Logs ─────────────────────────────────────────────────────────────

const getAuditLogs = async ({ tenantId, action, from, to, page = 1, limit = 50 } = {}) => {
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (action)   where.action = { contains: action, mode: 'insensitive' };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);
  }
  const logs = await prisma.auditLog.findMany({
    where, orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit), take: Number(limit),
  });

  // Resolve tenant names for logs that have a tenantId
  const tenantIds = [...new Set(logs.map(l => l.tenantId).filter(Boolean))];
  const tenantMap = {};
  if (tenantIds.length) {
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, syllabrixId: true },
    });
    tenants.forEach(t => { tenantMap[t.id] = t; });
  }

  return logs.map(l => ({
    ...l,
    tenantName:       l.tenantId ? (tenantMap[l.tenantId]?.name || l.tenantId.slice(0, 8)) : null,
    tenantSyllabrixId: l.tenantId ? tenantMap[l.tenantId]?.syllabrixId : null,
  }));
};

// ── Growth Wing ────────────────────────────────────────────────────────────

const PLAN_PRICE = { STARTER: 999, GROWTH: 2499, SCALE: 4999 };

// Returns price map from DB, falls back to hardcoded defaults if no plans seeded yet
const getPlanPriceMap = async () => {
  try {
    const plans = await prisma.platformPlan.findMany({ where: { isActive: true } });
    if (!plans.length) return PLAN_PRICE;
    const map = {};
    plans.forEach(p => { map[p.key] = p.monthlyPrice; });
    return map;
  } catch {
    return PLAN_PRICE;
  }
};

const getRevenue = async () => {
  const [planGroups, totalTenants, activeTenants, priceMap] = await Promise.all([
    prisma.tenant.groupBy({ by: ['plan'], where: { isActive: true }, _count: true }),
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    getPlanPriceMap(),
  ]);

  let mrr = 0;
  const planDistribution = planGroups.map(g => {
    const revenue = g._count * (priceMap[g.plan] || 0);
    mrr += revenue;
    return { plan: g.plan, count: g._count, revenue, pricePerMonth: priceMap[g.plan] || 0 };
  });

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const signups = await prisma.tenant.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true, plan: true },
  });

  const monthMap = {};
  signups.forEach(t => {
    const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) monthMap[key] = { month: key, count: 0, revenue: 0 };
    monthMap[key].count++;
    monthMap[key].revenue += priceMap[t.plan] || 0;
  });

  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.push(monthMap[key] || { month: key, count: 0, revenue: 0 });
  }

  const typeGroups = await prisma.tenant.groupBy({
    by: ['businessType', 'plan'],
    where: { isActive: true },
    _count: true,
  });

  const typeRevMap = {};
  typeGroups.forEach(g => {
    if (!typeRevMap[g.businessType]) typeRevMap[g.businessType] = { type: g.businessType, count: 0, revenue: 0 };
    typeRevMap[g.businessType].count += g._count;
    typeRevMap[g.businessType].revenue += g._count * (priceMap[g.plan] || 0);
  });

  return {
    mrr,
    arr: mrr * 12,
    churnRate: totalTenants > 0 ? parseFloat(((totalTenants - activeTenants) / totalTenants * 100).toFixed(1)) : 0,
    totalTenants,
    activeTenants,
    planDistribution,
    monthlyData,
    revenueByType: Object.values(typeRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
  };
};

const getPlansOverview = async ({ page = 1, limit = 30, plan, search } = {}) => {
  const where = {};
  if (plan) where.plan = plan;
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, businessType: true, plan: true, isActive: true, createdAt: true, syllabrixId: true, city: true, state: true },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.tenant.count({ where }),
  ]);

  const planChangeLogs = await prisma.auditLog.findMany({
    where: { action: 'CHANGE_PLAN', tenantId: { in: tenants.map(t => t.id) } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const logsByTenant = {};
  planChangeLogs.forEach(l => {
    if (!logsByTenant[l.tenantId]) logsByTenant[l.tenantId] = [];
    logsByTenant[l.tenantId].push(l);
  });

  const priceMap = await getPlanPriceMap();
  return {
    tenants: tenants.map(t => ({ ...t, monthlyPrice: priceMap[t.plan] || 0, planHistory: logsByTenant[t.id] || [] })),
    total, page: Number(page), limit: Number(limit),
  };
};

const getOnboardingPipeline = async () => {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true, name: true, email: true, businessType: true, plan: true,
      createdAt: true, syllabrixId: true, isActive: true,
      complianceRecord: { select: { kycStatus: true, riskLevel: true, lastReviewed: true, gstVerified: true, panVerified: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();
  const daysSince = (d) => Math.floor((now - new Date(d).getTime()) / 86400000);

  const stages = { NEW_SIGNUP: [], SUBMITTED: [], UNDER_REVIEW: [], VERIFIED: [], REJECTED: [] };

  tenants.forEach(t => {
    const kyc = t.complianceRecord?.kycStatus || 'PENDING';
    const entry = { ...t, daysSinceSignup: daysSince(t.createdAt), daysSinceReview: t.complianceRecord?.lastReviewed ? daysSince(t.complianceRecord.lastReviewed) : null };
    if (!t.complianceRecord || kyc === 'PENDING') stages.NEW_SIGNUP.push(entry);
    else if (kyc === 'SUBMITTED')    stages.SUBMITTED.push(entry);
    else if (kyc === 'UNDER_REVIEW') stages.UNDER_REVIEW.push(entry);
    else if (kyc === 'VERIFIED')     stages.VERIFIED.push(entry);
    else                             stages.REJECTED.push(entry);
  });

  return {
    stages,
    summary: { newSignup: stages.NEW_SIGNUP.length, submitted: stages.SUBMITTED.length, underReview: stages.UNDER_REVIEW.length, verified: stages.VERIFIED.length, rejected: stages.REJECTED.length },
  };
};

// ── Platform Analytics ─────────────────────────────────────────────────────

const getPlatformAnalytics = async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [allTenants, businessTypeGroups, cityGroups, stateGroups] = await Promise.all([
    prisma.tenant.findMany({
      select: { id: true, createdAt: true, isActive: true, plan: true, businessType: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tenant.groupBy({ by: ['businessType'], _count: true, orderBy: { _count: { businessType: 'desc' } } }),
    prisma.tenant.groupBy({ by: ['city'], where: { city: { not: null } }, _count: true, orderBy: { _count: { city: 'desc' } }, take: 10 }),
    prisma.tenant.groupBy({ by: ['state'], where: { state: { not: null } }, _count: true, orderBy: { _count: { state: 'desc' } }, take: 10 }),
  ]);

  // Monthly growth (last 12 months) with cumulative count
  const monthMap = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { month: key, newTenants: 0, cumulative: 0 };
  }

  // Count signups per month across ALL time to compute cumulative
  let cumulativeBefore = 0;
  allTenants.forEach(t => {
    const d = new Date(t.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (d < twelveMonthsAgo) { cumulativeBefore++; return; }
    if (monthMap[key]) monthMap[key].newTenants++;
  });

  let running = cumulativeBefore;
  const monthlyGrowth = Object.values(monthMap).map(m => {
    running += m.newTenants;
    return { ...m, cumulative: running };
  });

  // Retention cohorts — last 6 months
  const cohorts = [];
  for (let i = 5; i >= 0; i--) {
    const cohortStart = new Date();
    cohortStart.setMonth(cohortStart.getMonth() - i);
    cohortStart.setDate(1); cohortStart.setHours(0, 0, 0, 0);
    const cohortEnd = new Date(cohortStart);
    cohortEnd.setMonth(cohortEnd.getMonth() + 1);

    const cohortTenants = allTenants.filter(t => {
      const d = new Date(t.createdAt);
      return d >= cohortStart && d < cohortEnd;
    });
    const activeInCohort = cohortTenants.filter(t => t.isActive).length;
    const label = `${cohortStart.toLocaleString('en-IN', { month: 'short' })} ${cohortStart.getFullYear()}`;
    cohorts.push({
      label,
      total: cohortTenants.length,
      active: activeInCohort,
      retentionPct: cohortTenants.length > 0
        ? parseFloat((activeInCohort / cohortTenants.length * 100).toFixed(1))
        : null,
    });
  }

  return {
    monthlyGrowth,
    retentionCohorts: cohorts,
    businessTypeDistribution: businessTypeGroups.map(g => ({ type: g.businessType, count: g._count })),
    topCities: cityGroups.map(g => ({ city: g.city, count: g._count })),
    topStates: stateGroups.map(g => ({ state: g.state, count: g._count })),
    totalTenants: allTenants.length,
    activeTenants: allTenants.filter(t => t.isActive).length,
  };
};

// ── Error Tracker ──────────────────────────────────────────────────────────

const getErrorLogs = async ({ days = 7, statusCode, path: pathFilter } = {}) => {
  const since = new Date(Date.now() - Number(days) * 86400000);
  const where = { createdAt: { gte: since } };
  if (statusCode) where.statusCode = Number(statusCode);
  if (pathFilter) where.path = { contains: pathFilter };

  const [logs, totalCount, byStatusCode, byPath, byTenant, dailyTrend] = await Promise.all([
    // Recent individual errors
    prisma.platformErrorLog.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 100,
    }),
    // Total count in period
    prisma.platformErrorLog.count({ where }),
    // Group by status code
    prisma.platformErrorLog.groupBy({
      by: ['statusCode'], where, _count: true,
      orderBy: { _count: { statusCode: 'desc' } },
    }),
    // Top error paths
    prisma.platformErrorLog.groupBy({
      by: ['path', 'statusCode'], where, _count: true,
      orderBy: { _count: { path: 'desc' } }, take: 15,
    }),
    // Per-tenant breakdown (only non-null tenantIds)
    prisma.platformErrorLog.groupBy({
      by: ['tenantId'], where: { ...where, tenantId: { not: null } }, _count: true,
      orderBy: { _count: { tenantId: 'desc' } }, take: 10,
    }),
    // Daily trend (last N days)
    prisma.platformErrorLog.findMany({
      where, select: { statusCode: true, createdAt: true }, orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Build daily trend map
  const dayMap = {};
  for (let i = Number(days) - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = { date: key, count: 0, errors5xx: 0, errors4xx: 0 };
  }
  dailyTrend.forEach(e => {
    const key = new Date(e.createdAt).toISOString().slice(0, 10);
    if (dayMap[key]) {
      dayMap[key].count++;
      if (e.statusCode >= 500) dayMap[key].errors5xx++;
      else if (e.statusCode >= 400) dayMap[key].errors4xx++;
    }
  });

  // Resolve tenant names for per-tenant breakdown
  const tenantIds = byTenant.map(t => t.tenantId).filter(Boolean);
  const tenantNames = tenantIds.length
    ? await prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, name: true, syllabrixId: true } })
    : [];
  const tenantMap = Object.fromEntries(tenantNames.map(t => [t.id, t]));

  return {
    totalCount,
    logs,
    byStatusCode,
    topPaths: byPath,
    byTenant: byTenant.map(t => ({ ...t, tenantName: tenantMap[t.tenantId]?.name || t.tenantId, syllabrixId: tenantMap[t.tenantId]?.syllabrixId })),
    dailyTrend: Object.values(dayMap),
  };
};

// ── Feature Flags ──────────────────────────────────────────────────────────

const ALL_MODULES = [
  { key: 'dashboard',   label: 'Dashboard',          icon: '▦' },
  { key: 'invoicing',   label: 'Invoicing',           icon: '🧾' },
  { key: 'pos',         label: 'Point of Sale',       icon: '🛒' },
  { key: 'inventory',   label: 'Inventory',           icon: '📦' },
  { key: 'customers',   label: 'Customers',           icon: '👥' },
  { key: 'appointments',label: 'Appointments',        icon: '📅' },
  { key: 'expenses',    label: 'Expenses',            icon: '💸' },
  { key: 'payroll',     label: 'Payroll',             icon: '💰' },
  { key: 'attendance',  label: 'Attendance',          icon: '🕐' },
  { key: 'fees',        label: 'Fees',                icon: '🎓' },
  { key: 'campaigns',   label: 'Campaigns',           icon: '📣' },
  { key: 'creditnotes', label: 'Credit Notes',        icon: '📝' },
  { key: 'quotations',  label: 'Quotations',          icon: '📄' },
  { key: 'reports',     label: 'Reports',             icon: '📊' },
  { key: 'bills',       label: 'Bills & Payables',    icon: '🏷️' },
  { key: 'assets',      label: 'Asset Management',    icon: '🏗️' },
  { key: 'subscriptions',label:'Subscriptions',       icon: '🔄' },
  { key: 'whatsapp',    label: 'WhatsApp',            icon: '💬' },
  { key: 'vendors',     label: 'Vendors',             icon: '🏭' },
  { key: 'lease',       label: 'Lease Management',    icon: '🏢' },
  { key: 'staff',       label: 'Staff',               icon: '👤' },
  { key: 'returns',     label: 'Returns',             icon: '↩️' },
];

const getFeatureFlags = async () => {
  const flags = await prisma.featureFlag.findMany();
  const flagMap = {};
  flags.forEach(f => { flagMap[f.moduleKey] = f; });

  return ALL_MODULES.map(m => ({
    ...m,
    isEnabled: flagMap[m.key]?.isEnabled ?? true,
    reason: flagMap[m.key]?.reason ?? null,
    toggledBy: flagMap[m.key]?.toggledBy ?? null,
    toggledAt: flagMap[m.key]?.toggledAt ?? null,
  }));
};

const toggleFeatureFlag = async (moduleKey, isEnabled, reason, adminName) => {
  const flag = await prisma.featureFlag.upsert({
    where: { moduleKey },
    update: { isEnabled, reason, toggledBy: adminName, toggledAt: new Date() },
    create: { moduleKey, isEnabled, reason, toggledBy: adminName },
  });
  await prisma.auditLog.create({
    data: {
      actorType: 'SUPER_ADMIN', actorId: 'system', actorName: adminName,
      action: isEnabled ? 'MODULE_ENABLED' : 'MODULE_DISABLED',
      resource: 'featureFlag', resourceId: moduleKey,
      details: { moduleKey, isEnabled, reason },
    },
  }).catch(() => {});
  return flag;
};

const getTenantModules = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, modules: true, businessType: true } });
  if (!tenant) throw Object.assign(new Error('Tenant not found'), { statusCode: 404 });
  return tenant;
};

const setTenantModule = async (tenantId, moduleKey, action, adminName) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { modules: true, name: true } });
  if (!tenant) throw Object.assign(new Error('Tenant not found'), { statusCode: 404 });

  let modules = Array.isArray(tenant.modules) ? [...tenant.modules] : [];
  if (action === 'enable' && !modules.includes(moduleKey)) modules.push(moduleKey);
  if (action === 'disable') modules = modules.filter(m => m !== moduleKey);

  const updated = await prisma.tenant.update({ where: { id: tenantId }, data: { modules } });
  await prisma.auditLog.create({
    data: {
      actorType: 'SUPER_ADMIN', actorId: 'system', actorName: adminName,
      action: action === 'enable' ? 'TENANT_MODULE_ENABLED' : 'TENANT_MODULE_DISABLED',
      resource: 'tenant', resourceId: tenantId,
      details: { moduleKey, action, tenantName: tenant.name },
    },
  }).catch(() => {});
  return updated;
};

// ── Module Usage ────────────────────────────────────────────────────────────

const getModuleUsage = async () => {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { modules: true },
  });

  const totalActive = tenants.length;
  const moduleCount = {};
  ALL_MODULES.forEach(m => { moduleCount[m.key] = 0; });

  tenants.forEach(t => {
    const mods = Array.isArray(t.modules) ? t.modules : [];
    mods.forEach(k => { if (moduleCount[k] !== undefined) moduleCount[k]++; });
  });

  // Activity from TenantActivityLog (last 30 days)
  const since = new Date(Date.now() - 30 * 86400000);
  const activityRows = await prisma.tenantActivityLog.groupBy({
    by: ['module'],
    where: { createdAt: { gte: since } },
    _count: true,
    orderBy: { _count: { module: 'desc' } },
  });

  const activityMap = {};
  activityRows.forEach(r => { activityMap[r.module] = r._count; });

  const usage = ALL_MODULES.map(m => ({
    ...m,
    enabledCount: moduleCount[m.key] || 0,
    adoptionPct: totalActive > 0 ? parseFloat(((moduleCount[m.key] || 0) / totalActive * 100).toFixed(1)) : 0,
    activityLast30d: activityMap[m.key] || 0,
  })).sort((a, b) => b.adoptionPct - a.adoptionPct);

  return { totalActiveTenants: totalActive, modules: usage };
};

// ── Platform Health ────────────────────────────────────────────────────────

const getPlatformHealth = async () => {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

  let dbStatus = 'OK';
  let dbLatencyMs = 0;
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
  } catch {
    dbStatus = 'ERROR';
  }

  const [errorsLast1h, errorsLast24h, errorsByStatus, topEndpoints, recentErrors] = await Promise.all([
    prisma.platformErrorLog.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.platformErrorLog.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
    prisma.platformErrorLog.groupBy({
      by: ['statusCode'], _count: true,
      where: { createdAt: { gte: twentyFourHoursAgo } },
      orderBy: { _count: { statusCode: 'desc' } },
    }),
    prisma.platformErrorLog.groupBy({
      by: ['path'], _count: true,
      where: { createdAt: { gte: twentyFourHoursAgo } },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
    prisma.platformErrorLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { id: true, statusCode: true, method: true, path: true, message: true, createdAt: true, tenantId: true },
    }),
  ]);

  return {
    db: { status: dbStatus, latencyMs: dbLatencyMs },
    api: { status: 'OK' },
    errors: { last1h: errorsLast1h, last24h: errorsLast24h },
    errorsByStatus: errorsByStatus.map(e => ({ statusCode: e.statusCode, count: e._count })),
    topErrorEndpoints: topEndpoints.map(e => ({ path: e.path, count: e._count })),
    recentErrors,
  };
};

// ── Maintenance Mode ───────────────────────────────────────────────────────

const getMaintenanceWindows = () =>
  prisma.maintenanceWindow.findMany({ orderBy: { startAt: 'desc' }, take: 50 });

const getActiveMaintenance = () =>
  prisma.maintenanceWindow.findFirst({ where: { isActive: true }, orderBy: { startAt: 'desc' } });

const scheduleMaintenance = async ({ title, message, startAt, endAt, isEmergency, adminName }) => {
  const window = await prisma.maintenanceWindow.create({
    data: {
      title, message,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      isEmergency: !!isEmergency,
      isActive: !!isEmergency,
      createdBy: adminName,
    },
  });
  await prisma.auditLog.create({
    data: { actorType: 'SUPER_ADMIN', actorName: adminName, action: 'MAINTENANCE_SCHEDULED', resource: 'maintenanceWindow', resourceId: window.id },
  }).catch(() => {});
  return window;
};

const activateMaintenance = async (id, adminName) => {
  const window = await prisma.maintenanceWindow.update({
    where: { id },
    data: { isActive: true },
  });
  await prisma.auditLog.create({
    data: { actorType: 'SUPER_ADMIN', actorName: adminName, action: 'MAINTENANCE_ACTIVATED', resource: 'maintenanceWindow', resourceId: id },
  }).catch(() => {});
  return window;
};

const cancelMaintenance = async (id, adminName) => {
  const window = await prisma.maintenanceWindow.update({
    where: { id },
    data: { isActive: false, cancelledAt: new Date() },
  });
  await prisma.auditLog.create({
    data: { actorType: 'SUPER_ADMIN', actorName: adminName, action: 'MAINTENANCE_CANCELLED', resource: 'maintenanceWindow', resourceId: id },
  }).catch(() => {});
  return window;
};

// ── Subscriptions ──────────────────────────────────────────────────────────

const getSubscriptions = async ({ plan, status, search, page = 1, limit = 30 } = {}) => {
  const where = {};
  if (plan) where.plan = plan;
  if (status === 'active') where.isActive = true;
  if (status === 'suspended') where.isActive = false;
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { syllabrixId: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ];

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      select: { id: true, name: true, email: true, syllabrixId: true, plan: true, isActive: true, createdAt: true, businessType: true, city: true },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.tenant.count({ where }),
  ]);

  const [planGroups, priceMap] = await Promise.all([
    prisma.tenant.groupBy({ by: ['plan'], where: { isActive: true }, _count: true }),
    getPlanPriceMap(),
  ]);
  let totalMrr = 0;
  const planSummary = planGroups.map(g => {
    const rev = g._count * (priceMap[g.plan] || 0);
    totalMrr += rev;
    return { plan: g.plan, count: g._count, mrr: rev };
  });

  const now = new Date();
  const subscriptions = tenants.map(t => {
    const created = new Date(t.createdAt);
    const monthsElapsed = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    const renewalDay = created.getDate();
    const nextRenewal = new Date(now.getFullYear(), now.getMonth(), renewalDay);
    if (nextRenewal <= now) nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    const daysUntilRenewal = Math.ceil((nextRenewal - now) / (1000 * 60 * 60 * 24));

    return {
      ...t,
      businessName: t.name,
      monthlyPrice: priceMap[t.plan] || 0,
      nextRenewal: nextRenewal.toISOString(),
      daysUntilRenewal,
      isOverdue: !t.isActive && t.plan !== 'FREE',
      monthsActive: monthsElapsed,
    };
  });

  return { subscriptions, total, page: Number(page), limit: Number(limit), planSummary, totalMrr };
};

// ── Super Admin Management ─────────────────────────────────────────────────

const listAdmins = () => prisma.superAdmin.findMany({
  select: { id: true, name: true, email: true, role: true, platformRoleId: true, isActive: true, lastLogin: true, createdAt: true,
    platformRole: { select: { id: true, label: true, name: true } } },
  orderBy: { createdAt: 'asc' },
});

const createAdmin = async ({ name, email, password, role }) => {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.superAdmin.create({ data: { name, email, password: hashed, role }, select: { id: true, name: true, email: true, role: true } });
};

const seedDefaultAdmin = async () => {
  const initPassword = process.env.SA_INIT_PASSWORD;
  if (!initPassword) {
    console.warn('[WARN] SA_INIT_PASSWORD not set — skipping default superadmin seed. Set this env var to create the first admin.');
    return;
  }
  const initEmail = process.env.SA_INIT_EMAIL || 'support@syllabrix.com';
  const exists = await prisma.superAdmin.findUnique({ where: { email: initEmail } });
  if (exists) return;
  const hashed = await bcrypt.hash(initPassword, 10);
  await prisma.superAdmin.create({ data: { name: 'Syllabrix Admin', email: initEmail, password: hashed, role: 'SUPER' } });
  console.log(`✅ Default super admin created: ${initEmail}`);
};

// ── Plan Builder ───────────────────────────────────────────────────────────

const DEFAULT_PLANS = [
  {
    key: 'STARTER', name: 'Starter', tagline: 'Perfect for getting started',
    description: 'Essential modules for small businesses launching on Syllabrix.',
    monthlyPrice: 999, yearlyPrice: 9990, color: '#10B981',
    trialDays: 14, sortOrder: 1,
    modules: ['dashboard','invoicing','pos','inventory','customers','expenses','reports'],
    maxUsers: 3, maxBranches: 1,
  },
  {
    key: 'GROWTH', name: 'Growth', tagline: 'For growing businesses',
    description: 'Everything in Starter plus advanced tools for scaling teams.',
    monthlyPrice: 2499, yearlyPrice: 24990, color: '#3B82F6',
    trialDays: 14, sortOrder: 2,
    modules: ['dashboard','invoicing','pos','inventory','customers','expenses','reports','appointments','payroll','attendance','staff','campaigns','creditnotes','quotations','bills','whatsapp'],
    maxUsers: 15, maxBranches: 3,
  },
  {
    key: 'SCALE', name: 'Scale', tagline: 'Unlimited power',
    description: 'All modules, unlimited users, multi-branch, and priority support.',
    monthlyPrice: 4999, yearlyPrice: 49990, color: '#8B5CF6',
    trialDays: 30, sortOrder: 3,
    modules: ['dashboard','invoicing','pos','inventory','customers','expenses','reports','appointments','payroll','attendance','staff','campaigns','creditnotes','quotations','bills','whatsapp','assets','vendors','lease','returns','subscriptions'],
    maxUsers: null, maxBranches: null,
  },
];

const seedDefaultPlans = async () => {
  const count = await prisma.platformPlan.count();
  if (count > 0) return;
  for (const plan of DEFAULT_PLANS) {
    await prisma.platformPlan.create({ data: plan });
  }
  console.log('✅ Default platform plans seeded');
};

const getManagedPlans = () =>
  prisma.platformPlan.findMany({ orderBy: { sortOrder: 'asc' } });

const createManagedPlan = (data, adminName) =>
  prisma.platformPlan.create({
    data: {
      key: data.key.toUpperCase(),
      name: data.name,
      tagline: data.tagline || null,
      description: data.description || null,
      monthlyPrice: Number(data.monthlyPrice),
      yearlyPrice: data.yearlyPrice ? Number(data.yearlyPrice) : null,
      color: data.color || '#1FB8D6',
      isActive: data.isActive !== false,
      isPublic: data.isPublic !== false,
      trialDays: Number(data.trialDays || 0),
      modules: data.modules || [],
      maxUsers: data.maxUsers ? Number(data.maxUsers) : null,
      maxBranches: data.maxBranches ? Number(data.maxBranches) : null,
      sortOrder: Number(data.sortOrder || 0),
    },
  });

const updateManagedPlan = (id, data) =>
  prisma.platformPlan.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.tagline !== undefined && { tagline: data.tagline }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.monthlyPrice !== undefined && { monthlyPrice: Number(data.monthlyPrice) }),
      ...(data.yearlyPrice !== undefined && { yearlyPrice: data.yearlyPrice ? Number(data.yearlyPrice) : null }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.trialDays !== undefined && { trialDays: Number(data.trialDays) }),
      ...(data.modules !== undefined && { modules: data.modules }),
      ...(data.maxUsers !== undefined && { maxUsers: data.maxUsers ? Number(data.maxUsers) : null }),
      ...(data.maxBranches !== undefined && { maxBranches: data.maxBranches ? Number(data.maxBranches) : null }),
      ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) }),
    },
  });

const toggleManagedPlan = async (id) => {
  const plan = await prisma.platformPlan.findUnique({ where: { id } });
  if (!plan) throw Object.assign(new Error('Plan not found'), { statusCode: 404 });
  return prisma.platformPlan.update({ where: { id }, data: { isActive: !plan.isActive } });
};

const deleteManagedPlan = (id) => prisma.platformPlan.delete({ where: { id } });

// Offers
const getManagedOffers = () =>
  prisma.platformOffer.findMany({ orderBy: { createdAt: 'desc' } });

const createManagedOffer = (data, adminName) =>
  prisma.platformOffer.create({
    data: {
      code: data.code.toUpperCase().trim(),
      description: data.description || null,
      discountType: data.discountType || 'PERCENT',
      discountValue: Number(data.discountValue),
      applicablePlans: data.applicablePlans || [],
      maxUses: data.maxUses ? Number(data.maxUses) : null,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      isActive: data.isActive !== false,
      createdBy: adminName,
    },
  });

const updateManagedOffer = (id, data) =>
  prisma.platformOffer.update({
    where: { id },
    data: {
      ...(data.description !== undefined && { description: data.description }),
      ...(data.discountType !== undefined && { discountType: data.discountType }),
      ...(data.discountValue !== undefined && { discountValue: Number(data.discountValue) }),
      ...(data.applicablePlans !== undefined && { applicablePlans: data.applicablePlans }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses ? Number(data.maxUses) : null }),
      ...(data.validFrom !== undefined && { validFrom: data.validFrom ? new Date(data.validFrom) : null }),
      ...(data.validUntil !== undefined && { validUntil: data.validUntil ? new Date(data.validUntil) : null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

const deleteManagedOffer = (id) => prisma.platformOffer.delete({ where: { id } });

// ── Platform Settings (API Keys) ─────────────────────────────────────────────

const SETTING_KEYS = [
  // AI Copilot
  'groq_api_key', 'gemini_api_key', 'anthropic_api_key',
  // Payments — Razorpay
  'razorpay_key_id', 'razorpay_key_secret', 'razorpay_webhook_secret',
  // Messaging — WhatsApp / Meta
  'whatsapp_token', 'whatsapp_phone_id', 'whatsapp_waba_id', 'whatsapp_webhook_secret',
  // Email — SMTP
  'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_email',
];

const getSettings = async () => {
  const rows = await prisma.platformSetting.findMany({ where: { key: { in: SETTING_KEYS } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r]));
  return SETTING_KEYS.map((key) => ({
    key,
    value: map[key] ? maskKey(map[key].value) : '',
    hasValue: !!map[key]?.value,
    updatedAt: map[key]?.updatedAt || null,
    updatedBy: map[key]?.updatedBy || null,
  }));
};

const maskKey = (val) => {
  if (!val || val.length < 8) return '••••••••';
  return val.slice(0, 6) + '••••••••••••' + val.slice(-4);
};

const saveSettings = async (data, adminName) => {
  const results = [];
  for (const [key, value] of Object.entries(data)) {
    if (!SETTING_KEYS.includes(key)) continue;
    if (value === undefined) continue;
    if (value === '') {
      await prisma.platformSetting.deleteMany({ where: { key } });
      results.push(key);
      continue;
    }
    if (value.includes('•')) continue; // skip masked display values
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value, updatedBy: adminName },
      create: { key, value, updatedBy: adminName },
    });
    results.push(key);
  }
  // Reload AI config cache
  await loadAiKeysIntoConfig();
  return { updated: results };
};

const testApiKey = async ({ provider, key: rawKey }) => {
  // If frontend sends '__saved__', load the actual key from DB
  let key = rawKey;
  if (key === '__saved__') {
    const keyMap = { groq: 'groq_api_key', gemini: 'gemini_api_key', anthropic: 'anthropic_api_key' };
    const row = await prisma.platformSetting.findUnique({ where: { key: keyMap[provider] } });
    if (!row?.value) throw Object.assign(new Error('No key saved for this provider'), { statusCode: 400 });
    key = row.value;
  }
  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw Object.assign(new Error(e.error?.message || 'Invalid key'), { statusCode: 400 }); }
    return { provider, status: 'valid', message: 'Groq key is working' };
  }
  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 5, messages: [{ role: 'user', content: 'Hi' }] }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw Object.assign(new Error(e.error?.message || 'Invalid key'), { statusCode: 400 }); }
    return { provider, status: 'valid', message: 'Anthropic key is working' };
  }
  if (provider === 'gemini') {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: key });
    try {
      await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] });
      return { provider, status: 'valid', message: 'Gemini key is working' };
    } catch (e) {
      throw Object.assign(new Error(e.message?.slice(0, 120) || 'Invalid key'), { statusCode: 400 });
    }
  }
  throw Object.assign(new Error('Unknown provider'), { statusCode: 400 });
};

// Loads saved DB keys into config at startup and after save
const loadAiKeysIntoConfig = async () => {
  try {
    const rows = await prisma.platformSetting.findMany({ where: { key: { in: SETTING_KEYS } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    // AI
    if (map.groq_api_key)            config.groqApiKey            = map.groq_api_key;
    if (map.gemini_api_key)          config.geminiApiKey          = map.gemini_api_key;
    if (map.anthropic_api_key)       config.anthropicApiKey       = map.anthropic_api_key;
    // Payments
    if (map.razorpay_key_id)         config.razorpayKeyId         = map.razorpay_key_id;
    if (map.razorpay_key_secret)     config.razorpayKeySecret     = map.razorpay_key_secret;
    if (map.razorpay_webhook_secret) config.razorpayWebhookSecret = map.razorpay_webhook_secret;
    // Messaging
    if (map.whatsapp_token)          config.whatsappToken         = map.whatsapp_token;
    if (map.whatsapp_phone_id)       config.whatsappPhoneId       = map.whatsapp_phone_id;
    if (map.whatsapp_waba_id)        config.whatsappWabaId        = map.whatsapp_waba_id;
    if (map.whatsapp_webhook_secret) config.whatsappWebhookSecret = map.whatsapp_webhook_secret;
    // Email / SMTP
    if (map.smtp_host)               config.smtpHost              = map.smtp_host;
    if (map.smtp_port)               config.smtpPort              = map.smtp_port;
    if (map.smtp_user)               config.smtpUser              = map.smtp_user;
    if (map.smtp_pass)               config.smtpPass              = map.smtp_pass;
    if (map.from_email)              config.fromEmail             = map.from_email;
  } catch {}
};

// Call on server startup
loadAiKeysIntoConfig();

// ── Nerve Center RBAC ─────────────────────────────────────────────────────────

const WINGS = ['COMMAND', 'GROWTH', 'TENANTS', 'PLATFORM', 'OPERATIONS', 'INTELLIGENCE', 'ADMIN'];

const listNcRoles = () =>
  prisma.platformRole.findMany({ orderBy: [{ isBuiltIn: 'desc' }, { name: 'asc' }] });

const createNcRole = async ({ name, label, description, permissions }) => {
  if (!name || !label) throw Object.assign(new Error('name and label required'), { statusCode: 400 });
  const clean = {};
  for (const w of WINGS) {
    clean[w] = {
      C: !!permissions?.[w]?.C,
      R: !!permissions?.[w]?.R,
      U: !!permissions?.[w]?.U,
      D: !!permissions?.[w]?.D,
    };
  }
  return prisma.platformRole.create({ data: { name: name.toUpperCase(), label, description, isBuiltIn: false, permissions: clean } });
};

const updateNcRole = async (id, { label, description, permissions }) => {
  const role = await prisma.platformRole.findUnique({ where: { id } });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  const data = {};
  if (label)       data.label       = label;
  if (description !== undefined) data.description = description;
  if (permissions) {
    const clean = {};
    for (const w of WINGS) {
      clean[w] = {
        C: !!permissions[w]?.C,
        R: !!permissions[w]?.R,
        U: !!permissions[w]?.U,
        D: !!permissions[w]?.D,
      };
    }
    data.permissions = clean;
  }
  return prisma.platformRole.update({ where: { id }, data });
};

const deleteNcRole = async (id) => {
  const role = await prisma.platformRole.findUnique({ where: { id } });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  if (role.isBuiltIn) throw Object.assign(new Error('Built-in roles cannot be deleted'), { statusCode: 400 });
  const inUse = await prisma.superAdmin.count({ where: { platformRoleId: id } });
  if (inUse > 0) throw Object.assign(new Error(`Role is assigned to ${inUse} admin(s) — reassign first`), { statusCode: 400 });
  return prisma.platformRole.delete({ where: { id } });
};

const assignNcRole = async (adminId, { roleId }) => {
  if (!roleId) throw Object.assign(new Error('roleId required'), { statusCode: 400 });
  const role  = await prisma.platformRole.findUnique({ where: { id: roleId } });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  const admin = await prisma.superAdmin.update({
    where: { id: adminId },
    data:  { platformRoleId: roleId, role: role.name },
    include: { platformRole: true },
  });
  return admin;
};

const listGrants = async (adminId) => {
  const now = new Date();
  const grants = await prisma.platformPermissionGrant.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' },
    include: { grantedBy: { select: { name: true } } },
  });
  return grants.map((g) => ({
    ...g,
    status: g.revokedAt ? 'revoked'
          : g.expiresAt && g.expiresAt <= now ? 'expired'
          : 'active',
  }));
};

const createGrant = async (adminId, { wing, access, reason, expiresAt }, grantedById) => {
  if (!wing || !access?.length || !reason?.trim())
    throw Object.assign(new Error('wing, access, and reason are required'), { statusCode: 400 });
  if (!WINGS.includes(wing))
    throw Object.assign(new Error(`Invalid wing. Must be one of: ${WINGS.join(', ')}`), { statusCode: 400 });
  const validOps = access.filter((op) => ['C', 'R', 'U', 'D'].includes(op));
  if (!validOps.length) throw Object.assign(new Error('access must contain C, R, U, or D'), { statusCode: 400 });

  // Prevent granting ADMIN wing unless granter is SUPER
  const granter = await prisma.superAdmin.findUnique({ where: { id: grantedById } });
  if (wing === 'ADMIN' && granter?.role !== 'SUPER')
    throw Object.assign(new Error('Only SUPER admins can grant ADMIN wing access'), { statusCode: 403 });

  return prisma.platformPermissionGrant.create({
    data: {
      adminId,
      wing,
      access: validOps,
      grantedById,
      reason: reason.trim(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: { grantedBy: { select: { name: true } } },
  });
};

const revokeGrant = async (grantId, revokedById) => {
  const grant = await prisma.platformPermissionGrant.findUnique({ where: { id: grantId } });
  if (!grant) throw Object.assign(new Error('Grant not found'), { statusCode: 404 });
  if (grant.revokedAt) throw Object.assign(new Error('Grant already revoked'), { statusCode: 400 });
  return prisma.platformPermissionGrant.update({
    where: { id: grantId },
    data:  { revokedAt: new Date(), revokedById },
  });
};

const resolvePermissions = async (adminId) => {
  const admin = await prisma.superAdmin.findUnique({
    where: { id: adminId },
    include: { platformRole: true },
  });
  if (!admin) return null;
  const base = admin.platformRole?.permissions || {};
  const now  = new Date();
  const grants = await prisma.platformPermissionGrant.findMany({
    where: { adminId, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
  });
  const merged = JSON.parse(JSON.stringify(base));
  for (const grant of grants) {
    if (!merged[grant.wing]) merged[grant.wing] = { C: false, R: false, U: false, D: false };
    for (const op of grant.access) merged[grant.wing][op] = true;
  }
  return merged;
};

const getMyPermissions = async (adminId) => {
  const admin = await prisma.superAdmin.findUnique({
    where: { id: adminId },
    include: { platformRole: true },
  });
  const permissions = await resolvePermissions(adminId);
  return { role: admin?.platformRole?.name, label: admin?.platformRole?.label, permissions };
};

// ── Landing Photos CMS ─────────────────────────────────────────────────────────

const listLandingPhotos = () =>
  prisma.landingPhoto.findMany({ orderBy: [{ rowIndex: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] });

const getActiveLandingPhotos = () =>
  prisma.landingPhoto.findMany({
    where: { isActive: true },
    orderBy: [{ rowIndex: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

const createLandingPhoto = (data) => prisma.landingPhoto.create({ data });

const updateLandingPhoto = (id, data) => prisma.landingPhoto.update({ where: { id }, data });

const deleteLandingPhoto = async (id) => {
  const photo = await prisma.landingPhoto.findUnique({ where: { id } });
  if (!photo) throw Object.assign(new Error('Photo not found'), { statusCode: 404 });
  const filePath = path.join(__dirname, '../../../uploads/landing', photo.filename);
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  return prisma.landingPhoto.delete({ where: { id } });
};

const reorderLandingPhotos = async (updates) => {
  await Promise.all(
    (updates || []).map(({ id, sortOrder }) =>
      prisma.landingPhoto.update({ where: { id }, data: { sortOrder: parseInt(sortOrder) } })
    )
  );
  return listLandingPhotos();
};

module.exports = {
  login, verifyToken, getMe, getDashboard,
  listTenants, getTenant, toggleTenant, changePlan, addTenantNote, terminateTenant,
  listRoleRequests, resolveRoleRequest,
  getAuditLogs,
  listAdmins, createAdmin, seedDefaultAdmin,
  getRevenue, getPlansOverview, getOnboardingPipeline,
  getFeatureFlags, toggleFeatureFlag, getTenantModules, setTenantModule,
  getModuleUsage,
  getPlatformAnalytics, getErrorLogs,
  getPlatformHealth,
  getMaintenanceWindows, getActiveMaintenance, scheduleMaintenance, activateMaintenance, cancelMaintenance,
  getSubscriptions,
  getManagedPlans, createManagedPlan, updateManagedPlan, toggleManagedPlan, deleteManagedPlan,
  getManagedOffers, createManagedOffer, updateManagedOffer, deleteManagedOffer,
  seedDefaultPlans,
  getSettings, saveSettings, testApiKey,
  listNcRoles, createNcRole, updateNcRole, deleteNcRole, assignNcRole,
  listGrants, createGrant, revokeGrant,
  resolvePermissions, getMyPermissions,
  listLandingPhotos, getActiveLandingPhotos, createLandingPhoto, updateLandingPhoto, deleteLandingPhoto, reorderLandingPhotos,
};
