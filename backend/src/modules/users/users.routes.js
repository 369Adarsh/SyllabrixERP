const router = require('express').Router();
const ctrl = require('./users.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', authorize('OWNER', 'ADMIN'), ctrl.list);
router.post('/', authorize('OWNER', 'ADMIN'), ctrl.create);
router.put('/:id', authorize('OWNER', 'ADMIN'), ctrl.update);
router.delete('/:id', authorize('OWNER'), ctrl.remove);
router.post('/change-password', ctrl.changePassword);

module.exports = router;
