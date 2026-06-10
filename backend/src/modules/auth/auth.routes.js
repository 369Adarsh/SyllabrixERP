const router = require('express').Router();
const ctrl = require('./auth.controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authLimiter, forgotPasswordLimiter, registerLimiter } = require('../../middleware/rateLimiter');
const {
  registerSchema, loginSchema, refreshSchema,
  forgotPasswordSchema, resetPasswordSchema,
} = require('./auth.schema');

router.get('/business-types',                                                             ctrl.getPublicBusinessTypes);
router.get('/plans',                                                                      ctrl.getPublicPlans);
router.get('/verify-email',                                                               ctrl.verifyEmail);
router.post('/resend-verification', authLimiter,                                          ctrl.resendVerification);
router.post('/register',         registerLimiter,       validate(registerSchema),       ctrl.register);
router.post('/login',            authLimiter,            validate(loginSchema),          ctrl.login);
router.post('/staff-login',      authLimiter,                                            ctrl.staffLogin);
router.post('/refresh',                                  validate(refreshSchema),        ctrl.refresh);
router.post('/logout',           authenticate,                                           ctrl.logout);
router.post('/forgot-password',  forgotPasswordLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password',                          validate(resetPasswordSchema),  ctrl.resetPassword);
router.get('/me',                authenticate,                                           ctrl.me);

module.exports = router;
