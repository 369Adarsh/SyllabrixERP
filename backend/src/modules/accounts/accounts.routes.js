const router = require('express').Router();
const ctrl = require('./accounts.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/balance', ctrl.balance);
router.get('/', ctrl.list);
router.post('/', authorize('OWNER', 'ADMIN'), ctrl.create);
router.put('/:id', authorize('OWNER', 'ADMIN'), ctrl.update);
router.delete('/:id', authorize('OWNER'), ctrl.remove);
router.get('/:id/transactions', ctrl.txns);
router.post('/:id/transactions', ctrl.addTxn);

module.exports = router;
