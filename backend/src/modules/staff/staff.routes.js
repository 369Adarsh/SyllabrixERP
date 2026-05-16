const router = require('express').Router();
const ctrl = require('./staff.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/',             ctrl.list);
router.get('/:id',          ctrl.get);
router.post('/',            authorize('OWNER', 'ADMIN'), ctrl.create);
router.put('/:id',          authorize('OWNER', 'ADMIN'), ctrl.update);
router.delete('/:id',       authorize('OWNER', 'ADMIN'), ctrl.remove);
router.patch('/:id/toggle', authorize('OWNER', 'ADMIN'), ctrl.toggleActive);

module.exports = router;
