const svc = require('./payroll.service');
const { ok } = require('../../utils/response');

const list    = async (req, res, next) => { try { ok(res, await svc.list(req.tenantId)); } catch (e) { next(e); } };
const get     = async (req, res, next) => { try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const process = async (req, res, next) => { try { ok(res, await svc.processPayroll(req.tenantId, Number(req.body.month), Number(req.body.year)), 'Payroll processed'); } catch (e) { next(e); } };
const markPaid = async (req, res, next) => { try { ok(res, await svc.markPaid(req.tenantId, req.params.id), 'Payroll marked as paid'); } catch (e) { next(e); } };

module.exports = { list, get, process, markPaid };
