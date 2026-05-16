const router = require('express').Router();
const ctrl = require('./expenses.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/summary', ctrl.summary);
router.post('/', authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.create);
router.put('/:id', authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.update);
router.delete('/:id', authorize('OWNER', 'ADMIN'), ctrl.remove);

module.exports = router;
