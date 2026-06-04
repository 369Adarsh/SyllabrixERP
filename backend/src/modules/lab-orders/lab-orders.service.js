const prisma = require('../../config/prisma');
const { generateLabOrderNumber } = require('../../utils/generateNumber');
const { searchTests, LAB_TESTS, LAB_CATEGORIES, getByCategory } = require('../../data/lab-tests');

// ── Lab Centers ───────────────────────────────────────────────────────────────

const listCenters = (tenantId) =>
  prisma.labCenter.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } });

const upsertCenter = async (tenantId, data) => {
  const { id, name, phone, address, email } = data;
  if (id) {
    const existing = await prisma.labCenter.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== tenantId) throw Object.assign(new Error('Lab center not found'), { statusCode: 404 });
    return prisma.labCenter.update({ where: { id }, data: { name, phone, address, email } });
  }
  return prisma.labCenter.create({ data: { tenantId, name, phone: phone || null, address: address || null, email: email || null } });
};

const deleteCenter = async (tenantId, id) => {
  const c = await prisma.labCenter.findUnique({ where: { id } });
  if (!c || c.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.labCenter.update({ where: { id }, data: { isActive: false } });
};

// ── Lab Orders ────────────────────────────────────────────────────────────────

const listOrders = async (tenantId, params = {}) => {
  const { patientId, status, limit = 100, offset = 0 } = params;
  const where = { tenantId };
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.labOrder.findMany({
      where,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        reports: { orderBy: { createdAt: 'desc' }, take: 5 },
        labCenter: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    }),
    prisma.labOrder.count({ where }),
  ]);
  return { orders, total };
};

const getOrderById = async (tenantId, id) => {
  const order = await prisma.labOrder.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      reports: { orderBy: { createdAt: 'desc' } },
      labCenter: true,
    },
  });
  if (!order || order.tenantId !== tenantId) throw Object.assign(new Error('Lab order not found'), { statusCode: 404 });
  return order;
};

const createOrder = async (tenantId, data) => {
  const {
    patientId, patientName, patientPhone,
    doctorId, doctorName, appointmentId,
    labCenterId, labCenterName,
    clinicalInfo, urgency = 'ROUTINE', notes, items = [],
  } = data;

  const orderNumber = await generateLabOrderNumber();

  return prisma.labOrder.create({
    data: {
      tenantId, orderNumber,
      patientId: patientId || null,
      patientName,
      patientPhone: patientPhone || null,
      doctorId: doctorId || null,
      doctorName,
      appointmentId: appointmentId || null,
      labCenterId: labCenterId || null,
      labCenterName: labCenterName || null,
      clinicalInfo: clinicalInfo || null,
      urgency,
      notes: notes || null,
      items: {
        create: items.map((item, idx) => ({
          testName: item.testName,
          testCode: item.testCode || null,
          category: item.category || null,
          status: 'PENDING',
          sortOrder: idx,
        })),
      },
    },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      reports: true,
      labCenter: true,
    },
  });
};

const updateOrder = async (tenantId, id, data) => {
  const order = await prisma.labOrder.findUnique({ where: { id } });
  if (!order || order.tenantId !== tenantId) throw Object.assign(new Error('Lab order not found'), { statusCode: 404 });

  const { clinicalInfo, notes, urgency, status, labCenterId, labCenterName, items } = data;

  await prisma.labOrder.update({
    where: { id },
    data: {
      ...(clinicalInfo !== undefined && { clinicalInfo }),
      ...(notes !== undefined && { notes }),
      ...(urgency && { urgency }),
      ...(status && { status }),
      ...(labCenterId !== undefined && { labCenterId: labCenterId || null }),
      ...(labCenterName !== undefined && { labCenterName: labCenterName || null }),
    },
  });

  if (items) {
    await prisma.labOrderItem.deleteMany({ where: { orderId: id } });
    if (items.length > 0) {
      await prisma.labOrderItem.createMany({
        data: items.map((item, idx) => ({
          orderId: id,
          testName: item.testName,
          testCode: item.testCode || null,
          category: item.category || null,
          status: item.status || 'PENDING',
          reportNote: item.reportNote || null,
          isAbnormal: item.isAbnormal ?? false,
          sortOrder: idx,
        })),
      });
    }
  }

  // Auto-compute order status from item statuses
  const allItems = await prisma.labOrderItem.findMany({ where: { orderId: id } });
  if (allItems.length > 0) {
    const allDone = allItems.every((i) => i.status === 'COMPLETED');
    const someDone = allItems.some((i) => i.status === 'COMPLETED');
    const computedStatus = allDone ? 'COMPLETED' : someDone ? 'PARTIAL' : 'PENDING';
    if (!status) {
      await prisma.labOrder.update({ where: { id }, data: { status: computedStatus } });
    }
  }

  return prisma.labOrder.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      reports: { orderBy: { createdAt: 'desc' } },
      labCenter: true,
    },
  });
};

const deleteOrder = async (tenantId, id) => {
  const order = await prisma.labOrder.findUnique({ where: { id } });
  if (!order || order.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.labOrder.delete({ where: { id } });
};

// ── Lab Reports ───────────────────────────────────────────────────────────────

const addReport = async (tenantId, data) => {
  const { orderId, patientId, patientName, reportName, fileUrl, fileType, notes, isAbnormal, reportedAt } = data;
  return prisma.labReport.create({
    data: {
      tenantId,
      orderId: orderId || null,
      patientId: patientId || null,
      patientName,
      reportName,
      fileUrl: fileUrl || null,
      fileType: fileType || null,
      notes: notes || null,
      isAbnormal: isAbnormal ?? false,
      reportedAt: reportedAt ? new Date(reportedAt) : new Date(),
    },
  });
};

const markReportViewed = (id) => prisma.labReport.update({ where: { id }, data: { isViewed: true } });

const deleteReport = async (tenantId, id) => {
  const report = await prisma.labReport.findUnique({ where: { id } });
  if (!report || report.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.labReport.delete({ where: { id } });
};

// ── Test catalog ──────────────────────────────────────────────────────────────

const testSearch = (query) => searchTests(query, 20);
const testCatalog = () => ({ tests: LAB_TESTS, categories: LAB_CATEGORIES });

module.exports = {
  listCenters, upsertCenter, deleteCenter,
  listOrders, getOrderById, createOrder, updateOrder, deleteOrder,
  addReport, markReportViewed, deleteReport,
  testSearch, testCatalog,
};
