const svc = require('./reports.service');
const { ok } = require('../../utils/response');

const dashboard = async (req, res, next) => {
  try { ok(res, await svc.dashboard(req.tenantId)); } catch (e) { next(e); }
};
const salesReport = async (req, res, next) => {
  try { ok(res, await svc.salesReport(req.tenantId, req.query)); } catch (e) { next(e); }
};
const invoiceReport = async (req, res, next) => {
  try { ok(res, await svc.invoiceReport(req.tenantId, req.query)); } catch (e) { next(e); }
};
const topProducts = async (req, res, next) => {
  try { ok(res, await svc.topProducts(req.tenantId, req.query)); } catch (e) { next(e); }
};
const topCustomers = async (req, res, next) => {
  try { ok(res, await svc.topCustomers(req.tenantId, req.query)); } catch (e) { next(e); }
};

const profitLoss = async (req, res, next) => {
  try { ok(res, await svc.profitLoss(req.tenantId, req.query)); } catch (e) { next(e); }
};
const cashFlow = async (req, res, next) => {
  try { ok(res, await svc.cashFlow(req.tenantId, req.query)); } catch (e) { next(e); }
};
const gstr1 = async (req, res, next) => {
  try { ok(res, await svc.gstr1(req.tenantId, req.query)); } catch (e) { next(e); }
};

module.exports = { dashboard, salesReport, invoiceReport, topProducts, topCustomers, profitLoss, cashFlow, gstr1 };
