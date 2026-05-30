const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const c = require('./roles.controller');

router.use(authenticate);

router.get('/',                         c.list);
router.get('/:id',                      c.get);
router.post('/',        authorize('OWNER', 'ADMIN'), c.create);
router.put('/:id',      authorize('OWNER', 'ADMIN'), c.update);
router.delete('/:id',   authorize('OWNER', 'ADMIN'), c.remove);
router.put('/assign/:userId', authorize('OWNER', 'ADMIN'), c.assignToUser);

module.exports = router;
