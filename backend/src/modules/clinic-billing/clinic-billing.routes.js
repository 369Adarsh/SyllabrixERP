const router = require('express').Router();
const ctrl = require('./clinic-billing.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/procedures',    ctrl.getProcedures);
router.get('/day-end',       ctrl.dayEndSummary);
router.get('/outstanding',   ctrl.getOutstanding);
router.get('/pnl',           ctrl.getPnL);
router.get('/',              ctrl.listBills);
router.get('/:id',           ctrl.getBillById);
router.post('/',             ctrl.createBill);
router.patch('/:id',         ctrl.updateBill);
router.delete('/:id',        ctrl.deleteBill);

module.exports = router;
