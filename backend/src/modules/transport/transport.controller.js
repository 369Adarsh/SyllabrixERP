const svc = require('./transport.service');
const { ok } = require('../../utils/response');

const adminName = (req) => req.saAdmin?.name || req.saAdmin?.email || 'Admin';

const getStats        = async (req, res, next) => { try { ok(res, await svc.getStats()); } catch (e) { next(e); } };
const list            = async (req, res, next) => { try { ok(res, await svc.list(req.query)); } catch (e) { next(e); } };
const getOne          = async (req, res, next) => { try { ok(res, await svc.get(req.params.id)); } catch (e) { next(e); } };
const create          = async (req, res, next) => { try { ok(res, await svc.create(req.body, adminName(req))); } catch (e) { next(e); } };
const update          = async (req, res, next) => { try { ok(res, await svc.update(req.params.id, req.body)); } catch (e) { next(e); } };
const approve         = async (req, res, next) => { try { ok(res, await svc.approve(req.params.id, adminName(req))); } catch (e) { next(e); } };
const promote         = async (req, res, next) => { try { ok(res, await svc.promote(req.params.id, adminName(req), req.body.notes)); } catch (e) { next(e); } };
const rollback        = async (req, res, next) => { try { ok(res, await svc.rollback(req.params.id, req.body.reason, adminName(req))); } catch (e) { next(e); } };
const toggleScopeLock = async (req, res, next) => { try { ok(res, await svc.toggleScopeLock(req.params.id, adminName(req))); } catch (e) { next(e); } };
const addComment      = async (req, res, next) => { try { ok(res, await svc.addComment(req.params.id, req.body.body, adminName(req))); } catch (e) { next(e); } };
const addTestScenario = async (req, res, next) => { try { ok(res, await svc.addTestScenario(req.params.id, req.body)); } catch (e) { next(e); } };
const updateTestResult= async (req, res, next) => { try { ok(res, await svc.updateTestResult(req.params.scenarioId, req.body, adminName(req))); } catch (e) { next(e); } };
const getEnvironments = async (req, res, next) => { try { ok(res, await svc.getEnvironments()); } catch (e) { next(e); } };

module.exports = {
  getStats, list, getOne, create, approve, update,
  promote, rollback, toggleScopeLock,
  addComment, addTestScenario, updateTestResult,
  getEnvironments,
};
