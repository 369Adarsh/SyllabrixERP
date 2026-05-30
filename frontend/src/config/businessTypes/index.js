import REGISTRY from './registry';
import base from './base.config';

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

const overrideModules = import.meta.glob('./overrides/*.js', { eager: true });

function loadOverride(overrideKey) {
  const path = `./overrides/${overrideKey}.js`;
  const mod = overrideModules[path];
  return mod ? (mod.default ?? mod) : {};
}

export function getBusinessTypeCodes(businessTypeEnum) {
  return REGISTRY[businessTypeEnum] || { categoryCode: 'SYL-BC-GEN', typeCode: 'SYL-BC-GEN-OT02' };
}

export function getBusinessTypeConfig(businessTypeEnum) {
  const { typeCode } = getBusinessTypeCodes(businessTypeEnum);

  if (_cache[typeCode]) return _cache[typeCode];

  const overrideKey = typeCode.replace('SYL-BC-', ''); // e.g. "GEN-KR02"
  const override = loadOverride(overrideKey);
  _cache[typeCode] = deepMerge(base, override);
  return _cache[typeCode];
}

export function isFeatureEnabled(businessTypeEnum, featureKey) {
  return getBusinessTypeConfig(businessTypeEnum).features[featureKey] === true;
}

export function isModuleEnabled(businessTypeEnum, moduleKey) {
  return getBusinessTypeConfig(businessTypeEnum).modules[moduleKey] === true;
}
