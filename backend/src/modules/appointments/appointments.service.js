const prisma = require('../../config/prisma');
const { generateInvoiceNumber, generateClinicBillNumber } = require('../../utils/generateNumber');

// Healthcare types that bill via ClinicBill, not generic Invoice
const HEALTHCARE_TYPES = new Set([
  'CLINIC', 'DENTAL', 'HOSPITAL', 'NURSING_HOME',
  'PHYSIOTHERAPY', 'AYURVEDA', 'VET_CLINIC', 'DIAGNOSTIC_LAB',
]);

const listServices = (tenantId) =>
  prisma.service.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } });

const createService = (tenantId, data) =>
  prisma.service.create({ data: { ...data, tenantId } });

const updateService = (tenantId, id, data) =>
  prisma.service.update({ where: { id, tenantId }, data });

const deleteService = (tenantId, id) =>
  prisma.service.update({ where: { id, tenantId }, data: { isActive: false } });

// ── Conflict detection ────────────────────────────────────────────────────────
const checkConflict = async (tenantId, staffId, startTime, endTime, excludeId = null) => {
  if (!staffId) return null;
  return prisma.appointment.findFirst({
    where: {
      tenantId,
      staffId,
      status: { notIn: ['CANCELLED'] },
      ...(excludeId && { id: { not: excludeId } }),
      AND: [
        { startTime: { lt: endTime } },
        { endTime:   { gt: startTime } },
      ],
    },
    include: {
      customer: { select: { name: true } },
      service:  { select: { name: true } },
      staff:    { select: { name: true } },
    },
  });
};

const throwConflict = (conflict) => {
  const t = new Date(conflict.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const with_ = conflict.customer ? ` with ${conflict.customer.name}` : '';
  throw Object.assign(
    new Error(`${conflict.staff?.name || 'This doctor'} already has an appointment at ${t}${with_}`),
    { statusCode: 409, code: 'CONFLICT' }
  );
};

// ── List ──────────────────────────────────────────────────────────────────────
const list = async (tenantId, { date, from, to, staffId, serviceId, noCustomer, status, search, page = 1, limit = 50 } = {}) => {
  const where = { tenantId };

  if (staffId) {
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
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);
    where.startTime = { gte: start, lte: end };
  } else if (from || to) {
    where.startTime = {};
    if (from) where.startTime.gte = new Date(from);
    if (to)   where.startTime.lte = new Date(to);
  } else {
    const past   = new Date(); past.setDate(past.getDate() - 7);
    const future = new Date(); future.setDate(future.getDate() + 30);
    where.startTime = { gte: past, lte: future };
  }

  if (search) {
    where.OR = [
      { title:    { contains: search, mode: 'insensitive' } },
      { customer: { name:     { contains: search, mode: 'insensitive' } } },
      { service:  { name:     { contains: search, mode: 'insensitive' } } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service:  { select: { id: true, name: true, price: true, duration: true } },
        staff:    { select: { id: true, name: true } },
      },
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
    include: { customer: true, service: true, staff: true },
  });

// ── Create (with conflict detection) ─────────────────────────────────────────
const create = async (tenantId, data) => {
  const startTime = new Date(data.scheduledAt || data.startTime);
  const endTime   = data.endTime ? new Date(data.endTime) : new Date(startTime.getTime() + 60 * 60_000);
  const { scheduledAt, recurring, ...rest } = data;

  if (rest.staffId) {
    const conflict = await checkConflict(tenantId, rest.staffId, startTime, endTime);
    if (conflict) throwConflict(conflict);
  }

  return prisma.appointment.create({
    data: { ...rest, tenantId, startTime, endTime, title: rest.title || rest.serviceName || 'Appointment' },
    include: { customer: true, service: true, staff: true },
  });
};

// ── Recurring: create N appointments at a fixed frequency ─────────────────────
const createRecurring = async (tenantId, data, { frequency, count }) => {
  const first    = new Date(data.scheduledAt || data.startTime);
  const duration = data.endTime
    ? new Date(data.endTime).getTime() - first.getTime()
    : 60 * 60_000;

  const results = { created: [], skipped: [] };

  for (let i = 0; i < Math.min(count, 52); i++) {
    const startTime = new Date(first);

    if (frequency === 'daily')        startTime.setDate(startTime.getDate() + i);
    else if (frequency === 'weekly')  startTime.setDate(startTime.getDate() + i * 7);
    else if (frequency === 'monthly') startTime.setMonth(startTime.getMonth() + i);

    const endTime = new Date(startTime.getTime() + duration);

    try {
      const appt = await create(tenantId, { ...data, startTime: startTime.toISOString(), endTime: endTime.toISOString() });
      results.created.push(appt);
    } catch (e) {
      if (e.code === 'CONFLICT') {
        results.skipped.push({ date: startTime.toISOString(), reason: e.message });
      } else {
        throw e;
      }
    }
  }

  return results;
};

// ── Update (with conflict detection on reschedule) ────────────────────────────
const update = async (tenantId, id, data) => {
  if (data.scheduledAt) { data.startTime = new Date(data.scheduledAt); delete data.scheduledAt; }
  if (data.startTime)   data.startTime = new Date(data.startTime);

  if (data.startTime) {
    const existing  = await prisma.appointment.findUnique({ where: { id, tenantId }, select: { staffId: true, endTime: true } });
    const staffId   = data.staffId !== undefined ? data.staffId : existing?.staffId;
    if (staffId) {
      const endTime = data.endTime ? new Date(data.endTime) : new Date(data.startTime.getTime() + 60 * 60_000);
      const conflict = await checkConflict(tenantId, staffId, data.startTime, endTime, id);
      if (conflict) throwConflict(conflict);
    }
  }

  return prisma.appointment.update({
    where: { id, tenantId },
    data,
    include: { customer: true, service: true, staff: true },
  });
};

// ── Reschedule: change date/time, keep everything else, reset to SCHEDULED ────
const reschedule = async (tenantId, id, { date, time }) => {
  const existing = await prisma.appointment.findUnique({
    where: { id, tenantId },
    select: { staffId: true, startTime: true, endTime: true },
  });
  if (!existing) throw Object.assign(new Error('Appointment not found'), { statusCode: 404 });

  const newStart   = new Date(`${date}T${time}`);
  const duration   = existing.endTime ? existing.endTime.getTime() - existing.startTime.getTime() : 60 * 60_000;
  const newEnd     = new Date(newStart.getTime() + duration);

  if (existing.staffId) {
    const conflict = await checkConflict(tenantId, existing.staffId, newStart, newEnd, id);
    if (conflict) throwConflict(conflict);
  }

  return prisma.appointment.update({
    where: { id, tenantId },
    data:  { startTime: newStart, endTime: newEnd, status: 'SCHEDULED' },
    include: { customer: true, service: true, staff: true },
  });
};

// ── Update status (auto-bill on COMPLETED) ────────────────────────────────────
const updateStatus = async (tenantId, id, status) => {
  const appointment = await prisma.appointment.update({
    where: { id, tenantId },
    data:  { status },
    include: { service: true, customer: true, tenant: { select: { businessType: true } } },
  });

  if (status === 'COMPLETED' && appointment.service?.price) {
    if (HEALTHCARE_TYPES.has(appointment.tenant?.businessType)) {
      // Healthcare: create a ClinicBill draft
      const billNumber = await generateClinicBillNumber();
      await prisma.clinicBill.create({
        data: {
          tenantId,
          billNumber,
          patientId:     appointment.customerId   || null,
          patientName:   appointment.customer?.name  || 'Walk-in Patient',
          patientPhone:  appointment.customer?.phone || null,
          appointmentId: appointment.id,
          subtotal:      appointment.service.price,
          totalAmount:   appointment.service.price,
          dueAmount:     appointment.service.price,
          notes: `Auto from appointment — ${appointment.service.name}`,
          items: {
            create: [{
              category:    'CONSULTATION',
              description: appointment.service.name,
              quantity:    1,
              unitPrice:   appointment.service.price,
              discount:    0,
              isGstExempt: true,
              taxRate:     0,
              taxAmount:   0,
              lineTotal:   appointment.service.price,
            }],
          },
        },
      });
    } else {
      // Generic business: create a draft Invoice
      const invoiceNumber = await generateInvoiceNumber();
      await prisma.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          customerId:     appointment.customerId || null,
          status:         'DRAFT',
          subtotal:       appointment.service.price,
          taxAmount:      0,
          discountAmount: 0,
          total:          appointment.service.price,
          amountPaid:     0,
          balanceDue:     appointment.service.price,
          notes: `Auto from appointment — ${appointment.service.name}`,
          items: {
            create: [{
              description: appointment.service.name,
              quantity:    1,
              unitPrice:   appointment.service.price,
              discount:    0,
              taxRate:     0,
              taxAmount:   0,
              total:       appointment.service.price,
            }],
          },
        },
      });
    }
  }

  return appointment;
};

const remove = (tenantId, id) =>
  prisma.appointment.update({ where: { id, tenantId }, data: { status: 'CANCELLED' } });

module.exports = {
  listServices, createService, updateService, deleteService,
  list, get, create, createRecurring, update, reschedule, updateStatus, remove,
};
