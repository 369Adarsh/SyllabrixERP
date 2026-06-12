const axios = require('axios');
const prisma = require('../../config/prisma');
const config = require('../../config/env');

const WA_BASE = () => `https://graph.facebook.com/v19.0/${config.whatsappPhoneId}/messages`;
const WA_HEADERS = () => ({
  Authorization: `Bearer ${config.whatsappToken}`,
  'Content-Type': 'application/json',
});

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── Core send ────────────────────────────────────────────────────────────────
const sendRaw = async (payload) => {
  try {
    const { data } = await axios.post(WA_BASE(), payload, { headers: WA_HEADERS() });
    return data;
  } catch (err) {
    // Surface Meta's actual error message instead of generic axios error
    const metaError = err.response?.data?.error;
    if (metaError) {
      const msg = metaError.error_user_msg || metaError.message || 'WhatsApp API error';
      const code = metaError.code;
      // Common Meta error codes with friendly messages
      const friendly = {
        131030: 'Recipient phone number is not registered on WhatsApp.',
        131047: 'Message failed — recipient may have opted out or number is invalid.',
        131026: 'Recipient number is not on WhatsApp.',
        100:    'Invalid phone number format. Use 10-digit Indian mobile number.',
        190:    'WhatsApp access token has expired. Please refresh it in Meta Developer Console.',
        200:    'Permission denied — check your WhatsApp Business account permissions.',
        368:    'Your WhatsApp Business account has been temporarily blocked.',
        // Test account limitation
        131051: 'This number is not in your test recipients list. Add it in Meta Developer Console → WhatsApp → API Setup.',
      };
      const readableMsg = friendly[code] || `${msg} (Meta error code: ${code})`;
      const e = new Error(readableMsg);
      e.statusCode = 400;
      e.metaCode = code;
      throw e;
    }
    throw err;
  }
};

const sendText = async (tenantId, phone, body, contactName = null) => {
  const normalized = normalizePhone(phone);
  const payload = {
    messaging_product: 'whatsapp',
    to: normalized,
    type: 'text',
    text: { body },
  };
  const result = await sendRaw(payload);
  await prisma.whatsAppMessage.create({
    data: { tenantId, phone: normalized, contactName, direction: 'OUTBOUND', body, waMessageId: result?.messages?.[0]?.id, status: 'SENT' },
  });
  return result;
};

// ── Invoice notification ─────────────────────────────────────────────────────
const sendInvoice = async (tenantId, invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true, tenant: true, items: true },
  });
  if (!invoice) throw new Error('Invoice not found');
  if (!invoice.customer?.phone) throw new Error('Customer has no phone number');

  const itemLines = invoice.items.map(i => `  • ${i.description} × ${i.quantity} = ${fmt(i.total)}`).join('\n');
  const body = `🧾 *Invoice from ${invoice.tenant.name}*\n\nInvoice #: ${invoice.invoiceNumber}\nDate: ${new Date(invoice.issueDate).toLocaleDateString('en-IN')}\nDue Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}\n\n${itemLines}\n\n*Total: ${fmt(invoice.total)}*\nPaid: ${fmt(invoice.amountPaid)}\n*Balance Due: ${fmt(invoice.balanceDue)}*\n\nPlease contact us for payment: ${invoice.tenant.phone}`;

  return sendText(tenantId, invoice.customer.phone, body, invoice.customer.name);
};

// ── Appointment reminder ─────────────────────────────────────────────────────
const sendAppointmentReminder = async (tenantId, appointmentId) => {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, service: true, tenant: true },
  });
  if (!appt) throw new Error('Appointment not found');
  if (!appt.customer?.phone) throw new Error('Customer has no phone number');

  const dt = new Date(appt.startTime || appt.scheduledAt);
  const dateStr = dt.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const body = `📅 *Appointment Reminder — ${appt.tenant.name}*\n\nHello ${appt.customer.name},\n\nYou have an appointment scheduled:\n📌 *${appt.service?.name || appt.title}*\n📆 ${dateStr} at ${timeStr}\n\nPlease arrive 5 minutes early. For any changes, contact us at ${appt.tenant.phone}.\n\nSee you soon! 🙏`;

  return sendText(tenantId, appt.customer.phone, body, appt.customer.name);
};

// ── Fee due reminder ─────────────────────────────────────────────────────────
const sendFeeReminder = async (tenantId, feeId) => {
  const fee = await prisma.feeRecord.findUnique({
    where: { id: feeId },
    include: { student: true, tenant: true },
  });
  if (!fee) throw new Error('Fee record not found');
  const phone = fee.student?.phone || fee.student?.parentPhone;
  if (!phone) throw new Error('Student has no phone number');

  const dueStr = new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const balance = fee.netAmount - fee.paidAmount;
  const body = `📚 *Fee Reminder — ${fee.tenant.name}*\n\nDear ${fee.student?.parentName || fee.student?.name},\n\n${fee.description} for *${fee.student.name}* is due.\n\n💰 Total Amount: ${fmt(fee.netAmount)}\n✅ Paid: ${fmt(fee.paidAmount)}\n⚠️ *Balance Due: ${fmt(balance)}*\n📅 Due Date: ${dueStr}\n\nPlease clear the dues on time to avoid late fees. Contact us at ${fee.tenant.phone}.\n\nThank you!`;

  return sendText(tenantId, phone, body, fee.student.parentName || fee.student.name);
};

// ── Rent due reminder ────────────────────────────────────────────────────────
const sendRentReminder = async (tenantId, leaseId) => {
  const lease = await prisma.leaseTenant.findUnique({
    where: { id: leaseId },
    include: { unit: true, tenant: true },
  });
  if (!lease) throw new Error('Lease not found');
  if (!lease.phone) throw new Error('Tenant has no phone number');

  const body = `🏢 *Rent Due — ${lease.tenant.name}*\n\nDear ${lease.contactName || lease.businessName},\n\nYour monthly rent is due:\n🏪 Shop/Unit: ${lease.unit?.unitNumber}\n💰 *Rent Amount: ${fmt(lease.monthlyRent)}*\n\nPlease make the payment at your earliest convenience. Contact us at ${lease.tenant.phone}.\n\nThank you!`;

  return sendText(tenantId, lease.phone, body, lease.contactName);
};

// ── Bulk reminder dispatch ───────────────────────────────────────────────────
const dispatchOverdueFeeReminders = async (tenantId) => {
  const overdue = await prisma.feeRecord.findMany({
    where: { tenantId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }, dueDate: { lt: new Date() } },
    include: { student: true },
  });
  const results = [];
  for (const fee of overdue) {
    const phone = fee.student?.phone || fee.student?.parentPhone;
    if (!phone) continue;
    try {
      await sendFeeReminder(tenantId, fee.id);
      results.push({ id: fee.id, status: 'sent' });
    } catch (e) {
      results.push({ id: fee.id, status: 'failed', error: e.message });
    }
  }
  return results;
};

// ── Inbox / conversation threads ─────────────────────────────────────────────
const getConversations = async (tenantId) => {
  const messages = await prisma.whatsAppMessage.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
  const threads = {};
  for (const msg of messages) {
    if (!threads[msg.phone]) {
      threads[msg.phone] = { phone: msg.phone, contactName: msg.contactName, lastMessage: msg.body, lastAt: msg.createdAt, unread: 0, messages: [] };
    }
    if (msg.direction === 'INBOUND' && msg.status !== 'READ') threads[msg.phone].unread++;
    threads[msg.phone].messages.push(msg);
  }
  return Object.values(threads).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
};

const getThread = async (tenantId, phone) => {
  const normalized = normalizePhone(phone);
  return prisma.whatsAppMessage.findMany({
    where: { tenantId, phone: normalized },
    orderBy: { createdAt: 'asc' },
  });
};

// ── Freelancer notifications ──────────────────────────────────────────────────
const isWAReady = () => !!(config.whatsappToken && config.whatsappPhoneId);

const flTenantName = async (tenantId) => {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
  return t?.name || 'Your service provider';
};

const sendFlJobCreated = async (tenantId, phone, contactName, job) => {
  if (!isWAReady() || !phone) return;
  const biz = await flTenantName(tenantId);
  const body = [
    `Hi ${contactName || 'there'}! 👋`,
    ``,
    `Your job has been created with *${biz}*.`,
    ``,
    `📋 *Job #:* ${job.jobNumber}`,
    `🔧 *Work:* ${job.workType}`,
    job.jobValue ? `💰 *Value:* ₹${Number(job.jobValue).toLocaleString('en-IN')}` : null,
    job.startDate ? `📅 *Start:* ${new Date(job.startDate).toLocaleDateString('en-IN')}` : null,
    ``,
    `We'll keep you updated at every step. Thank you! 🙏`,
  ].filter(l => l !== null).join('\n');
  return sendText(tenantId, phone, body, contactName).catch(e => console.error('[WA] sendFlJobCreated failed:', e.message));
};

const STATUS_LABELS = {
  ENQUIRY: 'Enquiry received', ESTIMATE_SENT: 'Estimate sent',
  IN_PROGRESS: 'Work started', COMPLETED: 'Work completed',
  PAYMENT_PENDING: 'Payment pending', CLOSED: 'Job closed', CANCELLED: 'Job cancelled',
};
const STATUS_EMOJI = {
  ENQUIRY: '📩', ESTIMATE_SENT: '📄', IN_PROGRESS: '🔨',
  COMPLETED: '✅', PAYMENT_PENDING: '⏳', CLOSED: '🔒', CANCELLED: '❌',
};

const sendFlStatusUpdate = async (tenantId, phone, contactName, job) => {
  if (!isWAReady() || !phone) return;
  const biz = await flTenantName(tenantId);
  const emoji = STATUS_EMOJI[job.status] || '📌';
  const label = STATUS_LABELS[job.status] || job.status;
  const body = [
    `${emoji} *Status Update — ${biz}*`,
    ``,
    `Job *${job.jobNumber}* (${job.workType})`,
    `Status: *${label}*`,
    job.status === 'COMPLETED' ? `\nThank you for choosing us! 🙏` : `\nFor any queries, please reach out to us.`,
  ].join('\n');
  return sendText(tenantId, phone, body, contactName).catch(e => console.error('[WA] sendFlStatusUpdate failed:', e.message));
};

const sendFlPaymentReceived = async (tenantId, phone, contactName, job, payment) => {
  if (!isWAReady() || !phone) return;
  const biz = await flTenantName(tenantId);
  const body = [
    `✅ *Payment Received — ${biz}*`,
    ``,
    `Hi ${contactName || 'there'},`,
    ``,
    `We've received your payment:`,
    `💰 *Amount:* ₹${Number(payment.amount).toLocaleString('en-IN')}`,
    `💳 *Mode:* ${payment.mode}`,
    `📋 *Job:* ${job.jobNumber} — ${job.workType}`,
    payment.note ? `📝 *Note:* ${payment.note}` : null,
    ``,
    `Thank you! 🙏`,
  ].filter(l => l !== null).join('\n');
  return sendText(tenantId, phone, body, contactName).catch(e => console.error('[WA] sendFlPaymentReceived failed:', e.message));
};

const sendFlAMCReminder = async (tenantId, phone, contactName, amc, daysLeft) => {
  if (!isWAReady() || !phone) return;
  const biz = await flTenantName(tenantId);
  const urgency = daysLeft <= 7 ? '🚨 *Urgent Reminder*' : '⏰ *Renewal Reminder*';
  const body = [
    `${urgency} — ${biz}`,
    ``,
    `Hi ${contactName || 'there'},`,
    ``,
    `Your *${amc.workType}* contract is expiring in *${daysLeft} day${daysLeft !== 1 ? 's' : ''}*.`,
    `📅 Expiry: ${new Date(amc.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    amc.annualFee ? `💰 Annual Fee: ₹${Number(amc.annualFee).toLocaleString('en-IN')}` : null,
    ``,
    `Please contact us to renew your contract on time. Thank you! 🙏`,
  ].filter(l => l !== null).join('\n');
  return sendText(tenantId, phone, body, contactName).catch(e => console.error('[WA] sendFlAMCReminder failed:', e.message));
};

// ── Incoming webhook handler ──────────────────────────────────────────────────
const handleInbound = async (tenantId, entry) => {
  const changes = entry?.changes || [];
  for (const change of changes) {
    const value = change.value;
    const messages = value?.messages || [];
    const contacts = value?.contacts || [];
    for (const msg of messages) {
      if (msg.type !== 'text') continue;
      const phone = msg.from;
      const contactName = contacts.find(c => c.wa_id === phone)?.profile?.name || null;
      const body = msg.text?.body || '';

      await prisma.whatsAppMessage.upsert({
        where: { waMessageId: msg.id },
        update: {},
        create: { tenantId, phone, contactName, direction: 'INBOUND', body, waMessageId: msg.id, status: 'DELIVERED' },
      });

      // Auto-create inquiry job if no recent inquiry from this number
      await _autoCreateInquiry(tenantId, phone, contactName, body);
    }
  }
};

const _autoCreateInquiry = async (tenantId, phone, contactName, messageBody) => {
  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour dedup window
    const existing = await prisma.flJob.findFirst({
      where: { tenantId, customerPhone: phone, createdAt: { gte: cutoff } },
    });
    if (existing) return; // Already created an inquiry recently

    const count = await prisma.flJob.count({ where: { tenantId } });
    const jobNumber = `JOB-${String(count + 1).padStart(4, '0')}`;
    const job = await prisma.flJob.create({
      data: {
        tenantId, jobNumber,
        customerName: contactName || 'WhatsApp Inquiry',
        customerPhone: phone,
        workType: 'WhatsApp Inquiry',
        description: messageBody,
        status: 'ENQUIRY',
      },
    });

    const biz = await flTenantName(tenantId);
    const reply = [
      `Thank you for reaching out to *${biz}*! 🙏`,
      ``,
      `We've received your message and will get back to you shortly.`,
      ``,
      `📋 *Reference:* ${jobNumber}`,
      ``,
      `_This is an automated acknowledgment._`,
    ].join('\n');

    await sendText(tenantId, phone, reply, contactName);
    console.log(`[WA Inbound] Auto-created inquiry ${jobNumber} for ${phone} (tenant ${tenantId})`);
  } catch (e) {
    console.error('[WA Inbound] Failed to auto-create inquiry:', e.message);
  }
};

// ── Util ─────────────────────────────────────────────────────────────────────
function normalizePhone(phone) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);          // strip STD trunk prefix
  if (p.length === 10) p = '91' + p;              // always add country code for 10-digit numbers
  if (p.startsWith('+')) p = p.slice(1);          // strip + if present
  return p;
}

module.exports = {
  sendText, sendInvoice, sendAppointmentReminder, sendFeeReminder, sendRentReminder,
  dispatchOverdueFeeReminders, getConversations, getThread, handleInbound,
  sendFlJobCreated, sendFlStatusUpdate, sendFlPaymentReceived, sendFlAMCReminder,
  isWAReady,
};
