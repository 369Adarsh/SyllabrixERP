/**
 * Syllabrix Permission Checker
 * Works with the new Role model (assignedRole on req.user).
 * Falls back gracefully for users without an assignedRole.
 */

/**
 * Returns true if the user can perform `op` on `feature` within `module`.
 * op: 'C' | 'R' | 'U' | 'D'
 */
function can(user, module, feature, op) {
  // Legacy OWNER enum — always passes
  if (user.role === 'OWNER') return true;

  // New role system
  const assignedRole = user.assignedRole;
  if (!assignedRole) return false;
  if (assignedRole.isOwner) return true;

  const perms = assignedRole.permissions;
  if (!perms || typeof perms !== 'object') return false;

  return perms[module]?.[feature]?.[op] === true;
}

/**
 * Returns true if the user has ANY access (at least Read) to the module.
 */
function canAccessModule(user, module) {
  if (user.role === 'OWNER') return true;
  const assignedRole = user.assignedRole;
  if (!assignedRole) return false;
  if (assignedRole.isOwner) return true;

  const perms = assignedRole.permissions;
  if (!perms || typeof perms !== 'object') return false;

  const modulePerms = perms[module];
  if (!modulePerms) return false;

  return Object.values(modulePerms).some(f => f.R === true);
}

/**
 * Express middleware factory.
 * Usage: router.post('/invoices', authenticate, authorizeFeature('invoicing','invoices','C'), handler)
 */
function authorizeFeature(module, feature, op) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (can(req.user, module, feature, op)) return next();
    return res.status(403).json({ success: false, message: `Permission denied: ${module}.${feature}.${op}` });
  };
}

module.exports = { can, canAccessModule, authorizeFeature };
