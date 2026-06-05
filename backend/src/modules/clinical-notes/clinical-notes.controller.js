const svc = require('./clinical-notes.service');

const byAppointment = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getByAppointment(req.tenantId, req.params.appointmentId) }); }
  catch (e) { next(e); }
};

const patientHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    res.json({ success: true, data: await svc.getPatientHistory(req.tenantId, req.params.customerId, limit) });
  } catch (e) { next(e); }
};

const save = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.upsert(req.tenantId, req.body) }); }
  catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try { await svc.remove(req.tenantId, req.params.id); res.json({ success: true }); }
  catch (e) { next(e); }
};

module.exports = { byAppointment, patientHistory, save, remove };
