const router = require('express').Router();
const ctrl = require('./pos.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);
router.post('/sale', ctrl.createSale);
router.get('/transactions', ctrl.listTransactions);
router.get('/transactions/:id', ctrl.getTransaction);

module.exports = router;
