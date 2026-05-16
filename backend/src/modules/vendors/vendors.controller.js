const svc = require('./vendors.service');
const { ok, created } = require('../../utils/response');

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
  try { ok(res, await svc.listPurchaseOrders(req.tenantId, req.query)); } catch (e) { next(e); }
};
const getPurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.getPurchaseOrder(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const createPurchaseOrder = async (req, res, next) => {
  try { created(res, await svc.createPurchaseOrder(req.tenantId, req.body)); } catch (e) { next(e); }
};
const receivePurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.receivePurchaseOrder(req.tenantId, req.params.id), 'Stock updated'); } catch (e) { next(e); }
};
const cancelPurchaseOrder = async (req, res, next) => {
  try { ok(res, await svc.cancelPurchaseOrder(req.tenantId, req.params.id), 'Cancelled'); } catch (e) { next(e); }
};

module.exports = {
  listVendors, getVendor, createVendor, updateVendor, deleteVendor,
  listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
};
