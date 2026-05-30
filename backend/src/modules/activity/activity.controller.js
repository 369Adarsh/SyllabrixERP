const svc = require('./activity.service');
const { ok } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    ok(res, await svc.getActivity(req.query));
  } catch (e) { next(e); }
};

const moduleSummary = async (req, res, next) => {
  try {
    ok(res, await svc.getModuleSummary(req.query.tenantId));
  } catch (e) { next(e); }
};

const activeTenants = async (req, res, next) => {
  try {
    ok(res, await svc.getActiveTenants(Number(req.query.hours) || 24));
  } catch (e) { next(e); }
};

module.exports = { list, moduleSummary, activeTenants };
