const router = require('express').Router();
const prisma = require('../../config/prisma');
const svc = require('./campaigns.service');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const data = await svc.list(req.tenantId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/preview', async (req, res, next) => {
  try {
    const data = await svc.previewSegment(req.tenantId, req.query.segment || 'ALL');
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// Returns customers matching a segment (must be before /:id routes)
router.get('/segment-customers', authenticate, async (req, res, next) => {
  try {
    const customers = await svc.resolveSegment(req.tenantId, req.query.segment || 'ALL');
    res.json({ success: true, data: customers.filter(c => c?.phone) });
  } catch (e) { next(e); }
});

router.post('/', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const data = await svc.create(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/:id/send', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const data = await svc.send(req.tenantId, req.params.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.delete('/:id', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    await svc.remove(req.tenantId, req.params.id);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (e) { next(e); }
});

// Returns personalised recipient list for a campaign — used by frontend wa.me broadcast
router.get('/:id/recipients', authenticate, async (req, res, next) => {
  try {
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: { tenant: true },
    });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    const customers = await svc.resolveSegment(req.tenantId, campaign.segment);
    const recipients = customers
      .filter(c => c?.phone)
      .map(c => ({
        id: c.id, name: c.name, phone: c.phone,
        message: svc.personalizeMessage(campaign.message, c, campaign.tenant?.name),
      }));
    res.json({ success: true, data: { campaign, recipients } });
  } catch (e) { next(e); }
});

// Mark campaign as sent after frontend broadcast completes
router.patch('/:id/mark-sent', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const data = await svc.markSent(req.tenantId, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

module.exports = router;
