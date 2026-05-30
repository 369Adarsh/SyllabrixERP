const { verifyToken, resolvePermissions } = require('./superadmin.service');
const { unauthorized, forbidden } = require('../../utils/response');

const authenticateSA = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return unauthorized(res, 'Super admin token required');
  try {
    const decoded = verifyToken(header.split(' ')[1]);
    req.saAdmin = decoded; // { adminId, role }
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired super admin token');
  }
};

// authorizeSA('WING', 'R')     — new wing-permission check
// authorizeSA('SUPER','ADMIN') — legacy role-name check (backward compat)
const authorizeSA = (...args) => async (req, res, next) => {
  try {
    const adminRole = req.saAdmin?.role;

    // SUPER always passes everything
    if (adminRole === 'SUPER') return next();

    // Legacy: all args are role names (length > 1, not single op letters)
    const isLegacy = args.every((a) => a.length > 1);
    if (isLegacy) {
      if (args.includes(adminRole)) return next();
      return forbidden(res, `Requires role: ${args.join(' or ')}`);
    }

    // New: authorizeSA('TENANTS', 'R')
    const [wing, op] = args;
    const perms = await resolvePermissions(req.saAdmin.adminId);
    if (!perms) return forbidden(res, 'Admin account not found');
    if (perms[wing]?.[op]) return next();
    return forbidden(res, `Requires ${wing}:${op} permission`);
  } catch (e) {
    console.error('authorizeSA error:', e.message);
    return forbidden(res, 'Permission check failed');
  }
};

module.exports = { authenticateSA, authorizeSA };
