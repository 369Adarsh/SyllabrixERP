const prisma = require('../../config/prisma');

// ── Suppliers ─────────────────────────────────────────────────────────────────

const listSuppliers = (tenantId) =>
  prisma.clinicSupplier.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } });

const upsertSupplier = async (tenantId, data) => {
  const { id, name, phone, email, gstin, address, creditDays } = data;
  if (id) {
    const s = await prisma.clinicSupplier.findUnique({ where: { id } });
    if (!s || s.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
    return prisma.clinicSupplier.update({ where: { id }, data: { name, phone, email, gstin, address, creditDays } });
  }
  return prisma.clinicSupplier.create({ data: { tenantId, name, phone: phone || null, email: email || null, gstin: gstin || null, address: address || null, creditDays: creditDays || 0 } });
};

const deleteSupplier = async (tenantId, id) => {
  const s = await prisma.clinicSupplier.findUnique({ where: { id } });
  if (!s || s.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.clinicSupplier.update({ where: { id }, data: { isActive: false } });
};

// ── Medicines (Master) ────────────────────────────────────────────────────────

const listMedicines = async (tenantId) => {
  const medicines = await prisma.clinicMedicine.findMany({
    where: { tenantId, isActive: true },
    include: {
      batches: {
        select: { quantity: true, usedQuantity: true, expiryDate: true, id: true },
        where: { expiryDate: { gt: new Date() } },
      },
    },
    orderBy: { genericName: 'asc' },
  });

  return medicines.map((m) => {
    const totalStock = m.batches.reduce((s, b) => s + b.quantity - b.usedQuantity, 0);
    const nearExpiry = m.batches.filter((b) => {
      const days = (new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
      return days <= 90;
    }).length;
    return { ...m, currentStock: totalStock, nearExpiryBatches: nearExpiry };
  });
};

const getMedicineById = async (tenantId, id) => {
  const m = await prisma.clinicMedicine.findUnique({
    where: { id },
    include: {
      batches: { include: { supplier: true }, orderBy: { expiryDate: 'asc' } },
    },
  });
  if (!m || m.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return m;
};

const createMedicine = (tenantId, data) => {
  const { genericName, brandName, manufacturer, formulation, strength, unit, mrp, reorderLevel, scheduleType } = data;
  return prisma.clinicMedicine.create({
    data: {
      tenantId, genericName,
      brandName: brandName || null, manufacturer: manufacturer || null,
      formulation: formulation || null, strength: strength || null,
      unit: unit || 'Strip', mrp: mrp ? parseFloat(mrp) : null,
      reorderLevel: reorderLevel || 10, scheduleType: scheduleType || 'NONE',
    },
  });
};

const updateMedicine = async (tenantId, id, data) => {
  const m = await prisma.clinicMedicine.findUnique({ where: { id } });
  if (!m || m.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  const { genericName, brandName, manufacturer, formulation, strength, unit, mrp, reorderLevel, scheduleType } = data;
  return prisma.clinicMedicine.update({
    where: { id },
    data: {
      ...(genericName && { genericName }),
      ...(brandName !== undefined && { brandName }),
      ...(manufacturer !== undefined && { manufacturer }),
      ...(formulation !== undefined && { formulation }),
      ...(strength !== undefined && { strength }),
      ...(unit && { unit }),
      ...(mrp !== undefined && { mrp: mrp ? parseFloat(mrp) : null }),
      ...(reorderLevel !== undefined && { reorderLevel }),
      ...(scheduleType && { scheduleType }),
    },
  });
};

const deleteMedicine = async (tenantId, id) => {
  const m = await prisma.clinicMedicine.findUnique({ where: { id } });
  if (!m || m.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.clinicMedicine.update({ where: { id }, data: { isActive: false } });
};

// ── Batches ───────────────────────────────────────────────────────────────────

const addBatch = async (tenantId, data) => {
  const { medicineId, supplierId, batchNumber, mfgDate, expiryDate, quantity, purchasePrice } = data;
  const m = await prisma.clinicMedicine.findUnique({ where: { id: medicineId } });
  if (!m || m.tenantId !== tenantId) throw Object.assign(new Error('Medicine not found'), { statusCode: 404 });
  return prisma.clinicMedicineBatch.create({
    data: {
      tenantId, medicineId, supplierId: supplierId || null,
      batchNumber, expiryDate: new Date(expiryDate),
      mfgDate: mfgDate ? new Date(mfgDate) : null,
      quantity: parseInt(quantity), purchasePrice: parseFloat(purchasePrice) || 0,
    },
  });
};

const deleteBatch = async (tenantId, id) => {
  const b = await prisma.clinicMedicineBatch.findUnique({ where: { id } });
  if (!b || b.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.clinicMedicineBatch.delete({ where: { id } });
};

// ── Dispensing ────────────────────────────────────────────────────────────────

const dispense = async (tenantId, data) => {
  const { medicineId, batchId, patientName, patientId, prescriptionId, rxNumber, quantity, dispensedBy, notes } = data;

  const batch = await prisma.clinicMedicineBatch.findUnique({ where: { id: batchId } });
  if (!batch || batch.tenantId !== tenantId) throw Object.assign(new Error('Batch not found'), { statusCode: 404 });

  const available = batch.quantity - batch.usedQuantity;
  if (available < quantity) throw Object.assign(new Error(`Insufficient stock. Available: ${available}`), { statusCode: 400 });

  const [record] = await prisma.$transaction([
    prisma.clinicDispense.create({
      data: {
        tenantId, medicineId, batchId,
        patientName, patientId: patientId || null,
        prescriptionId: prescriptionId || null, rxNumber: rxNumber || null,
        quantity: parseInt(quantity), dispensedBy: dispensedBy || null, notes: notes || null,
      },
    }),
    prisma.clinicMedicineBatch.update({
      where: { id: batchId },
      data: { usedQuantity: { increment: parseInt(quantity) } },
    }),
  ]);
  return record;
};

const listDispenses = (tenantId, params = {}) => {
  const { medicineId, limit = 50 } = params;
  return prisma.clinicDispense.findMany({
    where: { tenantId, ...(medicineId && { medicineId }) },
    include: { medicine: { select: { genericName: true, brandName: true, formulation: true } } },
    orderBy: { dispensedAt: 'desc' },
    take: Number(limit),
  });
};

// ── Alerts ────────────────────────────────────────────────────────────────────

const getExpiryAlerts = async (tenantId) => {
  const now = new Date();
  const in30 = new Date(now); in30.setDate(in30.getDate() + 30);
  const in90 = new Date(now); in90.setDate(in90.getDate() + 90);

  const batches = await prisma.clinicMedicineBatch.findMany({
    where: { tenantId, expiryDate: { lte: in90, gt: now } },
    include: { medicine: { select: { genericName: true, brandName: true, scheduleType: true } } },
    orderBy: { expiryDate: 'asc' },
  });

  return batches.map((b) => {
    const daysLeft = Math.ceil((new Date(b.expiryDate) - now) / (1000 * 60 * 60 * 24));
    const available = b.quantity - b.usedQuantity;
    return { ...b, daysLeft, available, urgency: daysLeft <= 30 ? 'CRITICAL' : 'WARNING' };
  });
};

const getLowStockAlerts = async (tenantId) => {
  const medicines = await listMedicines(tenantId);
  return medicines.filter((m) => m.currentStock <= m.reorderLevel);
};

const getScheduleHRegister = (tenantId) =>
  prisma.clinicDispense.findMany({
    where: {
      tenantId,
      medicine: { scheduleType: { in: ['H', 'H1', 'X'] } },
    },
    include: {
      medicine: { select: { genericName: true, brandName: true, scheduleType: true } },
      batch: { select: { batchNumber: true } },
    },
    orderBy: { dispensedAt: 'desc' },
    take: 200,
  });

module.exports = {
  listSuppliers, upsertSupplier, deleteSupplier,
  listMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine,
  addBatch, deleteBatch,
  dispense, listDispenses,
  getExpiryAlerts, getLowStockAlerts, getScheduleHRegister,
};
