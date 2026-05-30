const prisma = require('../../config/prisma');

// ── Write a log entry — never throws, never blocks the caller ─────────────────

const log = async (tenantId, userId, userName, userRole, action, module, resourceType = null, resourceId = null, details = null, ipAddress = null) => {
  prisma.tenantActivityLog.create({
    data: { tenantId, userId, userName, userRole, action, module, resourceType, resourceId: resourceId ? String(resourceId) : null, details, ipAddress },
  }).catch((e) => console.error('[activity] log failed:', e.message));
};

// ── Helper — extract common fields from an Express request ───────────────────

const fromReq = (req) => ({
  tenantId:  req.tenantId,
  userId:    req.user?.id    || 'unknown',
  userName:  req.user?.name  || req.user?.email || 'Unknown',
  userRole:  req.user?.role  || 'UNKNOWN',
  ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
});

// ── Query activity (for platform admin) ──────────────────────────────────────

const getActivity = async ({ tenantId, module, action, from, to, limit = 100, page = 1 } = {}) => {
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (module)   where.module   = module;
  if (action)   where.action   = { contains: action, mode: 'insensitive' };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    prisma.tenantActivityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (Number(page) - 1) * Number(limit),
      take:    Number(limit),
    }),
    prisma.tenantActivityLog.count({ where }),
  ]);

  // Resolve tenant names
  const tenantIds = [...new Set(logs.map(l => l.tenantId))];
  const tenantMap = {};
  if (tenantIds.length) {
    const tenants = await prisma.tenant.findMany({
      where:  { id: { in: tenantIds } },
      select: { id: true, name: true, syllabrixId: true, businessType: true },
    });
    tenants.forEach(t => { tenantMap[t.id] = t; });
  }

  return {
    logs:  logs.map(l => ({ ...l, tenant: tenantMap[l.tenantId] || null })),
    total,
    page:  Number(page),
    limit: Number(limit),
  };
};

// ── Per-module summary for a tenant (or all tenants) ─────────────────────────

const getModuleSummary = async (tenantId) => {
  const where = tenantId ? { tenantId } : {};
  const rows = await prisma.tenantActivityLog.groupBy({
    by:      ['module'],
    where,
    _count:  { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  return rows.map(r => ({ module: r.module, count: r._count.id }));
};

// ── Recent active tenants (last 24 h) ────────────────────────────────────────

const getActiveTenants = async (hours = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const rows = await prisma.tenantActivityLog.groupBy({
    by:      ['tenantId'],
    where:   { createdAt: { gte: since } },
    _count:  { id: true },
    orderBy: { _count: { id: 'desc' } },
    take:    20,
  });

  const tenantIds = rows.map(r => r.tenantId);
  const tenants   = await prisma.tenant.findMany({
    where:  { id: { in: tenantIds } },
    select: { id: true, name: true, syllabrixId: true, businessType: true },
  });
  const tMap = Object.fromEntries(tenants.map(t => [t.id, t]));

  return rows.map(r => ({ ...tMap[r.tenantId], actions: r._count.id })).filter(r => r.id);
};

module.exports = { log, fromReq, getActivity, getModuleSummary, getActiveTenants };
