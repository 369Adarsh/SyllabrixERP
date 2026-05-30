const router = require('express').Router();
const ctrl = require('./reports.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/dashboard',      ctrl.dashboard);
router.get('/sales',          ctrl.salesReport);
router.get('/invoices',       ctrl.invoiceReport);
router.get('/top-products',   ctrl.topProducts);
router.get('/top-customers',  ctrl.topCustomers);
router.get('/pl',             ctrl.profitLoss);
router.get('/balance-sheet',  ctrl.balanceSheet);
router.get('/cash-flow',      ctrl.cashFlow);
router.get('/gstr1',          ctrl.gstr1);
router.get('/gstr3b',         ctrl.gstr3b);
router.get('/tds',            ctrl.tdsReport);
router.get('/cash-book',      ctrl.cashBook);
router.get('/creditor-aging', ctrl.creditorAging);
router.get('/demand-trends',  ctrl.demandTrends);

module.exports = router;
