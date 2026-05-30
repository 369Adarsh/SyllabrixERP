const router = require('express').Router();
const ctrl   = require('./branches.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/',              ctrl.list);
router.post('/',             ctrl.create);
router.get('/stock-network', ctrl.network);
router.get('/:id',           ctrl.get);
router.put('/:id',           ctrl.update);
router.patch('/:id/toggle',  ctrl.toggle);

module.exports = router;
