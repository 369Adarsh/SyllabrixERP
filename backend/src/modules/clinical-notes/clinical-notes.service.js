const prisma = require('../../config/prisma');

const getByAppointment = async (tenantId, appointmentId) =>
  prisma.clinicalNote.findFirst({ where: { tenantId, appointmentId } });

const getPatientHistory = async (tenantId, customerId, limit = 10) =>
  prisma.clinicalNote.findMany({
    where: { tenantId, customerId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true, appointmentId: true, serviceName: true, soapA: true,
      followUpDate: true, diagnosisCode: true, createdAt: true, updatedAt: true,
    },
  });

const upsert = async (tenantId, data) => {
  const {
    customerId, appointmentId, doctorId, doctorName, patientName, serviceName,
    soapS, soapO, soapA, soapP, diagnosisCode, followUpDate, followUpNotes, isConfidential,
  } = data;

  const existing = await prisma.clinicalNote.findFirst({ where: { tenantId, appointmentId } });

  const payload = {
    soapS: soapS ?? null, soapO: soapO ?? null, soapA: soapA ?? null, soapP: soapP ?? null,
    diagnosisCode: diagnosisCode ?? null,
    followUpDate: followUpDate ? new Date(followUpDate) : null,
    followUpNotes: followUpNotes ?? null,
    isConfidential: isConfidential ?? false,
  };

  if (existing) {
    return prisma.clinicalNote.update({ where: { id: existing.id }, data: payload });
  }

  return prisma.clinicalNote.create({
    data: {
      tenantId, customerId: customerId ?? null, appointmentId,
      doctorId: doctorId ?? null, doctorName: doctorName ?? null,
      patientName: patientName ?? null, serviceName: serviceName ?? null,
      ...payload,
    },
  });
};

const remove = async (tenantId, id) => {
  const note = await prisma.clinicalNote.findUnique({ where: { id } });
  if (!note || note.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.clinicalNote.delete({ where: { id } });
};

module.exports = { getByAppointment, getPatientHistory, upsert, remove };
