const svc = require('./progress.service');
const { ok, created } = require('../../utils/response');

const listHomework      = async (req, res, next) => { try { ok(res, await svc.listHomework(req.tenantId, req.query)); } catch (e) { next(e); } };
const createHomework    = async (req, res, next) => { try { created(res, await svc.createHomework(req.tenantId, req.body)); } catch (e) { next(e); } };
const deleteHomework    = async (req, res, next) => { try { ok(res, await svc.deleteHomework(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const updateSubmission  = async (req, res, next) => { try { ok(res, await svc.updateSubmission(req.tenantId, req.params.hwId, req.params.studentId, req.body)); } catch (e) { next(e); } };
const bulkSubmissions   = async (req, res, next) => { try { ok(res, await svc.bulkUpdateSubmissions(req.tenantId, req.params.hwId, req.body.updates)); } catch (e) { next(e); } };
const listTeachingLogs  = async (req, res, next) => { try { ok(res, await svc.listTeachingLogs(req.tenantId, req.query)); } catch (e) { next(e); } };
const createTeachingLog = async (req, res, next) => { try { created(res, await svc.createTeachingLog(req.tenantId, req.body)); } catch (e) { next(e); } };
const deleteTeachingLog = async (req, res, next) => { try { ok(res, await svc.deleteTeachingLog(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const studentProgress   = async (req, res, next) => { try { ok(res, await svc.getStudentProgress(req.tenantId)); } catch (e) { next(e); } };

const listExams         = async (req, res, next) => { try { ok(res, await svc.listExams(req.tenantId)); } catch (e) { next(e); } };
const createExam        = async (req, res, next) => { try { created(res, await svc.createExam(req.tenantId, req.body)); } catch (e) { next(e); } };
const updateExam        = async (req, res, next) => { try { ok(res, await svc.updateExam(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const deleteExam        = async (req, res, next) => { try { ok(res, await svc.deleteExam(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const upsertStudentPrep = async (req, res, next) => { try { ok(res, await svc.upsertStudentPrep(req.tenantId, req.params.examId, req.params.studentId, req.body)); } catch (e) { next(e); } };

module.exports = {
  listHomework, createHomework, deleteHomework, updateSubmission, bulkSubmissions,
  listTeachingLogs, createTeachingLog, deleteTeachingLog,
  studentProgress,
  listExams, createExam, updateExam, deleteExam, upsertStudentPrep,
};
