const router = require('express').Router();
const ctrl = require('./invoicing.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.patch('/:id/status', authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.updateStatus);
router.post('/:id/payments', ctrl.recordPayment);
router.delete('/:id', authorize('OWNER', 'ADMIN'), ctrl.remove);

module.exports = router;
