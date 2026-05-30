const router = require('express').Router();
const ctrl = require('./rolerequests.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

// Tenant routes — owner/admin only
router.get('/', authorize('OWNER', 'ADMIN'), ctrl.list);
router.post('/', authorize('OWNER', 'ADMIN'), ctrl.create);

// Syllabrix super-admin routes (protected by OWNER role of any tenant for now;
// in production these would sit behind a separate super-admin auth layer)
router.get('/admin/all', authorize('OWNER'), ctrl.listAll);
router.patch('/admin/:id/status', authorize('OWNER'), ctrl.updateStatus);

module.exports = router;
