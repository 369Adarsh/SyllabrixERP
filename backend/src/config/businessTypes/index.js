const REGISTRY = require('./registry');
const base = require('./base.config');

const _cache = {};

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Returns { categoryCode, typeCode } for a given BusinessType enum value.
 * Falls back to SYL-BC-GEN-OT02 (OTHER) for unknown types.
 */
function getBusinessTypeCodes(businessTypeEnum) {
  return REGISTRY[businessTypeEnum] || { categoryCode: 'SYL-BC-GEN', typeCode: 'SYL-BC-GEN-OT02' };
}

/**
 * Returns the merged config (base + override) for a given BusinessType enum value.
 * Override file: ./overrides/[CAT]-[LL##].js  e.g. GEN-KR02.js
 * If no override file exists the base config is returned as-is.
 * Results are cached after first load — zero overhead on repeat calls.
 */
function getBusinessTypeConfig(businessTypeEnum) {
  const { typeCode } = getBusinessTypeCodes(businessTypeEnum);

  if (_cache[typeCode]) return _cache[typeCode];

  const overrideKey = typeCode.replace('SYL-BC-', ''); // e.g. "GEN-KR02"
  let override = {};
  try {
    override = require(`./overrides/${overrideKey}`);
  } catch {
    // No override file yet — base config applies
  }

  _cache[typeCode] = deepMerge(base, override);
  return _cache[typeCode];
}

/**
 * Returns true if a specific feature flag is enabled for the given business type.
 * Usage: isFeatureEnabled('KIRANA', 'new_dashboard_v2')
 */
function isFeatureEnabled(businessTypeEnum, featureKey) {
  const config = getBusinessTypeConfig(businessTypeEnum);
  return config.features[featureKey] === true;
}

/**
 * Returns true if a module is active for the given business type.
 * Usage: isModuleEnabled('CLINIC', 'appointments')
 */
function isModuleEnabled(businessTypeEnum, moduleKey) {
  const config = getBusinessTypeConfig(businessTypeEnum);
  return config.modules[moduleKey] === true;
}

module.exports = { getBusinessTypeCodes, getBusinessTypeConfig, isFeatureEnabled, isModuleEnabled };
