const router = require('express').Router();
const ctrl   = require('./stockTransfer.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/',                     ctrl.list);
router.post('/',                    ctrl.create);
router.get('/suggest',              ctrl.suggestion);
router.get('/:id',                  ctrl.get);
router.patch('/:id/approve',        ctrl.approve);
router.patch('/:id/in-transit',     ctrl.inTransit);
router.patch('/:id/receive',        ctrl.receive);
router.patch('/:id/cancel',         ctrl.cancel);

module.exports = router;
