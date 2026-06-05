const router = require('express').Router();
const ctrl = require('./lab-orders.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

// Test catalog (no :id param clash)
router.get('/tests/search',   ctrl.testSearch);
router.get('/tests/catalog',  ctrl.testCatalog);

// Lab centers
router.get('/centers',        ctrl.listCenters);
router.post('/centers',       ctrl.upsertCenter);
router.delete('/centers/:id', ctrl.deleteCenter);

// Reports
router.post('/reports',          ctrl.addReport);
router.patch('/reports/:id/viewed', ctrl.markReportViewed);
router.delete('/reports/:id',    ctrl.deleteReport);

// Orders
router.get('/',     ctrl.listOrders);
router.get('/:id',  ctrl.getOrderById);
router.post('/',    ctrl.createOrder);
router.patch('/:id', ctrl.updateOrder);
router.delete('/:id', ctrl.deleteOrder);

module.exports = router;
