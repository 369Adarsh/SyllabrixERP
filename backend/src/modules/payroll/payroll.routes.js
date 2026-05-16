const router = require('express').Router();
const ctrl = require('./payroll.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/process', authorize('OWNER', 'ADMIN'), ctrl.process);
router.patch('/:id/paid', authorize('OWNER', 'ADMIN'), ctrl.markPaid);

module.exports = router;
