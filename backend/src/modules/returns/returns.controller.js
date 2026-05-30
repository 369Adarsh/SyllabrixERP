const svc = require('./returns.service');
const { ok, created } = require('../../utils/response');

const injectBranch = (req) => {
  const params = { ...req.query };
  if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
  return params;
};

const list    = async (req, res, next) => { try { ok(res, await svc.list(req.tenantId, injectBranch(req))); } catch (e) { next(e); } };
const summary = async (req, res, next) => { try { ok(res, await svc.summary(req.tenantId, injectBranch(req))); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { created(res, await svc.create(req.tenantId, req.body)); } catch (e) { next(e); } };

const lookupInvoice = async (req, res, next) => {
  try { ok(res, await svc.getInvoiceItems(req.tenantId, req.params.invoiceNumber)); } catch (e) { next(e); }
};
const lookupTransaction = async (req, res, next) => {
  try { ok(res, await svc.getTransactionItems(req.tenantId, req.params.receiptNumber)); } catch (e) { next(e); }
};

module.exports = { list, summary, create, lookupInvoice, lookupTransaction };
