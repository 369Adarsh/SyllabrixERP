const svc = require('./reports.service');
const { ok } = require('../../utils/response');

const h = (fn) => async (req, res, next) => {
  try {
    const params = { ...req.query };
    if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
    ok(res, await fn(req.tenantId, params));
  } catch (e) { next(e); }
};
const hNoQuery = h; // unified — always pass query params (branchId support)

module.exports = {
  dashboard:      h(svc.dashboard),
  salesReport:    h(svc.salesReport),
  invoiceReport:  h(svc.invoiceReport),
  topProducts:    h(svc.topProducts),
  topCustomers:   h(svc.topCustomers),
  profitLoss:     h(svc.profitLoss),
  balanceSheet:   hNoQuery(svc.balanceSheet),
  cashFlow:       h(svc.cashFlow),
  gstr1:          h(svc.gstr1),
  gstr3b:         h(svc.gstr3b),
  tdsReport:      h(svc.tdsReport),
  cashBook:       h(svc.cashBook),
  creditorAging:  hNoQuery(svc.creditorAging),
  demandTrends:   h(svc.demandTrends),
};
