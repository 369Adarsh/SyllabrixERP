const svc = require('./stockTransfer.service');
const { ok, created } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const params = { ...req.query };
    // Managers only see transfers involving their branch (as sender or receiver)
    if (req.user?.role === 'MANAGER' && req.user.branchId) params.involvesBranchId = req.user.branchId;
    ok(res, await svc.listTransfers(req.tenantId, params));
  } catch (e) { next(e); }
};
const get        = async (req, res, next) => { try { ok(res, await svc.getTransfer(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const create     = async (req, res, next) => { try { created(res, await svc.createTransfer(req.tenantId, req.body, req.user.id), 'Transfer requested'); } catch (e) { next(e); } };
const approve    = async (req, res, next) => { try { ok(res, await svc.approveTransfer(req.tenantId, req.params.id, req.user.id)); } catch (e) { next(e); } };
const inTransit  = async (req, res, next) => { try { ok(res, await svc.markInTransit(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const receive    = async (req, res, next) => { try { ok(res, await svc.receiveTransfer(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const cancel     = async (req, res, next) => { try { ok(res, await svc.cancelTransfer(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const suggestion = async (req, res, next) => { try { ok(res, await svc.getSurplusSuggestion(req.tenantId, req.query.productId, Number(req.query.qty || 1))); } catch (e) { next(e); } };

module.exports = { list, get, create, approve, inTransit, receive, cancel, suggestion };
