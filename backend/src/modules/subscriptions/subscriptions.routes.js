const router = require('express').Router({ mergeParams: true });
const svc = require('./subscriptions.service');
const waSvc = require('../whatsapp/whatsapp.service');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

// GET /customers/:customerId/subscriptions
router.get('/', async (req, res, next) => {
  try {
    const data = await svc.list(req.tenantId, req.params.customerId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// POST /customers/:customerId/subscriptions
router.post('/', async (req, res, next) => {
  try {
    const data = await svc.create(req.tenantId, req.params.customerId, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

// PATCH /customers/:customerId/subscriptions/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const data = await svc.updateStatus(req.tenantId, req.params.id, req.body.status);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// POST /customers/:customerId/subscriptions/:id/remind — send WhatsApp renewal reminder
router.post('/:id/remind', async (req, res, next) => {
  try {
    const prisma = require('../../config/prisma');
    const sub = await prisma.customerSubscription.findUnique({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: { customer: true, tenant: true },
    });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });
    if (!sub.customer?.phone) return res.status(400).json({ success: false, message: 'Customer has no phone number' });

    const expiry = new Date(sub.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const daysLeft = Math.ceil((new Date(sub.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    const urgent = daysLeft <= 3 ? '⚠️ *URGENT*: ' : '';
    const body = `${urgent}Hi ${sub.customer.name},\n\nYour *${sub.planName}* subscription with ${sub.tenant.name} expires on *${expiry}* (${daysLeft > 0 ? `${daysLeft} days left` : 'already expired'}).\n\nTo renew and continue enjoying our services, please contact us:\n📞 ${sub.tenant.phone}\n\nThank you! 🙏`;

    await waSvc.sendText(req.tenantId, sub.customer.phone, body, sub.customer.name);
    res.json({ success: true, message: 'Reminder sent' });
  } catch (e) { next(e); }
});

// DELETE /customers/:customerId/subscriptions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await svc.remove(req.tenantId, req.params.id);
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
