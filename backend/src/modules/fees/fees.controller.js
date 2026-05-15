const svc = require('./fees.service');
const { ok, created } = require('../../utils/response');

const listStudents = async (req, res, next) => {
  try { ok(res, await svc.listStudents(req.tenantId, req.query)); } catch (e) { next(e); }
};
const getStudent = async (req, res, next) => {
  try { ok(res, await svc.getStudent(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const createStudent = async (req, res, next) => {
  try { created(res, await svc.createStudent(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updateStudent = async (req, res, next) => {
  try { ok(res, await svc.updateStudent(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const listFees = async (req, res, next) => {
  try { ok(res, await svc.listFees(req.tenantId, req.query)); } catch (e) { next(e); }
};
const createFee = async (req, res, next) => {
  try { created(res, await svc.createFee(req.tenantId, req.body)); } catch (e) { next(e); }
};
const collectFee = async (req, res, next) => {
  try { ok(res, await svc.collectFee(req.tenantId, req.params.id, req.body), 'Fee collected'); } catch (e) { next(e); }
};
const waiveFee = async (req, res, next) => {
  try { ok(res, await svc.waiveFee(req.tenantId, req.params.id, req.body.notes), 'Fee waived'); } catch (e) { next(e); }
};
const getOverdueFees = async (req, res, next) => {
  try { ok(res, await svc.getOverdueFees(req.tenantId)); } catch (e) { next(e); }
};

module.exports = { listStudents, getStudent, createStudent, updateStudent, listFees, createFee, collectFee, waiveFee, getOverdueFees };
