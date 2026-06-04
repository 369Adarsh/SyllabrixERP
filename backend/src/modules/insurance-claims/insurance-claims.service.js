const prisma = require('../../config/prisma');
const { generateClaimNumber } = require('../../utils/generateNumber');

const CLAIM_STATUSES = ['PENDING', 'PRE_AUTH_REQUESTED', 'PRE_AUTH_APPROVED', 'UNDER_QUERY', 'APPROVED', 'REJECTED', 'SETTLED'];

const TPA_SCHEMES = [
  'CGHS', 'ECHS', 'ESI', 'IFFCO-TOKIO', 'STAR HEALTH', 'BAJAJ ALLIANZ',
  'UNITED INDIA', 'NEW INDIA', 'ORIENTAL', 'NATIONAL', 'MAX BUPA',
  'CARE HEALTH', 'NIVA BUPA', 'ADITYA BIRLA HEALTH', 'HDFC ERGO', 'ICICI LOMBARD',
  'OTHER',
];

const list = async (tenantId, { status, limit = 50, offset = 0 } = {}) => {
  const where = { tenantId };
  if (status) where.status = status;
  const [claims, total] = await Promise.all([
    prisma.insuranceClaim.findMany({ where, orderBy: { createdAt: 'desc' }, take: Number(limit), skip: Number(offset) }),
    prisma.insuranceClaim.count({ where }),
  ]);
  return { claims, total };
};

const getById = async (tenantId, id) => {
  const c = await prisma.insuranceClaim.findUnique({ where: { id } });
  if (!c || c.tenantId !== tenantId) throw Object.assign(new Error('Claim not found'), { statusCode: 404 });
  return c;
};

const create = async (tenantId, data) => {
  const {
    patientId, patientName, admissionId, policyNumber, memberId,
    tpaName, insurerName, coverageAmount, isCashless = false, notes,
  } = data;
  if (!patientName?.trim()) throw Object.assign(new Error('Patient name required'), { statusCode: 400 });
  const claimNumber = await generateClaimNumber();
  return prisma.insuranceClaim.create({
    data: {
      tenantId, claimNumber,
      patientId: patientId || null, patientName,
      admissionId: admissionId || null,
      policyNumber: policyNumber || null, memberId: memberId || null,
      tpaName: tpaName || null, insurerName: insurerName || null,
      coverageAmount: coverageAmount ? parseFloat(coverageAmount) : null,
      isCashless: Boolean(isCashless),
      notes: notes || null,
    },
  });
};

const update = async (tenantId, id, data) => {
  const c = await prisma.insuranceClaim.findUnique({ where: { id } });
  if (!c || c.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  const {
    status, preAuthCode, preAuthAmount, claimedAmount, approvedAmount,
    rejectionReason, notes, policyNumber, memberId, tpaName, insurerName,
    coverageAmount, isCashless,
  } = data;

  const extra = {};
  if (status === 'SETTLED') extra.settledAt = new Date();
  if (status === 'PRE_AUTH_REQUESTED' && !c.submittedAt) extra.submittedAt = new Date();

  return prisma.insuranceClaim.update({
    where: { id },
    data: {
      ...(status           && { status }),
      ...(preAuthCode      !== undefined && { preAuthCode }),
      ...(preAuthAmount    !== undefined && { preAuthAmount: parseFloat(preAuthAmount) }),
      ...(claimedAmount    !== undefined && { claimedAmount: parseFloat(claimedAmount) }),
      ...(approvedAmount   !== undefined && { approvedAmount: parseFloat(approvedAmount) }),
      ...(rejectionReason  !== undefined && { rejectionReason }),
      ...(notes            !== undefined && { notes }),
      ...(policyNumber     !== undefined && { policyNumber }),
      ...(memberId         !== undefined && { memberId }),
      ...(tpaName          !== undefined && { tpaName }),
      ...(insurerName      !== undefined && { insurerName }),
      ...(coverageAmount   !== undefined && { coverageAmount: parseFloat(coverageAmount) }),
      ...(isCashless       !== undefined && { isCashless: Boolean(isCashless) }),
      ...extra,
    },
  });
};

const remove = async (tenantId, id) => {
  const c = await prisma.insuranceClaim.findUnique({ where: { id } });
  if (!c || c.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.insuranceClaim.delete({ where: { id } });
};

const getStats = async (tenantId) => {
  const claims = await prisma.insuranceClaim.findMany({
    where: { tenantId },
    select: { status: true, claimedAmount: true, approvedAmount: true, isCashless: true },
  });
  const pending    = claims.filter((c) => ['PENDING', 'PRE_AUTH_REQUESTED', 'PRE_AUTH_APPROVED', 'UNDER_QUERY'].includes(c.status));
  const approved   = claims.filter((c) => c.status === 'APPROVED' || c.status === 'SETTLED');
  const rejected   = claims.filter((c) => c.status === 'REJECTED');
  const totalClaimed  = claims.reduce((a, c) => a + (c.claimedAmount || 0), 0);
  const totalApproved = approved.reduce((a, c) => a + (c.approvedAmount || 0), 0);
  return {
    total: claims.length, pending: pending.length, approved: approved.length, rejected: rejected.length,
    cashless: claims.filter((c) => c.isCashless).length,
    totalClaimed, totalApproved,
    rejectionRate: claims.length > 0 ? ((rejected.length / claims.length) * 100).toFixed(1) : 0,
  };
};

module.exports = { CLAIM_STATUSES, TPA_SCHEMES, list, getById, create, update, remove, getStats };
