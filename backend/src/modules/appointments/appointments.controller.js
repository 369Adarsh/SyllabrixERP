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
  try {
    const result = await svc.list(req.tenantId, req.query);
    ok(res, result);
  } catch (e) { next(e); }
};
const get = async (req, res, next) => {
  try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try {
    const appt = await svc.create(req.tenantId, req.body);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'APPOINTMENT_BOOKED', 'appointments', 'Appointment', appt.id, { customerName: appt.customerName, serviceName: appt.serviceName }, ipAddress);
    created(res, appt);
  } catch (e) { next(e); }
};
const update = async (req, res, next) => {
  try { ok(res, await svc.update(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const updateStatus = async (req, res, next) => {
  try {
    const result = await svc.updateStatus(req.tenantId, req.params.id, req.body.status);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, `APPOINTMENT_${req.body.status}`, 'appointments', 'Appointment', req.params.id, { status: req.body.status }, ipAddress);
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

module.exports = { listServices, createService, updateService, deleteService, list, get, create, update, updateStatus, remove };
