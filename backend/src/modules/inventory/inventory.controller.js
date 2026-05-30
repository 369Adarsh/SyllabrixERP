const svc = require('./inventory.service');
const { ok, created } = require('../../utils/response');
const activity = require('../activity/activity.service');

// Categories
const listCategories = async (req, res, next) => {
  try { ok(res, await svc.listCategories(req.tenantId)); } catch (e) { next(e); }
};
const createCategory = async (req, res, next) => {
  try { created(res, await svc.createCategory(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updateCategory = async (req, res, next) => {
  try { ok(res, await svc.updateCategory(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const deleteCategory = async (req, res, next) => {
  try { ok(res, await svc.deleteCategory(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); }
};

// Products
const listProducts = async (req, res, next) => {
  try {
    const params = { ...req.query };
    // Managers are locked to their own branch; owners can pass branchId explicitly
    if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
    ok(res, await svc.listProducts(req.tenantId, params));
  } catch (e) { next(e); }
};
const getProduct = async (req, res, next) => {
  try { ok(res, await svc.getProduct(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const createProduct = async (req, res, next) => {
  try {
    const p = await svc.createProduct(req.tenantId, req.body);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'PRODUCT_CREATED', 'inventory', 'Product', p.id, { name: p.name, sku: p.sku }, ipAddress);
    created(res, p);
  } catch (e) { next(e); }
};
const updateProduct = async (req, res, next) => {
  try {
    const p = await svc.updateProduct(req.tenantId, req.params.id, req.body);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'PRODUCT_UPDATED', 'inventory', 'Product', req.params.id, { name: p.name }, ipAddress);
    ok(res, p);
  } catch (e) { next(e); }
};
const deleteProduct = async (req, res, next) => {
  try { ok(res, await svc.deleteProduct(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); }
};

// Stock
const adjustStock = async (req, res, next) => {
  try {
    const result = await svc.adjustStock(req.tenantId, req.params.id, req.body);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'STOCK_ADJUSTED', 'inventory', 'Product', req.params.id, { adjustment: req.body.adjustment, reason: req.body.reason }, ipAddress);
    ok(res, result, 'Stock adjusted');
  } catch (e) { next(e); }
};
const getStockMovements = async (req, res, next) => {
  try { ok(res, await svc.getStockMovements(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const getLowStockProducts = async (req, res, next) => {
  try {
    const branchId = (req.user?.role === 'MANAGER' && req.user.branchId)
      ? req.user.branchId
      : req.query.branchId;
    ok(res, await svc.getLowStockProducts(req.tenantId, branchId));
  } catch (e) { next(e); }
};
const getExpiringProducts = async (req, res, next) => {
  try { ok(res, await svc.getExpiringProducts(req.tenantId, req.query.days)); } catch (e) { next(e); }
};

// Tax Rates
const listTaxRates = async (req, res, next) => {
  try { ok(res, await svc.listTaxRates(req.tenantId)); } catch (e) { next(e); }
};
const createTaxRate = async (req, res, next) => {
  try { created(res, await svc.createTaxRate(req.tenantId, req.body)); } catch (e) { next(e); }
};
const deleteTaxRate = async (req, res, next) => {
  try { ok(res, await svc.deleteTaxRate(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); }
};

// Purchase Orders
const listPurchaseOrders = async (req, res, next) => {
  try { ok(res, await svc.listPurchaseOrders(req.tenantId)); } catch (e) { next(e); }
};
const getPurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.getPurchaseOrder(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const createPurchaseOrder = async (req, res, next) => {
  try { created(res, await svc.createPurchaseOrder(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updatePurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.updatePurchaseOrder(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const deletePurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.deletePurchaseOrder(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); }
};
const receivePurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.receivePurchaseOrder(req.tenantId, req.params.id, req.body.items || [])); } catch (e) { next(e); }
};

const getAllStockMovements = async (req, res, next) => {
  try { ok(res, await svc.getAllStockMovements(req.tenantId)); } catch (e) { next(e); }
};

const getCategoryReport = async (req, res, next) => {
  try { ok(res, await svc.getCategoryReport(req.tenantId)); } catch (e) { next(e); }
};

const seedStandardCategories = async (req, res, next) => {
  try {
    await svc.seedStandardCategories(req.tenantId);
    ok(res, { seeded: true }, 'Standard categories seeded');
  } catch (e) { next(e); }
};

const deduplicateCategories = async (req, res, next) => {
  try { ok(res, await svc.deduplicateCategories(req.tenantId), 'Duplicates merged'); } catch (e) { next(e); }
};

module.exports = {
  listCategories, createCategory, updateCategory, deleteCategory, getCategoryReport,
  seedStandardCategories, deduplicateCategories,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  adjustStock, getStockMovements, getAllStockMovements, getLowStockProducts, getExpiringProducts,
  listTaxRates, createTaxRate, deleteTaxRate,
  listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder,
  deletePurchaseOrder, receivePurchaseOrder,
};
