const router = require('express').Router();
const ctrl = require('./opd-queue.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/stats', ctrl.stats);
router.get('/',      ctrl.list);
router.post('/',     ctrl.assign);

router.patch('/:id/call',     ctrl.call);
router.patch('/:id/start',    ctrl.start);
router.patch('/:id/complete', ctrl.complete);
router.patch('/:id/skip',     ctrl.skip);
router.patch('/:id/requeue',  ctrl.requeue);

module.exports = router;
