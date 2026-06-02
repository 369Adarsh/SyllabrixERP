const router = require('express').Router();
const ctrl = require('./clinic-doctors.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/staff', ctrl.getAllStaff);
router.get('/', ctrl.listDoctors);
router.get('/:staffId/profile', ctrl.getProfileByStaff);
router.post('/:staffId/profile', ctrl.upsertProfile);

module.exports = router;
