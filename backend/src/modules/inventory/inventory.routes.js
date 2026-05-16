const router = require('express').Router();
const ctrl = require('./inventory.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

router.get('/categories', ctrl.listCategories);
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

router.get('/tax-rates', ctrl.listTaxRates);
router.post('/tax-rates', authorize('OWNER', 'ADMIN'), ctrl.createTaxRate);
router.delete('/tax-rates/:id', authorize('OWNER'), ctrl.deleteTaxRate);

module.exports = router;
