const router = require('express').Router();
const ctrl = require('./appointments.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/services', ctrl.listServices);
router.post('/services', authorize('OWNER', 'ADMIN'), ctrl.createService);
router.put('/services/:id', authorize('OWNER', 'ADMIN'), ctrl.updateService);
router.delete('/services/:id', authorize('OWNER', 'ADMIN'), ctrl.deleteService);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.updateStatus);
router.delete('/:id', ctrl.remove);

module.exports = router;
