const config = require('../../config/env');
const prisma = require('../../config/prisma');

// AI Copilot — uses Claude API for business intelligence queries
const chat = async (tenantId, { message, history = [] }) => {
  if (!config.anthropicApiKey) {
    throw Object.assign(new Error('AI service not configured'), { statusCode: 503 });
  }

  // Fetch real context for the AI to work with
  const [tenant, todayStats] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, businessType: true } }),
    prisma.transaction.aggregate({
      where: {
        tenantId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
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

// Business insight suggestions based on real data
const getInsights = async (tenantId) => {
  const [lowStock, overdueInvoices, todayRevenue, weekRevenue] = await Promise.all([
    prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: 5 } } }),
    prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
    prisma.transaction.aggregate({
      where: { tenantId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      _sum: { total: true },
    }),
    prisma.transaction.aggregate({
      where: { tenantId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _sum: { total: true },
    }),
  ]);

  const insights = [];
  if (lowStock > 0) {
    insights.push({ type: 'warning', message: `${lowStock} product${lowStock > 1 ? 's are' : ' is'} running low on stock.`, action: 'Review inventory' });
  }
  if (overdueInvoices > 0) {
    insights.push({ type: 'danger', message: `${overdueInvoices} invoice${overdueInvoices > 1 ? 's are' : ' is'} overdue.`, action: 'Send reminders' });
  }
  if ((todayRevenue._sum.total || 0) === 0) {
    insights.push({ type: 'info', message: 'No sales recorded today yet.', action: 'Check POS' });
  }

  return {
    insights,
    kpis: {
      todayRevenue: todayRevenue._sum.total || 0,
      weekRevenue: weekRevenue._sum.total || 0,
    },
  };
};

module.exports = { chat, getInsights };
