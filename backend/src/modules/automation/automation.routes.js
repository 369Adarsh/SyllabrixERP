const router = require('express').Router();
const prisma = require('../../config/prisma');
const { authenticate, authorize } = require('../../middleware/auth');
const { sendDailyDigest, buildDailyDigest } = require('./automation.service');

// GET /api/automation/config
router.get('/config', authenticate, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    res.json({ data: tenant.automationConfig || {} });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/automation/config
router.put('/config', authenticate, async (req, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { automationConfig: req.body },
    });
    res.json({ data: tenant.automationConfig });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/automation/pending-actions
// Returns overdue fees, today's appointments, low stock, due rent — for dashboard widget
router.get('/pending-actions', authenticate, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const ac = tenant.automationConfig || {};
    const threshold = ac.lowStockThreshold ?? 5;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const inDays = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t; };

    const [fees, appointments, lowStock, leases] = await Promise.all([
      // Overdue or due within 3 days
      prisma.feeRecord.findMany({
        where: { tenantId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }, dueDate: { lte: inDays(3) } },
        include: { student: true },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
      // Today's appointments
      prisma.appointment.findMany({
        where: { tenantId, startTime: { gte: today, lt: tomorrow } },
        include: { customer: true, service: true },
        orderBy: { startTime: 'asc' },
      }),
      // Low stock products
      prisma.product.findMany({
        where: { tenantId, isActive: true, stock: { lte: threshold } },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
      // Active leases (rent reminders)
      prisma.leaseTenant.findMany({
        where: { tenantId, status: 'ACTIVE', phone: { not: null } },
        include: { unit: true },
        take: 10,
      }),
    ]);

    res.json({ data: { fees, appointments, lowStock, leases, tenantName: tenant.name, tenantPhone: tenant.phone } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/automation/daily-summary
// Returns today's sales data for the dashboard summary card
router.get('/daily-summary', authenticate, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const [sales, expenses] = await Promise.all([
      prisma.transaction.findMany({ where: { tenantId, createdAt: { gte: today, lt: tomorrow } } }),
      prisma.expense.findMany({ where: { tenantId, date: { gte: today, lt: tomorrow } } }),
    ]);

    const totalSales = sales.reduce((s, t) => s + t.total, 0);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const cashSales = sales.filter(t => t.paymentMethod === 'CASH').reduce((s, t) => s + t.total, 0);
    const upiSales = sales.filter(t => t.paymentMethod === 'UPI').reduce((s, t) => s + t.total, 0);
    const cardSales = sales.filter(t => t.paymentMethod === 'CARD').reduce((s, t) => s + t.total, 0);

    res.json({ data: { totalSales, totalExp, net: totalSales - totalExp, bills: sales.length, cashSales, upiSales, cardSales } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/automation/send-digest — manual trigger (OWNER only)
router.post('/send-digest', authenticate, authorize('OWNER'), async (req, res) => {
  try {
    const result = await sendDailyDigest(req.tenantId);
    if (!result.sent) return res.status(400).json({ message: result.reason || 'Failed to send digest' });
    res.json({ data: result, message: `Digest sent to ${result.phone}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/automation/digest-preview — preview message without sending
router.get('/digest-preview', authenticate, authorize('OWNER', 'ADMIN'), async (req, res) => {
  try {
    const result = await buildDailyDigest(req.tenantId);
    if (!result) return res.status(400).json({ message: 'No phone number configured on your business profile.' });
    res.json({ data: { message: result.message, phone: result.tenant.phone } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
