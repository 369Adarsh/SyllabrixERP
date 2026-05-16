const axios = require('axios');
const prisma = require('../../config/prisma');
const config = require('../../config/env');

const WA_BASE = `https://graph.facebook.com/v19.0/${config.whatsappPhoneId}/messages`;
const WA_HEADERS = () => ({
  Authorization: `Bearer ${config.whatsappToken}`,
  'Content-Type': 'application/json',
});

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── Core send ────────────────────────────────────────────────────────────────
const sendRaw = async (payload) => {
  const { data } = await axios.post(WA_BASE, payload, { headers: WA_HEADERS() });
  return data;
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

// ── Incoming webhook handler ─────────────────────────────────────────────────
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
      await prisma.whatsAppMessage.upsert({
        where: { waMessageId: msg.id },
        update: {},
        create: { tenantId, phone, contactName, direction: 'INBOUND', body: msg.text?.body || '', waMessageId: msg.id, status: 'DELIVERED' },
      });
    }
  }
};

// ── Util ─────────────────────────────────────────────────────────────────────
function normalizePhone(phone) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (!p.startsWith('91') && p.length === 10) p = '91' + p;
  return p;
}

module.exports = {
  sendText, sendInvoice, sendAppointmentReminder, sendFeeReminder, sendRentReminder,
  dispatchOverdueFeeReminders, getConversations, getThread, handleInbound,
};
