const router = require('express').Router();
const ctrl = require('./clinic-reports.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/daily-opd',         ctrl.dailyOPD);
router.get('/monthly-revenue',   ctrl.monthlyRevenue);
router.get('/patient-growth',    ctrl.patientGrowth);
router.get('/diagnosis-freq',    ctrl.diagnosisFreq);
router.get('/doctor-performance',ctrl.doctorPerformance);
router.get('/opd-trend',         ctrl.opdTrend);

module.exports = router;
