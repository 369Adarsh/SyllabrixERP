const svc = require('./inventory.service');
const { ok, created } = require('../../utils/response');

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
  try { ok(res, await svc.listProducts(req.tenantId, req.query)); } catch (e) { next(e); }
};
const getProduct = async (req, res, next) => {
  try { ok(res, await svc.getProduct(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const createProduct = async (req, res, next) => {
  try { created(res, await svc.createProduct(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updateProduct = async (req, res, next) => {
  try { ok(res, await svc.updateProduct(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const deleteProduct = async (req, res, next) => {
  try { ok(res, await svc.deleteProduct(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); }
};

// Stock
const adjustStock = async (req, res, next) => {
  try { ok(res, await svc.adjustStock(req.tenantId, req.params.id, req.body), 'Stock adjusted'); } catch (e) { next(e); }
};
const getStockMovements = async (req, res, next) => {
  try { ok(res, await svc.getStockMovements(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const getLowStockProducts = async (req, res, next) => {
  try { ok(res, await svc.getLowStockProducts(req.tenantId)); } catch (e) { next(e); }
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

module.exports = {
  listCategories, createCategory, updateCategory, deleteCategory,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  adjustStock, getStockMovements, getLowStockProducts,
  listTaxRates, createTaxRate, deleteTaxRate,
};
