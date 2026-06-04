const prisma = require('../../config/prisma');

const WARD_TYPES = ['ICU', 'GENERAL', 'PRIVATE', 'SEMI_PRIVATE', 'MATERNITY', 'PEDIATRIC', 'OTHER'];
const BED_TYPES  = ['STANDARD', 'AC', 'ICU', 'ISOLATION', 'VIP'];

// ── Wards ─────────────────────────────────────────────────────────────────────

const listWards = (tenantId) =>
  prisma.ward.findMany({
    where: { tenantId, isActive: true },
    include: { beds: { orderBy: { bedNumber: 'asc' } } },
    orderBy: { name: 'asc' },
  });

const createWard = (tenantId, data) => {
  const { name, wardType = 'GENERAL', floor, totalBeds = 0 } = data;
  return prisma.ward.create({ data: { tenantId, name, wardType, floor: floor || null, totalBeds: parseInt(totalBeds) } });
};

const updateWard = async (tenantId, id, data) => {
  const ward = await prisma.ward.findUnique({ where: { id } });
  if (!ward || ward.tenantId !== tenantId) throw Object.assign(new Error('Ward not found'), { statusCode: 404 });
  const { name, wardType, floor, totalBeds } = data;
  return prisma.ward.update({
    where: { id },
    data: {
      ...(name && { name }), ...(wardType && { wardType }),
      ...(floor !== undefined && { floor }), ...(totalBeds !== undefined && { totalBeds: parseInt(totalBeds) }),
    },
  });
};

const deleteWard = async (tenantId, id) => {
  const ward = await prisma.ward.findUnique({ where: { id } });
  if (!ward || ward.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.ward.update({ where: { id }, data: { isActive: false } });
};

// ── Beds ──────────────────────────────────────────────────────────────────────

const createBed = async (tenantId, data) => {
  const { wardId, bedNumber, bedType = 'STANDARD', dailyRate = 0 } = data;
  const ward = await prisma.ward.findUnique({ where: { id: wardId } });
  if (!ward || ward.tenantId !== tenantId) throw Object.assign(new Error('Ward not found'), { statusCode: 404 });
  return prisma.bed.create({
    data: { tenantId, wardId, bedNumber, bedType, dailyRate: parseFloat(dailyRate) },
  });
};

const updateBedStatus = async (tenantId, id, status) => {
  const bed = await prisma.bed.findUnique({ where: { id } });
  if (!bed || bed.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.bed.update({ where: { id }, data: { status } });
};

const deleteBed = async (tenantId, id) => {
  const bed = await prisma.bed.findUnique({ where: { id } });
  if (!bed || bed.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.bed.delete({ where: { id } });
};

// ── Occupancy Summary ─────────────────────────────────────────────────────────

const getOccupancy = async (tenantId) => {
  const beds = await prisma.bed.findMany({
    where: { tenantId },
    select: { status: true, wardId: true },
  });
  const total     = beds.length;
  const occupied  = beds.filter((b) => b.status === 'OCCUPIED').length;
  const available = beds.filter((b) => b.status === 'AVAILABLE').length;
  const cleaning  = beds.filter((b) => b.status === 'UNDER_CLEANING').length;
  const reserved  = beds.filter((b) => b.status === 'RESERVED').length;
  const pct       = total > 0 ? ((occupied / total) * 100).toFixed(1) : 0;
  return { total, occupied, available, cleaning, reserved, occupancyPct: Number(pct) };
};

module.exports = {
  WARD_TYPES, BED_TYPES,
  listWards, createWard, updateWard, deleteWard,
  createBed, updateBedStatus, deleteBed,
  getOccupancy,
};
