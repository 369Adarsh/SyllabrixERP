const svc = require('./pos.service');
const { ok, created } = require('../../utils/response');

const createSale = async (req, res, next) => {
  try { created(res, await svc.createSale(req.tenantId, req.body), 'Sale recorded'); } catch (e) { next(e); }
};
const listTransactions = async (req, res, next) => {
  try { ok(res, await svc.listTransactions(req.tenantId, req.query)); } catch (e) { next(e); }
};
const getTransaction = async (req, res, next) => {
  try { ok(res, await svc.getTransaction(req.tenantId, req.params.id)); } catch (e) { next(e); }
};

module.exports = { createSale, listTransactions, getTransaction };
