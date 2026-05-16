const router = require('express').Router();
const ctrl = require('./reports.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/dashboard', ctrl.dashboard);
router.get('/sales', ctrl.salesReport);
router.get('/invoices', ctrl.invoiceReport);
router.get('/top-products', ctrl.topProducts);
router.get('/top-customers', ctrl.topCustomers);
router.get('/pl', ctrl.profitLoss);
router.get('/cash-flow', ctrl.cashFlow);
router.get('/gstr1', ctrl.gstr1);

module.exports = router;
