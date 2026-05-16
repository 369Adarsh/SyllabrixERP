const svc = require('./attendance.service');
const { ok, created } = require('../../utils/response');

const getToday      = async (req, res, next) => { try { ok(res, await svc.today(req.tenantId)); } catch (e) { next(e); } };
const punchIn       = async (req, res, next) => { try { created(res, await svc.punch(req.tenantId, req.body.staffId, 'IN',  req.body.method, req.body.notes)); } catch (e) { next(e); } };
const punchOut      = async (req, res, next) => { try { created(res, await svc.punch(req.tenantId, req.body.staffId, 'OUT', req.body.method, req.body.notes)); } catch (e) { next(e); } };
const getReport     = async (req, res, next) => { try { ok(res, await svc.report(req.tenantId, req.query.from, req.query.to, req.query.staffId)); } catch (e) { next(e); } };
const getSummary    = async (req, res, next) => { try { ok(res, await svc.summary(req.tenantId, req.query.from, req.query.to)); } catch (e) { next(e); } };

// Called by biometric hardware — no JWT, uses tenantId in body
const devicePunch   = async (req, res, next) => {
  try {
    const { tenantId, biometricId, punchType, punchTime, deviceId } = req.body;
    const log = await svc.devicePunch(tenantId, biometricId, punchType, punchTime, deviceId);
    ok(res, log, 'Punch recorded');
  } catch (e) { next(e); }
};

module.exports = { getToday, punchIn, punchOut, getReport, getSummary, devicePunch };
