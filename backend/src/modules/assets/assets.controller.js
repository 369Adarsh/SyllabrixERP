const svc = require('./assets.service');
const { ok, created } = require('../../utils/response');

const listCategories   = async (req, res, next) => { try { ok(res, await svc.listCategories(req.tenantId)); } catch (e) { next(e); } };
const createCategory   = async (req, res, next) => { try { created(res, await svc.createCategory(req.tenantId, req.body)); } catch (e) { next(e); } };
const updateCategory   = async (req, res, next) => { try { ok(res, await svc.updateCategory(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const deleteCategory   = async (req, res, next) => { try { ok(res, await svc.deleteCategory(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); } };

const list             = async (req, res, next) => { try { ok(res, await svc.list(req.tenantId, req.query)); } catch (e) { next(e); } };
const get              = async (req, res, next) => { try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const create           = async (req, res, next) => { try { created(res, await svc.create(req.tenantId, req.body)); } catch (e) { next(e); } };
const update           = async (req, res, next) => { try { ok(res, await svc.update(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const dispose          = async (req, res, next) => { try { ok(res, await svc.dispose(req.tenantId, req.params.id, req.body), 'Asset disposed'); } catch (e) { next(e); } };
const remove           = async (req, res, next) => { try { ok(res, await svc.remove(req.tenantId, req.params.id), 'Deleted'); } catch (e) { next(e); } };
const logMaintenance   = async (req, res, next) => { try { created(res, await svc.logMaintenance(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const getMaintenanceLogs = async (req, res, next) => { try { ok(res, await svc.getMaintenanceLogs(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const getSummary       = async (req, res, next) => { try { ok(res, await svc.summary(req.tenantId)); } catch (e) { next(e); } };

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, list, get, create, update, dispose, remove, logMaintenance, getMaintenanceLogs, getSummary };
