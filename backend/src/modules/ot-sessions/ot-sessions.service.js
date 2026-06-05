const prisma = require('../../config/prisma');
const { generateOTSessionNumber } = require('../../utils/generateNumber');

const OT_TYPES    = ['ELECTIVE', 'EMERGENCY'];
const OT_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'];
const ANESTHESIA_TYPES = ['GA', 'SA', 'LA', 'REGIONAL', 'NONE'];

const list = async (tenantId, { status, date, limit = 50, offset = 0 } = {}) => {
  const where = { tenantId };
  if (status) where.status = status;
  if (date) {
    const d = new Date(date);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    where.scheduledDate = { gte: d, lt: next };
  }
  const [sessions, total] = await Promise.all([
    prisma.oTSession.findMany({ where, orderBy: { scheduledDate: 'asc' }, take: Number(limit), skip: Number(offset) }),
    prisma.oTSession.count({ where }),
  ]);
  return { sessions, total };
};

const getById = async (tenantId, id) => {
  const s = await prisma.oTSession.findUnique({ where: { id } });
  if (!s || s.tenantId !== tenantId) throw Object.assign(new Error('OT session not found'), { statusCode: 404 });
  return s;
};

const create = async (tenantId, data) => {
  const {
    patientId, patientName, admissionId, procedureName, surgeonName,
    anesthesiologistName, otRoom, scheduledDate, estimatedDuration,
    sessionType = 'ELECTIVE',
  } = data;
  if (!patientName?.trim()) throw Object.assign(new Error('Patient name required'), { statusCode: 400 });
  if (!procedureName?.trim()) throw Object.assign(new Error('Procedure name required'), { statusCode: 400 });
  if (!surgeonName?.trim()) throw Object.assign(new Error('Surgeon name required'), { statusCode: 400 });
  const sessionNumber = await generateOTSessionNumber();
  return prisma.oTSession.create({
    data: {
      tenantId, sessionNumber,
      patientId: patientId || null, patientName, admissionId: admissionId || null,
      procedureName, surgeonName,
      anesthesiologistName: anesthesiologistName || null,
      otRoom: otRoom || null,
      scheduledDate: new Date(scheduledDate),
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
      sessionType,
    },
  });
};

const update = async (tenantId, id, data) => {
  const s = await prisma.oTSession.findUnique({ where: { id } });
  if (!s || s.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  const {
    status, clearance, intraopNotes, anesthesiaType, anesthesiaNotes,
    postOpOrders, consumables, scheduledDate, otRoom, estimatedDuration,
    surgeonName, anesthesiologistName,
  } = data;
  return prisma.oTSession.update({
    where: { id },
    data: {
      ...(status             && { status }),
      ...(clearance          && { clearance }),
      ...(intraopNotes       !== undefined && { intraopNotes }),
      ...(anesthesiaType     && { anesthesiaType }),
      ...(anesthesiaNotes    !== undefined && { anesthesiaNotes }),
      ...(postOpOrders       !== undefined && { postOpOrders }),
      ...(consumables        && { consumables }),
      ...(scheduledDate      && { scheduledDate: new Date(scheduledDate) }),
      ...(otRoom             !== undefined && { otRoom }),
      ...(estimatedDuration  !== undefined && { estimatedDuration: parseInt(estimatedDuration) }),
      ...(surgeonName        && { surgeonName }),
      ...(anesthesiologistName !== undefined && { anesthesiologistName }),
    },
  });
};

const remove = async (tenantId, id) => {
  const s = await prisma.oTSession.findUnique({ where: { id } });
  if (!s || s.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.oTSession.delete({ where: { id } });
};

const getUtilization = async (tenantId) => {
  const sessions = await prisma.oTSession.findMany({
    where: { tenantId },
    select: { status: true, scheduledDate: true, estimatedDuration: true, sessionType: true },
  });
  const total      = sessions.length;
  const completed  = sessions.filter((s) => s.status === 'COMPLETED').length;
  const scheduled  = sessions.filter((s) => s.status === 'SCHEDULED').length;
  const cancelled  = sessions.filter((s) => s.status === 'CANCELLED').length;
  const emergency  = sessions.filter((s) => s.sessionType === 'EMERGENCY').length;
  const totalMinutes = sessions.filter((s) => s.estimatedDuration).reduce((a, s) => a + s.estimatedDuration, 0);
  return { total, completed, scheduled, cancelled, emergency, totalEstimatedMinutes: totalMinutes };
};

module.exports = { OT_TYPES, OT_STATUSES, ANESTHESIA_TYPES, list, getById, create, update, remove, getUtilization };
