const isProd = (process.env.NODE_ENV || 'development') === 'production';
const prisma = require('../config/prisma');

const logErrorToDb = (err, req, statusCode) => {
  try {
    const tenantId = req.user?.tenantId || null;
    prisma.platformErrorLog.create({
      data: {
        tenantId,
        method: req.method,
        path: req.path.slice(0, 255),
        statusCode,
        message: err.message?.slice(0, 500) || null,
        ipAddress: req.ip || null,
      },
    }).catch(() => {});
  } catch (_) {}
};

const errorHandler = (err, req, res, next) => {
  // Always log for monitoring — but keep server logs clean in production
  if (isProd) {
    console.error(`[ERROR] ${req.method} ${req.path} — ${err.message}`);
  } else {
    console.error(err);
  }

  // Prisma known errors — safe to expose field names (not stack)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists`,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Invalid reference — related record not found' });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  // CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: 'Request origin not allowed' });
  }

  const statusCode = err.statusCode || 500;
  logErrorToDb(err, req, statusCode);

  const payload = { success: false, message: err.message || 'Internal server error' };

  // In production, never leak internal error details for 5xx errors
  if (isProd && statusCode >= 500) {
    payload.message = 'An internal error occurred. Our team has been notified.';
  }

  // Allow services to attach extra data (e.g. tenants list for multi-tenant picker)
  if (err.data !== undefined) payload.data = err.data;

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;
