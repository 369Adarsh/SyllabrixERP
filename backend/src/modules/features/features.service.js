const prisma = require('../../config/prisma');

// Plan → which feature tiers are unlocked
const PLAN_TIERS = {
  STARTER:    ['BASIC'],
  GROWTH:     ['BASIC', 'STANDARD'],
  SCALE:      ['BASIC', 'STANDARD', 'ADVANCED'],
  ENTERPRISE: ['BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE'],
};

/**
 * Get all features for a module, merged with tenant + branch overrides.
 * Returns the effective enabled/enforced state for each feature.
 */
async function getEffectiveFeatures(tenantId, moduleKey, branchId = null) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const unlockedTiers = PLAN_TIERS[tenant?.plan] || ['BASIC'];

  const [allFeatures, tenantConfigs, branchConfigs] = await Promise.all([
    prisma.moduleFeature.findMany({
      where: { moduleKey, isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.tenantFeatureConfig.findMany({
      where: { tenantId, feature: { moduleKey } },
    }),
    branchId
      ? prisma.branchFeatureConfig.findMany({ where: { branchId, feature: { moduleKey } } })
      : Promise.resolve([]),
  ]);

  const tenantMap = Object.fromEntries(tenantConfigs.map(c => [c.featureKey, c]));
  const branchMap = Object.fromEntries(branchConfigs.map(c => [c.featureKey, c]));

  return allFeatures.map(f => {
    const planUnlocked = unlockedTiers.includes(f.tier);
    const tenantCfg   = tenantMap[f.featureKey];
    const branchCfg   = branchMap[f.featureKey];

    // Company-level: if no override, use feature's defaultOn
    const tenantEnabled  = tenantCfg ? tenantCfg.enabled : f.defaultOn;
    const tenantEnforced = tenantCfg?.enforced ?? false;

    // Branch-level: if enforced by company, branch cannot override
    let branchEnabled = tenantEnabled;
    if (!tenantEnforced && branchCfg) {
      branchEnabled = branchCfg.enabled;
    }

    const effective = planUnlocked && tenantEnabled && branchEnabled;

    return {
      featureKey:      f.featureKey,
      name:            f.name,
      description:     f.description,
      moduleKey:       f.moduleKey,
      tier:            f.tier,
      defaultOn:       f.defaultOn,
      dependencies:    f.dependencies,
      sortOrder:       f.sortOrder,
      planUnlocked,
      tenantEnabled,
      tenantEnforced,
      branchEnabled,
      effective,         // final answer: is this feature active right now?
    };
  });
}

/**
 * Get a flat map of featureKey → boolean for quick runtime checks.
 * Used by POS and other modules to gate UI.
 */
async function getFeatureMap(tenantId, moduleKey, branchId = null) {
  const features = await getEffectiveFeatures(tenantId, moduleKey, branchId);
  return Object.fromEntries(features.map(f => [f.featureKey, f.effective]));
}

/**
 * Nerve Center: list all features (optionally filtered by module).
 */
async function listAllFeatures(moduleKey = null) {
  return prisma.moduleFeature.findMany({
    where: moduleKey ? { moduleKey } : {},
    orderBy: [{ moduleKey: 'asc' }, { sortOrder: 'asc' }],
  });
}

/**
 * Nerve Center: upsert a feature definition.
 */
async function upsertFeature(data) {
  return prisma.moduleFeature.upsert({
    where:  { featureKey: data.featureKey },
    update: data,
    create: data,
  });
}

/**
 * Nerve Center: toggle a feature globally on/off.
 */
async function toggleFeatureGlobal(featureKey, isActive) {
  return prisma.moduleFeature.update({
    where:  { featureKey },
    data:   { isActive },
  });
}

/**
 * Tenant: update company-level feature config.
 * enforced=true means branches cannot override.
 */
async function setTenantFeature(tenantId, featureKey, enabled, enforced = false) {
  // Validate feature exists
  const feature = await prisma.moduleFeature.findUnique({ where: { featureKey } });
  if (!feature) throw new Error(`Feature ${featureKey} not found`);

  await prisma.tenantFeatureConfig.upsert({
    where:  { tenantId_featureKey: { tenantId, featureKey } },
    update: { enabled, enforced },
    create: { tenantId, featureKey, enabled, enforced },
  });

  // If disabling a feature, also disable dependents
  if (!enabled) {
    await cascadeDisable(tenantId, featureKey, 'tenant');
  }

  return getEffectiveFeatures(tenantId, feature.moduleKey);
}

/**
 * Branch: update branch-level feature override.
 * Cannot enable features the company hasn't enabled.
 * Cannot override features the company has enforced.
 */
async function setBranchFeature(tenantId, branchId, featureKey, enabled) {
  const feature = await prisma.moduleFeature.findUnique({ where: { featureKey } });
  if (!feature) throw new Error(`Feature ${featureKey} not found`);

  const tenantCfg = await prisma.tenantFeatureConfig.findUnique({
    where: { tenantId_featureKey: { tenantId, featureKey } },
  });

  const tenantEnabled  = tenantCfg ? tenantCfg.enabled : feature.defaultOn;
  const tenantEnforced = tenantCfg?.enforced ?? false;

  if (tenantEnforced) {
    throw new Error(`Feature "${feature.name}" is enforced by company and cannot be changed at branch level`);
  }
  if (enabled && !tenantEnabled) {
    throw new Error(`Feature "${feature.name}" is not enabled at company level — enable it there first`);
  }

  await prisma.branchFeatureConfig.upsert({
    where:  { branchId_featureKey: { branchId, featureKey } },
    update: { enabled },
    create: { tenantId, branchId, featureKey, enabled },
  });

  if (!enabled) {
    await cascadeDisable(tenantId, featureKey, 'branch', branchId);
  }

  return getEffectiveFeatures(tenantId, feature.moduleKey, branchId);
}

/**
 * When a feature is disabled, also disable all features that depend on it.
 */
async function cascadeDisable(tenantId, disabledKey, level, branchId = null) {
  const dependents = await prisma.moduleFeature.findMany({
    where: { dependencies: { has: disabledKey } },
  });

  for (const dep of dependents) {
    if (level === 'tenant') {
      await prisma.tenantFeatureConfig.upsert({
        where:  { tenantId_featureKey: { tenantId, featureKey: dep.featureKey } },
        update: { enabled: false },
        create: { tenantId, featureKey: dep.featureKey, enabled: false, enforced: false },
      });
    } else if (branchId) {
      await prisma.branchFeatureConfig.upsert({
        where:  { branchId_featureKey: { branchId, featureKey: dep.featureKey } },
        update: { enabled: false },
        create: { tenantId, branchId, featureKey: dep.featureKey, enabled: false },
      });
    }
  }
}

/**
 * Get adoption analytics for Nerve Center.
 */
async function getFeatureAdoption(moduleKey = null) {
  const features = await prisma.moduleFeature.findMany({
    where: moduleKey ? { moduleKey } : {},
    orderBy: { sortOrder: 'asc' },
  });

  const totalTenants = await prisma.tenant.count({ where: { isActive: true } });

  const result = [];
  for (const f of features) {
    const enabledCount = await prisma.tenantFeatureConfig.count({
      where: { featureKey: f.featureKey, enabled: true },
    });
    // Tenants without explicit config use defaultOn — count them too
    const configuredCount = await prisma.tenantFeatureConfig.count({
      where: { featureKey: f.featureKey },
    });
    const defaultOnCount = f.defaultOn ? (totalTenants - configuredCount) : 0;
    const effectiveEnabled = enabledCount + defaultOnCount;

    result.push({
      ...f,
      adoptionCount:   effectiveEnabled,
      adoptionPercent: totalTenants > 0 ? Math.round((effectiveEnabled / totalTenants) * 100) : 0,
      totalTenants,
    });
  }

  return result;
}

module.exports = {
  getEffectiveFeatures,
  getFeatureMap,
  listAllFeatures,
  upsertFeature,
  toggleFeatureGlobal,
  setTenantFeature,
  setBranchFeature,
  getFeatureAdoption,
};
