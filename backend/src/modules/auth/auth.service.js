const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../config/prisma');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { BUSINESS_MODULES } = require('../tenant/tenant.service');

const register = async ({ name, email, password, phone, businessName, businessType }) => {
  const existing = await prisma.tenant.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const modules = BUSINESS_MODULES[businessType] || BUSINESS_MODULES.OTHER;

  const tenant = await prisma.tenant.create({
    data: {
      name: businessName,
      businessType,
      email,
      phone,
      modules,
      users: {
        create: {
          name,
          email,
          password: hashed,
          role: 'OWNER',
          isEmailVerified: true,
        },
      },
    },
    include: { users: true },
  });

  const user = tenant.users[0];
  const accessToken = signToken({ userId: user.id, tenantId: tenant.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  return { accessToken, refreshToken, user: sanitize(user), tenant: sanitizeTenant(tenant) };
};

const login = async ({ email, password }) => {
  const tenant = await prisma.tenant.findUnique({
    where: { email },
    include: { users: { where: { email } } },
  });

  const user = tenant?.users?.[0];
  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  if (!user.isActive) throw Object.assign(new Error('Account deactivated'), { statusCode: 403 });

  const accessToken = signToken({ userId: user.id, tenantId: tenant.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastLogin: new Date() },
  });

  return { accessToken, refreshToken, user: sanitize(user), tenant: sanitizeTenant(tenant) };
};

const staffLogin = async ({ email, password, tenantId }) => {
  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
    include: { tenant: true },
  });

  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  if (!user.isActive) throw Object.assign(new Error('Account deactivated'), { statusCode: 403 });

  const accessToken = signToken({ userId: user.id, tenantId: user.tenantId, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastLogin: new Date() },
  });

  return { accessToken, refreshToken, user: sanitize(user), tenant: sanitizeTenant(user.tenant) };
};

const refresh = async ({ refreshToken }) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { tenant: true },
  });

  if (!user || user.refreshToken !== refreshToken) {
    throw Object.assign(new Error('Refresh token revoked'), { statusCode: 401 });
  }

  const accessToken = signToken({ userId: user.id, tenantId: user.tenantId, role: user.role });
  return { accessToken };
};

const logout = async (userId) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};

const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return; // silent — don't leak whether email exists

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  return token; // caller sends email
};

const resetPassword = async ({ token, password }) => {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) throw Object.assign(new Error('Token invalid or expired'), { statusCode: 400 });

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
  });
};

const me = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });
  return { user: sanitize(user), tenant: sanitizeTenant(user.tenant) };
};

const sanitize = ({ password, refreshToken, passwordResetToken, ...rest }) => rest;
const sanitizeTenant = ({ ...t }) => t;

module.exports = { register, login, staffLogin, refresh, logout, forgotPassword, resetPassword, me };
