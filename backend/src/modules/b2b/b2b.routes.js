const router = require('express').Router();
const ctrl = require('./b2b.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

// My Display Catalog — what I publish as a supplier/dealer
router.get('/display-catalog', ctrl.getMyDisplayCatalog);
router.post('/display-catalog', authorize('OWNER', 'ADMIN'), ctrl.addDisplayCatalogItem);
router.put('/display-catalog/:id', authorize('OWNER', 'ADMIN'), ctrl.updateDisplayCatalogItem);
router.delete('/display-catalog/:id', authorize('OWNER', 'ADMIN'), ctrl.deleteDisplayCatalogItem);

// Supplier discovery
router.get('/suppliers/search', ctrl.searchSuppliers);
router.get('/suppliers/local', ctrl.getLocalSuppliers);
router.get('/suppliers/:supplierTenantId/profile', ctrl.getSupplierProfile);
router.get('/suppliers/:supplierTenantId/catalog', ctrl.getSupplierCatalog);
router.get('/suppliers/:supplierTenantId/ratings', ctrl.getSupplierRatings);

// Partnerships
router.get('/partnerships', ctrl.getMyPartnerships);
router.post('/partnerships', authorize('OWNER', 'ADMIN'), ctrl.sendPartnerRequest);
router.patch('/partnerships/:id/respond', authorize('OWNER', 'ADMIN'), ctrl.respondToPartnerRequest);
router.patch('/partnerships/:id/terms', authorize('OWNER', 'ADMIN'), ctrl.setPartnershipTerms);

// Ratings
router.post('/ratings/:targetTenantId', authorize('OWNER', 'ADMIN'), ctrl.ratePartner);

// Price negotiations
router.get('/negotiations', ctrl.getMyNegotiations);
router.post('/negotiations', ctrl.requestBestPrice);
router.patch('/negotiations/:id/respond', ctrl.respondToNegotiation);

module.exports = router;
