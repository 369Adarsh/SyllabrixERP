const svc = require('./clinic-reports.service');
const ok = (res, data) => res.json(data);
const err = (res, e) => res.status(e.statusCode || 500).json({ error: e.message });

const dailyOPD          = async (req, res) => { try { ok(res, await svc.dailyOPD(req.tenantId, req.query.date)); } catch (e) { err(res, e); } };
const monthlyRevenue    = async (req, res) => { try { ok(res, await svc.monthlyRevenue(req.tenantId)); } catch (e) { err(res, e); } };
const patientGrowth     = async (req, res) => { try { ok(res, await svc.patientGrowth(req.tenantId)); } catch (e) { err(res, e); } };
const diagnosisFreq     = async (req, res) => { try { ok(res, await svc.diagnosisFrequency(req.tenantId)); } catch (e) { err(res, e); } };
const doctorPerformance = async (req, res) => { try { ok(res, await svc.doctorPerformance(req.tenantId, req.query.period)); } catch (e) { err(res, e); } };
const opdTrend          = async (req, res) => { try { ok(res, await svc.opdTrend(req.tenantId)); } catch (e) { err(res, e); } };

module.exports = { dailyOPD, monthlyRevenue, patientGrowth, diagnosisFreq, doctorPerformance, opdTrend };
