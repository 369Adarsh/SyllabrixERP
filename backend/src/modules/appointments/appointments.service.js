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

const list = async (tenantId, { date, from, to, staffId, serviceId, noCustomer, status, search, page = 1, limit = 50 } = {}) => {
  const where = { tenantId };
  if (staffId) {
    // match by FK or by staffName text (for sessions booked before staff link was established)
    const staffRecord = await prisma.staff.findFirst({ where: { id: staffId, tenantId }, select: { name: true } });
    if (staffRecord) {
      where.OR = [{ staffId }, { staffName: { contains: staffRecord.name, mode: 'insensitive' } }];
    } else {
      where.staffId = staffId;
    }
  }
  if (serviceId) where.serviceId = serviceId;
  if (noCustomer === 'true' || noCustomer === true) where.customerId = null;
  if (status) where.status = status;

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.startTime = { gte: start, lt: end };
  } else if (from || to) {
    where.startTime = {};
    if (from) where.startTime.gte = new Date(from);
    if (to) where.startTime.lte = new Date(to);
  } else {
    // Default: show past 7 days + next 30 days
    const past = new Date(); past.setDate(past.getDate() - 7);
    const future = new Date(); future.setDate(future.getDate() + 30);
    where.startTime = { gte: past, lte: future };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { service: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { customer: { select: { id: true, name: true, phone: true } }, service: { select: { id: true, name: true, price: true, duration: true } }, staff: { select: { id: true, name: true } } },
      orderBy: { startTime: 'asc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.appointment.count({ where }),
  ]);
  return { appointments: items, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
};

const get = (tenantId, id) =>
  prisma.appointment.findUnique({
    where: { id, tenantId },
    include: { customer: true, service: true },
  });

const create = (tenantId, data) => {
  const startTime = new Date(data.scheduledAt || data.startTime);
  const endTime = data.endTime ? new Date(data.endTime) : new Date(startTime.getTime() + 60 * 60_000);
  const { scheduledAt, ...rest } = data;
  return prisma.appointment.create({
    data: { ...rest, tenantId, startTime, endTime, title: rest.title || rest.serviceName || 'Appointment' },
    include: { customer: true, service: true, staff: true },
  });
};

const update = (tenantId, id, data) => {
  if (data.scheduledAt) { data.startTime = new Date(data.scheduledAt); delete data.scheduledAt; }
  if (data.startTime) data.startTime = new Date(data.startTime);
  return prisma.appointment.update({
    where: { id, tenantId },
    data,
    include: { customer: true, service: true, staff: true },
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
    const invoiceNumber = await generateInvoiceNumber();
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
