const router = require('express').Router();
const ctrl   = require('./radiology.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/meta',       ctrl.getMeta);
router.get('/worklist',   ctrl.getWorklist);
router.get('/stats',      ctrl.getStats);
router.get('/',           ctrl.list);
router.post('/',          ctrl.create);
router.get('/:id',        ctrl.getById);
router.patch('/:id',      ctrl.update);
router.delete('/:id',     ctrl.remove);

module.exports = router;
