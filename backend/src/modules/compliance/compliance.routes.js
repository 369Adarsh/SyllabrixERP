const router = require('express').Router();
const svc = require('./compliance.service');
const { ok } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { authenticateSA, authorizeSA } = require('../superadmin/superadmin.middleware');

// Tenant: view own compliance status + submit KYC
router.get('/my', authenticate, async (req, res, next) => {
  try { ok(res, await svc.getMyStatus(req.tenantId)); } catch (e) { next(e); }
});
router.post('/my/kyc', authenticate, async (req, res, next) => {
  try { ok(res, await svc.submitKyc(req.tenantId, req.body)); } catch (e) { next(e); }
});

// SA routes
router.use('/admin', authenticateSA, authorizeSA('SUPER', 'ADMIN', 'COMPLIANCE'));
router.get('/admin/stats', async (req, res, next) => {
  try { ok(res, await svc.getStats()); } catch (e) { next(e); }
});
router.get('/admin', async (req, res, next) => {
  try {
    const [records, total] = await svc.listAll(req.query);
    ok(res, { records, total });
  } catch (e) { next(e); }
});
router.patch('/admin/:tenantId', async (req, res, next) => {
  try { ok(res, await svc.updateRecord(req.params.tenantId, req.body, req.saAdmin.name || 'Admin')); } catch (e) { next(e); }
});
router.post('/admin/:tenantId/flag', async (req, res, next) => {
  try { ok(res, await svc.addFlag(req.params.tenantId, req.body.flag, req.saAdmin.name || 'Admin')); } catch (e) { next(e); }
});
router.delete('/admin/:tenantId/flag/:flag', async (req, res, next) => {
  try { ok(res, await svc.removeFlag(req.params.tenantId, req.params.flag)); } catch (e) { next(e); }
});

module.exports = router;
