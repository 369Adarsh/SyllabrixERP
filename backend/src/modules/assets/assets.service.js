const prisma = require('../../config/prisma');

// ── Depreciation helpers ─────────────────────────────────────────────────────

const yearsElapsed = (from, to = null) => {
  const end = to ? new Date(to).getTime() : Date.now();
  const ms = end - new Date(from).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 365.25));
};

const calcCurrentValue = (asset) => {
  const { purchasePrice, salvageValue, usefulLifeYears, depreciationMethod, purchaseDate, disposedAt } = asset;
  const years = yearsElapsed(purchaseDate, disposedAt || null);

  if (depreciationMethod === 'SLM') {
    const annualDep = (purchasePrice - salvageValue) / (usefulLifeYears || 5);
    return Math.max(salvageValue, purchasePrice - annualDep * years);
  }
  // WDV — Written Down Value (Indian IT Act)
  const rate = (asset.category?.wdvRate || 15) / 100;
  let val = purchasePrice;
  const fullYears = Math.floor(years);
  for (let i = 0; i < fullYears; i++) val *= (1 - rate);
  const fraction = years - fullYears;
  val *= (1 - rate * fraction);
  return Math.max(salvageValue, val);
};

const depreciationSchedule = (asset) => {
  const { purchasePrice, salvageValue, usefulLifeYears, depreciationMethod } = asset;
  const years = usefulLifeYears || 5;
  const schedule = [];

  if (depreciationMethod === 'SLM') {
    const annualDep = (purchasePrice - salvageValue) / years;
    let bookValue = purchasePrice;
    for (let y = 1; y <= years; y++) {
      const dep = Math.min(annualDep, bookValue - salvageValue);
      bookValue = Math.max(salvageValue, bookValue - dep);
      schedule.push({ year: y, depreciation: dep, bookValue });
    }
  } else {
    const rate = (asset.category?.wdvRate || 15) / 100;
    let bookValue = purchasePrice;
    for (let y = 1; y <= Math.min(years, 20); y++) {
      const dep = bookValue * rate;
      bookValue = Math.max(salvageValue, bookValue - dep);
      schedule.push({ year: y, depreciation: dep, bookValue });
      if (bookValue <= salvageValue) break;
    }
  }
  return schedule;
};

// ── Categories ───────────────────────────────────────────────────────────────

const listCategories = (tenantId) =>
  prisma.assetCategory.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });

const createCategory = (tenantId, data) =>
  prisma.assetCategory.create({ data: { ...data, tenantId } });

const updateCategory = (tenantId, id, data) =>
  prisma.assetCategory.update({ where: { id, tenantId }, data });

const deleteCategory = (tenantId, id) =>
  prisma.assetCategory.delete({ where: { id, tenantId } });

// ── Assets ───────────────────────────────────────────────────────────────────

const list = async (tenantId, { status, categoryId, search, branchId } = {}) => {
  const where = { tenantId };
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (branchId) where.branchId = branchId;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const assets = await prisma.asset.findMany({
    where,
    include: { category: true, maintenanceLogs: { orderBy: { performedAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });

  return assets.map(a => ({
    ...a,
    currentValue: calcCurrentValue(a),
    totalDepreciation: a.purchasePrice - calcCurrentValue(a),
  }));
};

const get = async (tenantId, id) => {
  const a = await prisma.asset.findUnique({
    where: { id, tenantId },
    include: { category: true, maintenanceLogs: { orderBy: { performedAt: 'desc' } } },
  });
  if (!a) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });
  return {
    ...a,
    currentValue: calcCurrentValue(a),
    totalDepreciation: a.purchasePrice - calcCurrentValue(a),
    depreciationSchedule: depreciationSchedule(a),
  };
};

const create = async (tenantId, data) => {
  const { purchaseDate, purchasePrice, salvageValue = 0, usefulLifeYears = 5, depreciationMethod = 'SLM', warrantyExpiry, ...rest } = data;

  const draft = {
    purchaseDate: new Date(purchaseDate),
    purchasePrice: Number(purchasePrice),
    salvageValue: Number(salvageValue),
    usefulLifeYears: Number(usefulLifeYears),
    depreciationMethod,
    warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
  };

  // Need category for WDV rate if method is WDV
  let category = null;
  if (rest.categoryId && depreciationMethod === 'WDV') {
    category = await prisma.assetCategory.findUnique({ where: { id: rest.categoryId } });
  }

  const currentValue = calcCurrentValue({ ...draft, category });

  return prisma.asset.create({
    data: { ...rest, ...draft, currentValue, tenantId },
    include: { category: true },
  });
};

const update = async (tenantId, id, data) => {
  const existing = await prisma.asset.findUnique({ where: { id, tenantId }, include: { category: true } });
  if (!existing) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });

  const allowed = ['name', 'description', 'categoryId', 'assetCode', 'serialNumber', 'location', 'assignedTo',
    'purchaseDate', 'purchasePrice', 'salvageValue', 'usefulLifeYears', 'depreciationMethod',
    'status', 'vendor', 'warrantyExpiry', 'notes'];
  const payload = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  if (payload.purchaseDate) payload.purchaseDate = new Date(payload.purchaseDate);
  if (payload.warrantyExpiry) payload.warrantyExpiry = new Date(payload.warrantyExpiry);
  if (payload.purchasePrice) payload.purchasePrice = Number(payload.purchasePrice);
  if (payload.salvageValue !== undefined) payload.salvageValue = Number(payload.salvageValue);
  if (payload.usefulLifeYears) payload.usefulLifeYears = Number(payload.usefulLifeYears);

  const merged = { ...existing, ...payload };
  const category = merged.categoryId !== existing.categoryId
    ? await prisma.assetCategory.findUnique({ where: { id: merged.categoryId } })
    : existing.category;
  payload.currentValue = calcCurrentValue({ ...merged, category });

  return prisma.asset.update({ where: { id, tenantId }, data: payload, include: { category: true } });
};

const dispose = async (tenantId, id, { disposalPrice, disposalReason }) => {
  return prisma.asset.update({
    where: { id, tenantId },
    data: { status: 'DISPOSED', disposedAt: new Date(), disposalPrice: Number(disposalPrice || 0), disposalReason },
  });
};

const remove = (tenantId, id) =>
  prisma.asset.delete({ where: { id, tenantId } });

// ── Maintenance ──────────────────────────────────────────────────────────────

const logMaintenance = async (tenantId, assetId, data) => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId, tenantId } });
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });

  const log = await prisma.assetMaintenance.create({
    data: {
      assetId,
      type: data.type || 'SCHEDULED',
      description: data.description,
      cost: Number(data.cost || 0),
      performedBy: data.performedBy || null,
      performedAt: data.performedAt ? new Date(data.performedAt) : new Date(),
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
      notes: data.notes || null,
    },
  });

  // If repair/scheduled, set to UNDER_MAINTENANCE; if completed note, set back to ACTIVE
  if (data.setStatus) {
    await prisma.asset.update({ where: { id: assetId }, data: { status: data.setStatus } });
  }

  return log;
};

const getMaintenanceLogs = (tenantId, assetId) =>
  prisma.assetMaintenance.findMany({
    where: { asset: { tenantId }, assetId },
    orderBy: { performedAt: 'desc' },
  });

// ── Summary ──────────────────────────────────────────────────────────────────

const summary = async (tenantId) => {
  const assets = await prisma.asset.findMany({
    where: { tenantId },
    include: { category: true, maintenanceLogs: { orderBy: { nextDueDate: 'asc' }, take: 1 } },
  });

  const withValues = assets.map(a => ({ ...a, cv: calcCurrentValue(a) }));
  const byStatus = (s) => withValues.filter(a => a.status === s);

  const dueSoon = withValues.filter(a => {
    const next = a.maintenanceLogs?.[0]?.nextDueDate;
    if (!next) return false;
    return new Date(next) <= new Date(Date.now() + 30 * 86400000);
  });

  return {
    total: assets.length,
    totalPurchaseValue: assets.reduce((s, a) => s + a.purchasePrice, 0),
    totalCurrentValue: withValues.reduce((s, a) => s + a.cv, 0),
    totalDepreciation: withValues.reduce((s, a) => s + (a.purchasePrice - a.cv), 0),
    active: byStatus('ACTIVE').length,
    underMaintenance: byStatus('UNDER_MAINTENANCE').length,
    disposed: byStatus('DISPOSED').length,
    lost: byStatus('LOST').length,
    retired: byStatus('RETIRED').length,
    maintenanceDueSoon: dueSoon.length,
  };
};

module.exports = {
  listCategories, createCategory, updateCategory, deleteCategory,
  list, get, create, update, dispose, remove,
  logMaintenance, getMaintenanceLogs,
  summary,
};
