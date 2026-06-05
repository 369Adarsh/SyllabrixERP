const router = require('express').Router();
const ctrl = require('./prescriptions.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/drugs/search',  ctrl.drugSearch);
router.post('/ai-suggest',   ctrl.aiRxSuggest);
router.get('/',              ctrl.list);
router.get('/:id',           ctrl.getById);
router.post('/',             ctrl.create);
router.patch('/:id',         ctrl.update);
router.delete('/:id',        ctrl.remove);

module.exports = router;
