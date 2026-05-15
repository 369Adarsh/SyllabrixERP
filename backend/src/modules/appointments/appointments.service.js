const prisma = require('../../config/prisma');

const listServices = (tenantId) =>
  prisma.service.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } });

const createService = (tenantId, data) =>
  prisma.service.create({ data: { ...data, tenantId } });

const updateService = (tenantId, id, data) =>
  prisma.service.update({ where: { id, tenantId }, data });

const deleteService = (tenantId, id) =>
  prisma.service.update({ where: { id, tenantId }, data: { isActive: false } });

const list = (tenantId, { date, staffId, status } = {}) => {
  const where = { tenantId };
  if (staffId) where.staffId = staffId;
  if (status) where.status = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.startTime = { gte: start, lt: end };
  }
  return prisma.appointment.findMany({
    where,
    include: { customer: true, staff: true, service: true },
    orderBy: { startTime: 'asc' },
  });
};

const get = (tenantId, id) =>
  prisma.appointment.findUnique({
    where: { id, tenantId },
    include: { customer: true, staff: true, service: true },
  });

const create = (tenantId, data) =>
  prisma.appointment.create({
    data: {
      ...data,
      tenantId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    },
    include: { customer: true, staff: true, service: true },
  });

const update = (tenantId, id, data) => {
  if (data.startTime) data.startTime = new Date(data.startTime);
  if (data.endTime) data.endTime = new Date(data.endTime);
  return prisma.appointment.update({
    where: { id, tenantId },
    data,
    include: { customer: true, staff: true, service: true },
  });
};

const updateStatus = (tenantId, id, status) =>
  prisma.appointment.update({ where: { id, tenantId }, data: { status } });

const remove = (tenantId, id) =>
  prisma.appointment.update({ where: { id, tenantId }, data: { status: 'CANCELLED' } });

module.exports = {
  listServices, createService, updateService, deleteService,
  list, get, create, update, updateStatus, remove,
};
