const authService = require('./auth.service');
const { ok, created, error } = require('../../utils/response');
const activity = require('../activity/activity.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    created(res, result, 'Account created successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    activity.log(result.user.tenantId, result.user.id, result.user.name || result.user.email, result.user.role, 'LOGIN', 'auth', 'User', result.user.id, null, req.ip);
    ok(res, result, 'Login successful');
  } catch (err) { next(err); }
};

const staffLogin = async (req, res, next) => {
  try {
    const result = await authService.staffLogin(req.body);
    ok(res, result, 'Login successful');
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body);
    ok(res, result, 'Token refreshed');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    activity.log(req.user.tenantId, req.user.id, req.user.name || req.user.email, req.user.role, 'LOGOUT', 'auth', 'User', req.user.id, null, req.ip);
    ok(res, {}, 'Logged out');
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { sendPasswordResetEmail } = require('../../utils/email');
    const token = await authService.forgotPassword(req.body);
    const responseData = {};
    if (token) {
      await sendPasswordResetEmail(req.body.email, token);
      // Only expose reset link in local dev when explicitly opted in — never in staging or production
      if (process.env.NODE_ENV === 'development' && process.env.SHOW_DEV_RESET_LINK === 'true') {
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        responseData.devResetLink = `${frontendUrl}/reset-password?token=${token}`;
      }
    }
    ok(res, responseData, 'If that email is registered, a reset link has been sent');
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    ok(res, {}, 'Password reset successful');
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const result = await authService.me(req.user.id);
    ok(res, result);
  } catch (err) { next(err); }
};

const getPublicBusinessTypes = async (req, res, next) => {
  try {
    const result = await authService.getPublicBusinessTypes();
    ok(res, result);
  } catch (err) { next(err); }
};

const verifyEmail = async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.query.token);
    ok(res, result, 'Email verified successfully');
  } catch (err) { next(err); }
};

const resendVerification = async (req, res, next) => {
  try {
    await authService.resendVerification(req.body);
    ok(res, {}, 'If that email is registered and unverified, a new link has been sent');
  } catch (err) { next(err); }
};

module.exports = { register, login, staffLogin, refresh, logout, forgotPassword, resetPassword, me, getPublicBusinessTypes, verifyEmail, resendVerification };
