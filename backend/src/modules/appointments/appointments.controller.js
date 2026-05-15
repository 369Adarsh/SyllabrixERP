const svc = require('./appointments.service');
const { ok, created } = require('../../utils/response');

const listServices = async (req, res, next) => {
  try { ok(res, await svc.listServices(req.tenantId)); } catch (e) { next(e); }
};
const createService = async (req, res, next) => {
  try { created(res, await svc.createService(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updateService = async (req, res, next) => {
  try { ok(res, await svc.updateService(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const deleteService = async (req, res, next) => {
  try { ok(res, await svc.deleteService(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); }
};
const list = async (req, res, next) => {
  try { ok(res, await svc.list(req.tenantId, req.query)); } catch (e) { next(e); }
};
const get = async (req, res, next) => {
  try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try { created(res, await svc.create(req.tenantId, req.body)); } catch (e) { next(e); }
};
const update = async (req, res, next) => {
  try { ok(res, await svc.update(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const updateStatus = async (req, res, next) => {
  try { ok(res, await svc.updateStatus(req.tenantId, req.params.id, req.body.status)); } catch (e) { next(e); }
};
const remove = async (req, res, next) => {
  try { ok(res, await svc.remove(req.tenantId, req.params.id), 'Cancelled'); } catch (e) { next(e); }
};

module.exports = { listServices, createService, updateService, deleteService, list, get, create, update, updateStatus, remove };
