const DEFAULT_TEMPLATES = require('./defaults');
const EXTRA_ROLES_BY_TYPE = require('./byBusinessType');

/**
 * Returns all roles to seed for a given tenant on registration.
 * Always includes the 6 standard roles (OWNER → STAFF).
 * Appends business-type-specific extra roles if defined.
 */
function getRolesToSeed(businessType) {
  const standard = Object.values(DEFAULT_TEMPLATES);
  const extras = EXTRA_ROLES_BY_TYPE[businessType] || [];
  return [...standard, ...extras];
}

module.exports = { getRolesToSeed, DEFAULT_TEMPLATES, EXTRA_ROLES_BY_TYPE };
