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

module.exports = { dashboard, salesReport, invoiceReport, topProducts, topCustomers };
