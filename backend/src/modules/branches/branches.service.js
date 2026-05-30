const prisma = require('../../config/prisma');
const { nextSyllabrixId, generateBranchId } = require('../../utils/syllabrixId');

const listBranches = async (tenantId) => {
  const branches = await prisma.branch.findMany({
    where: { tenantId },
    orderBy: [{ isHQ: 'desc' }, { name: 'asc' }],
  });

  // Find managers by User.branchId + role (more reliable than Branch.managerId which may be null)
  const branchIds = branches.map(b => b.id);
  const managers = await prisma.user.findMany({
    where: { tenantId, branchId: { in: branchIds }, role: 'MANAGER', isActive: true },
    select: { id: true, name: true, email: true, syllabrixId: true, branchId: true },
  });

  const byBranchId = Object.fromEntries(managers.map(m => [m.branchId, m]));
  return branches.map(b => ({ ...b, manager: byBranchId[b.id] ?? null }));
};

const getBranch = (tenantId, id) =>
  prisma.branch.findFirst({ where: { id, tenantId } });

const createBranch = async (tenantId, data) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { syllabrixId: true } });
  const branchCode = (data.code || '').toUpperCase().slice(0, 4);
  const syllabrixId = tenant?.syllabrixId && branchCode
    ? generateBranchId(tenant.syllabrixId, branchCode)
    : await nextSyllabrixId(); // fallback if no code yet
  const branch = await prisma.branch.create({
    data: { tenantId, syllabrixId, ...data },
  });
  await prisma.tenant.update({ where: { id: tenantId }, data: { hasBranches: true } });
  return branch;
};

const updateBranch = (tenantId, id, data) =>
  prisma.branch.update({ where: { id }, data });

const toggleBranch = async (tenantId, id) => {
  const branch = await prisma.branch.findFirst({ where: { id, tenantId } });
  if (!branch) throw Object.assign(new Error('Branch not found'), { statusCode: 404 });
  if (branch.isHQ) throw Object.assign(new Error('Cannot deactivate HQ branch'), { statusCode: 400 });
  return prisma.branch.update({ where: { id }, data: { isActive: !branch.isActive } });
};

// Stock network — all products with qty per branch (for the network health dashboard)
const getStockNetwork = async (tenantId) => {
  const [branches, stocks, products] = await Promise.all([
    prisma.branch.findMany({ where: { tenantId, isActive: true }, orderBy: [{ isHQ: 'desc' }, { name: 'asc' }] }),
    prisma.branchStock.findMany({
      where: { tenantId },
      include: { product: { select: { id: true, name: true, sku: true, lowStockAlert: true, unit: true } } },
    }),
    prisma.product.findMany({ where: { tenantId, isActive: true }, select: { id: true, name: true, sku: true, lowStockAlert: true, unit: true } }),
  ]);

  // Build a product → branch → qty map
  const stockMap = {};
  for (const s of stocks) {
    if (!stockMap[s.productId]) stockMap[s.productId] = {};
    stockMap[s.productId][s.branchId] = s.quantity;
  }

  const grid = products.map(p => ({
    product: p,
    branches: branches.map(b => ({
      branchId: b.id,
      branchName: b.name,
      qty: stockMap[p.id]?.[b.id] ?? 0,
      status: getStockStatus(stockMap[p.id]?.[b.id] ?? 0, p.lowStockAlert),
    })),
    totalQty: branches.reduce((sum, b) => sum + (stockMap[p.id]?.[b.id] ?? 0), 0),
  }));

  return { branches, grid };
};

function getStockStatus(qty, lowAlert) {
  if (qty <= 0) return 'CRITICAL';
  if (qty <= lowAlert) return 'LOW';
  return 'OK';
}

// Per-branch stock for one product — used by transfer suggestion
const getBranchStocksForProduct = (tenantId, productId) =>
  prisma.branchStock.findMany({
    where: { tenantId, productId },
    include: { branch: { select: { id: true, name: true, code: true } } },
  });

// Upsert branch stock (used by seed and POS/inventory adjustments)
const upsertBranchStock = (tenantId, branchId, productId, qty) =>
  prisma.branchStock.upsert({
    where: { branchId_productId: { branchId, productId } },
    create: { tenantId, branchId, productId, quantity: qty },
    update: { quantity: qty },
  });

const adjustBranchStock = async (tenantId, branchId, productId, delta) => {
  const existing = await prisma.branchStock.findUnique({
    where: { branchId_productId: { branchId, productId } },
  });
  const newQty = Math.max(0, (existing?.quantity ?? 0) + delta);
  await upsertBranchStock(tenantId, branchId, productId, newQty);
  // Keep Product.stock in sync as aggregate
  const agg = await prisma.branchStock.aggregate({ where: { tenantId, productId }, _sum: { quantity: true } });
  await prisma.product.update({ where: { id: productId }, data: { stock: agg._sum.quantity ?? 0 } });
  return newQty;
};

module.exports = {
  listBranches, getBranch, createBranch, updateBranch, toggleBranch,
  getStockNetwork, getBranchStocksForProduct, upsertBranchStock, adjustBranchStock,
};
