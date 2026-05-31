const router = require('express').Router();
const ctrl = require('./receipts.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.post('/backfill',       ctrl.backfill);
router.post('/',               ctrl.create);
router.get('/',                ctrl.list);
router.get('/summary',         ctrl.summary);
router.patch('/:id/payment',   ctrl.updatePayment);

module.exports = router;
