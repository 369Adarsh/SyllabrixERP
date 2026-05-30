const router = require('express').Router();
const ctrl = require('./fees.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/students', ctrl.listStudents);
router.get('/students/:id', ctrl.getStudent);
router.post('/students', ctrl.createStudent);
router.put('/students/:id', ctrl.updateStudent);

router.get('/', ctrl.listFees);
router.get('/overdue', ctrl.getOverdueFees);
router.post('/', authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.createFee);
router.put('/:id', authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.updateFee);
router.post('/:id/collect', ctrl.collectFee);
router.patch('/:id/waive', authorize('OWNER', 'ADMIN'), ctrl.waiveFee);

module.exports = router;
