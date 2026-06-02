const prisma = require('../../config/prisma');
const { generateRxNumber } = require('../../utils/generateNumber');
const { searchDrugs } = require('../../data/indian-drugs');

const list = async (tenantId, params = {}) => {
  const { patientId, status, limit = 50, offset = 0 } = params;
  const where = { tenantId };
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    }),
    prisma.prescription.count({ where }),
  ]);
  return { prescriptions, total };
};

const getById = async (tenantId, id) => {
  const rx = await prisma.prescription.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!rx || rx.tenantId !== tenantId) {
    throw Object.assign(new Error('Prescription not found'), { statusCode: 404 });
  }
  return rx;
};

const create = async (tenantId, data) => {
  const {
    patientId, patientName, patientPhone,
    doctorId, doctorName,
    appointmentId, diagnosis, notes, followUpDate,
    items = [],
  } = data;

  const rxNumber = await generateRxNumber();

  return prisma.prescription.create({
    data: {
      tenantId, rxNumber,
      patientId: patientId || null,
      patientName,
      patientPhone: patientPhone || null,
      doctorId: doctorId || null,
      doctorName,
      appointmentId: appointmentId || null,
      diagnosis: diagnosis || null,
      notes: notes || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      items: {
        create: items.map((item, idx) => ({
          drugName: item.drugName,
          brandName: item.brandName || null,
          formulation: item.formulation || null,
          strength: item.strength || null,
          dose: item.dose || null,
          frequency: item.frequency || null,
          duration: item.duration || null,
          instructions: item.instructions || null,
          isScheduleH: item.isScheduleH ?? false,
          isScheduleX: item.isScheduleX ?? false,
          sortOrder: idx,
        })),
      },
    },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
};

const update = async (tenantId, id, data) => {
  const rx = await prisma.prescription.findUnique({ where: { id } });
  if (!rx || rx.tenantId !== tenantId) {
    throw Object.assign(new Error('Prescription not found'), { statusCode: 404 });
  }

  const { diagnosis, notes, followUpDate, status, isPrinted, isDispensed, items } = data;

  await prisma.prescription.update({
    where: { id },
    data: {
      ...(diagnosis !== undefined && { diagnosis }),
      ...(notes !== undefined && { notes }),
      ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
      ...(status && { status }),
      ...(isPrinted !== undefined && { isPrinted }),
      ...(isDispensed !== undefined && { isDispensed }),
    },
  });

  if (items) {
    await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
    if (items.length > 0) {
      await prisma.prescriptionItem.createMany({
        data: items.map((item, idx) => ({
          prescriptionId: id,
          drugName: item.drugName,
          brandName: item.brandName || null,
          formulation: item.formulation || null,
          strength: item.strength || null,
          dose: item.dose || null,
          frequency: item.frequency || null,
          duration: item.duration || null,
          instructions: item.instructions || null,
          isScheduleH: item.isScheduleH ?? false,
          isScheduleX: item.isScheduleX ?? false,
          sortOrder: idx,
        })),
      });
    }
  }

  return prisma.prescription.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
};

const remove = async (tenantId, id) => {
  const rx = await prisma.prescription.findUnique({ where: { id } });
  if (!rx || rx.tenantId !== tenantId) {
    throw Object.assign(new Error('Prescription not found'), { statusCode: 404 });
  }
  return prisma.prescription.delete({ where: { id } });
};

const drugSearch = (query) => searchDrugs(query, 15);

module.exports = { list, getById, create, update, remove, drugSearch };
