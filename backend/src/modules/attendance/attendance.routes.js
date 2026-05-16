const router = require('express').Router();
const ctrl = require('./attendance.controller');
const { authenticate } = require('../../middleware/auth');

// Public — biometric device push (ZKTeco / FingerJet)
router.post('/device-punch', ctrl.devicePunch);

// Authenticated
router.use(authenticate);
router.get('/today',   ctrl.getToday);
router.post('/in',     ctrl.punchIn);
router.post('/out',    ctrl.punchOut);
router.get('/report',  ctrl.getReport);
router.get('/summary', ctrl.getSummary);

module.exports = router;
