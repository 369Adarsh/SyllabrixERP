const crypto = require('crypto');
const svc = require('./whatsapp.service');
const config = require('../../config/env');
const prisma = require('../../config/prisma');
const { ok } = require('../../utils/response');

// GET /whatsapp/webhook  — Meta webhook verification challenge
const verify = (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.whatsappWebhookSecret) {
    return res.status(200).send(challenge);
  }
  res.status(403).json({ error: 'Forbidden' });
};

// Resolve which tenant owns this incoming WhatsApp phone number ID
// For single-tenant WhatsApp deployment: matches against env config
// TODO: For multi-tenant, store phone_number_id per tenant in DB
const resolveTenantId = async (phoneNumberId) => {
  if (!phoneNumberId) return null;
  if (config.whatsappPhoneId && phoneNumberId === config.whatsappPhoneId) {
    const tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return tenant?.id || null;
  }
  return null;
};

// POST /whatsapp/webhook  — incoming messages from Meta
// Mounted in app.js with express.raw() so req.body is a Buffer for HMAC verification
const webhook = async (req, res) => {
  // Always respond 200 immediately — Meta requires acknowledgment within 20 seconds
  res.status(200).send('EVENT_RECEIVED');

  try {
    const secret = config.whatsappWebhookSecret;

    if (secret) {
      const signature = req.headers['x-hub-signature-256'];
      if (!signature) {
        console.warn('[SECURITY] WhatsApp webhook: missing X-Hub-Signature-256 header — ignoring');
        return;
      }

      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
      const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const sigBuf      = Buffer.from(signature);
      const expectedBuf = Buffer.from(expected);
      const valid = sigBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(sigBuf, expectedBuf);

      if (!valid) {
        console.warn('[SECURITY] WhatsApp webhook: invalid signature — ignoring');
        return;
      }
    }

    const body = Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString('utf8'))
      : req.body;

    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      const phoneNumberId = entry.changes?.[0]?.value?.metadata?.phone_number_id;
      const tenantId = await resolveTenantId(phoneNumberId);
      if (!tenantId) continue;
      await svc.handleInbound(tenantId, entry);
    }
  } catch (e) {
    console.error('WhatsApp webhook error:', e.message);
  }
};

// POST /whatsapp/send
const send = async (req, res, next) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ success: false, message: 'phone and message required' });
    const result = await svc.sendText(req.tenantId, phone, message);
    ok(res, result);
  } catch (e) { next(e); }
};

// POST /whatsapp/send-invoice/:invoiceId
const sendInvoice = async (req, res, next) => {
  try {
    const result = await svc.sendInvoice(req.tenantId, req.params.invoiceId);
    ok(res, result, 'Invoice sent via WhatsApp');
  } catch (e) { next(e); }
};

// POST /whatsapp/send-appointment-reminder/:appointmentId
const sendAppointmentReminder = async (req, res, next) => {
  try {
    const result = await svc.sendAppointmentReminder(req.tenantId, req.params.appointmentId);
    ok(res, result, 'Reminder sent');
  } catch (e) { next(e); }
};

// POST /whatsapp/send-fee-reminder/:feeId
const sendFeeReminder = async (req, res, next) => {
  try {
    const result = await svc.sendFeeReminder(req.tenantId, req.params.feeId);
    ok(res, result, 'Reminder sent');
  } catch (e) { next(e); }
};

// POST /whatsapp/send-rent-reminder/:leaseId
const sendRentReminder = async (req, res, next) => {
  try {
    const result = await svc.sendRentReminder(req.tenantId, req.params.leaseId);
    ok(res, result, 'Reminder sent');
  } catch (e) { next(e); }
};

// POST /whatsapp/bulk-fee-reminders
const bulkFeeReminders = async (req, res, next) => {
  try {
    const results = await svc.dispatchOverdueFeeReminders(req.tenantId);
    ok(res, results, `Dispatched ${results.length} reminders`);
  } catch (e) { next(e); }
};

// GET /whatsapp/qr-status  — returns QR string + connection status for this tenant
const qrStatus = (req, res) => {
  const { getStatus, connectTenant } = require('./baileys.service');
  const tenantId = req.tenantId;
  const info = getStatus(tenantId);
  // If disconnected and no session pending, kick off a new connection attempt
  if (info.status === 'disconnected') {
    connectTenant(tenantId).catch(() => {});
  }
  res.json(info);
};

// POST /whatsapp/disconnect  — unlink WhatsApp for this tenant
const disconnectWA = async (req, res, next) => {
  try {
    const { disconnectTenant } = require('./baileys.service');
    await disconnectTenant(req.tenantId);
    res.json({ success: true, message: 'WhatsApp disconnected' });
  } catch (e) { next(e); }
};

// GET /whatsapp/qr.png  — returns HTML page with scannable QR for this tenant
const qrImage = (req, res) => {
  const { getStatus, connectTenant } = require('./baileys.service');
  const tenantId = req.tenantId;
  const { status, qr } = getStatus(tenantId);
  // Kick off connection if not already started
  if (status === 'disconnected') connectTenant(tenantId).catch(() => {});

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-store');

  if (status === 'connected') {
    return res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px">
      <h2 style="color:#16a34a">✅ WhatsApp Connected!</h2>
      <p>Your WhatsApp is linked and automation is active.</p>
    </body></html>`);
  }

  if (!qr) {
    return res.send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="4"></head>
      <body style="font-family:sans-serif;text-align:center;padding:40px">
      <h2>⏳ QR not ready yet…</h2>
      <p>Auto-refreshing in 4 seconds. Status: <strong>${status}</strong></p>
    </body></html>`);
  }

  const encoded = encodeURIComponent(qr);
  return res.send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="30">
    <style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f9f9f9}
    img{border:3px solid #e5e7eb;border-radius:12px;margin:20px auto;display:block}
    h2{color:#111}p{color:#555}</style></head>
    <body>
      <h2>📱 Scan to Link WhatsApp</h2>
      <p>Open WhatsApp → <strong>⋮ Menu</strong> → <strong>Linked Devices</strong> → <strong>Link a Device</strong></p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encoded}" width="350" height="350" alt="WhatsApp QR Code"/>
      <p style="font-size:13px;color:#9ca3af">QR refreshes every 30 seconds. Page auto-reloads.</p>
    </body></html>`);
};

// GET /whatsapp/conversations
const conversations = async (req, res, next) => {
  try {
    ok(res, await svc.getConversations(req.tenantId));
  } catch (e) { next(e); }
};

// GET /whatsapp/conversations/:phone
const thread = async (req, res, next) => {
  try {
    ok(res, await svc.getThread(req.tenantId, req.params.phone));
  } catch (e) { next(e); }
};

module.exports = {
  verify, webhook, qrStatus, qrImage, disconnectWA,
  send, sendInvoice, sendAppointmentReminder, sendFeeReminder, sendRentReminder,
  bulkFeeReminders, conversations, thread,
};
