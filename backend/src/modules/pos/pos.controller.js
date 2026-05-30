const svc = require('./pos.service');
const { ok, created } = require('../../utils/response');
const activity = require('../activity/activity.service');

const createSale = async (req, res, next) => {
  try {
    const sale = await svc.createSale(req.tenantId, req.body);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'SALE_COMPLETED', 'pos', 'Sale', sale.id, { total: sale.total, itemCount: sale.items?.length }, ipAddress);
    created(res, sale, 'Sale recorded');
  } catch (e) { next(e); }
};
const listTransactions = async (req, res, next) => {
  try {
    const params = { ...req.query };
    if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
    ok(res, await svc.listTransactions(req.tenantId, params));
  } catch (e) { next(e); }
};
const getTransaction = async (req, res, next) => {
  try { ok(res, await svc.getTransaction(req.tenantId, req.params.id)); } catch (e) { next(e); }
};

module.exports = { createSale, listTransactions, getTransaction };
