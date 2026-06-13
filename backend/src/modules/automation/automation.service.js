const cron = require('node-cron');
const prisma = require('../../config/prisma');
const { sendText, sendFlAMCReminder } = require('../whatsapp/whatsapp.service');

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ── Low stock check (called per-sale from pos.service) ────────────────────────
const checkLowStock = async (tenantId, productId) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const ac = tenant?.automationConfig || {};
    if (!ac.lowStockAlerts) return;
    const threshold = ac.lowStockThreshold ?? 5;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product && product.stock <= threshold) {
      console.log(`[Low Stock] ${tenant.name}: "${product.name}" is at ${product.stock} units (threshold: ${threshold})`);
    }
  } catch { /* non-critical */ }
};

// ── Build daily digest for one tenant ─────────────────────────────────────────
const buildDailyDigest = async (tenantId) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, phone: true, automationConfig: true },
  });
  if (!tenant || !tenant.phone) return null;

  const threshold = tenant.automationConfig?.lowStockThreshold ?? 5;

  const [sales, invoicePayments, newCustomers, overdueInvoices, expenses, lowStockCount] = await Promise.all([
    prisma.transaction.findMany({ where: { tenantId, createdAt: { gte: today, lt: tomorrow } }, select: { total: true } }),
    prisma.payment.findMany({ where: { invoice: { tenantId }, createdAt: { gte: today, lt: tomorrow } }, select: { amount: true } }),
    prisma.customer.count({ where: { tenantId, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.invoice.findMany({ where: { tenantId, status: 'OVERDUE' }, select: { balanceDue: true } }),
    prisma.expense.findMany({ where: { tenantId, date: { gte: today, lt: tomorrow } }, select: { amount: true } }),
    prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: threshold } } }),
  ]);

  const totalSales = sales.reduce((s, t) => s + t.total, 0);
  const totalInvoiceCollected = invoicePayments.reduce((s, p) => s + p.amount, 0);
  const totalRevenue = totalSales + totalInvoiceCollected;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const overdueTotal = overdueInvoices.reduce((s, i) => s + i.balanceDue, 0);
  const net = totalRevenue - totalExpenses;

  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const lines = [
    `📊 *Daily Summary — ${dateStr}*`,
    `_${tenant.name}_`,
    ``,
    `💰 *Revenue*`,
    `• POS Sales: ${fmt(totalSales)} (${sales.length} bills)`,
    `• Invoices collected: ${fmt(totalInvoiceCollected)}`,
    `• *Total: ${fmt(totalRevenue)}*`,
    ``,
    `💸 *Expenses: ${fmt(totalExpenses)}*`,
    ``,
    `📈 *Net: ${net >= 0 ? '🟢' : '🔴'} ${fmt(Math.abs(net))} ${net >= 0 ? 'profit' : 'loss'}*`,
  ];

  if (newCustomers > 0) lines.push(``, `👥 New customers today: ${newCustomers}`);
  if (overdueInvoices.length > 0) lines.push(``, `⚠️ Overdue: ${overdueInvoices.length} invoices (${fmt(overdueTotal)})`);
  if (lowStockCount > 0) lines.push(``, `📦 Low stock: ${lowStockCount} item${lowStockCount !== 1 ? 's' : ''}`);

  lines.push(``, `_Powered by Syllabrix_ 🚀`);

  return { tenant, message: lines.join('\n') };
};

// ── Send digest for a single tenant (also callable from API for test trigger) ─
const sendDailyDigest = async (tenantId) => {
  try {
    const result = await buildDailyDigest(tenantId);
    if (!result) return { sent: false, reason: 'No phone number configured on business profile' };

    await sendText(tenantId, result.tenant.phone, result.message, result.tenant.name);
    console.log(`[Digest] Sent to ${result.tenant.name} (${result.tenant.phone})`);
    return { sent: true, phone: result.tenant.phone };
  } catch (err) {
    console.error(`[Digest] Failed for tenant ${tenantId}:`, err.message);
    return { sent: false, reason: err.message };
  }
};

// ── Cron jobs ─────────────────────────────────────────────────────────────────
const startAutomation = () => {
  // Nightly digest at 8:30 PM IST — opt-in per tenant via automationConfig.whatsappDigest
  cron.schedule('30 20 * * *', async () => {
    console.log('[Digest] Starting nightly WhatsApp digest…');
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true, phone: { not: null } },
      select: { id: true, name: true, automationConfig: true },
    });
    let sent = 0, skipped = 0;
    for (const tenant of tenants) {
      if (!tenant.automationConfig?.whatsappDigest) { skipped++; continue; }
      const r = await sendDailyDigest(tenant.id);
      if (r.sent) sent++;
    }
    console.log(`[Digest] Done — ${sent} sent, ${skipped} skipped`);
  }, { timezone: 'Asia/Kolkata' });

  // EOD console log at 8 PM IST (always runs regardless of opt-in)
  cron.schedule('0 20 * * *', async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const tenants = await prisma.tenant.findMany({ where: { isActive: true }, select: { id: true, name: true } });
    for (const tenant of tenants) {
      const sales = await prisma.transaction.findMany({ where: { tenantId: tenant.id, createdAt: { gte: today, lt: tomorrow } } });
      const total = sales.reduce((s, t) => s + t.total, 0);
      console.log(`[EOD] ${tenant.name}: ${sales.length} sales, ₹${total.toFixed(2)}`);
    }
  }, { timezone: 'Asia/Kolkata' });

  // AMC expiry reminders — daily at 9 AM IST
  cron.schedule('0 9 * * *', async () => {
    console.log('[AMC] Checking expiring contracts…');
    const now = new Date();
    const in30 = new Date(now); in30.setDate(now.getDate() + 30);
    const in7  = new Date(now); in7.setDate(now.getDate() + 7);
    const in8  = new Date(now); in8.setDate(now.getDate() + 8);

    // Only process AMCs for tenants with an active WA session to avoid full-table scans
    const activeSessions = await prisma.waSession.findMany({ select: { id: true } });
    const activeTenantIds = activeSessions.map(s => s.id);
    if (activeTenantIds.length === 0) return;

    // Contracts expiring in exactly 30 days or exactly 7 days (±12h window)
    const contracts = await prisma.flAMC.findMany({
      where: {
        tenantId: { in: activeTenantIds },
        endDate: {
          gte: new Date(in7.getTime() - 12 * 3600 * 1000),
          lte: new Date(in30.getTime() + 12 * 3600 * 1000),
        },
      },
    });

    for (const amc of contracts) {
      const daysLeft = Math.ceil((new Date(amc.endDate) - now) / 86_400_000);
      if (daysLeft !== 30 && daysLeft !== 7) continue;
      try {
        await sendFlAMCReminder(amc.tenantId, amc.clientPhone, amc.clientName, amc, daysLeft);
        console.log(`[AMC] Sent ${daysLeft}d reminder → ${amc.clientPhone} (${amc.workType})`);
      } catch (e) {
        console.error(`[AMC] Reminder failed for ${amc.id}:`, e.message);
      }
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[Automation] Cron jobs started (IST timezone)');
};

module.exports = { startAutomation, checkLowStock, sendDailyDigest, buildDailyDigest };
