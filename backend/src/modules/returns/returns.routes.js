const router = require('express').Router();
const ctrl   = require('./returns.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/',                              ctrl.list);
router.get('/summary',                       ctrl.summary);
router.get('/lookup/invoice/:invoiceNumber', ctrl.lookupInvoice);
router.get('/lookup/receipt/:receiptNumber', ctrl.lookupTransaction);
router.post('/', authorize('OWNER', 'ADMIN', 'MANAGER', 'CASHIER'), ctrl.create);

module.exports = router;
