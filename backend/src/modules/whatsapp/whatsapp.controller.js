const svc = require('./whatsapp.service');
const config = require('../../config/env');
const { ok } = require('../../utils/response');

// GET /whatsapp/webhook  — Meta webhook verification
const verify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.whatsappWebhookSecret) {
    return res.status(200).send(challenge);
  }
  res.status(403).json({ error: 'Forbidden' });
};

// POST /whatsapp/webhook  — incoming messages
const webhook = async (req, res) => {
  res.status(200).send('EVENT_RECEIVED');
  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;
    for (const entry of body.entry || []) {
      // Use tenantId from waba account mapping — for now map to first tenant with matching WABA
      const tenantId = req.tenantId || null;
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

module.exports = { verify, webhook, send, sendInvoice, sendAppointmentReminder, sendFeeReminder, sendRentReminder, bulkFeeReminders, conversations, thread };
