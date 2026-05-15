const router = require('express').Router();
const ctrl = require('./auth.controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const {
  registerSchema, loginSchema, refreshSchema,
  forgotPasswordSchema, resetPasswordSchema,
} = require('./auth.schema');

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/staff-login', ctrl.staffLogin);
router.post('/refresh', validate(refreshSchema), ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
