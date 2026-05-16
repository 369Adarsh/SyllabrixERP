const router = require('express').Router();
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

module.exports = router;
