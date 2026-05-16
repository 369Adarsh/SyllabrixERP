const router = require('express').Router();
const ctrl = require('./vendors.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

// Vendors
router.get('/vendors', ctrl.listVendors);
router.get('/vendors/:id', ctrl.getVendor);
router.post('/vendors', authorize('OWNER', 'ADMIN'), ctrl.createVendor);
router.put('/vendors/:id', authorize('OWNER', 'ADMIN'), ctrl.updateVendor);
router.delete('/vendors/:id', authorize('OWNER', 'ADMIN'), ctrl.deleteVendor);

// Purchase Orders
router.get('/purchase-orders', ctrl.listPurchaseOrders);
router.get('/purchase-orders/:id', ctrl.getPurchaseOrder);
router.post('/purchase-orders', authorize('OWNER', 'ADMIN'), ctrl.createPurchaseOrder);
router.patch('/purchase-orders/:id/receive', authorize('OWNER', 'ADMIN'), ctrl.receivePurchaseOrder);
router.patch('/purchase-orders/:id/cancel', authorize('OWNER', 'ADMIN'), ctrl.cancelPurchaseOrder);

module.exports = router;
