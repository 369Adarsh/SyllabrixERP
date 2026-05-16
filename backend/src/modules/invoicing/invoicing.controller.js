const crypto = require('crypto');
const svc = require('./invoicing.service');
const { ok, created } = require('../../utils/response');

const list = async (req, res, next) => {
  try { ok(res, await svc.list(req.tenantId, req.query)); } catch (e) { next(e); }
};
const get = async (req, res, next) => {
  try { ok(res, await svc.get(req.tenantId, req.params.id)); } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try { created(res, await svc.create(req.tenantId, req.body), 'Invoice created'); } catch (e) { next(e); }
};
const updateStatus = async (req, res, next) => {
  try { ok(res, await svc.updateStatus(req.tenantId, req.params.id, req.body.status), 'Status updated'); } catch (e) { next(e); }
};
const recordPayment = async (req, res, next) => {
  try { created(res, await svc.recordPayment(req.tenantId, req.params.id, req.body), 'Payment recorded'); } catch (e) { next(e); }
};
const remove = async (req, res, next) => {
  try { ok(res, await svc.remove(req.tenantId, req.params.id), 'Invoice cancelled'); } catch (e) { next(e); }
};
const createPaymentLink = async (req, res, next) => {
  try { ok(res, await svc.createPaymentLink(req.tenantId, req.params.id), 'Payment link ready'); } catch (e) { next(e); }
};

// Called directly by Razorpay — no auth middleware, raw body for signature
const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);

    if (secret && signature) {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      if (signature !== expected) return res.status(400).json({ error: 'Invalid signature' });
    }

    const body = JSON.parse(rawBody);
    if (body.event === 'payment_link.paid') {
      await svc.handlePaymentLinkPaid(body.payload);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    res.status(500).json({ error: 'Webhook error' });
  }
};

module.exports = { list, get, create, updateStatus, recordPayment, remove, createPaymentLink, razorpayWebhook };
