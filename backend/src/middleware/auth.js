const { verifyToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/response');
const prisma = require('../config/prisma');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }

  const token = header.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true, assignedRole: true },
    });

    if (!user || !user.isActive) {
      return unauthorized(res, 'User not found or deactivated');
    }

    if (user.tenant && !user.tenant.isActive) {
      return unauthorized(res, 'Your account has been suspended. Please contact Syllabrix support.');
    }

    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }
};

// Role-based gate — also accepts users whose customPermissions explicitly grant
// the module. Pass module key as last arg: authorize('OWNER','ADMIN', { module: 'invoices' })
const authorize = (...args) => (req, res, next) => {
  // Separate roles from options object
  const opts = args.find(a => typeof a === 'object' && a !== null) || {};
  const roles = args.filter(a => typeof a === 'string');

  const { role, customPermissions } = req.user;

  // OWNER always passes
  if (role === 'OWNER') return next();

  // Role check
  if (roles.includes(role)) return next();

  // customPermissions module check — if the user has 'view', 'own', or 'manage' on the module
  if (opts.module && customPermissions) {
    const perms = typeof customPermissions === 'string'
      ? JSON.parse(customPermissions)
      : customPermissions;
    const level = perms[opts.module];
    if (level && level !== 'none') return next();
  }

  return forbidden(res, `Access denied. Required role: ${roles.join(' or ')}`);
};

// Strict write gate — requires 'manage' or 'own' permission on the module
const authorizeWrite = (module) => (req, res, next) => {
  const { role, customPermissions } = req.user;
  if (role === 'OWNER' || role === 'ADMIN') return next();

  if (customPermissions) {
    const perms = typeof customPermissions === 'string'
      ? JSON.parse(customPermissions)
      : customPermissions;
    const level = perms[module];
    if (level === 'manage' || level === 'own') return next();
  }

  return forbidden(res, 'Write access denied for this module');
};

module.exports = { authenticate, authorize, authorizeWrite };
