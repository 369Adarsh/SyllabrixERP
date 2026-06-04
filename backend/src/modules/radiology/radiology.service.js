const prisma = require('../../config/prisma');
const { generateRadiologyOrderNumber } = require('../../utils/generateNumber');

const MODALITIES = ['XRAY', 'USG', 'CT', 'MRI', 'ECG', 'ECHO', 'MAMMOGRAPHY', 'DEXA', 'PET_SCAN'];
const PRIORITIES = ['ROUTINE', 'URGENT', 'STAT'];
const STATUSES   = ['ORDERED', 'SCHEDULED', 'IN_PROGRESS', 'REPORTED', 'DELIVERED'];

const list = async (tenantId, { status, modality, limit = 50, offset = 0 } = {}) => {
  const where = { tenantId };
  if (status)   where.status   = status;
  if (modality) where.modality = modality;
  const [orders, total] = await Promise.all([
    prisma.radiologyOrder.findMany({ where, orderBy: { createdAt: 'desc' }, take: Number(limit), skip: Number(offset) }),
    prisma.radiologyOrder.count({ where }),
  ]);
  return { orders, total };
};

const getById = async (tenantId, id) => {
  const o = await prisma.radiologyOrder.findUnique({ where: { id } });
  if (!o || o.tenantId !== tenantId) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  return o;
};

const create = async (tenantId, data) => {
  const { patientId, patientName, admissionId, orderedBy, modality, bodyPart, clinicalInfo, priority = 'ROUTINE' } = data;
  if (!patientName?.trim()) throw Object.assign(new Error('Patient name required'), { statusCode: 400 });
  if (!modality) throw Object.assign(new Error('Modality required'), { statusCode: 400 });
  if (!orderedBy?.trim()) throw Object.assign(new Error('Ordering doctor required'), { statusCode: 400 });
  const orderNumber = await generateRadiologyOrderNumber();
  return prisma.radiologyOrder.create({
    data: {
      tenantId, orderNumber,
      patientId: patientId || null, patientName,
      admissionId: admissionId || null,
      orderedBy, modality,
      bodyPart: bodyPart || null, clinicalInfo: clinicalInfo || null, priority,
    },
  });
};

const update = async (tenantId, id, data) => {
  const o = await prisma.radiologyOrder.findUnique({ where: { id } });
  if (!o || o.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  const { status, technicianName, findings, impression, reportedBy, imageUrls } = data;
  const extra = status === 'REPORTED' ? { reportedAt: new Date() } : {};
  return prisma.radiologyOrder.update({
    where: { id },
    data: {
      ...(status          && { status }),
      ...(technicianName  !== undefined && { technicianName }),
      ...(findings        !== undefined && { findings }),
      ...(impression      !== undefined && { impression }),
      ...(reportedBy      !== undefined && { reportedBy }),
      ...(imageUrls       && { imageUrls }),
      ...extra,
    },
  });
};

const remove = async (tenantId, id) => {
  const o = await prisma.radiologyOrder.findUnique({ where: { id } });
  if (!o || o.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.radiologyOrder.delete({ where: { id } });
};

const getWorklist = (tenantId) =>
  prisma.radiologyOrder.findMany({
    where: { tenantId, status: { in: ['ORDERED', 'SCHEDULED', 'IN_PROGRESS'] } },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });

const getStats = async (tenantId) => {
  const orders = await prisma.radiologyOrder.findMany({ where: { tenantId }, select: { status: true, modality: true } });
  const byStatus = {};
  const byModality = {};
  for (const o of orders) {
    byStatus[o.status]     = (byStatus[o.status] || 0) + 1;
    byModality[o.modality] = (byModality[o.modality] || 0) + 1;
  }
  return { total: orders.length, byStatus, byModality, pending: (byStatus.ORDERED || 0) + (byStatus.SCHEDULED || 0) + (byStatus.IN_PROGRESS || 0) };
};

module.exports = { MODALITIES, PRIORITIES, STATUSES, list, getById, create, update, remove, getWorklist, getStats };
