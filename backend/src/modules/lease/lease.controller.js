const svc = require('./lease.service');
const { ok, created } = require('../../utils/response');

const listUnits = async (req, res, next) => {
  try { ok(res, await svc.listUnits(req.tenantId)); } catch (e) { next(e); }
};
const createUnit = async (req, res, next) => {
  try { created(res, await svc.createUnit(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updateUnit = async (req, res, next) => {
  try { ok(res, await svc.updateUnit(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const listLeases = async (req, res, next) => {
  try { ok(res, await svc.listLeases(req.tenantId, req.query)); } catch (e) { next(e); }
};
const getLease = async (req, res, next) => {
  try { ok(res, await svc.getLease(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const createLease = async (req, res, next) => {
  try { created(res, await svc.createLease(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updateLease = async (req, res, next) => {
  try { ok(res, await svc.updateLease(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const terminateLease = async (req, res, next) => {
  try { ok(res, await svc.terminateLease(req.tenantId, req.params.id), 'Lease terminated'); } catch (e) { next(e); }
};
const getRentDue = async (req, res, next) => {
  try { ok(res, await svc.getRentDue(req.tenantId)); } catch (e) { next(e); }
};

module.exports = { listUnits, createUnit, updateUnit, listLeases, getLease, createLease, updateLease, terminateLease, getRentDue };
