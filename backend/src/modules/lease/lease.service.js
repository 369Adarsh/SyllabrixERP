const prisma = require('../../config/prisma');

// Units
const listUnits = (tenantId) =>
  prisma.leaseUnit.findMany({
    where: { tenantId },
    include: { leases: { where: { status: 'ACTIVE' }, take: 1 } },
    orderBy: { unitNumber: 'asc' },
  });

const createUnit = (tenantId, data) =>
  prisma.leaseUnit.create({ data: { ...data, tenantId } });

const updateUnit = (tenantId, id, data) =>
  prisma.leaseUnit.update({ where: { id, tenantId }, data });

// Lease Tenants
const listLeases = (tenantId, { status, unitId } = {}) => {
  const where = { tenantId };
  if (status) where.status = status;
  if (unitId) where.unitId = unitId;
  return prisma.leaseTenant.findMany({
    where,
    include: { unit: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getLease = (tenantId, id) =>
  prisma.leaseTenant.findUnique({
    where: { id, tenantId },
    include: { unit: true },
  });

const createLease = async (tenantId, data) => {
  const lease = await prisma.leaseTenant.create({
    data: {
      ...data,
      tenantId,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: { unit: true },
  });
  await prisma.leaseUnit.update({ where: { id: data.unitId }, data: { isOccupied: true } });
  return lease;
};

const updateLease = (tenantId, id, data) => {
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  return prisma.leaseTenant.update({ where: { id, tenantId }, data, include: { unit: true } });
};

const terminateLease = async (tenantId, id) => {
  const lease = await prisma.leaseTenant.update({
    where: { id, tenantId },
    data: { status: 'TERMINATED' },
  });
  await prisma.leaseUnit.update({ where: { id: lease.unitId }, data: { isOccupied: false } });
  return lease;
};

const getRentDue = (tenantId) =>
  prisma.leaseTenant.findMany({
    where: { tenantId, status: 'ACTIVE' },
    include: { unit: true },
    orderBy: { businessName: 'asc' },
  });

module.exports = { listUnits, createUnit, updateUnit, listLeases, getLease, createLease, updateLease, terminateLease, getRentDue };
