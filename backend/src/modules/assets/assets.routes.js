const router = require('express').Router();
const ctrl = require('./assets.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

// Summary
router.get('/summary', ctrl.getSummary);

// Categories
router.get('/categories', ctrl.listCategories);
router.post('/categories', authorize('OWNER', 'ADMIN'), ctrl.createCategory);
router.put('/categories/:id', authorize('OWNER', 'ADMIN'), ctrl.updateCategory);
router.delete('/categories/:id', authorize('OWNER', 'ADMIN'), ctrl.deleteCategory);

// Assets
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.create);
router.put('/:id', authorize('OWNER', 'ADMIN', 'ACCOUNTANT'), ctrl.update);
router.patch('/:id/dispose', authorize('OWNER', 'ADMIN'), ctrl.dispose);
router.delete('/:id', authorize('OWNER', 'ADMIN'), ctrl.remove);

// Maintenance
router.get('/:id/maintenance', ctrl.getMaintenanceLogs);
router.post('/:id/maintenance', authorize('OWNER', 'ADMIN', 'STAFF'), ctrl.logMaintenance);

module.exports = router;
