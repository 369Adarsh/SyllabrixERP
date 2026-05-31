const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = require('express').Router();
const ctrl = require('./superadmin.controller');
const { authenticateSA, authorizeSA } = require('./superadmin.middleware');
const featureCtrl = require('../features/features.controller');
const helpCtrl = require('../help/help.controller');

// ── Landing photo upload ────────────────────────────────────────────────────
const landingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/landing');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `landing-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const LANDING_ALLOWED_EXTS  = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const LANDING_ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const landingUpload = multer({
  storage: landingStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!LANDING_ALLOWED_EXTS.includes(ext) || !LANDING_ALLOWED_MIMES.includes(file.mimetype))
      return cb(Object.assign(new Error('Only JPG, PNG, WebP or GIF allowed'), { statusCode: 400 }));
    cb(null, true);
  },
});

// Public — no auth
router.post('/auth/login', ctrl.login);
router.get('/landing-photos/public', ctrl.getActiveLandingPhotos);

// All routes below require SA token
router.use(authenticateSA);

router.get('/auth/me', ctrl.getMe);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Tenant management
router.get('/tenants', authorizeSA('SUPER', 'ADMIN', 'SUPPORT', 'COMPLIANCE'), ctrl.listTenants);
router.get('/tenants/:id', authorizeSA('SUPER', 'ADMIN', 'SUPPORT', 'COMPLIANCE'), ctrl.getTenant);
router.patch('/tenants/:id/toggle', authorizeSA('SUPER', 'ADMIN'), ctrl.toggleTenant);
router.patch('/tenants/:id/plan', authorizeSA('SUPER', 'ADMIN'), ctrl.changePlan);
router.post('/tenants/:id/notes', authorizeSA('SUPER', 'ADMIN', 'SUPPORT', 'COMPLIANCE'), ctrl.addNote);
router.delete('/tenants/:id/terminate', authorizeSA('SUPER'), ctrl.terminateTenant);

// Role requests
router.get('/role-requests', authorizeSA('SUPER', 'ADMIN'), ctrl.listRoleRequests);
router.patch('/role-requests/:id', authorizeSA('SUPER', 'ADMIN'), ctrl.resolveRoleRequest);

// Audit logs
router.get('/audit-logs', authorizeSA('SUPER', 'ADMIN'), ctrl.getAuditLogs);

// Admin management — SUPER only
router.get('/admins', authorizeSA('SUPER'), ctrl.listAdmins);
router.post('/admins', authorizeSA('SUPER'), ctrl.createAdmin);

// Diagnostic audit reports — platform support console
router.get('/audit-reports',                authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.listAuditReports);
router.patch('/audit-reports/:reportId',    authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.patchAuditReport);

// Growth Wing
router.get('/revenue',     authorizeSA('SUPER', 'ADMIN'), ctrl.getRevenue);
router.get('/plans',       authorizeSA('SUPER', 'ADMIN'), ctrl.getPlansOverview);
router.get('/onboarding',  authorizeSA('SUPER', 'ADMIN', 'COMPLIANCE'), ctrl.getOnboardingPipeline);

// Platform Control — Feature Flags
router.get('/feature-flags',                                    authorizeSA('SUPER', 'ADMIN'), ctrl.getFeatureFlags);
router.patch('/feature-flags/:moduleKey',                       authorizeSA('SUPER'), ctrl.toggleFeatureFlag);
router.get('/feature-flags/tenant/:tenantId',                   authorizeSA('SUPER', 'ADMIN'), ctrl.getTenantModules);
router.patch('/feature-flags/tenant/:tenantId/:moduleKey',      authorizeSA('SUPER', 'ADMIN'), ctrl.setTenantModule);

// Platform Control — Module Usage
router.get('/module-usage', authorizeSA('SUPER', 'ADMIN'), ctrl.getModuleUsage);

// Intelligence Wing
router.get('/analytics',    authorizeSA('SUPER', 'ADMIN'), ctrl.getPlatformAnalytics);
router.get('/errors',       authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getErrorLogs);

// Platform Health
router.get('/health',       authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getPlatformHealth);

// Maintenance Mode
router.get('/maintenance',              authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getMaintenanceWindows);
router.get('/maintenance/active',       authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), ctrl.getActiveMaintenance);
router.post('/maintenance',             authorizeSA('SUPER', 'ADMIN'), ctrl.scheduleMaintenance);
router.patch('/maintenance/:id/activate', authorizeSA('SUPER', 'ADMIN'), ctrl.activateMaintenance);
router.patch('/maintenance/:id/cancel',   authorizeSA('SUPER', 'ADMIN'), ctrl.cancelMaintenance);

// Subscriptions
router.get('/subscriptions', authorizeSA('SUPER', 'ADMIN'), ctrl.getSubscriptions);

// Plan Builder
router.get('/plan-builder/plans',              authorizeSA('SUPER', 'ADMIN'), ctrl.getManagedPlans);
router.post('/plan-builder/plans',             authorizeSA('SUPER'), ctrl.createManagedPlan);
router.patch('/plan-builder/plans/:id',        authorizeSA('SUPER', 'ADMIN'), ctrl.updateManagedPlan);
router.patch('/plan-builder/plans/:id/toggle', authorizeSA('SUPER'), ctrl.toggleManagedPlan);
router.delete('/plan-builder/plans/:id',       authorizeSA('SUPER'), ctrl.deleteManagedPlan);

router.get('/plan-builder/offers',             authorizeSA('SUPER', 'ADMIN'), ctrl.getManagedOffers);
router.post('/plan-builder/offers',            authorizeSA('SUPER', 'ADMIN'), ctrl.createManagedOffer);
router.patch('/plan-builder/offers/:id',       authorizeSA('SUPER', 'ADMIN'), ctrl.updateManagedOffer);
router.delete('/plan-builder/offers/:id',      authorizeSA('SUPER'), ctrl.deleteManagedOffer);

// Feature Catalog Management
router.get('/features/adoption',              authorizeSA('SUPER', 'ADMIN'), featureCtrl.ncGetAdoption);
router.get('/features',                       authorizeSA('SUPER', 'ADMIN'), featureCtrl.ncListFeatures);
router.post('/features',                      authorizeSA('SUPER'), featureCtrl.ncCreateFeature);
router.patch('/features/:featureKey/toggle',  authorizeSA('SUPER', 'ADMIN'), featureCtrl.ncToggleFeature);
router.patch('/features/:featureKey',         authorizeSA('SUPER', 'ADMIN'), featureCtrl.ncUpdateFeature);

// Platform Settings (API Keys)
router.get('/settings',           authorizeSA('SUPER', 'ADMIN'), ctrl.getSettings);
router.put('/settings',           authorizeSA('SUPER', 'ADMIN'), ctrl.saveSettings);
router.post('/settings/test-key', authorizeSA('SUPER', 'ADMIN'), ctrl.testApiKey);

// ── Nerve Center RBAC ─────────────────────────────────────────────────────────
// Roles
router.get('/nc-roles',              authorizeSA('ADMIN', 'R'), ctrl.listNcRoles);
router.post('/nc-roles',             authorizeSA('ADMIN', 'C'), ctrl.createNcRole);
router.patch('/nc-roles/:id',        authorizeSA('ADMIN', 'U'), ctrl.updateNcRole);
router.delete('/nc-roles/:id',       authorizeSA('ADMIN', 'D'), ctrl.deleteNcRole);
router.patch('/nc-roles/:id/assign', authorizeSA('ADMIN', 'U'), ctrl.assignNcRole);

// Grants
router.get('/nc-grants/:adminId',    authorizeSA('ADMIN', 'R'), ctrl.listGrants);
router.post('/nc-grants/:adminId',   authorizeSA('ADMIN', 'C'), ctrl.createGrant);
router.delete('/nc-grants/:grantId/revoke', authorizeSA('ADMIN', 'U'), ctrl.revokeGrant);

// My permissions (any authenticated admin can call this)
router.get('/nc-my-permissions',     ctrl.getMyPermissions);

// ── Module Help / Knowledge Base ─────────────────────────────────────────────
router.get('/help/:moduleKey',         authorizeSA('SUPER', 'ADMIN', 'SUPPORT'), helpCtrl.getForModule);
router.put('/help/:moduleKey/:lang',   authorizeSA('SUPER', 'ADMIN'), helpCtrl.upsert);
router.delete('/help/:moduleKey/:lang',authorizeSA('SUPER', 'ADMIN'), helpCtrl.remove);

// ── Demo Seed (quality/staging only) ─────────────────────────────────────────
router.post('/seed-demo', authorizeSA('SUPER', 'ADMIN'), async (req, res) => {
  const config = require('../../config/env');
  if (config.nodeEnv !== 'quality') {
    return res.status(403).json({ success: false, message: 'Seed endpoint only available in quality environment.' });
  }
  try {
    const { seedIronZone } = require('../../../prisma/seed-gym-full');
    await seedIronZone();
    res.json({ success: true, message: 'Iron Zone Fitness demo data seeded successfully. Login: owner@ironzone.test / Test@1234' });
  } catch (err) {
    console.error('[SEED-DEMO]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Seed Diagnostic (quality only) ────────────────────────────────────────────
router.get('/seed-check', authorizeSA('SUPER', 'ADMIN'), async (req, res) => {
  const config = require('../../config/env');
  if (config.nodeEnv !== 'quality') {
    return res.status(403).json({ success: false, message: 'Diagnostic only available in quality environment.' });
  }
  try {
    const prisma = require('../../config/prisma');
    const tenant = await prisma.tenant.findUnique({
      where: { email: 'owner@ironzone.test' },
      include: { users: { where: { email: 'owner@ironzone.test' } } },
    });
    res.json({
      success: true,
      data: {
        tenantExists: !!tenant,
        tenantId: tenant?.id,
        userExists: (tenant?.users?.length || 0) > 0,
        userIsVerified: tenant?.users?.[0]?.isEmailVerified,
        userRole: tenant?.users?.[0]?.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Landing Page CMS ──────────────────────────────────────────────────────────
router.get('/landing-photos',              authorizeSA('SUPER', 'ADMIN'), ctrl.listLandingPhotos);
router.post('/landing-photos',             authorizeSA('SUPER', 'ADMIN'), landingUpload.single('photo'), ctrl.createLandingPhoto);
router.patch('/landing-photos/reorder',    authorizeSA('SUPER', 'ADMIN'), ctrl.reorderLandingPhotos);
router.patch('/landing-photos/:id',        authorizeSA('SUPER', 'ADMIN'), ctrl.updateLandingPhoto);
router.delete('/landing-photos/:id',       authorizeSA('SUPER', 'ADMIN'), ctrl.deleteLandingPhoto);

module.exports = router;
