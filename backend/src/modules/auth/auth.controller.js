const authService = require('./auth.service');
const { ok, created, error } = require('../../utils/response');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    created(res, result, 'Account created successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
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
    ok(res, {}, 'Logged out');
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { sendPasswordResetEmail } = require('../../utils/email');
    const token = await authService.forgotPassword(req.body);
    if (token) await sendPasswordResetEmail(req.body.email, token);
    ok(res, {}, 'If that email is registered, a reset link has been sent');
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

module.exports = { register, login, staffLogin, refresh, logout, forgotPassword, resetPassword, me };
