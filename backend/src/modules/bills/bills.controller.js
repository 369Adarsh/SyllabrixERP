const svc = require('./bills.service');
const { ok, created } = require('../../utils/response');

const injectBranch = (req) => {
  const params = { ...req.query };
  if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
  return params;
};

const list    = async (req, res, next) => { try { ok(res, await svc.list(req.tenantId, injectBranch(req))); } catch (e) { next(e); } };
const get     = async (req, res, next) => { try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const create  = async (req, res, next) => {
  const data = { ...req.body };
  if (req.user?.role === 'MANAGER' && req.user.branchId) data.branchId = req.user.branchId;
  try { created(res, await svc.create(req.tenantId, data), 'Bill created'); } catch (e) { next(e); }
};
const pay     = async (req, res, next) => { try { ok(res, await svc.recordPayment(req.tenantId, req.params.id, req.body), 'Payment recorded'); } catch (e) { next(e); } };
const remove  = async (req, res, next) => { try { ok(res, await svc.remove(req.tenantId, req.params.id), 'Bill cancelled'); } catch (e) { next(e); } };
const summary = async (req, res, next) => { try { ok(res, await svc.summary(req.tenantId, injectBranch(req))); } catch (e) { next(e); } };

module.exports = { list, get, create, pay, remove, summary };
