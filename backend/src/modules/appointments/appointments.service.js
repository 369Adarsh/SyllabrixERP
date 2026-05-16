const prisma = require('../../config/prisma');
const { generateInvoiceNumber } = require('../../utils/generateNumber');

const listServices = (tenantId) =>
  prisma.service.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } });

const createService = (tenantId, data) =>
  prisma.service.create({ data: { ...data, tenantId } });

const updateService = (tenantId, id, data) =>
  prisma.service.update({ where: { id, tenantId }, data });

const deleteService = (tenantId, id) =>
  prisma.service.update({ where: { id, tenantId }, data: { isActive: false } });

const list = (tenantId, { date, staffId, status, search } = {}) => {
  const where = { tenantId };
  if (staffId) where.staffId = staffId;
  if (status) where.status = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.scheduledAt = { gte: start, lt: end };
  }
  return prisma.appointment.findMany({
    where,
    include: { customer: true, service: true },
    orderBy: { scheduledAt: 'asc' },
  });
};

const get = (tenantId, id) =>
  prisma.appointment.findUnique({
    where: { id, tenantId },
    include: { customer: true, service: true },
  });

const create = (tenantId, data) =>
  prisma.appointment.create({
    data: {
      ...data,
      tenantId,
      scheduledAt: new Date(data.scheduledAt),
    },
    include: { customer: true, service: true },
  });

const update = (tenantId, id, data) => {
  if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
  return prisma.appointment.update({
    where: { id, tenantId },
    data,
    include: { customer: true, service: true },
  });
};

// When appointment is marked COMPLETED, auto-create a draft invoice
const updateStatus = async (tenantId, id, status) => {
  const appointment = await prisma.appointment.update({
    where: { id, tenantId },
    data: { status },
    include: { service: true, customer: true },
  });

  if (status === 'COMPLETED' && appointment.service?.price) {
    const invoiceNumber = await generateInvoiceNumber(tenantId);
    await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        customerId: appointment.customerId || null,
        status: 'DRAFT',
        subtotal: appointment.service.price,
        taxAmount: 0,
        discountAmount: 0,
        total: appointment.service.price,
        amountPaid: 0,
        balanceDue: appointment.service.price,
        notes: `Auto-generated from appointment — ${appointment.service.name}`,
        items: {
          create: [{
            description: appointment.service.name,
            quantity: 1,
            unitPrice: appointment.service.price,
            discount: 0,
            taxRate: 0,
            taxAmount: 0,
            total: appointment.service.price,
          }],
        },
      },
    });
  }

  return appointment;
};

const remove = (tenantId, id) =>
  prisma.appointment.update({ where: { id, tenantId }, data: { status: 'CANCELLED' } });

module.exports = {
  listServices, createService, updateService, deleteService,
  list, get, create, update, updateStatus, remove,
};
