const router = require('express').Router();
const ctrl = require('./ai.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { aiLimiter } = require('../../middleware/rateLimiter');

router.use(authenticate);

// Copilot
router.post('/chat',    aiLimiter,                   ctrl.chat);
router.get('/insights', aiLimiter,                   ctrl.getInsights);

// Code Auditor
router.get('/audit/modules',                         ctrl.modules);
router.get('/audit/page-modules',                    ctrl.pageModules);
router.post('/audit', authorize('OWNER', 'ADMIN'),   ctrl.audit);

// Diagnostic reports (any authenticated user can submit, OWNER/ADMIN can view theirs)
router.post('/reports',                              ctrl.submitReport);
router.get('/reports/mine',                          ctrl.myReports);

module.exports = router;
