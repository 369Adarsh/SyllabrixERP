const { z } = require('zod');

const registerSchema = z.object({
  name:         z.string().min(2).max(100).trim(),
  email:        z.string().email().max(254).toLowerCase(),
  password:     z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone:        z.string().min(10).max(15).regex(/^\d+$/, 'Phone must contain only digits'),
  businessName: z.string().min(2).max(150).trim(),
  businessType: z.string().min(2).max(50),
  gstin:        z.string().max(15).optional(),
  pan:          z.string().max(10).optional(),
  address:      z.string().max(300).optional(),
  city:         z.string().max(100).optional(),
  state:        z.string().max(100).optional(),
  pincode:      z.string().max(10).optional(),
  planKey:      z.string().optional(),
});

// Login schema intentionally does not validate password complexity —
// we always run bcrypt.compare and return "Invalid credentials" regardless,
// to avoid revealing whether the password format is wrong vs account not found.
const loginSchema = z.object({
  email:    z.string().email().max(254).toLowerCase(),
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
