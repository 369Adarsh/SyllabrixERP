const svc = require('./rolerequests.service');
const { ok, created } = require('../../utils/response');

const list = async (req, res, next) => {
  try { ok(res, await svc.list(req.tenantId)); } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try { created(res, await svc.create(req.tenantId, req.body), 'Role request submitted'); } catch (e) { next(e); }
};

// Syllabrix super-admin endpoints
const listAll = async (req, res, next) => {
  try { ok(res, await svc.listAll()); } catch (e) { next(e); }
};

const updateStatus = async (req, res, next) => {
  try { ok(res, await svc.updateStatus(req.params.id, req.body), 'Status updated'); } catch (e) { next(e); }
};

module.exports = { list, create, listAll, updateStatus };
