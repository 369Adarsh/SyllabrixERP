const svc = require('./appointments.service');
const { ok, created } = require('../../utils/response');
const activity = require('../activity/activity.service');

const listServices = async (req, res, next) => {
  try { ok(res, await svc.listServices(req.tenantId)); } catch (e) { next(e); }
};
const createService = async (req, res, next) => {
  try { created(res, await svc.createService(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updateService = async (req, res, next) => {
  try { ok(res, await svc.updateService(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const deleteService = async (req, res, next) => {
  try { ok(res, await svc.deleteService(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); }
};

const list = async (req, res, next) => {
  try { ok(res, await svc.list(req.tenantId, req.query)); } catch (e) { next(e); }
};
const get = async (req, res, next) => {
  try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { recurring, ...data } = req.body;

    // If recurring is provided, create multiple appointments
    if (recurring?.frequency && recurring?.count > 1) {
      const results = await svc.createRecurring(req.tenantId, data, recurring);
      const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
      activity.log(tenantId, userId, userName, userRole, 'APPOINTMENT_RECURRING_CREATED', 'appointments', 'Appointment', null,
        { count: results.created.length, skipped: results.skipped.length, frequency: recurring.frequency }, ipAddress);
      return ok(res, results);
    }

    const appt = await svc.create(req.tenantId, data);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'APPOINTMENT_BOOKED', 'appointments', 'Appointment', appt.id,
      { customerName: appt.customer?.name, serviceName: appt.service?.name }, ipAddress);
    created(res, appt);
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try { ok(res, await svc.update(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};

const reschedule = async (req, res, next) => {
  try {
    const result = await svc.reschedule(req.tenantId, req.params.id, req.body);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'APPOINTMENT_RESCHEDULED', 'appointments', 'Appointment', req.params.id,
      { date: req.body.date, time: req.body.time }, ipAddress);
    ok(res, result);
  } catch (e) { next(e); }
};

const updateStatus = async (req, res, next) => {
  try {
    const result = await svc.updateStatus(req.tenantId, req.params.id, req.body.status);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, `APPOINTMENT_${req.body.status}`, 'appointments', 'Appointment', req.params.id,
      { status: req.body.status }, ipAddress);
    ok(res, result);
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const result = await svc.remove(req.tenantId, req.params.id);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'APPOINTMENT_CANCELLED', 'appointments', 'Appointment', req.params.id, null, ipAddress);
    ok(res, result, 'Cancelled');
  } catch (e) { next(e); }
};

module.exports = { listServices, createService, updateService, deleteService, list, get, create, update, reschedule, updateStatus, remove };
