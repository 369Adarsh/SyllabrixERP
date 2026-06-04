const router = require('express').Router();
const ctrl   = require('./ipd-admissions.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

// Census
router.get('/census', ctrl.getCensus);

// Admissions CRUD
router.get('/',           ctrl.listAdmissions);
router.post('/',          ctrl.createAdmission);
router.get('/:id',        ctrl.getAdmission);
router.patch('/:id',      ctrl.updateAdmission);
router.delete('/:id',     ctrl.deleteAdmission);

// Progress Notes (Module 19)
router.post('/:admId/progress-notes',           ctrl.addProgressNote);
router.patch('/progress-notes/:noteId',         ctrl.updateProgressNote);
router.delete('/progress-notes/:noteId',        ctrl.deleteProgressNote);

// Nursing Charts / MAR (Module 20)
router.post('/:admId/nursing-charts',           ctrl.addNursingChart);
router.delete('/nursing-charts/:chartId',       ctrl.deleteNursingChart);

module.exports = router;
