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
      include: { tenant: true },
    });

    if (!user || !user.isActive) {
      return unauthorized(res, 'User not found or deactivated');
    }

    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return forbidden(res, `Access denied. Required role: ${roles.join(' or ')}`);
  }
  next();
};

module.exports = { authenticate, authorize };
