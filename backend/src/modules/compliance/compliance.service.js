const prisma = require('../../config/prisma');

// Upsert compliance record for a tenant (auto-created on first access)
const getOrCreate = async (tenantId) => {
  let record = await prisma.complianceRecord.findUnique({ where: { tenantId } });
  if (!record) record = await prisma.complianceRecord.create({ data: { tenantId } });
  return record;
};

// Tenant-facing: view own compliance status
const getMyStatus = async (tenantId) => {
  const [record, tenant] = await Promise.all([
    getOrCreate(tenantId),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { gstin: true, pan: true, name: true } }),
  ]);
  return { ...record, tenant };
};

// Tenant: submit KYC documents
const submitKyc = async (tenantId, documents) => {
  await getOrCreate(tenantId);
  return prisma.complianceRecord.update({
    where: { tenantId },
    data: { kycDocuments: documents, kycStatus: 'SUBMITTED' },
  });
};

// SA: list all compliance records with filters
const listAll = async ({ kycStatus, riskLevel, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (kycStatus) where.kycStatus = kycStatus;
  if (riskLevel) where.riskLevel = riskLevel;

  const [records, total] = await Promise.all([
    prisma.complianceRecord.findMany({
      where,
      include: { tenant: { select: { name: true, email: true, businessType: true } } },
      orderBy: { updatedAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.complianceRecord.count({ where }),
  ]);

  return [records.map(r => ({ ...r, flags: r.flags ?? [] })), total];
};

// SA: update compliance record (verify GST, PAN, update KYC status, add flags, set risk)
const updateRecord = async (tenantId, { gstVerified, panVerified, kycStatus, flags, riskLevel, notes }, reviewerName) => {
  await getOrCreate(tenantId);
  const data = { lastReviewed: new Date(), reviewedBy: reviewerName };
  if (gstVerified !== undefined) data.gstVerified = gstVerified;
  if (panVerified !== undefined) data.panVerified = panVerified;
  if (kycStatus) data.kycStatus = kycStatus;
  if (flags) data.flags = flags;
  if (riskLevel) data.riskLevel = riskLevel;
  if (notes !== undefined) data.notes = notes;

  const updated = await prisma.complianceRecord.update({ where: { tenantId }, data });

  await prisma.auditLog.create({
    data: {
      tenantId, actorType: 'SUPER_ADMIN', actorId: 'system', actorName: reviewerName,
      action: 'UPDATE_COMPLIANCE', resource: 'compliance', resourceId: tenantId, details: data,
    },
  });
  return updated;
};

// SA: add compliance flag to a tenant
const addFlag = async (tenantId, flag, reviewerName) => {
  const record = await getOrCreate(tenantId);
  const flags = [...new Set([...(record.flags || []), flag])];
  return prisma.complianceRecord.update({ where: { tenantId }, data: { flags, lastReviewed: new Date(), reviewedBy: reviewerName } });
};

const removeFlag = async (tenantId, flag) => {
  const record = await getOrCreate(tenantId);
  return prisma.complianceRecord.update({ where: { tenantId }, data: { flags: (record.flags || []).filter(f => f !== flag) } });
};

// SA: get compliance summary stats
const getStats = async () => {
  const all = await prisma.complianceRecord.findMany({ select: { kycStatus: true, riskLevel: true, flags: true } });
  const total      = all.length;
  const kycVerified = all.filter(r => r.kycStatus === 'VERIFIED').length;
  const kycPending  = all.filter(r => ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(r.kycStatus)).length;
  const highRisk    = all.filter(r => r.riskLevel === 'HIGH').length;
  const flagged     = all.filter(r => Array.isArray(r.flags) && r.flags.length > 0).length;
  return { total, kycVerified, kycPending, highRisk, flagged };
};

module.exports = { getMyStatus, submitKyc, listAll, updateRecord, addFlag, removeFlag, getStats };
