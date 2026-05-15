const router = require('express').Router();
const ctrl = require('./lease.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/units', ctrl.listUnits);
router.post('/units', authorize('OWNER', 'ADMIN'), ctrl.createUnit);
router.put('/units/:id', authorize('OWNER', 'ADMIN'), ctrl.updateUnit);

router.get('/', ctrl.listLeases);
router.get('/rent-due', ctrl.getRentDue);
router.get('/:id', ctrl.getLease);
router.post('/', authorize('OWNER', 'ADMIN'), ctrl.createLease);
router.put('/:id', authorize('OWNER', 'ADMIN'), ctrl.updateLease);
router.patch('/:id/terminate', authorize('OWNER'), ctrl.terminateLease);

module.exports = router;
