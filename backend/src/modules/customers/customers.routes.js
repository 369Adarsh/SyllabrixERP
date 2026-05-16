const router = require('express').Router();
const svc = require('./customers.service');
const subscriptionRoutes = require('../subscriptions/subscriptions.routes');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const data = await svc.list(req.tenantId, { search: req.query.search });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await svc.getProfile(req.tenantId, req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await svc.create(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = await svc.update(req.tenantId, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.patch('/:id/credit', async (req, res, next) => {
  try {
    const { amount, operation } = req.body;
    const data = await svc.adjustCredit(req.tenantId, req.params.id, amount, operation);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.remove(req.tenantId, req.params.id);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (e) { next(e); }
});

// Nested subscriptions
router.use('/:customerId/subscriptions', subscriptionRoutes);

module.exports = router;
