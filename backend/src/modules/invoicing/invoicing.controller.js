const svc = require('./invoicing.service');
const { ok, created } = require('../../utils/response');

const list = async (req, res, next) => {
  try { ok(res, await svc.list(req.tenantId, req.query)); } catch (e) { next(e); }
};
const get = async (req, res, next) => {
  try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try { created(res, await svc.create(req.tenantId, req.body), 'Invoice created'); } catch (e) { next(e); }
};
const updateStatus = async (req, res, next) => {
  try { ok(res, await svc.updateStatus(req.tenantId, req.params.id, req.body.status), 'Status updated'); } catch (e) { next(e); }
};
const recordPayment = async (req, res, next) => {
  try { created(res, await svc.recordPayment(req.tenantId, req.params.id, req.body), 'Payment recorded'); } catch (e) { next(e); }
};
const remove = async (req, res, next) => {
  try { ok(res, await svc.remove(req.tenantId, req.params.id), 'Invoice cancelled'); } catch (e) { next(e); }
};

module.exports = { list, get, create, updateStatus, recordPayment, remove };
