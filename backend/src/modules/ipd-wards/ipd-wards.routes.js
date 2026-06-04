const router = require('express').Router();
const ctrl = require('./ipd-wards.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/occupancy',       ctrl.getOccupancy);
router.get('/types',           ctrl.getTypes);
router.get('/',                ctrl.listWards);
router.post('/',               ctrl.createWard);
router.patch('/:id',           ctrl.updateWard);
router.delete('/:id',          ctrl.deleteWard);
router.post('/beds',           ctrl.createBed);
router.patch('/beds/:id/status',ctrl.updateBedStatus);
router.delete('/beds/:id',     ctrl.deleteBed);

module.exports = router;
