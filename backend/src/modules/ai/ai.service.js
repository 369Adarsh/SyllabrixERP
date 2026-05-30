const { GoogleGenAI } = require('@google/genai');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const config = require('../../config/env');
const prisma = require('../../config/prisma');

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];

const chatViaGroq = async (systemPrompt, history, message, modelName = 'llama-3.3-70b-versatile') => {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
    { role: 'user', content: message },
  ];
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.groqApiKey}` },
    body: JSON.stringify({ model: modelName, messages, max_tokens: 1024 }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const status = response.status;
    throw Object.assign(new Error(err.error?.message || `Groq error ${status}`), { statusCode: status });
  }
  const data = await response.json();
  return data.choices[0].message.content;
};

// Returns true for any Gemini error we should skip (quota, model not available, etc.)
const isGeminiSkippable = (err) => {
  const msg = err?.message?.toLowerCase() || '';
  const status = err?.status || err?.statusCode || err?.code;
  return (
    status === 429 || status === 404 ||
    msg.includes('quota') || msg.includes('rate limit') ||
    msg.includes('resource exhausted') || msg.includes('not found') ||
    msg.includes('404')
  );
};

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-8b'];

const chatViaGemini = async (systemInstruction, history, message, modelName = 'gemini-2.0-flash') => {
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const contents = [
    ...history.map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];
  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: systemInstruction ? { systemInstruction } : undefined,
  });
  return response.text;
};

const chatViaAnthropic = async (systemPrompt, history, message) => {
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
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, system: systemPrompt, messages }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw Object.assign(new Error(err.error?.message || 'Anthropic error'), { statusCode: 502 });
  }
  const data = await response.json();
  return data.content[0].text;
};

// AI Copilot — Groq primary, Gemini secondary, Anthropic fallback
const chat = async (tenantId, { message, history = [] }) => {
  if (!config.groqApiKey && !config.geminiApiKey && !config.anthropicApiKey) {
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
You have access to the business's ERP data.

Formatting rules (strictly follow):
- Use **bold** for key numbers and important terms.
- Use bullet lists (- item) for multiple points or steps.
- Use numbered lists (1. item) for sequential steps.
- Use ## for section headings when the answer has multiple sections.
- Never wrap answers in code blocks (no triple backticks) unless showing actual code.
- Keep responses concise and direct. Lead with the most important insight first.
- All currency in Indian Rupees (₹). Use Indian number formatting (lakhs, crores).
- Never be sycophantic. Answer the question immediately.`;

  // Try Groq first (free, fast)
  if (config.groqApiKey) {
    for (const modelName of GROQ_MODELS) {
      try {
        const reply = await chatViaGroq(systemPrompt, history, message, modelName);
        return { reply, provider: 'groq' };
      } catch (err) {
        const status = err?.statusCode || err?.status;
        if (status !== 429 && status !== 503) {
          throw Object.assign(new Error('AI service error. Try again in a moment.'), { statusCode: 502 });
        }
        console.warn(`Groq ${modelName} skipped (${err.message?.slice(0, 80)})`);
      }
    }
    console.warn('All Groq models rate-limited — trying Gemini');
  }

  // Try Gemini models
  if (config.geminiApiKey) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const reply = await chatViaGemini(systemPrompt, history, message, modelName);
        return { reply, provider: 'gemini' };
      } catch (err) {
        if (!isGeminiSkippable(err)) {
          throw Object.assign(new Error('AI service error. Try again in a moment.'), { statusCode: 502 });
        }
        console.warn(`Gemini ${modelName} skipped (${err.message?.slice(0, 80)})`);
      }
    }
    console.warn('All Gemini models unavailable — trying Anthropic');
  }

  // Fallback to Anthropic
  if (config.anthropicApiKey) {
    const reply = await chatViaAnthropic(systemPrompt, history, message);
    return { reply, provider: 'anthropic' };
  }

  throw Object.assign(new Error('AI quota exhausted. Please try again tomorrow.'), { statusCode: 503 });
};

// ── Alert Intelligence System — business-type-aware contextual insights ──────

const PROFILE_POS_RETAIL = ['RETAIL','KIRANA','RESTAURANT','WORKSHOP','MEDICAL_STORE','STATIONARY','SWEET_SHOP','BAKERY','JEWELLERY','HARDWARE','ELECTRICAL','CLOTHING','FOOTWEAR','ELECTRONICS','BOOKSTORE','FLORIST','DHABA','CLOUD_KITCHEN','JUICE_BAR','CANTEEN_MESS','DEALER','COURIER','OTHER'];
const PROFILE_SALON_POS  = ['SALON','BEAUTY_PARLOUR','BARBERSHOP','MOBILE_REPAIR','OPTICAL','VET_CLINIC','LAUNDRY'];
const PROFILE_CLINIC     = ['CLINIC','DENTAL','DIAGNOSTIC_LAB','AYURVEDA','HOSPITAL','PHYSIOTHERAPY'];
const PROFILE_COACHING   = ['COACHING','HOME_TUITION','MUSIC_SCHOOL','DANCE_ACADEMY','DRIVING_SCHOOL','COMPUTER_TRAINING'];
const PROFILE_GYM        = ['GYM','SPA','YOGA_STUDIO','MARTIAL_ARTS','SPORTS_ACADEMY','SWIMMING_ACADEMY','CROSSFIT_STUDIO'];
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

  // ── POS Retail & Salon+POS ────────────────────────────────────────────────
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

// ── Code Auditor ──────────────────────────────────────────────────────────────

// Maps frontend page routes to the backend/frontend module keys most relevant for that page
const PAGE_MODULE_MAP = {
  '/dashboard':          ['dashboard-page', 'reports-service', 'ai-service'],
  '/reports':            ['reports-page', 'reports-service'],
  '/pos':                ['pos-page', 'pos-service'],
  '/invoices':           ['invoicing-service'],
  '/invoicing':          ['invoicing-service'],
  '/fees':               ['fees-page', 'fees-service'],
  '/membership-plans':   ['fees-service'],
  '/appointments':       ['fees-service'],
  '/staff':              ['fees-service'],
  '/customers':          ['reports-service'],
  '/inventory':          ['pos-service'],
  '/expenses':           ['expenses-service'],
  '/accounts':           ['accounts-service'],
  '/auth':               ['auth-context', 'auth-service', 'axios-config'],
  '/login':              ['auth-context', 'auth-service', 'axios-config'],
  '/ai-copilot':         ['ai-service'],
  '/code-audit':         ['ai-service'],
  '/settings':           ['auth-service'],
};

// Extracts a named function or component from source code by finding its boundaries
const extractSection = (code, sectionName) => {
  if (!sectionName) return null;
  const lines = code.split('\n');
  // Match: function Name, const Name =, class Name
  const startPattern = new RegExp(`(function\\s+${sectionName}|const\\s+${sectionName}\\s*=|class\\s+${sectionName})`);
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (startPattern.test(lines[i])) { startIdx = i; break; }
  }
  if (startIdx === -1) return null;

  // Walk forward tracking brace depth to find the end of the block
  let depth = 0, found = false, endIdx = startIdx;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; found = true; }
      else if (ch === '}') depth--;
    }
    if (found && depth === 0) { endIdx = i; break; }
  }
  const section = lines.slice(startIdx, endIdx + 1).join('\n');
  return { section, startLine: startIdx + 1, endLine: endIdx + 1 };
};

const AUDITABLE_MODULES = {
  // Backend services
  'reports-service':   { label: 'Reports Service',   file: path.join(__dirname, '../reports/reports.service.js'),                              type: 'backend',  desc: 'P&L, sales, invoices, cash flow, GST' },
  'fees-service':      { label: 'Fees Service',       file: path.join(__dirname, '../fees/fees.service.js'),                                    type: 'backend',  desc: 'Fee collection, records, receipts' },
  'pos-service':       { label: 'POS Service',        file: path.join(__dirname, '../pos/pos.service.js'),                                      type: 'backend',  desc: 'Point-of-sale transactions' },
  'invoicing-service': { label: 'Invoicing Service',  file: path.join(__dirname, '../invoicing/invoicing.service.js'),                          type: 'backend',  desc: 'Invoice creation and payments' },
  'auth-service':      { label: 'Auth Service',       file: path.join(__dirname, '../auth/auth.service.js'),                                    type: 'backend',  desc: 'Login, registration, token refresh' },
  'expenses-service':  { label: 'Expenses Service',   file: path.join(__dirname, '../expenses/expenses.service.js'),                            type: 'backend',  desc: 'Expense tracking and categories' },
  'accounts-service':  { label: 'Accounts Service',   file: path.join(__dirname, '../accounts/accounts.service.js'),                            type: 'backend',  desc: 'Bank accounts and transactions' },
  'ai-service':        { label: 'AI Service',          file: path.join(__dirname, './ai.service.js'),                                            type: 'backend',  desc: 'Gemini/Claude copilot and insights' },
  // Frontend pages & contexts
  'reports-page':      { label: 'Reports Page',        file: path.join(__dirname, '../../../../frontend/src/pages/reports/Reports.jsx'),         type: 'frontend', desc: 'Finance reports, P&L, GSTR, cash flow UI' },
  'pos-page':          { label: 'POS Page',             file: path.join(__dirname, '../../../../frontend/src/pages/pos/POS.jsx'),                 type: 'frontend', desc: 'Point-of-sale UI' },
  'dashboard-page':    { label: 'Dashboard Page',       file: path.join(__dirname, '../../../../frontend/src/pages/dashboard/Dashboard.jsx'),     type: 'frontend', desc: 'Main business dashboard' },
  'fees-page':         { label: 'Fees Page',            file: path.join(__dirname, '../../../../frontend/src/pages/fees/Fees.jsx'),               type: 'frontend', desc: 'Fee management UI' },
  'auth-context':      { label: 'AuthContext',           file: path.join(__dirname, '../../../../frontend/src/context/AuthContext.jsx'),           type: 'frontend', desc: 'Auth state + token management' },
  'axios-config':      { label: 'Axios Config',          file: path.join(__dirname, '../../../../frontend/src/api/axios.js'),                     type: 'frontend', desc: 'HTTP client, interceptors, refresh logic' },
};

const extractJson = (text) => {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1].trim()); } catch {} }
  const s = text.indexOf('{'); const e = text.lastIndexOf('}');
  if (s !== -1 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch {} }
  throw new Error('AI did not return valid JSON');
};

const auditModule = async (moduleKey, ticketContext = null) => {
  const mod = AUDITABLE_MODULES[moduleKey];
  if (!mod) throw Object.assign(new Error(`Unknown module: ${moduleKey}`), { statusCode: 400 });

  let code;
  try { code = fs.readFileSync(mod.file, 'utf8'); }
  catch (e) { throw Object.assign(new Error(`Cannot read file: ${e.message}`), { statusCode: 500 }); }

  const MAX = 14000;
  const truncated = code.length > MAX;
  const snippet = truncated ? code.slice(0, MAX) : code;
  const lineCount = code.split('\n').length;

  // Ticket context block — injected when a support ticket is attached
  const ticketBlock = ticketContext
    ? `
SUPPORT TICKET — drill into the specific error this tenant reported:
  Business ID   : ${ticketContext.businessId || 'not provided'}
  Business Type : ${ticketContext.businessType || 'not provided'}
  Error reported: "${ticketContext.errorDescription || 'not provided'}"

Your audit MUST prioritise finding what causes this exact error for a ${ticketContext.businessType || 'this'} business. Flag anything in the code that behaves differently or breaks for this business type.
` : '';

  const prompt = `You are an expert senior code reviewer for Syllabrix, a multi-tenant SaaS ERP for Indian SMBs built with Node.js/Express (backend) and React/Vite (frontend).
${ticketBlock}
Analyze this ${mod.type === 'backend' ? 'Node.js/Express service' : 'React component'} file.
Filename: ${path.basename(mod.file)}
Module: ${mod.label} — ${mod.desc}
${truncated ? `Note: File truncated to first ${MAX} characters.\n` : ''}
Return ONLY valid JSON, absolutely nothing else outside the object:
{
  "summary": "one sentence describing overall quality and the most important issue${ticketContext ? ' — relate it to the reported error' : ''}",
  "score": <integer 0-100>,
  "issues": [
    {
      "severity": "critical|warning|info",
      "line": <line number or null>,
      "title": "<max 8 words>",
      "description": "<specific problem found in this code>",
      "fix": "<specific fix — code snippet or clear instruction>"
    }
  ]
}

Severity: critical=crash/data loss/security, warning=logic error/missing handling/can fail, info=quality/perf/style.
Report only real issues in this code. If the code is solid, give a high score and few issues.

CODE:
${snippet}`;

  if (!config.groqApiKey && !config.geminiApiKey && !config.anthropicApiKey)
    throw Object.assign(new Error('AI service not configured'), { statusCode: 503 });

  let raw;

  if (config.groqApiKey) {
    for (const modelName of GROQ_MODELS) {
      try { raw = await chatViaGroq('', [], prompt, modelName); break; }
      catch (err) { const s = err?.statusCode || err?.status; if (s !== 429 && s !== 503) break; }
    }
  }

  if (!raw && config.geminiApiKey) {
    for (const modelName of GEMINI_MODELS) {
      try { raw = await chatViaGemini('', [], prompt, modelName); break; }
      catch (err) { if (!isGeminiSkippable(err)) break; }
    }
  }

  if (!raw && config.anthropicApiKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.anthropicApiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw Object.assign(new Error('Anthropic error'), { statusCode: 502 });
    const data = await res.json();
    raw = data.content[0].text;
  }

  if (!raw) throw Object.assign(new Error('AI service unavailable'), { statusCode: 503 });

  const result = extractJson(raw);
  result.score = Math.max(0, Math.min(100, result.score || 0));
  result.issues = (result.issues || []).map(i => ({
    severity: ['critical', 'warning', 'info'].includes(i.severity) ? i.severity : 'info',
    line: typeof i.line === 'number' ? i.line : null,
    title: i.title || '',
    description: i.description || '',
    fix: i.fix || '',
  }));

  return {
    module: { key: moduleKey, label: mod.label, type: mod.type, desc: mod.desc, filename: path.basename(mod.file), lines: lineCount, truncated },
    summary: result.summary || '',
    score: result.score,
    issues: result.issues,
    ticketContext: ticketContext || null,
    auditedAt: new Date().toISOString(),
  };
};

// List of available modules (for the frontend picker)
const listAuditableModules = () =>
  Object.entries(AUDITABLE_MODULES).map(([key, m]) => ({
    key, label: m.label, type: m.type, desc: m.desc, filename: path.basename(m.file),
  }));

// Returns module keys relevant for a given page route
const getModulesForPage = (pageRoute) => {
  const keys = PAGE_MODULE_MAP[pageRoute] || [];
  return keys.filter(k => AUDITABLE_MODULES[k]);
};

// ── Report lifecycle ──────────────────────────────────────────────────────────

const makeReportId = async () => {
  const now = new Date();
  const ymd = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const count = await prisma.auditReport.count({ where: { reportId: { startsWith: `RPT-${ymd}` } } });
  return `RPT-${ymd}-${String(count + 1).padStart(3, '0')}`;
};

const submitReport = async (tenantId, { pageRoute, modules: explicitModules, errorDesc, frequency, reporterName, reporterRole }) => {
  const modules = (explicitModules && explicitModules.length) ? explicitModules : getModulesForPage(pageRoute);
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { businessType: true, syllabrixId: true } });
  const dedupHash = crypto.createHash('sha256')
    .update([pageRoute, errorDesc.trim().toLowerCase().slice(0, 200), tenant?.businessType || ''].join('|'))
    .digest('hex').slice(0, 16);

  const existing = await prisma.auditReport.findFirst({ where: { dedupHash } });
  if (existing) {
    const newPriority = existing.occurrences + 1 >= 3 ? 'P1' : existing.priority;
    const updated = await prisma.auditReport.update({
      where: { id: existing.id },
      data: { occurrences: { increment: 1 }, priority: newPriority, updatedAt: new Date() },
    });
    return { report: updated, isDuplicate: true };
  }

  const reportId = await makeReportId();
  const report = await prisma.auditReport.create({
    data: { reportId, tenantId, pageRoute, modules, errorDesc, frequency: frequency || 'SOMETIMES', dedupHash, reporterName, reporterRole },
  });
  return { report, isDuplicate: false };
};

const getReports = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.tenantId) where.tenantId = filters.tenantId;
  return prisma.auditReport.findMany({
    where,
    orderBy: [{ priority: 'asc' }, { occurrences: 'desc' }, { createdAt: 'desc' }],
    include: { tenant: { select: { name: true, businessType: true, syllabrixId: true } } },
    take: filters.limit || 100,
  });
};

const updateReport = async (reportId, { status, assignedTo, fixNotes, auditResult }) => {
  const data = { updatedAt: new Date() };
  if (status) data.status = status;
  if (assignedTo !== undefined) data.assignedTo = assignedTo;
  if (fixNotes !== undefined) data.fixNotes = fixNotes;
  if (auditResult !== undefined) data.auditResult = auditResult;
  if (status === 'RESOLVED') data.resolvedAt = new Date();
  return prisma.auditReport.update({ where: { reportId }, data });
};

const getTenantReports = async (tenantId) =>
  prisma.auditReport.findMany({
    where: { tenantId },
    orderBy: [{ createdAt: 'desc' }],
    take: 50,
  });

module.exports = { chat, getInsights, auditModule, listAuditableModules, getModulesForPage, PAGE_MODULE_MAP, submitReport, getReports, updateReport, getTenantReports };
