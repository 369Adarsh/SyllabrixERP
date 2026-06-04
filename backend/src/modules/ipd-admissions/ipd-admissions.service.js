const prisma = require('../../config/prisma');
const { generateAdmissionNumber } = require('../../utils/generateNumber');

// ── Admissions ────────────────────────────────────────────────────────────────

const listAdmissions = async (tenantId, params = {}) => {
  const { status, limit = 100, offset = 0 } = params;
  const where = { tenantId };
  if (status) where.status = status;

  const [admissions, total] = await Promise.all([
    prisma.iPDAdmission.findMany({
      where, orderBy: { admissionDate: 'desc' },
      take: Number(limit), skip: Number(offset),
    }),
    prisma.iPDAdmission.count({ where }),
  ]);
  return { admissions, total };
};

const getAdmissionById = async (tenantId, id) => {
  const adm = await prisma.iPDAdmission.findUnique({
    where: { id },
    include: {
      progressNotes: { orderBy: { noteDate: 'desc' } },
      nursingCharts: { orderBy: { chartDate: 'desc' } },
    },
  });
  if (!adm || adm.tenantId !== tenantId) throw Object.assign(new Error('Admission not found'), { statusCode: 404 });
  return adm;
};

const createAdmission = async (tenantId, data) => {
  const {
    patientId, patientName, patientPhone, patientAge, patientGender,
    bedId, wardId, wardName, bedNumber,
    admittingDoctorId, admittingDoctorName, admissionDiagnosis,
    isMLC = false, advanceAmount = 0,
    attendantName, attendantPhone, notes,
  } = data;

  const admissionNumber = await generateAdmissionNumber();

  // Mark bed as occupied
  if (bedId) {
    await prisma.bed.update({ where: { id: bedId }, data: { status: 'OCCUPIED' } });
  }

  return prisma.iPDAdmission.create({
    data: {
      tenantId, admissionNumber,
      patientId: patientId || null,
      patientName, patientPhone: patientPhone || null,
      patientAge: patientAge ? parseInt(patientAge) : null,
      patientGender: patientGender || null,
      bedId: bedId || null, wardId: wardId || null,
      wardName: wardName || null, bedNumber: bedNumber || null,
      admittingDoctorId: admittingDoctorId || null,
      admittingDoctorName: admittingDoctorName || null,
      admissionDiagnosis: admissionDiagnosis || null,
      isMLC, advanceAmount: parseFloat(advanceAmount) || 0,
      attendantName: attendantName || null,
      attendantPhone: attendantPhone || null,
      notes: notes || null,
    },
  });
};

const updateAdmission = async (tenantId, id, data) => {
  const adm = await prisma.iPDAdmission.findUnique({ where: { id } });
  if (!adm || adm.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });

  const { status, dischargeDate, dischargeType, bedId, wardId, wardName, bedNumber, dailyCharges, dischargeSummary, notes } = data;

  // If discharging, release bed
  if (status && ['DISCHARGED', 'TRANSFERRED', 'LAMA', 'ABSCONDED', 'DECEASED'].includes(status) && adm.bedId) {
    await prisma.bed.update({ where: { id: adm.bedId }, data: { status: 'UNDER_CLEANING' } });
  }

  // If transferring to new bed, update both beds
  if (bedId && bedId !== adm.bedId) {
    if (adm.bedId) await prisma.bed.update({ where: { id: adm.bedId }, data: { status: 'UNDER_CLEANING' } });
    await prisma.bed.update({ where: { id: bedId }, data: { status: 'OCCUPIED' } });
  }

  return prisma.iPDAdmission.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(dischargeDate && { dischargeDate: new Date(dischargeDate) }),
      ...(dischargeType && { dischargeType }),
      ...(bedId !== undefined && { bedId: bedId || null }),
      ...(wardId !== undefined && { wardId: wardId || null }),
      ...(wardName !== undefined && { wardName }),
      ...(bedNumber !== undefined && { bedNumber }),
      ...(dailyCharges !== undefined && { dailyCharges }),
      ...(dischargeSummary !== undefined && { dischargeSummary }),
      ...(notes !== undefined && { notes }),
    },
  });
};

const deleteAdmission = async (tenantId, id) => {
  const adm = await prisma.iPDAdmission.findUnique({ where: { id } });
  if (!adm || adm.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.iPDAdmission.delete({ where: { id } });
};

// ── Progress Notes (Module 19) ────────────────────────────────────────────────

const addProgressNote = async (tenantId, admissionId, data) => {
  const { doctorName, doctorId, noteType = 'PROGRESS', findings, orders, vitals } = data;
  const adm = await prisma.iPDAdmission.findUnique({ where: { id: admissionId } });
  if (!adm || adm.tenantId !== tenantId) throw Object.assign(new Error('Admission not found'), { statusCode: 404 });

  return prisma.iPDProgressNote.create({
    data: {
      tenantId, admissionId, doctorName, doctorId: doctorId || null,
      noteType, findings: findings || null,
      orders: orders || null, vitals: vitals || null,
    },
  });
};

const updateProgressNote = async (tenantId, noteId, data) => {
  const note = await prisma.iPDProgressNote.findUnique({ where: { id: noteId } });
  if (!note || note.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.iPDProgressNote.update({ where: { id: noteId }, data });
};

const deleteProgressNote = async (tenantId, noteId) => {
  const note = await prisma.iPDProgressNote.findUnique({ where: { id: noteId } });
  if (!note || note.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.iPDProgressNote.delete({ where: { id: noteId } });
};

// ── Nursing Charts / MAR (Module 20) ─────────────────────────────────────────

const addNursingChart = async (tenantId, admissionId, data) => {
  const { chartType, chartDate, data: chartData, recordedBy, notes } = data;
  const adm = await prisma.iPDAdmission.findUnique({ where: { id: admissionId } });
  if (!adm || adm.tenantId !== tenantId) throw Object.assign(new Error('Admission not found'), { statusCode: 404 });

  return prisma.nursingChart.create({
    data: {
      tenantId, admissionId, chartType,
      chartDate: chartDate ? new Date(chartDate) : new Date(),
      data: chartData || {},
      recordedBy: recordedBy || null, notes: notes || null,
    },
  });
};

const deleteNursingChart = async (tenantId, chartId) => {
  const chart = await prisma.nursingChart.findUnique({ where: { id: chartId } });
  if (!chart || chart.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.nursingChart.delete({ where: { id: chartId } });
};

// ── Census Report ──────────────────────────────────────────────────────────────

const getCensus = async (tenantId, date) => {
  const start = new Date(date || new Date().toISOString().slice(0, 10));
  const end = new Date(start); end.setDate(end.getDate() + 1);

  const [admitted, discharged, current] = await Promise.all([
    prisma.iPDAdmission.count({ where: { tenantId, admissionDate: { gte: start, lt: end } } }),
    prisma.iPDAdmission.count({ where: { tenantId, dischargeDate: { gte: start, lt: end } } }),
    prisma.iPDAdmission.count({ where: { tenantId, status: 'ADMITTED' } }),
  ]);
  return { date: start.toISOString().slice(0, 10), admitted, discharged, current };
};

module.exports = {
  listAdmissions, getAdmissionById, createAdmission, updateAdmission, deleteAdmission,
  addProgressNote, updateProgressNote, deleteProgressNote,
  addNursingChart, deleteNursingChart, getCensus,
};
