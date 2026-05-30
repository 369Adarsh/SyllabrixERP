const rateLimit = require('express-rate-limit');

const isProd = (process.env.NODE_ENV || 'development') === 'production';

const make = (opts) =>
  rateLimit({
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    ...opts,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: opts.message || 'Too many requests. Please try again later.',
      });
    },
  });

// Auth endpoints — brute-force protection
const authLimiter = make({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 10 : 100,    // 10 login attempts per 15 min in prod
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

// Forgot-password — prevent email spam
const forgotPasswordLimiter = make({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProd ? 5 : 50,
  message: 'Too many password reset requests. Please try again in 1 hour.',
});

// Register — prevent account farm
const registerLimiter = make({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 5 : 50,
  message: 'Too many registrations from this IP. Please try again later.',
});

// AI / Gemini — prevent API cost abuse
const aiLimiter = make({
  windowMs: 60 * 1000,   // 1 minute
  max: isProd ? 20 : 200,
  message: 'AI request limit reached. Please wait a moment before sending more.',
});

// WhatsApp send — prevent message spam
const whatsappLimiter = make({
  windowMs: 60 * 1000,
  max: isProd ? 30 : 300,
  message: 'WhatsApp send limit reached. Please wait before sending more messages.',
});

// General API — catch-all protection
const apiLimiter = make({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 3000,
  message: 'Request limit exceeded. Please slow down.',
});

module.exports = { authLimiter, forgotPasswordLimiter, registerLimiter, aiLimiter, whatsappLimiter, apiLimiter };
