const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./modules/auth/auth.routes');
const tenantRoutes = require('./modules/tenant/tenant.routes');
const userRoutes = require('./modules/users/users.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const posRoutes = require('./modules/pos/pos.routes');
const invoicingRoutes = require('./modules/invoicing/invoicing.routes');
const appointmentRoutes = require('./modules/appointments/appointments.routes');
const feesRoutes = require('./modules/fees/fees.routes');
const leaseRoutes = require('./modules/lease/lease.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const customerRoutes = require('./modules/customers/customers.routes');
const vendorRoutes = require('./modules/vendors/vendors.routes');
const expenseRoutes = require('./modules/expenses/expenses.routes');
const whatsappRoutes = require('./modules/whatsapp/whatsapp.routes');
const assetRoutes = require('./modules/assets/assets.routes');
const staffRoutes = require('./modules/staff/staff.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const campaignRoutes = require('./modules/campaigns/campaigns.routes');
const billsRoutes = require('./modules/bills/bills.routes');
const accountsRoutes = require('./modules/accounts/accounts.routes');
const creditNotesRoutes = require('./modules/creditnotes/creditnotes.routes');
const quotationsRoutes = require('./modules/quotations/quotations.routes');
const payrollRoutes = require('./modules/payroll/payroll.routes');
const recurringInvoicesRoutes = require('./modules/recurringinvoices/recurringinvoices.routes');
const automationRoutes = require('./modules/automation/automation.routes');
const progressRoutes = require('./modules/progress/progress.routes');
const roleRequestsRoutes = require('./modules/rolerequests/rolerequests.routes');
const superadminRoutes = require('./modules/superadmin/superadmin.routes');
const activityRoutes   = require('./modules/activity/activity.routes');
const supportRoutes = require('./modules/support/support.routes');
const complianceRoutes = require('./modules/compliance/compliance.routes');
const announcementsRoutes = require('./modules/announcements/announcements.routes');
const businessBuilderRoutes = require('./modules/businessbuilder/businessbuilder.routes');
const b2bRoutes = require('./modules/b2b/b2b.routes');
const membershipPlansRoutes = require('./modules/membership-plans/membership-plans.routes');
const returnsRoutes = require('./modules/returns/returns.routes');
const trainingRoutes = require('./modules/training/training.routes');
const rolesRoutes = require('./modules/roles/roles.routes');
const branchesRoutes = require('./modules/branches/branches.routes');
const stockTransferRoutes = require('./modules/branches/stockTransfer.routes');
const featuresRoutes = require('./modules/features/features.routes');
const helpRoutes = require('./modules/help/help.routes');
const receiptsRoutes = require('./modules/receipts/receipts.routes');
const opdQueueRoutes = require('./modules/opd-queue/opd-queue.routes');
const vitalsRoutes = require('./modules/vitals/vitals.routes');
const clinicalNotesRoutes = require('./modules/clinical-notes/clinical-notes.routes');
const prescriptionsRoutes = require('./modules/prescriptions/prescriptions.routes');
const labOrdersRoutes        = require('./modules/lab-orders/lab-orders.routes');
const clinicBillingRoutes    = require('./modules/clinic-billing/clinic-billing.routes');
const clinicMedicinesRoutes  = require('./modules/clinic-medicines/clinic-medicines.routes');
const clinicDoctorsRoutes    = require('./modules/clinic-doctors/clinic-doctors.routes');
const clinicReportsRoutes    = require('./modules/clinic-reports/clinic-reports.routes');
const prescCtrl              = require('./modules/prescriptions/prescriptions.controller');

const { razorpayWebhook } = require('./modules/invoicing/invoicing.controller');
const { verify: waVerify, webhook: waWebhook } = require('./modules/whatsapp/whatsapp.controller');

const app = express();

// ─── HTTPS redirect in production ─────────────────────────────────────────────
if (config.nodeEnv === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
  app.set('trust proxy', 1); // Trust Railway/Render/Vercel reverse proxy
}

// ─── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"], // Allow inline styles for email templates
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'", 'https:'],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
      upgradeInsecureRequests: config.nodeEnv === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Allow uploads to be loaded cross-origin
  hsts: config.nodeEnv === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = config.clientUrl
  ? config.clientUrl.split(',').map(u => u.trim()).filter(Boolean)
  : [];

if (config.nodeEnv === 'production' && allowedOrigins.length === 0) {
  throw new Error('[FATAL] CLIENT_URL must be set in production');
}
if (config.nodeEnv !== 'production' && allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173');
}

app.use(cors({
  origin: (origin, cb) => {
    // Requests with no Origin header (e.g. curl, Postman) are blocked when credentials are involved
    if (!origin) return cb(null, false);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // On quality/staging, accept any Vercel preview URL so branch deploys don't break
    if (config.nodeEnv === 'quality' && /^https:\/\/[a-z0-9-]+-369adarshs-projects\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  maxAge: 86400, // Cache preflight 24h
}));

// ─── Request logging ───────────────────────────────────────────────────────────
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ─── Static public assets (logo, etc.) ────────────────────────────────────────
app.use('/public', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'public')));

// ─── Uploaded files (logos) ────────────────────────────────────────────────────
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // Prevent browsers from executing uploaded files as scripts
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// ─── Webhook routes — raw body required before express.json() ─────────────────
// Razorpay: HMAC-SHA256 over raw body
app.post('/api/v1/webhooks/razorpay', express.raw({ type: 'application/json' }), razorpayWebhook);
// WhatsApp: Meta X-Hub-Signature-256 over raw body
app.get('/api/v1/whatsapp/webhook', waVerify);
app.post('/api/v1/whatsapp/webhook', express.raw({ type: 'application/json' }), waWebhook);

// ─── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Health check (no rate limit) ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Syllabrix API' }));

// ─── Global API rate limiter ───────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenant', tenantRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/pos', posRoutes);
app.use('/api/v1/invoices', invoicingRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/fees', feesRoutes);
app.use('/api/v1/lease', leaseRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/bills', billsRoutes);
app.use('/api/v1/accounts', accountsRoutes);
app.use('/api/v1/credit-notes', creditNotesRoutes);
app.use('/api/v1/quotations', quotationsRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/recurring-invoices', recurringInvoicesRoutes);
app.use('/api/v1/automation', automationRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/role-requests', roleRequestsRoutes);
app.use('/api/v1/b2b', b2bRoutes);
app.use('/api/v1/membership-plans', membershipPlansRoutes);
app.use('/api/v1/returns', returnsRoutes);
app.use('/api/v1/training', trainingRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/branches', branchesRoutes);
app.use('/api/v1/stock-transfers', stockTransferRoutes);
app.use('/api/v1/features', featuresRoutes);
app.use('/api/v1/help', helpRoutes);
app.use('/api/v1/receipts', receiptsRoutes);
app.use('/api/v1/opd-queue', opdQueueRoutes);
app.use('/api/v1/vitals', vitalsRoutes);
app.use('/api/v1/clinical-notes', clinicalNotesRoutes);
app.use('/api/v1/prescriptions', prescriptionsRoutes);
app.use('/api/v1/lab-orders',      labOrdersRoutes);
app.use('/api/v1/clinic-billing',  clinicBillingRoutes);
app.use('/api/v1/clinic-medicines', clinicMedicinesRoutes);
app.use('/api/v1/clinic-doctors',   clinicDoctorsRoutes);
app.use('/api/v1/clinic-reports',   clinicReportsRoutes);

// ── Public prescription verify (no auth) ─────────────────────────────────────
app.get('/api/v1/public/rx/:token', prescCtrl.verifyRx);

// ── UPI Payment Redirect (public, no auth) ────────────────────────────────────
app.get('/pay', (req, res) => {
  const { pa, am, pn, tn } = req.query;
  if (!pa || !am) return res.status(400).send('Missing UPI parameters');
  const upiLink = `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn || '')}&am=${encodeURIComponent(am)}&cu=INR&tn=${encodeURIComponent(tn || 'Membership')}`;
  const displayAmt = `₹${Number(am).toLocaleString('en-IN')}`;
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pay ${displayAmt} — ${pn || 'Gym'}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F0FDF4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:#fff;border-radius:20px;padding:32px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
    .icon{font-size:48px;margin-bottom:16px}
    .gym{font-size:18px;font-weight:700;color:#1B3A6B;margin-bottom:4px}
    .plan{font-size:13px;color:#6B7280;margin-bottom:20px}
    .amount{font-size:40px;font-weight:800;color:#059669;margin-bottom:8px}
    .label{font-size:13px;color:#9CA3AF;margin-bottom:28px}
    .btn{display:block;width:100%;padding:16px;background:#059669;color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;text-decoration:none;margin-bottom:12px}
    .upi-apps{display:flex;justify-content:center;gap:8px;margin:16px 0}
    .app-badge{font-size:11px;color:#6B7280;background:#F3F4F6;padding:4px 10px;border-radius:20px}
    .note{font-size:11px;color:#9CA3AF;margin-top:16px;line-height:1.5}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">💳</div>
    <div class="gym">${pn || 'Gym'}</div>
    <div class="plan">${tn || 'Membership Payment'}</div>
    <div class="amount">${displayAmt}</div>
    <div class="label">Pay via UPI</div>
    <a href="${upiLink}" class="btn">Tap to Pay Now</a>
    <div class="upi-apps">
      <span class="app-badge">GPay</span>
      <span class="app-badge">PhonePe</span>
      <span class="app-badge">Paytm</span>
      <span class="app-badge">BHIM</span>
    </div>
    <div class="note">UPI ID: <strong>${pa}</strong><br>Open any UPI app and pay to this ID if the button doesn't work.</div>
  </div>
  <script>
    // Auto-trigger on mobile after a short delay
    setTimeout(() => { window.location.href = "${upiLink}"; }, 800);
  </script>
</body>
</html>`);
});

// ── Syllabrix Platform Layer ───────────────────────────────────────────────────
app.use('/api/platform', superadminRoutes);
app.use('/api/platform/activity', activityRoutes);
app.use('/api/platform/support', supportRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/platform/compliance', complianceRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/platform/announcements', announcementsRoutes);
app.use('/api/v1/announcements', announcementsRoutes);
app.use('/api/platform/builder', businessBuilderRoutes);

// Public maintenance check — no auth required, consumed by tenant app
app.get('/api/v1/maintenance/active', async (req, res) => {
  try {
    const prisma = require('./config/prisma');
    const window = await prisma.maintenanceWindow.findFirst({ where: { isActive: true }, orderBy: { startAt: 'desc' } });
    res.json({ success: true, data: window || null });
  } catch {
    res.json({ success: true, data: null });
  }
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
