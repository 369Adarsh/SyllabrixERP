const router = require('express').Router();
const ctrl = require('./quotations.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.patch('/:id/status', ctrl.status);
router.post('/:id/convert', ctrl.convert);

module.exports = router;
