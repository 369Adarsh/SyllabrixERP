const svc = require('./staff.service');
const { ok, created } = require('../../utils/response');

const list         = async (req, res, next) => {
  try {
    const params = { ...req.query };
    if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
    ok(res, await svc.list(req.tenantId, params));
  } catch (e) { next(e); }
};
const get          = async (req, res, next) => { try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const create       = async (req, res, next) => { try { created(res, await svc.create(req.tenantId, req.body)); } catch (e) { next(e); } };
const update       = async (req, res, next) => { try { ok(res, await svc.update(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const remove       = async (req, res, next) => { try { ok(res, await svc.remove(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); } };
const toggleActive = async (req, res, next) => { try { ok(res, await svc.toggleActive(req.tenantId, req.params.id)); } catch (e) { next(e); } };

module.exports = { list, get, create, update, remove, toggleActive };
