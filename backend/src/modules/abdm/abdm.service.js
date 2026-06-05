const prisma = require('../../config/prisma');

// ── ABDM Config (tenant-level) ────────────────────────────────────────────────

const getConfig = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { abdmConfig: true, name: true, phone: true, address: true },
  });
  return { config: tenant?.abdmConfig || {}, tenant };
};

const saveConfig = async (tenantId, data) => {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { abdmConfig: data },
  });
  return data;
};

// ── Patient ABHA Stats ─────────────────────────────────────────────────────────

const getAbhaStats = async (tenantId) => {
  const [total, withAbha] = await Promise.all([
    prisma.customer.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId, abhaId: { not: null } } }),
  ]);
  return { total, withAbha, withoutAbha: total - withAbha };
};

const getPatientsWithoutAbha = async (tenantId, limit = 50) =>
  prisma.customer.findMany({
    where: { tenantId, OR: [{ abhaId: null }, { abhaId: '' }] },
    select: { id: true, name: true, phone: true, abhaId: true, dateOfBirth: true, gender: true },
    orderBy: { visitCount: 'desc' },
    take: Number(limit),
  });

const updatePatientAbha = async (tenantId, patientId, abhaId) => {
  const patient = await prisma.customer.findUnique({ where: { id: patientId } });
  if (!patient || patient.tenantId !== tenantId)
    throw Object.assign(new Error('Patient not found'), { statusCode: 404 });
  return prisma.customer.update({ where: { id: patientId }, data: { abhaId } });
};

// ── Health Records Queue ──────────────────────────────────────────────────────
// Returns recent prescriptions + lab reports eligible for ABHA push

const getHealthRecordQueue = async (tenantId) => {
  const [prescriptions, labOrders] = await Promise.all([
    prisma.prescription.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true, rxNumber: true, patientName: true, patientId: true, diagnosis: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.labOrder.findMany({
      where: { tenantId, status: 'COMPLETED' },
      select: { id: true, orderNumber: true, patientName: true, patientId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return { prescriptions, labOrders };
};

module.exports = { getConfig, saveConfig, getAbhaStats, getPatientsWithoutAbha, updatePatientAbha, getHealthRecordQueue };
