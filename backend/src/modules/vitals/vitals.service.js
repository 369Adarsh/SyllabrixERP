const prisma = require('../../config/prisma');

const NORMAL_RANGES = {
  bpSystolic:      { min: 90,  max: 140 },
  bpDiastolic:     { min: 60,  max: 90  },
  pulse:           { min: 60,  max: 100 },
  temperature:     { min: 36.0, max: 37.5 },
  spo2:            { min: 95,  max: 100 },
  bloodGlucose:    { min: 70,  max: 140 },
  respiratoryRate: { min: 12,  max: 20  },
};

const isAbnormal = (vitals) => {
  for (const [key, range] of Object.entries(NORMAL_RANGES)) {
    const val = vitals[key];
    if (val !== null && val !== undefined && (val < range.min || val > range.max)) return true;
  }
  return false;
};

const recordVitals = async (tenantId, data) => {
  const {
    customerId, appointmentId,
    bpSystolic, bpDiastolic, pulse, temperature,
    weight, height, spo2, bloodGlucose, respiratoryRate,
    notes, recordedBy,
  } = data;

  // Upsert: if vitals already exist for this appointment, update them
  if (appointmentId) {
    const existing = await prisma.vitals.findUnique({ where: { appointmentId } });
    if (existing) {
      return prisma.vitals.update({
        where: { appointmentId },
        data: { bpSystolic, bpDiastolic, pulse, temperature, weight, height, spo2, bloodGlucose, respiratoryRate, notes, recordedBy, recordedAt: new Date() },
      });
    }
  }

  return prisma.vitals.create({
    data: {
      tenantId, customerId: customerId || null, appointmentId: appointmentId || null,
      bpSystolic, bpDiastolic, pulse, temperature, weight, height,
      spo2, bloodGlucose, respiratoryRate, notes, recordedBy,
    },
  });
};

const getByAppointment = async (tenantId, appointmentId) => {
  const v = await prisma.vitals.findFirst({ where: { tenantId, appointmentId } });
  if (!v) return null;
  return { ...v, abnormal: isAbnormal(v) };
};

const getByPatient = async (tenantId, customerId, limit = 10) => {
  const list = await prisma.vitals.findMany({
    where: { tenantId, customerId },
    orderBy: { recordedAt: 'desc' },
    take: limit,
  });
  return list.map(v => ({ ...v, abnormal: isAbnormal(v) }));
};

const remove = async (tenantId, id) => {
  const v = await prisma.vitals.findUnique({ where: { id } });
  if (!v || v.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.vitals.delete({ where: { id } });
};

module.exports = { recordVitals, getByAppointment, getByPatient, remove, NORMAL_RANGES };
