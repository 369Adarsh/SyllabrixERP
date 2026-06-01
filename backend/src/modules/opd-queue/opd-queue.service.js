const prisma = require('../../config/prisma');

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const getQueue = async (tenantId) => {
  const tokens = await prisma.opdToken.findMany({
    where: { tenantId, visitDate: { gte: startOfToday(), lte: endOfToday() } },
    orderBy: [{ status: 'asc' }, { tokenNumber: 'asc' }],
  });
  // Sort: CALLED/IN_CONSULTATION first, then WAITING by token#, then COMPLETED/SKIPPED last
  const order = { CALLED: 0, IN_CONSULTATION: 1, WAITING: 2, COMPLETED: 3, SKIPPED: 4 };
  return tokens.sort((a, b) => {
    const os = order[a.status] - order[b.status];
    return os !== 0 ? os : a.tokenNumber - b.tokenNumber;
  });
};

const getStats = async (tenantId) => {
  const tokens = await prisma.opdToken.findMany({
    where: { tenantId, visitDate: { gte: startOfToday(), lte: endOfToday() } },
    select: { status: true, createdAt: true, calledAt: true },
  });
  const total     = tokens.length;
  const waiting   = tokens.filter(t => t.status === 'WAITING').length;
  const active    = tokens.filter(t => t.status === 'IN_CONSULTATION').length;
  const called    = tokens.filter(t => t.status === 'CALLED').length;
  const completed = tokens.filter(t => t.status === 'COMPLETED').length;
  const skipped   = tokens.filter(t => t.status === 'SKIPPED').length;

  // Avg wait time: time from createdAt to calledAt for completed/called tokens
  const withWait = tokens.filter(t => t.calledAt);
  const avgWaitMin = withWait.length
    ? Math.round(withWait.reduce((sum, t) => sum + (new Date(t.calledAt) - new Date(t.createdAt)) / 60000, 0) / withWait.length)
    : 0;

  return { total, waiting, active, called, completed, skipped, avgWaitMin };
};

const assignToken = async (tenantId, { patientId, patientName, doctorId, doctorName, appointmentId }) => {
  // Get highest token number for today
  const last = await prisma.opdToken.findFirst({
    where: { tenantId, visitDate: { gte: startOfToday(), lte: endOfToday() } },
    orderBy: { tokenNumber: 'desc' },
    select: { tokenNumber: true },
  });
  const tokenNumber = (last?.tokenNumber || 0) + 1;

  // Resolve names if IDs provided but names not
  let resolvedPatientName = patientName;
  let resolvedDoctorName  = doctorName;

  if (patientId && !resolvedPatientName) {
    const p = await prisma.customer.findUnique({ where: { id: patientId }, select: { name: true } });
    resolvedPatientName = p?.name;
  }
  if (doctorId && !resolvedDoctorName) {
    const d = await prisma.staff.findUnique({ where: { id: doctorId }, select: { name: true } });
    resolvedDoctorName = d?.name;
  }

  return prisma.opdToken.create({
    data: {
      tenantId,
      tokenNumber,
      visitDate: new Date(),
      patientId: patientId || null,
      patientName: resolvedPatientName || 'Walk-in Patient',
      doctorId: doctorId || null,
      doctorName: resolvedDoctorName || null,
      appointmentId: appointmentId || null,
      status: 'WAITING',
    },
  });
};

const callToken = async (tenantId, id) => {
  await _assertExists(tenantId, id);
  return prisma.opdToken.update({
    where: { id, tenantId },
    data: { status: 'CALLED', calledAt: new Date() },
  });
};

const startConsultation = async (tenantId, id) => {
  await _assertExists(tenantId, id);
  return prisma.opdToken.update({
    where: { id, tenantId },
    data: { status: 'IN_CONSULTATION' },
  });
};

const completeToken = async (tenantId, id) => {
  await _assertExists(tenantId, id);
  return prisma.opdToken.update({
    where: { id, tenantId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
};

const skipToken = async (tenantId, id) => {
  await _assertExists(tenantId, id);
  return prisma.opdToken.update({
    where: { id, tenantId },
    data: { status: 'SKIPPED' },
  });
};

const requeueToken = async (tenantId, id) => {
  await _assertExists(tenantId, id);
  return prisma.opdToken.update({
    where: { id, tenantId },
    data: { status: 'WAITING', calledAt: null, completedAt: null },
  });
};

const _assertExists = async (tenantId, id) => {
  const token = await prisma.opdToken.findUnique({ where: { id, tenantId } });
  if (!token) throw Object.assign(new Error('Token not found'), { statusCode: 404 });
  return token;
};

module.exports = { getQueue, getStats, assignToken, callToken, startConsultation, completeToken, skipToken, requeueToken };
