const svc = require('./quotations.service');
const { ok, created } = require('../../utils/response');

const list    = async (req, res, next) => {
  try {
    const params = { ...req.query };
    if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
    ok(res, await svc.list(req.tenantId, params));
  } catch (e) { next(e); }
};
const get     = async (req, res, next) => { try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { created(res, await svc.create(req.tenantId, req.body), 'Quotation created'); } catch (e) { next(e); } };
const status  = async (req, res, next) => { try { ok(res, await svc.updateStatus(req.tenantId, req.params.id, req.body.status)); } catch (e) { next(e); } };
const convert = async (req, res, next) => { try { created(res, await svc.convertToInvoice(req.tenantId, req.params.id), 'Invoice created from quotation'); } catch (e) { next(e); } };

module.exports = { list, get, create, status, convert };
