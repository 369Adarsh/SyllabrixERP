const svc = require('./expenses.service');
const { ok, created } = require('../../utils/response');

const list    = async (req, res, next) => { try { ok(res, await svc.list(req.tenantId, req.query)); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { created(res, await svc.create(req.tenantId, req.body)); } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { ok(res, await svc.update(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const remove  = async (req, res, next) => { try { ok(res, await svc.remove(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); } };
const summary = async (req, res, next) => { try { ok(res, await svc.summary(req.tenantId, req.query)); } catch (e) { next(e); } };

module.exports = { list, create, update, remove, summary };
