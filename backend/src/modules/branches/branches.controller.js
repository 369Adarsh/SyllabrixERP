const svc = require('./branches.service');
const { ok, created } = require('../../utils/response');

const list    = async (req, res, next) => { try { ok(res, await svc.listBranches(req.tenantId)); } catch (e) { next(e); } };
const get     = async (req, res, next) => { try { ok(res, await svc.getBranch(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { created(res, await svc.createBranch(req.tenantId, req.body), 'Branch created'); } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { ok(res, await svc.updateBranch(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const toggle  = async (req, res, next) => { try { ok(res, await svc.toggleBranch(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const network = async (req, res, next) => { try { ok(res, await svc.getStockNetwork(req.tenantId)); } catch (e) { next(e); } };

module.exports = { list, get, create, update, toggle, network };
