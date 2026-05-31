const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../config/prisma');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { BUSINESS_MODULES } = require('../tenant/tenant.service');
const { seedStandardCategories } = require('../inventory/inventory.service');
const { seedForTenant } = require('../roles/roles.service');
const { nextSyllabrixId, nextNSyllabrixIds } = require('../../utils/syllabrixId');
const { sendVerificationEmail } = require('../../utils/email');
const config = require('../../config/env');

// On quality/staging, skip email verification so testers can log in immediately
const IS_STAGING = config.nodeEnv === 'quality';

// Generates next sequential Syllabrix ID from the global pool (SYL00001 … SYL99999)
const generateSyllabrixId = nextSyllabrixId;

const getModulesForBusinessType = async (businessType) => {
  try {
    const config = await prisma.businessTypeConfig.findFirst({
      where: { enumKey: businessType, isActive: true },
      include: { modules: { orderBy: { sortOrder: 'asc' } } },
    });
    if (config?.modules?.length) {
      return config.modules
        .filter(m => m.tier === 'CORE' || m.tier === 'OPTIONAL')
        .map(m => m.moduleKey);
    }
  } catch {}
  return BUSINESS_MODULES[businessType] || BUSINESS_MODULES.OTHER;
};

const getPublicBusinessTypes = async () => {
  const categories = await prisma.businessCategory.findMany({
    where: { isActive: true },
    include: {
      businessTypes: {
        where: { isActive: true, enumKey: { not: null } },
        select: { name: true, enumKey: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
  return categories.filter(c => c.businessTypes.length > 0);
};

const register = async ({ name, email: rawEmail, password, phone, businessName, businessType }) => {
  const email = rawEmail.trim().toLowerCase();
  const [byEmail, byPhone] = await Promise.all([
    prisma.tenant.findUnique({ where: { email } }),
    prisma.tenant.findFirst({ where: { phone } }),
  ]);
  if (byEmail) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  if (byPhone) throw Object.assign(new Error('A business with this phone number already exists'), { statusCode: 409 });

  const emailVerifyToken = IS_STAGING ? null : crypto.randomBytes(32).toString('hex');

  const [hashed, [tenantSyllabrixId, userSyllabrixId]] = await Promise.all([
    bcrypt.hash(password, 10),
    nextNSyllabrixIds(2),
  ]);
  const modules = await getModulesForBusinessType(businessType);

  const tenant = await prisma.tenant.create({
    data: {
      name: businessName,
      businessType,
      email,
      phone,
      modules,
      syllabrixId: tenantSyllabrixId,
      users: {
        create: {
          name,
          email,
          password: hashed,
          role: 'OWNER',
          isEmailVerified: IS_STAGING,
          emailVerifyToken,
          syllabrixId: userSyllabrixId,
        },
      },
    },
    include: { users: true },
  });

  // Seed standard categories + default roles (non-blocking)
  seedStandardCategories(tenant.id).catch(() => {});
  seedForTenant(tenant.id, businessType).catch(() => {});

  if (!IS_STAGING) {
    // Send verification email (non-blocking — never fail the registration)
    sendVerificationEmail(email, businessName, emailVerifyToken).catch(err => console.error('[EMAIL] Verification send failed:', err.message));
  }

  return { requiresVerification: !IS_STAGING, email };
};

const login = async ({ email: rawEmail, password }) => {
  const email = rawEmail.trim().toLowerCase();
  const tenant = await prisma.tenant.findUnique({
    where: { email },
    include: { users: { where: { email } } },
  });

  const user = tenant?.users?.[0];
  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  // Transparently upgrade old high-cost hashes to rounds=10 on successful login
  if (bcrypt.getRounds(user.password) > 10) {
    bcrypt.hash(password, 10).then(h => prisma.user.update({ where: { id: user.id }, data: { password: h } })).catch(() => {});
  }

  if (!user.isEmailVerified) {
    if (IS_STAGING) {
      // Auto-verify on staging so testers aren't blocked by email delivery
      await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true, emailVerifyToken: null } });
    } else {
      throw Object.assign(new Error('Please verify your email address before logging in. Check your inbox for the verification link.'), { statusCode: 403, code: 'EMAIL_NOT_VERIFIED' });
    }
  }

  if (!user.isActive) throw Object.assign(new Error('Account deactivated'), { statusCode: 403 });

  const accessToken = signToken({ userId: user.id, tenantId: tenant.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastLogin: new Date() },
  });

  const staffProfile = await prisma.staff.findFirst({
    where: { tenantId: tenant.id, email: user.email, isActive: true },
    select: { id: true, name: true, role: true, department: true, specialization: true, bio: true, phone: true, branchId: true },
  }).catch(() => null);
  return { accessToken, refreshToken, user: { ...sanitize(user), staffProfile }, tenant: sanitizeTenant(tenant) };
};

const staffLogin = async ({ email: rawEmail, password, tenantId }) => {
  const email = rawEmail.trim().toLowerCase();
  // If tenantId provided, do exact lookup; otherwise find by email across all tenants
  let user;
  if (tenantId) {
    user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      include: { tenant: true },
    });
  } else {
    // Find all accounts with this email (could be at multiple tenants)
    const users = await prisma.user.findMany({
      where: { email },
      include: { tenant: true },
    });
    if (users.length === 0) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }
    if (users.length > 1) {
      // Multiple tenants — return a list so the caller can pick one
      throw Object.assign(
        new Error('Multiple businesses found for this email. Please choose one.'),
        { statusCode: 409, data: { tenants: users.map(u => ({ tenantId: u.tenantId, name: u.tenant?.name })) } }
      );
    }
    user = users[0];
  }

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

  const staffProfileSL = await prisma.staff.findFirst({
    where: { tenantId: user.tenantId, email: user.email, isActive: true },
    select: { id: true, name: true, role: true, department: true, specialization: true, bio: true, phone: true, branchId: true },
  }).catch(() => null);
  return { accessToken, refreshToken, user: { ...sanitize(user), staffProfile: staffProfileSL }, tenant: sanitizeTenant(user.tenant) };
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

  // Rotate refresh token on every use — limits damage from stolen tokens
  const newRefreshToken = signRefreshToken({ userId: user.id });
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

  const accessToken = signToken({ userId: user.id, tenantId: user.tenantId, role: user.role });
  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};

const forgotPassword = async ({ email: rawEmail }) => {
  const email = rawEmail.trim().toLowerCase();
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

  const hashed = await bcrypt.hash(password, 10);
  // Invalidate password reset token AND all active sessions on password change
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshToken: null,     // Force re-login on all devices
    },
  });
};

const me = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenant: true,
      assignedRole: { select: { id: true, templateKey: true, name: true } },
    },
  });
  // Backfill syllabrixId for tenants that predate this feature
  if (user.tenant && !user.tenant.syllabrixId) {
    const syllabrixId = await generateSyllabrixId();
    user.tenant = await prisma.tenant.update({ where: { id: user.tenant.id }, data: { syllabrixId } });
  }
  // Attach Staff profile for staff/trainer users (linked by email + tenantId)
  let staffProfile = null;
  if (user.email && user.tenantId) {
    staffProfile = await prisma.staff.findFirst({
      where: { tenantId: user.tenantId, email: user.email, isActive: true },
      select: { id: true, name: true, role: true, department: true, specialization: true, bio: true, phone: true, branchId: true },
    });
  }
  return { user: { ...sanitize(user), staffProfile }, tenant: sanitizeTenant(user.tenant) };
};

const verifyEmail = async (token) => {
  if (!token) throw Object.assign(new Error('Verification token is required'), { statusCode: 400 });
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) throw Object.assign(new Error('This verification link is invalid or has already been used'), { statusCode: 400 });
  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null },
  });
  return { verified: true };
};

const resendVerification = async ({ email: rawEmail }) => {
  const email = rawEmail.trim().toLowerCase();
  const tenant = await prisma.tenant.findUnique({
    where: { email },
    include: { users: { where: { email } } },
  });
  const user = tenant?.users?.[0];
  if (!user || user.isEmailVerified) return; // silent — don't leak account info
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: token } });
  sendVerificationEmail(email, tenant.name, token).catch(err => console.error('[EMAIL] Resend verification failed:', err.message));
};

const sanitize = ({ password, refreshToken, passwordResetToken, ...rest }) => rest;
const sanitizeTenant = ({ ...t }) => {
  // Always merge canonical modules for the business type so existing tenants
  // automatically get newly-added modules (e.g. 'progress' added to HOME_TUITION).
  const canonical = BUSINESS_MODULES[t.businessType] || [];
  t.modules = [...new Set([...canonical, ...(Array.isArray(t.modules) ? t.modules : [])])];
  return t;
};

module.exports = { register, login, staffLogin, refresh, logout, forgotPassword, resetPassword, me, getPublicBusinessTypes, verifyEmail, resendVerification };
