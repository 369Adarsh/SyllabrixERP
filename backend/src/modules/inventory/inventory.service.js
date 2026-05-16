const prisma = require('../../config/prisma');

// ── Categories ─────────────────────────────────────────────────────────────

const listCategories = (tenantId) =>
  prisma.category.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });

const createCategory = (tenantId, data) =>
  prisma.category.create({ data: { ...data, tenantId } });

const updateCategory = (tenantId, id, data) =>
  prisma.category.update({ where: { id, tenantId }, data });

const deleteCategory = (tenantId, id) =>
  prisma.category.delete({ where: { id, tenantId } });

// ── Products ───────────────────────────────────────────────────────────────

const listProducts = (tenantId, { search, categoryId, lowStock } = {}) => {
  const where = { tenantId, isActive: true };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (categoryId) where.categoryId = categoryId;
  if (lowStock === 'true') where.stock = { lte: prisma.product.fields.lowStockAlert };
  return prisma.product.findMany({
    where,
    include: { category: true, taxRate: true },
    orderBy: { name: 'asc' },
  });
};

const getProduct = (tenantId, id) =>
  prisma.product.findUnique({ where: { id, tenantId }, include: { category: true, taxRate: true } });

const createProduct = (tenantId, data) =>
  prisma.product.create({ data: { ...data, tenantId } });

const updateProduct = (tenantId, id, data) =>
  prisma.product.update({ where: { id, tenantId }, data });

const deleteProduct = (tenantId, id) =>
  prisma.product.update({ where: { id, tenantId }, data: { isActive: false } });

// ── Stock ──────────────────────────────────────────────────────────────────

const adjustStock = async (tenantId, productId, { type, quantity, notes }) => {
  const product = await prisma.product.findUnique({ where: { id: productId, tenantId } });
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

  const delta = type === 'PURCHASE' || type === 'RETURN' ? quantity : -quantity;
  const afterStock = product.stock + delta;

  if (afterStock < 0) throw Object.assign(new Error('Insufficient stock'), { statusCode: 400 });

  const [updated] = await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: { stock: afterStock } }),
    prisma.stockMovement.create({
      data: { tenantId, productId, type, quantity, beforeStock: product.stock, afterStock, notes },
    }),
  ]);
  return updated;
};

const getStockMovements = (tenantId, productId) =>
  prisma.stockMovement.findMany({
    where: { tenantId, ...(productId ? { productId } : {}) },
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

const getLowStockProducts = (tenantId) =>
  prisma.$queryRaw`
    SELECT * FROM products
    WHERE "tenantId" = ${tenantId}
    AND "isActive" = true
    AND stock <= "lowStockAlert"
  `;

const getExpiringProducts = (tenantId, days = 30) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
  return prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      expiryDate: { not: null, lte: cutoff },
    },
    include: { category: { select: { name: true } } },
    orderBy: { expiryDate: 'asc' },
  });
};

// ── Tax Rates ──────────────────────────────────────────────────────────────

const listTaxRates = (tenantId) => prisma.taxRate.findMany({ where: { tenantId } });
const createTaxRate = (tenantId, data) => prisma.taxRate.create({ data: { ...data, tenantId } });
const deleteTaxRate = (tenantId, id) => prisma.taxRate.delete({ where: { id, tenantId } });

module.exports = {
  listCategories, createCategory, updateCategory, deleteCategory,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  adjustStock, getStockMovements, getLowStockProducts, getExpiringProducts,
  listTaxRates, createTaxRate, deleteTaxRate,
};
