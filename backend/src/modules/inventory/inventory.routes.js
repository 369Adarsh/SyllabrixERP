const router = require('express').Router();
const ctrl = require('./inventory.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

router.get('/categories', ctrl.listCategories);
router.get('/categories/report', ctrl.getCategoryReport);
router.post('/categories/seed-standard', authorize('OWNER', 'ADMIN'), ctrl.seedStandardCategories);
router.post('/categories/deduplicate', authorize('OWNER', 'ADMIN'), ctrl.deduplicateCategories);
router.post('/categories', authorize('OWNER', 'ADMIN'), ctrl.createCategory);
router.put('/categories/:id', authorize('OWNER', 'ADMIN'), ctrl.updateCategory);
router.delete('/categories/:id', authorize('OWNER', 'ADMIN'), ctrl.deleteCategory);

router.get('/products', ctrl.listProducts);
router.get('/products/low-stock', ctrl.getLowStockProducts);
router.get('/products/expiring', ctrl.getExpiringProducts);
router.get('/products/:id', ctrl.getProduct);
router.post('/products', authorize('OWNER', 'ADMIN'), ctrl.createProduct);
router.put('/products/:id', authorize('OWNER', 'ADMIN'), ctrl.updateProduct);
router.delete('/products/:id', authorize('OWNER', 'ADMIN'), ctrl.deleteProduct);
router.post('/products/:id/stock', authorize('OWNER', 'ADMIN'), ctrl.adjustStock);
router.get('/products/:id/movements', ctrl.getStockMovements);
router.get('/movements', ctrl.getAllStockMovements);

router.get('/tax-rates', ctrl.listTaxRates);
router.post('/tax-rates', authorize('OWNER', 'ADMIN'), ctrl.createTaxRate);
router.delete('/tax-rates/:id', authorize('OWNER'), ctrl.deleteTaxRate);

// Purchase Orders
router.get('/purchase-orders', ctrl.listPurchaseOrders);
router.get('/purchase-orders/:id', ctrl.getPurchaseOrder);
router.post('/purchase-orders', authorize('OWNER', 'ADMIN'), ctrl.createPurchaseOrder);
router.put('/purchase-orders/:id', authorize('OWNER', 'ADMIN'), ctrl.updatePurchaseOrder);
router.delete('/purchase-orders/:id', authorize('OWNER', 'ADMIN'), ctrl.deletePurchaseOrder);
router.post('/purchase-orders/:id/receive', authorize('OWNER', 'ADMIN'), ctrl.receivePurchaseOrder);

module.exports = router;
