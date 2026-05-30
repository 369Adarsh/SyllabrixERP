const path = require('path');
const dotenv = require('dotenv');

// Load the correct .env file based on NODE_ENV
// NODE_ENV=development → .env.development
// NODE_ENV=quality     → .env.quality
// NODE_ENV=production  → .env.production
const ENV = process.env.NODE_ENV || 'development';
const envFile = path.resolve(__dirname, `../../.env.${ENV}`);
dotenv.config({ path: envFile });

const required = (key) => {
  const val = process.env[key];
  if (!val) {
    if (ENV === 'production') throw new Error(`[FATAL] Missing required env var: ${key}`);
    console.warn(`[WARN] Missing env var: ${key} — set this before going to production`);
  }
  return val;
};

// Secrets must never use placeholder defaults in any environment once set
const secret = (key, devDefault) => {
  const val = process.env[key];
  if (!val) {
    if (ENV === 'production') throw new Error(`[FATAL] Missing secret: ${key}`);
    return devDefault;
  }
  if (ENV === 'production' && val.length < 32) {
    throw new Error(`[FATAL] Secret ${key} is too short — minimum 32 characters required`);
  }
  return val;
};

const config = {
  env: ENV,
  port: process.env.PORT || 5000,
  nodeEnv: ENV,

  jwtSecret: secret('JWT_SECRET', 'dev-jwt-secret-change-before-production-min32chars'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: secret('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-before-production-min32chars'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  saJwtSecret: secret('SA_JWT_SECRET', 'dev-superadmin-secret-change-before-production-min32chars'),

  databaseUrl: required('DATABASE_URL'),

  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  fromEmail: process.env.FROM_EMAIL || 'noreply@syllabrix.com',

  groqApiKey: process.env.GROQ_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  whatsappToken: process.env.WHATSAPP_TOKEN,
  whatsappPhoneId: process.env.WHATSAPP_PHONE_ID,
  whatsappWabaId: process.env.WHATSAPP_WABA_ID,
  whatsappWebhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET,

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
};

if (ENV !== 'test') {
  console.log(`▶  Environment: ${ENV.toUpperCase()}`);
}

module.exports = config;
