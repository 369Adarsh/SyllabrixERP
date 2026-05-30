const router = require('express').Router();
const svc = require('./announcements.service');
const { ok, created } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { authenticateSA, authorizeSA } = require('../superadmin/superadmin.middleware');

// Tenant: read published announcements for their business type
router.get('/my', authenticate, async (req, res, next) => {
  try { ok(res, await svc.getForTenant(req.tenantId)); } catch (e) { next(e); }
});

// SA: manage announcements
router.use('/admin', authenticateSA, authorizeSA('SUPER', 'ADMIN'));
router.get('/admin', async (req, res, next) => {
  try { ok(res, await svc.list(true)); } catch (e) { next(e); }
});
router.post('/admin', async (req, res, next) => {
  try { created(res, await svc.create(req.body, req.saAdmin.name || 'Admin'), 'Announcement created'); } catch (e) { next(e); }
});
router.put('/admin/:id', async (req, res, next) => {
  try { ok(res, await svc.update(req.params.id, req.body)); } catch (e) { next(e); }
});
router.patch('/admin/:id/publish', async (req, res, next) => {
  try { ok(res, await svc.publish(req.params.id), 'Published'); } catch (e) { next(e); }
});
router.patch('/admin/:id/unpublish', async (req, res, next) => {
  try { ok(res, await svc.unpublish(req.params.id), 'Unpublished'); } catch (e) { next(e); }
});
router.delete('/admin/:id', async (req, res, next) => {
  try { await svc.remove(req.params.id); ok(res, {}, 'Deleted'); } catch (e) { next(e); }
});

module.exports = router;
