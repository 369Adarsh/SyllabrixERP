const prisma = require('../../config/prisma');
const { generateSampleNumber } = require('../../utils/generateNumber');

const CATEGORIES = ['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'SEROLOGY', 'URINE', 'HISTOPATHOLOGY', 'GENERAL'];

// ── Test Catalog ───────────────────────────────────────────────────────────────
const listTests = (tenantId, { category, active = true } = {}) =>
  prisma.limsTest.findMany({
    where: { tenantId, ...(category && { category }), isActive: active !== 'false' },
    orderBy: [{ category: 'asc' }, { testName: 'asc' }],
  });

const createTest = (tenantId, data) => {
  const { testCode, testName, category = 'GENERAL', unit, refRangeLow, refRangeHigh, referenceText, turnaroundHours = 24, price = 0 } = data;
  return prisma.limsTest.create({
    data: {
      tenantId, testCode, testName, category,
      unit: unit || null,
      refRangeLow: refRangeLow != null ? parseFloat(refRangeLow) : null,
      refRangeHigh: refRangeHigh != null ? parseFloat(refRangeHigh) : null,
      referenceText: referenceText || null,
      turnaroundHours: parseInt(turnaroundHours),
      price: parseFloat(price),
    },
  });
};

const updateTest = async (tenantId, id, data) => {
  const t = await prisma.limsTest.findUnique({ where: { id } });
  if (!t || t.tenantId !== tenantId) throw Object.assign(new Error('Test not found'), { statusCode: 404 });
  return prisma.limsTest.update({ where: { id }, data });
};

const deactivateTest = async (tenantId, id) => {
  const t = await prisma.limsTest.findUnique({ where: { id } });
  if (!t || t.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.limsTest.update({ where: { id }, data: { isActive: false } });
};

// ── Samples ────────────────────────────────────────────────────────────────────
const listSamples = async (tenantId, { status, limit = 50, offset = 0 } = {}) => {
  const where = { tenantId };
  if (status) where.status = status;
  const [samples, total] = await Promise.all([
    prisma.limsSample.findMany({
      where, orderBy: { collectedAt: 'desc' },
      take: Number(limit), skip: Number(offset),
      include: { results: true },
    }),
    prisma.limsSample.count({ where }),
  ]);
  return { samples, total };
};

const getSample = async (tenantId, id) => {
  const s = await prisma.limsSample.findUnique({ where: { id }, include: { results: true } });
  if (!s || s.tenantId !== tenantId) throw Object.assign(new Error('Sample not found'), { statusCode: 404 });
  return s;
};

const createSample = async (tenantId, data) => {
  const { patientId, patientName, admissionId, testsOrdered, collectedBy } = data;
  if (!patientName?.trim()) throw Object.assign(new Error('Patient name required'), { statusCode: 400 });
  if (!testsOrdered?.length) throw Object.assign(new Error('At least one test required'), { statusCode: 400 });
  const sampleNumber = await generateSampleNumber();
  return prisma.limsSample.create({
    data: {
      tenantId, sampleNumber,
      patientId: patientId || null, patientName,
      admissionId: admissionId || null,
      testsOrdered,
      collectedBy: collectedBy || null,
    },
  });
};

const updateSampleStatus = async (tenantId, id, status) => {
  const s = await prisma.limsSample.findUnique({ where: { id } });
  if (!s || s.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  const extra = status === 'REPORTED' ? { reportedAt: new Date() } : {};
  return prisma.limsSample.update({ where: { id }, data: { status, ...extra } });
};

// ── Results ────────────────────────────────────────────────────────────────────
const addResult = async (tenantId, sampleId, data) => {
  const s = await prisma.limsSample.findUnique({ where: { id: sampleId } });
  if (!s || s.tenantId !== tenantId) throw Object.assign(new Error('Sample not found'), { statusCode: 404 });
  const { testCode, testName, value, unit, refRange, isAbnormal = false, isCritical = false, enteredBy } = data;
  return prisma.limsResult.create({
    data: {
      tenantId, sampleId, testCode, testName, value,
      unit: unit || null, refRange: refRange || null,
      isAbnormal: Boolean(isAbnormal), isCritical: Boolean(isCritical),
      enteredBy: enteredBy || null,
    },
  });
};

const updateResult = async (tenantId, resultId, data) => {
  const r = await prisma.limsResult.findUnique({ where: { id: resultId } });
  if (!r || r.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.limsResult.update({ where: { id: resultId }, data });
};

const deleteResult = async (tenantId, resultId) => {
  const r = await prisma.limsResult.findUnique({ where: { id: resultId } });
  if (!r || r.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.limsResult.delete({ where: { id: resultId } });
};

// ── Stats ──────────────────────────────────────────────────────────────────────
const getStats = async (tenantId) => {
  const [total, resulted, reported, critical] = await Promise.all([
    prisma.limsSample.count({ where: { tenantId } }),
    prisma.limsSample.count({ where: { tenantId, status: 'RESULTED' } }),
    prisma.limsSample.count({ where: { tenantId, status: 'REPORTED' } }),
    prisma.limsResult.count({ where: { tenantId, isCritical: true } }),
  ]);
  const pending = total - resulted - reported;
  return { total, resulted, reported, critical, pending };
};

module.exports = {
  CATEGORIES,
  listTests, createTest, updateTest, deactivateTest,
  listSamples, getSample, createSample, updateSampleStatus,
  addResult, updateResult, deleteResult,
  getStats,
};
