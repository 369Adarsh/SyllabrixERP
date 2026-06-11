const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const ctrl = require('./freelancer.controller');

router.use(authenticate);

// ── Jobs ──────────────────────────────────────────────────────────────────────
router.post  ('/jobs',                  ctrl.createJob);
router.get   ('/jobs',                  ctrl.listJobs);
router.get   ('/jobs/:id',              ctrl.getJob);
router.put   ('/jobs/:id',              ctrl.updateJob);
router.patch ('/jobs/:id/status',       ctrl.updateJobStatus);
router.delete('/jobs/:id',              ctrl.deleteJob);

// ── Estimates ─────────────────────────────────────────────────────────────────
router.post  ('/jobs/:id/estimate',     ctrl.saveEstimate);
router.get   ('/jobs/:id/estimate',     ctrl.getEstimate);

// ── Materials ─────────────────────────────────────────────────────────────────
router.post  ('/jobs/:id/materials',    ctrl.addMaterial);
router.get   ('/jobs/:id/materials',    ctrl.listMaterials);
router.delete('/jobs/:id/materials/:mid', ctrl.deleteMaterial);

// ── Payments ─────────────────────────────────────────────────────────────────
router.post  ('/jobs/:id/payments',     ctrl.recordPayment);
router.get   ('/jobs/:id/payments',     ctrl.listPayments);

// ── Helpers ───────────────────────────────────────────────────────────────────
router.post  ('/helpers',               ctrl.createHelper);
router.get   ('/helpers',               ctrl.listHelpers);
router.post  ('/jobs/:id/helpers',      ctrl.assignHelper);
router.patch ('/jobs/:id/helpers/:hid', ctrl.updateJobHelper);

// ── Partners ──────────────────────────────────────────────────────────────────
router.post  ('/partners',              ctrl.createPartner);
router.get   ('/partners',              ctrl.listPartners);

// ── Clients ───────────────────────────────────────────────────────────────────
router.post  ('/clients',               ctrl.createClient);
router.get   ('/clients',               ctrl.listClients);
router.get   ('/clients/:id',           ctrl.getClient);
router.put   ('/clients/:id',           ctrl.updateClient);

// ── Expenses ──────────────────────────────────────────────────────────────────
router.post  ('/expenses',              ctrl.createExpense);
router.get   ('/expenses',              ctrl.listExpenses);
router.delete('/expenses/:id',          ctrl.deleteExpense);

// ── Suppliers ─────────────────────────────────────────────────────────────────
router.post  ('/suppliers',             ctrl.createSupplier);
router.get   ('/suppliers',             ctrl.listSuppliers);
router.put   ('/suppliers/:id',         ctrl.updateSupplier);

// ── Tools ─────────────────────────────────────────────────────────────────────
router.post  ('/tools',                 ctrl.createTool);
router.get   ('/tools',                 ctrl.listTools);
router.put   ('/tools/:id',             ctrl.updateTool);

// ── AMC ───────────────────────────────────────────────────────────────────────
router.post  ('/amc',                   ctrl.createAMC);
router.get   ('/amc',                   ctrl.listAMC);
router.put   ('/amc/:id',               ctrl.updateAMC);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get   ('/reports/dashboard',     ctrl.dashboardStats);
router.get   ('/reports/monthly',       ctrl.monthlyReport);
router.get   ('/reports/pending',       ctrl.pendingPayments);
router.get   ('/reports/jobs',          ctrl.jobsReport);

module.exports = router;
