const svc = require('./features.service');

// ── Tenant / Business routes ───────────────────────────────────────────────────

/** GET /api/v1/features/:moduleKey — effective features for the calling tenant+branch */
const getMyFeatures = async (req, res, next) => {
  try {
    const tenantId  = req.tenantId;
    const branchId  = req.query.branchId || req.user?.branchId || null;
    const moduleKey = req.params.moduleKey;
    const features  = await svc.getEffectiveFeatures(tenantId, moduleKey, branchId);
    res.json({ success: true, data: features });
  } catch (err) { next(err); }
};

/** GET /api/v1/features/:moduleKey/map — { featureKey: boolean } flat map */
const getFeatureMap = async (req, res, next) => {
  try {
    const tenantId  = req.tenantId;
    const branchId  = req.query.branchId || req.user?.branchId || null;
    const moduleKey = req.params.moduleKey;
    const map = await svc.getFeatureMap(tenantId, moduleKey, branchId);
    res.json({ success: true, data: map });
  } catch (err) { next(err); }
};

/** GET /api/v1/features/:moduleKey/company — company-level view (owner/admin only) */
const getCompanyFeatures = async (req, res, next) => {
  try {
    const features = await svc.getEffectiveFeatures(req.tenantId, req.params.moduleKey);
    res.json({ success: true, data: features });
  } catch (err) { next(err); }
};

/** PATCH /api/v1/features/:moduleKey/company — update company-level feature toggle */
const setCompanyFeature = async (req, res, next) => {
  try {
    const { featureKey, enabled, enforced = false } = req.body;
    if (typeof featureKey !== 'string' || typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'featureKey and enabled (boolean) required' });
    }
    const features = await svc.setTenantFeature(req.tenantId, featureKey, enabled, enforced);
    res.json({ success: true, data: features });
  } catch (err) { next(err); }
};

/** GET /api/v1/features/:moduleKey/branch/:branchId — branch-level view */
const getBranchFeatures = async (req, res, next) => {
  try {
    const features = await svc.getEffectiveFeatures(req.tenantId, req.params.moduleKey, req.params.branchId);
    res.json({ success: true, data: features });
  } catch (err) { next(err); }
};

/** PATCH /api/v1/features/:moduleKey/branch/:branchId — update branch feature toggle */
const setBranchFeature = async (req, res, next) => {
  try {
    const { featureKey, enabled } = req.body;
    if (typeof featureKey !== 'string' || typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'featureKey and enabled (boolean) required' });
    }
    const features = await svc.setBranchFeature(req.tenantId, req.params.branchId, featureKey, enabled);
    res.json({ success: true, data: features });
  } catch (err) { next(err); }
};

// ── Nerve Center (Superadmin) routes ──────────────────────────────────────────

/** GET /api/platform/features — full feature catalog */
const ncListFeatures = async (req, res, next) => {
  try {
    const features = await svc.listAllFeatures(req.query.moduleKey || null);
    res.json({ success: true, data: features });
  } catch (err) { next(err); }
};

/** POST /api/platform/features — create a new feature */
const ncCreateFeature = async (req, res, next) => {
  try {
    const feature = await svc.upsertFeature(req.body);
    res.status(201).json({ success: true, data: feature });
  } catch (err) { next(err); }
};

/** PATCH /api/platform/features/:featureKey — update feature definition */
const ncUpdateFeature = async (req, res, next) => {
  try {
    const feature = await svc.upsertFeature({ ...req.body, featureKey: req.params.featureKey });
    res.json({ success: true, data: feature });
  } catch (err) { next(err); }
};

/** PATCH /api/platform/features/:featureKey/toggle — globally enable/disable */
const ncToggleFeature = async (req, res, next) => {
  try {
    const feature = await svc.toggleFeatureGlobal(req.params.featureKey, req.body.isActive);
    res.json({ success: true, data: feature });
  } catch (err) { next(err); }
};

/** GET /api/platform/features/adoption — adoption analytics */
const ncGetAdoption = async (req, res, next) => {
  try {
    const data = await svc.getFeatureAdoption(req.query.moduleKey || null);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  getMyFeatures,
  getFeatureMap,
  getCompanyFeatures,
  setCompanyFeature,
  getBranchFeatures,
  setBranchFeature,
  ncListFeatures,
  ncCreateFeature,
  ncUpdateFeature,
  ncToggleFeature,
  ncGetAdoption,
};
