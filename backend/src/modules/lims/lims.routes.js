const router = require('express').Router();
const ctrl   = require('./lims.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/categories',                  ctrl.getCategories);
router.get('/stats',                       ctrl.getStats);

// Test catalog
router.get('/tests',                       ctrl.listTests);
router.post('/tests',                      ctrl.createTest);
router.patch('/tests/:id',                 ctrl.updateTest);
router.delete('/tests/:id',               ctrl.deactivateTest);

// Samples
router.get('/samples',                     ctrl.listSamples);
router.post('/samples',                    ctrl.createSample);
router.get('/samples/:id',                 ctrl.getSample);
router.patch('/samples/:id/status',        ctrl.updateSampleStatus);

// Results
router.post('/samples/:sampleId/results',  ctrl.addResult);
router.patch('/results/:resultId',         ctrl.updateResult);
router.delete('/results/:resultId',        ctrl.deleteResult);

module.exports = router;
