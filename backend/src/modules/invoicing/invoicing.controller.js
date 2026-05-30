const crypto = require('crypto');
const config = require('../../config/env');
const svc = require('./invoicing.service');
const { ok, created } = require('../../utils/response');
const activity = require('../activity/activity.service');

const list = async (req, res, next) => {
  try {
    const params = { ...req.query };
    if (req.user?.role === 'MANAGER' && req.user.branchId) params.branchId = req.user.branchId;
    ok(res, await svc.list(req.tenantId, params));
  } catch (e) { next(e); }
};
const get = async (req, res, next) => {
  try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try {
    const inv = await svc.create(req.tenantId, req.body);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'INVOICE_CREATED', 'invoicing', 'Invoice', inv.id, { amount: inv.total, customerName: inv.customerName }, ipAddress);
    created(res, inv, 'Invoice created');
  } catch (e) { next(e); }
};
const updateStatus = async (req, res, next) => {
  try {
    const inv = await svc.updateStatus(req.tenantId, req.params.id, req.body.status);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, `INVOICE_${req.body.status}`, 'invoicing', 'Invoice', req.params.id, { status: req.body.status }, ipAddress);
    ok(res, inv, 'Status updated');
  } catch (e) { next(e); }
};
const recordPayment = async (req, res, next) => {
  try {
    const result = await svc.recordPayment(req.tenantId, req.params.id, req.body);
    const { tenantId, userId, userName, userRole, ipAddress } = activity.fromReq(req);
    activity.log(tenantId, userId, userName, userRole, 'PAYMENT_RECORDED', 'invoicing', 'Invoice', req.params.id, { amount: req.body.amount, method: req.body.method }, ipAddress);
    created(res, result, 'Payment recorded');
  } catch (e) { next(e); }
};
const remove = async (req, res, next) => {
  try { ok(res, await svc.remove(req.tenantId, req.params.id), 'Invoice cancelled'); } catch (e) { next(e); }
};
const createPaymentLink = async (req, res, next) => {
  try { ok(res, await svc.createPaymentLink(req.tenantId, req.params.id), 'Payment link ready'); } catch (e) { next(e); }
};

// Called directly by Razorpay — no auth middleware, raw body for HMAC verification
const razorpayWebhook = async (req, res) => {
  try {
    const secret = config.razorpayWebhookSecret;
    const signature = req.headers['x-razorpay-signature'];

    // Always reject if secret is not configured — never silently accept unverified payloads
    if (!secret) {
      console.error('[SECURITY] RAZORPAY_WEBHOOK_SECRET not configured — rejecting webhook');
      return res.status(500).json({ error: 'Webhook not configured' });
    }
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const sigBuf      = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    const valid = sigBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(sigBuf, expectedBuf);

    if (!valid) return res.status(400).json({ error: 'Invalid signature' });

    const body = JSON.parse(rawBody);
    if (body.event === 'payment_link.paid') {
      await svc.handlePaymentLinkPaid(body.payload);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err.message);
    res.status(500).json({ error: 'Webhook error' });
  }
};

module.exports = { list, get, create, updateStatus, recordPayment, remove, createPaymentLink, razorpayWebhook };
