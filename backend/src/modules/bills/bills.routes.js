const router = require('express').Router();
const ctrl = require('./bills.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/summary', ctrl.summary);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.post('/:id/pay', ctrl.pay);
router.delete('/:id', authorize('OWNER', 'ADMIN'), ctrl.remove);

module.exports = router;
