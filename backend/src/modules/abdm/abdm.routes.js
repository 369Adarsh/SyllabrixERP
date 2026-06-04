const router = require('express').Router();
const ctrl = require('./abdm.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/config',                    ctrl.getConfig);
router.post('/config',                   ctrl.saveConfig);
router.get('/stats',                     ctrl.getAbhaStats);
router.get('/patients/no-abha',          ctrl.getPatientsNoAbha);
router.patch('/patients/:patientId/abha',ctrl.updatePatientAbha);
router.get('/health-records/queue',      ctrl.getHealthRecordQueue);

module.exports = router;
