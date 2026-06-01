const svc = require('./vitals.service');

const record = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.recordVitals(req.tenantId, req.body) }); }
  catch (e) { next(e); }
};

const byAppointment = async (req, res, next) => {
  try {
    const data = await svc.getByAppointment(req.tenantId, req.params.appointmentId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const byPatient = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    res.json({ success: true, data: await svc.getByPatient(req.tenantId, req.params.customerId, limit) });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try { await svc.remove(req.tenantId, req.params.id); res.json({ success: true }); }
  catch (e) { next(e); }
};

module.exports = { record, byAppointment, byPatient, remove };
