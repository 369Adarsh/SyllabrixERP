const config = require('../../config/env');
const prisma = require('../../config/prisma');

// AI Copilot — uses Claude API for business intelligence queries
const chat = async (tenantId, { message, history = [] }) => {
  if (!config.anthropicApiKey) {
    throw Object.assign(new Error('AI service not configured'), { statusCode: 503 });
  }

  const [tenant, todayStats] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, businessType: true } }),
    prisma.transaction.aggregate({
      where: { tenantId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const systemPrompt = `You are the Syllabrix AI Copilot for ${tenant.name}, a ${tenant.businessType.toLowerCase()} business.
Today's revenue: ₹${(todayStats._sum.total || 0).toLocaleString('en-IN')} from ${todayStats._count} transactions.
You have access to the business's ERP data. Answer questions concisely and helpfully.
Focus on actionable insights. Never be sycophantic. Lead with numbers when relevant.`;

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw Object.assign(new Error(err.error?.message || 'AI error'), { statusCode: 502 });
  }

  const data = await response.json();
  return { reply: data.content[0].text };
};

// ── Alert Intelligence System — business-type-aware contextual insights ──────

const PROFILE_POS_RETAIL = ['RETAIL','KIRANA','RESTAURANT','WORKSHOP','MEDICAL_STORE','STATIONARY','SWEET_SHOP','BAKERY','JEWELLERY','HARDWARE','ELECTRICAL','CLOTHING','FOOTWEAR','ELECTRONICS','BOOKSTORE','FLORIST','DHABA','CLOUD_KITCHEN','JUICE_BAR','CANTEEN_MESS','DEALER','COURIER','OTHER'];
const PROFILE_SALON_POS  = ['SALON','BEAUTY_PARLOUR','BARBERSHOP','MOBILE_REPAIR','OPTICAL','VET_CLINIC','LAUNDRY'];
const PROFILE_CLINIC     = ['CLINIC','DENTAL','DIAGNOSTIC_LAB','AYURVEDA','HOSPITAL','PHYSIOTHERAPY'];
const PROFILE_COACHING   = ['COACHING','HOME_TUITION','MUSIC_SCHOOL','DANCE_ACADEMY','DRIVING_SCHOOL','COMPUTER_TRAINING'];
const PROFILE_GYM        = ['GYM','SPA'];
const PROFILE_EVENT      = ['EVENT_PLANNER','DECORATOR','TENT_HOUSE','CATERING','PHOTOGRAPHY','TAILORING'];
const PROFILE_INVOICE    = ['FREELANCER','DIGITAL_AGENCY','CA_FIRM','LAW_FIRM','CONSTRUCTION','INTERIOR_DESIGN','TRANSPORT','PACKERS_MOVERS','CAR_RENTAL','TRAVEL_AGENCY','INSURANCE_AGENCY','PEST_CONTROL','REAL_ESTATE'];
const PROFILE_PROPERTY   = ['MALL','CO_WORKING'];
const PROFILE_SUPPLIER   = ['SUPPLIER','WHOLESALE'];

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const s = (n, word) => `${n} ${word}${n !== 1 ? 's' : ''}`;

const getInsights = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { businessType: true } });
  const btype = tenant?.businessType || 'OTHER';

  const now = new Date();
  const startOfDay   = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay     = new Date(now); endOfDay.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const ago7         = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const ago14        = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const ago30        = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const next3Days    = new Date(now.getTime() + 3  * 24 * 60 * 60 * 1000);
  const next7Days    = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);

  const insights = [];

  // ── POS Retail & Salon+POS (product-heavy businesses) ────────────────────
  if (PROFILE_POS_RETAIL.includes(btype) || PROFILE_SALON_POS.includes(btype)) {
    const now30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [expired, expiring7, expiring30, lowStock, todaySales, thisWeekSales, lastWeekSales] = await Promise.all([
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { not: null, lte: now } } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { gt: now, lte: next7Days } } }),
      prisma.product.count({ where: { tenantId, isActive: true, expiryDate: { gt: now, lte: now30 } } }),
      prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: 5 } } }),
      prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
      prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: ago7 } }, _sum: { total: true } }),
      prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: ago14, lt: ago7 } }, _sum: { total: true } }),
    ]);

    if (expired > 0) {
      insights.push({ type: 'danger', message: `${s(expired, 'product')} on your shelves have already expired — remove immediately to avoid liability.`, action: 'View expired' });
    }
    if (expiring7 > 0) {
      insights.push({ type: 'warning', message: `${s(expiring7, 'product')} expire within 7 days — sell or return to distributor before the date.`, action: 'Check inventory' });
    } else if (expiring30 > 0) {
      insights.push({ type: 'info', message: `${s(expiring30, 'product')} expiring in the next 30 days — keep an eye on stock rotation.`, action: 'Check inventory' });
    }
    if (lowStock > 0) {
      insights.push({ type: 'warning', message: `${s(lowStock, 'item')} running low on stock. Reorder before shelves run empty.`, action: 'Restock now' });
    }
    if ((todaySales._count || 0) === 0) {
      insights.push({ type: 'info', message: 'No sales recorded today yet. Is the counter open?', action: 'Open POS' });
    } else {
      const thisWeek = thisWeekSales._sum.total || 0;
      const lastWeek = lastWeekSales._sum.total || 0;
      if (lastWeek > 0 && thisWeek < lastWeek * 0.7) {
        const drop = Math.round((1 - thisWeek / lastWeek) * 100);
        insights.push({ type: 'warning', message: `Revenue is down ${drop}% this week vs last week (${fmt(thisWeek)} vs ${fmt(lastWeek)}). Check if something changed.`, action: 'View reports' });
      }
    }
    return { insights };
  }

  // ── Clinic / Healthcare ───────────────────────────────────────────────────
  if (PROFILE_CLINIC.includes(btype)) {
    const [todayAppts, pendingAppts, overdueInv, noInvThisWeek] = await Promise.all([
      prisma.appointment.count({ where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay }, status: { not: 'CANCELLED' } } }),
      prisma.appointment.count({ where: { tenantId, status: 'SCHEDULED' } }),
      prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
      prisma.invoice.count({ where: { tenantId, issueDate: { gte: ago7 } } }),
    ]);
    if (todayAppts === 0) {
      insights.push({ type: 'info', message: 'No appointments scheduled for today.', action: 'Book a patient' });
    }
    if (pendingAppts > 3) {
      insights.push({ type: 'warning', message: `${s(pendingAppts, 'appointment')} awaiting confirmation — confirm or reschedule to avoid no-shows.`, action: 'Manage appointments' });
    }
    if (overdueInv > 0) {
      insights.push({ type: 'danger', message: `${s(overdueInv, 'patient invoice')} ${overdueInv === 1 ? 'is' : 'are'} overdue. Follow up on outstanding payments.`, action: 'Send reminders' });
    }
    if (noInvThisWeek === 0 && todayAppts > 0) {
      insights.push({ type: 'info', message: 'No invoices raised this week despite appointments. Have you billed your patients?', action: 'New invoice' });
    }
    return { insights };
  }

  // ── Coaching / Education ──────────────────────────────────────────────────
  if (PROFILE_COACHING.includes(btype)) {
    const [overdueFees, pendingFees, collectedMonth, dueThisMonth] = await Promise.all([
      prisma.feeRecord.count({ where: { tenantId, status: 'OVERDUE' } }),
      prisma.feeRecord.aggregate({ where: { tenantId, status: { in: ['PENDING', 'PARTIAL'] } }, _sum: { netAmount: true } }),
      prisma.feeRecord.aggregate({ where: { tenantId, status: 'PAID', paidAt: { gte: startOfMonth } }, _sum: { paidAmount: true } }),
      prisma.feeRecord.aggregate({ where: { tenantId, dueDate: { gte: startOfMonth, lte: now } }, _sum: { netAmount: true } }),
    ]);

    if (overdueFees > 0) {
      insights.push({ type: 'danger', message: `${s(overdueFees, 'student')} ${overdueFees === 1 ? 'has' : 'have'} overdue fees. Send reminders to parents today.`, action: 'View overdue' });
    }
    const pending = pendingFees._sum.netAmount || 0;
    if (pending > 0) {
      insights.push({ type: 'warning', message: `${fmt(pending)} in fees is pending collection this cycle.`, action: 'Collect fees' });
    }
    const collected = collectedMonth._sum.paidAmount || 0;
    const due = dueThisMonth._sum.netAmount || 0;
    if (due > 0 && collected < due * 0.5 && now.getDate() > 15) {
      const pct = Math.round((collected / due) * 100);
      insights.push({ type: 'warning', message: `Only ${pct}% of fees due this month collected (${fmt(collected)} of ${fmt(due)}). Second half of month — follow up now.`, action: 'Send reminders' });
    }
    return { insights };
  }

  // ── Gym / Spa ─────────────────────────────────────────────────────────────
  if (PROFILE_GYM.includes(btype)) {
    const [expiring3, expiring7, overdueFees] = await Promise.all([
      prisma.customerSubscription.count({ where: { tenantId, status: 'ACTIVE', expiryDate: { gte: now, lte: next3Days } } }),
      prisma.customerSubscription.count({ where: { tenantId, status: 'ACTIVE', expiryDate: { gte: now, lte: next7Days } } }),
      prisma.feeRecord.count({ where: { tenantId, status: 'OVERDUE' } }),
    ]);

    if (expiring3 > 0) {
      insights.push({ type: 'danger', message: `${s(expiring3, 'membership')} expire${expiring3 === 1 ? 's' : ''} within 3 days — call members now to renew.`, action: 'View memberships' });
    } else if (expiring7 > 0) {
      insights.push({ type: 'warning', message: `${s(expiring7, 'membership')} expire${expiring7 === 1 ? 's' : ''} within 7 days — send WhatsApp renewal reminders.`, action: 'Send reminders' });
    }
    if (overdueFees > 0) {
      insights.push({ type: 'danger', message: `${s(overdueFees, 'fee record')} ${overdueFees === 1 ? 'is' : 'are'} overdue. Collect before allowing access.`, action: 'Collect fees' });
    }
    return { insights };
  }

  // ── Events / Bookings ─────────────────────────────────────────────────────
  if (PROFILE_EVENT.includes(btype)) {
    const [upcoming, overdueInv, balanceDue] = await Promise.all([
      prisma.appointment.count({ where: { tenantId, startTime: { gte: now, lte: next7Days }, status: { not: 'CANCELLED' } } }),
      prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
      prisma.invoice.aggregate({ where: { tenantId, status: { in: ['SENT', 'OVERDUE'] } }, _sum: { balanceDue: true } }),
    ]);

    if (upcoming > 0) {
      insights.push({ type: 'info', message: `${s(upcoming, 'event')} scheduled in the next 7 days — confirm logistics and collect advances.`, action: 'View bookings' });
    }
    if (overdueInv > 0) {
      insights.push({ type: 'danger', message: `${s(overdueInv, 'invoice')} ${overdueInv === 1 ? 'is' : 'are'} overdue. Follow up before the event date.`, action: 'View invoices' });
    }
    const balance = balanceDue._sum.balanceDue || 0;
    if (balance > 0 && overdueInv === 0) {
      insights.push({ type: 'warning', message: `${fmt(balance)} in client balances outstanding. Chase payment before delivery.`, action: 'View invoices' });
    }
    return { insights };
  }

  // ── Invoice-only service businesses ──────────────────────────────────────
  if (PROFILE_INVOICE.includes(btype)) {
    const [overdue, overdueAmt, noInvThisWeek, lateAmt] = await Promise.all([
      prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
      prisma.invoice.aggregate({ where: { tenantId, status: 'OVERDUE' }, _sum: { balanceDue: true } }),
      prisma.invoice.count({ where: { tenantId, issueDate: { gte: ago7 } } }),
      prisma.invoice.aggregate({ where: { tenantId, status: { in: ['SENT', 'OVERDUE'] }, issueDate: { gte: ago30, lt: ago7 } }, _sum: { balanceDue: true } }),
    ]);

    if (overdue > 0) {
      insights.push({ type: 'danger', message: `${s(overdue, 'invoice')} overdue totalling ${fmt(overdueAmt._sum.balanceDue || 0)}. Send payment reminders today.`, action: 'Send reminders' });
    }
    if (noInvThisWeek === 0) {
      insights.push({ type: 'info', message: 'No invoices raised this week. Have you billed your clients for completed work?', action: 'New invoice' });
    }
    const late = lateAmt._sum.balanceDue || 0;
    if (late > 0) {
      insights.push({ type: 'warning', message: `${fmt(late)} in invoices sent 7–30 days ago still unpaid — follow up before they go overdue.`, action: 'Follow up' });
    }
    return { insights };
  }

  // ── Property / Lease ──────────────────────────────────────────────────────
  if (PROFILE_PROPERTY.includes(btype)) {
    const [expiredLeases, vacantUnits, overdueInv] = await Promise.all([
      prisma.leaseTenant.count({ where: { tenantId, status: 'EXPIRED' } }),
      prisma.leaseUnit.count({ where: { tenantId, isOccupied: false } }),
      prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
    ]);

    if (expiredLeases > 0) {
      insights.push({ type: 'danger', message: `${s(expiredLeases, 'lease')} ${expiredLeases === 1 ? 'has' : 'have'} expired — send renewal notices or begin vacancy proceedings.`, action: 'View leases' });
    }
    if (vacantUnits > 0) {
      insights.push({ type: 'warning', message: `${s(vacantUnits, 'unit')} currently vacant — lost rental income. List to find new tenants.`, action: 'View units' });
    }
    if (overdueInv > 0) {
      insights.push({ type: 'danger', message: `${s(overdueInv, 'tenant invoice')} ${overdueInv === 1 ? 'is' : 'are'} overdue. Send payment reminders.`, action: 'Send reminders' });
    }
    return { insights };
  }

  // ── Supplier / Wholesale ──────────────────────────────────────────────────
  if (PROFILE_SUPPLIER.includes(btype)) {
    const [overdue, overdueAmt, lowStock] = await Promise.all([
      prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
      prisma.invoice.aggregate({ where: { tenantId, status: 'OVERDUE' }, _sum: { balanceDue: true } }),
      prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: 5 } } }),
    ]);

    if (overdue > 0) {
      insights.push({ type: 'danger', message: `${s(overdue, 'invoice')} overdue totalling ${fmt(overdueAmt._sum.balanceDue || 0)}. Send reminders to clients.`, action: 'Send reminders' });
    }
    if (lowStock > 0) {
      insights.push({ type: 'warning', message: `${s(lowStock, 'stock item')} running low. Place purchase orders before you can't fulfil orders.`, action: 'Check inventory' });
    }
    return { insights };
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  const [overdueInvoices, todaySales] = await Promise.all([
    prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
    prisma.transaction.aggregate({ where: { tenantId, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
  ]);
  if (overdueInvoices > 0) {
    insights.push({ type: 'danger', message: `${s(overdueInvoices, 'invoice')} ${overdueInvoices === 1 ? 'is' : 'are'} overdue.`, action: 'Send reminders' });
  }
  if ((todaySales._count || 0) === 0) {
    insights.push({ type: 'info', message: 'No transactions recorded today.', action: 'Check POS' });
  }
  return { insights };
};

module.exports = { chat, getInsights };
