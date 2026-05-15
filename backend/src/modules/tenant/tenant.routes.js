const router = require('express').Router();
const ctrl = require('./tenant.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/profile', ctrl.getProfile);
router.put('/profile', authorize('OWNER', 'ADMIN'), ctrl.updateProfile);
router.get('/modules', ctrl.getModules);
router.patch('/modules', authorize('OWNER'), ctrl.toggleModule);
router.get('/stats', ctrl.getStats);

module.exports = router;
