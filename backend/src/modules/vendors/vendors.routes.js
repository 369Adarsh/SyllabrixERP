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

// Vendor catalog
router.get('/vendors/:vendorId/catalog', ctrl.listVendorCatalog);
router.post('/vendors/:vendorId/catalog', authorize('OWNER', 'ADMIN'), ctrl.addCatalogItem);
router.put('/vendors/catalog/:id', authorize('OWNER', 'ADMIN'), ctrl.updateCatalogItem);
router.delete('/vendors/catalog/:id', authorize('OWNER', 'ADMIN'), ctrl.deleteCatalogItem);

// Reorder suggestions
router.get('/reorder-suggestions', ctrl.getReorderSuggestions);

// Purchase Orders
router.get('/purchase-orders', ctrl.listPurchaseOrders);
router.get('/purchase-orders/:id', ctrl.getPurchaseOrder);
router.post('/purchase-orders', authorize('OWNER', 'ADMIN'), ctrl.createPurchaseOrder);
router.post('/purchase-orders/:id/receive', authorize('OWNER', 'ADMIN'), ctrl.receivePurchaseOrder);
router.patch('/purchase-orders/:id/cancel', authorize('OWNER', 'ADMIN'), ctrl.cancelPurchaseOrder);

// Goods Receipt Notes
router.get('/grns', ctrl.listGRNs);
router.get('/grns/:id', ctrl.getGRN);
router.post('/grns', authorize('OWNER', 'ADMIN'), ctrl.createGRN);
router.post('/grns/:id/confirm', authorize('OWNER', 'ADMIN'), ctrl.confirmGRN);
router.get('/grns/:id/variance', ctrl.getVarianceSummary);

module.exports = router;
