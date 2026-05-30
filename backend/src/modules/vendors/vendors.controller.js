const svc = require('./vendors.service');
const grnSvc = require('./grn.service');
const { ok, created } = require('../../utils/response');

const injectBranch = (req) => {
  const params = { ...req.query };
  if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
  return params;
};

const listVendors = async (req, res, next) => {
  try { ok(res, await svc.listVendors(req.tenantId, req.query)); } catch (e) { next(e); }
};
const getVendor = async (req, res, next) => {
  try { ok(res, await svc.getVendor(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const createVendor = async (req, res, next) => {
  try { created(res, await svc.createVendor(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updateVendor = async (req, res, next) => {
  try { ok(res, await svc.updateVendor(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const deleteVendor = async (req, res, next) => {
  try { ok(res, await svc.deleteVendor(req.tenantId, req.params.id), 'Vendor deactivated'); } catch (e) { next(e); }
};
const listPurchaseOrders = async (req, res, next) => {
  try { ok(res, await svc.listPurchaseOrders(req.tenantId, injectBranch(req))); } catch (e) { next(e); }
};
const getPurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.getPurchaseOrder(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const createPurchaseOrder = async (req, res, next) => {
  const data = { ...req.body };
  if (req.user?.role === 'MANAGER' && req.user.branchId) data.branchId = req.user.branchId;
  try { created(res, await svc.createPurchaseOrder(req.tenantId, data)); } catch (e) { next(e); }
};
const receivePurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.receivePurchaseOrder(req.tenantId, req.params.id, req.body.items || []), 'Stock updated'); } catch (e) { next(e); }
};
const cancelPurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.cancelPurchaseOrder(req.tenantId, req.params.id), 'Cancelled'); } catch (e) { next(e); }
};

// Vendor catalog
const listVendorCatalog = async (req, res, next) => {
  try { ok(res, await svc.listVendorCatalog(req.tenantId, req.params.vendorId)); } catch (e) { next(e); }
};
const addCatalogItem = async (req, res, next) => {
  try { created(res, await svc.addCatalogItem(req.tenantId, req.params.vendorId, req.body)); } catch (e) { next(e); }
};
const updateCatalogItem = async (req, res, next) => {
  try { ok(res, await svc.updateCatalogItem(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const deleteCatalogItem = async (req, res, next) => {
  try { ok(res, await svc.deleteCatalogItem(req.tenantId, req.params.id), 'Removed'); } catch (e) { next(e); }
};
const getReorderSuggestions = async (req, res, next) => {
  try { ok(res, await svc.getReorderSuggestions(req.tenantId)); } catch (e) { next(e); }
};

// GRN controllers
const listGRNs = async (req, res, next) => {
  try { ok(res, await grnSvc.listGRNs(req.tenantId, injectBranch(req))); } catch (e) { next(e); }
};
const getGRN = async (req, res, next) => {
  try { ok(res, await grnSvc.getGRN(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const createGRN = async (req, res, next) => {
  try { created(res, await grnSvc.createGRN(req.tenantId, req.body.poId), 'GRN created'); } catch (e) { next(e); }
};
const confirmGRN = async (req, res, next) => {
  try { ok(res, await grnSvc.confirmGRN(req.tenantId, req.params.id, req.body), 'GRN confirmed — stock updated'); } catch (e) { next(e); }
};
const getVarianceSummary = async (req, res, next) => {
  try { ok(res, await grnSvc.getVarianceSummary(req.tenantId, req.params.id)); } catch (e) { next(e); }
};

module.exports = {
  listVendors, getVendor, createVendor, updateVendor, deleteVendor,
  listVendorCatalog, addCatalogItem, updateCatalogItem, deleteCatalogItem,
  getReorderSuggestions,
  listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
  listGRNs, getGRN, createGRN, confirmGRN, getVarianceSummary,
};
