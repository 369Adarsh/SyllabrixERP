const prisma = require('../../config/prisma');
const wa = require('../whatsapp/whatsapp.service');

// ── Job number generator ──────────────────────────────────────────────────────
async function nextJobNumber(tenantId) {
  const count = await prisma.flJob.count({ where: { tenantId } });
  return `JOB-${String(count + 1).padStart(4, '0')}`;
}

// ── JOBS ─────────────────────────────────────────────────────────────────────
async function createJob(tenantId, data) {
  const jobNumber = await nextJobNumber(tenantId);
  const { startDate, endDate, ...rest } = data;
  const job = await prisma.flJob.create({
    data: {
      tenantId, jobNumber, ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate:   endDate   ? new Date(endDate)   : undefined,
    },
    include: { estimate: true, payments: true },
  });
  // Non-blocking WhatsApp notification to customer
  if (job.customerPhone) {
    prisma.flWaSettings.findUnique({ where: { tenantId } }).then(s => {
      if (s === null || s.notifyNewJob) {
        wa.sendFlJobCreated(tenantId, job.customerPhone, job.customerName, job, s?.msgNewJob || null)
          .catch(() => {});
      }
    }).catch(() => {});
  }
  return job;
}

async function listJobs(tenantId, { status, search, page = 1, limit = 20 } = {}) {
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 20;
  const where = { tenantId };
  if (status) where.status = status;
  if (search) where.OR = [
    { customerName: { contains: search, mode: 'insensitive' } },
    { workType: { contains: search, mode: 'insensitive' } },
    { jobNumber: { contains: search, mode: 'insensitive' } },
  ];
  const [jobs, total] = await Promise.all([
    prisma.flJob.findMany({
      where,
      include: { payments: { select: { amount: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * l,
      take: l,
    }),
    prisma.flJob.count({ where }),
  ]);
  return { jobs, total, page: p, pages: Math.ceil(total / l) };
}

async function getJob(tenantId, id) {
  return prisma.flJob.findFirst({
    where: { id, tenantId },
    include: {
      estimate: { include: { items: true } },
      materials: true,
      payments: true,
      helpers: { include: { helper: true } },
      expenses: true,
    },
  });
}

async function updateJob(tenantId, id, data) {
  const { startDate, endDate, ...rest } = data;
  return prisma.flJob.update({
    where: { id, tenantId },
    data: {
      ...rest,
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate   !== undefined && { endDate:   endDate   ? new Date(endDate)   : null }),
    },
  });
}

async function updateJobStatus(tenantId, id, status) {
  const job = await prisma.flJob.update({ where: { id, tenantId }, data: { status } });
  // Non-blocking WhatsApp status update to customer
  if (job.customerPhone) {
    prisma.flWaSettings.findUnique({ where: { tenantId } }).then(s => {
      if (s === null || s.notifyStatus) {
        wa.sendFlStatusUpdate(tenantId, job.customerPhone, job.customerName, job, s?.msgStatus || null)
          .catch(() => {});
      }
    }).catch(() => {});
  }
  return job;
}

async function deleteJob(tenantId, id) {
  return prisma.flJob.delete({ where: { id, tenantId } });
}

// ── ESTIMATES ────────────────────────────────────────────────────────────────
async function saveEstimate(tenantId, jobId, { items, advanceReq, validUntil, terms }) {
  const total = items.reduce((s, i) => s + i.total, 0);
  const existing = await prisma.flEstimate.findUnique({ where: { jobId } });

  if (existing) {
    await prisma.flEstimateItem.deleteMany({ where: { estimateId: existing.id } });
    return prisma.flEstimate.update({
      where: { id: existing.id },
      data: { total, advanceReq, validUntil, terms, version: existing.version + 1,
               items: { create: items } },
      include: { items: true },
    });
  }
  return prisma.flEstimate.create({
    data: { tenantId, jobId, total, advanceReq, validUntil, terms,
             items: { create: items } },
    include: { items: true },
  });
}

async function getEstimate(tenantId, jobId) {
  return prisma.flEstimate.findFirst({
    where: { jobId, tenantId },
    include: { items: true },
  });
}

// ── MATERIALS ────────────────────────────────────────────────────────────────
async function addMaterial(tenantId, jobId, data) {
  return prisma.flMaterial.create({ data: { tenantId, jobId, ...data } });
}

async function listMaterials(tenantId, jobId) {
  return prisma.flMaterial.findMany({ where: { jobId, tenantId }, orderBy: { purchaseDate: 'desc' } });
}

async function deleteMaterial(tenantId, id) {
  return prisma.flMaterial.delete({ where: { id, tenantId } });
}

// ── PAYMENTS ─────────────────────────────────────────────────────────────────
async function recordPayment(tenantId, jobId, data) {
  const { paidAt, ...rest } = data;
  const payment = await prisma.flPayment.create({
    data: { tenantId, jobId, ...rest, ...(paidAt && { paidAt: new Date(paidAt) }) },
  });
  // Non-blocking WhatsApp payment receipt to customer
  const job = await prisma.flJob.findFirst({ where: { id: jobId, tenantId } });
  if (job?.customerPhone) {
    prisma.flWaSettings.findUnique({ where: { tenantId } }).then(s => {
      if (s === null || s.notifyPayment) {
        wa.sendFlPaymentReceived(tenantId, job.customerPhone, job.customerName, job, payment, s?.msgPayment || null)
          .catch(() => {});
      }
    }).catch(() => {});
  }
  return payment;
}

async function listPayments(tenantId, jobId) {
  return prisma.flPayment.findMany({ where: { jobId, tenantId }, orderBy: { paidAt: 'desc' } });
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
async function createHelper(tenantId, data) {
  return prisma.flHelper.create({ data: { tenantId, ...data } });
}

async function listHelpers(tenantId) {
  return prisma.flHelper.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } });
}

async function assignHelper(tenantId, jobId, { helperId, daysWorked = 0 }) {
  const helper = await prisma.flHelper.findFirst({ where: { id: helperId, tenantId } });
  const totalWages = daysWorked * (helper?.dailyRate || 0);
  return prisma.flJobHelper.upsert({
    where: { jobId_helperId: { jobId, helperId } },
    update: { daysWorked, totalWages },
    create: { tenantId, jobId, helperId, daysWorked, totalWages },
  });
}

async function updateJobHelper(tenantId, jobId, helperId, data) {
  return prisma.flJobHelper.update({ where: { jobId_helperId: { jobId, helperId } }, data });
}

// ── PARTNERS ─────────────────────────────────────────────────────────────────
async function createPartner(tenantId, data) {
  return prisma.flPartner.create({ data: { tenantId, ...data } });
}

async function listPartners(tenantId) {
  return prisma.flPartner.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
}

// ── CLIENTS ──────────────────────────────────────────────────────────────────
async function createClient(tenantId, data) {
  return prisma.flClient.create({ data: { tenantId, ...data } });
}

async function listClients(tenantId, { search } = {}) {
  const where = { tenantId };
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search } },
  ];
  return prisma.flClient.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { jobs: true } } },
  });
}

async function getClient(tenantId, id) {
  return prisma.flClient.findFirst({
    where: { id, tenantId },
    include: {
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, jobNumber: true, workType: true, status: true, jobValue: true, createdAt: true },
      },
    },
  });
}

async function updateClient(tenantId, id, data) {
  return prisma.flClient.update({ where: { id, tenantId }, data });
}

// ── EXPENSES ─────────────────────────────────────────────────────────────────
async function createExpense(tenantId, data) {
  const { expenseDate, ...rest } = data;
  return prisma.flExpense.create({
    data: { tenantId, ...rest, ...(expenseDate && { expenseDate: new Date(expenseDate) }) },
  });
}

async function listExpenses(tenantId, { month, year } = {}) {
  const where = { tenantId };
  if (month && year) {
    where.expenseDate = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }
  return prisma.flExpense.findMany({ where, orderBy: { expenseDate: 'desc' } });
}

async function deleteExpense(tenantId, id) {
  return prisma.flExpense.delete({ where: { id, tenantId } });
}

// ── SUPPLIERS ────────────────────────────────────────────────────────────────
async function createSupplier(tenantId, data) {
  return prisma.flSupplier.create({ data: { tenantId, ...data } });
}

async function listSuppliers(tenantId) {
  return prisma.flSupplier.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
}

async function updateSupplier(tenantId, id, data) {
  return prisma.flSupplier.update({ where: { id, tenantId }, data });
}

// ── TOOLS ────────────────────────────────────────────────────────────────────
function parseDates(data, fields) {
  const result = { ...data };
  fields.forEach(f => {
    if (f in result) {
      result[f] = result[f] ? new Date(result[f]) : null;
    }
  });
  return result;
}

async function createTool(tenantId, data) {
  return prisma.flTool.create({ data: { tenantId, ...parseDates(data, ['purchaseDate', 'warrantyUntil', 'nextService']) } });
}

async function listTools(tenantId) {
  return prisma.flTool.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
}

async function updateTool(tenantId, id, data) {
  return prisma.flTool.update({ where: { id, tenantId }, data: parseDates(data, ['purchaseDate', 'warrantyUntil', 'nextService']) });
}

// ── AMC ──────────────────────────────────────────────────────────────────────
async function createAMC(tenantId, data) {
  return prisma.flAMC.create({ data: { tenantId, ...parseDates(data, ['startDate', 'endDate', 'nextService']) } });
}

async function listAMC(tenantId) {
  return prisma.flAMC.findMany({ where: { tenantId }, orderBy: { endDate: 'asc' } });
}

async function updateAMC(tenantId, id, data) {
  return prisma.flAMC.update({ where: { id, tenantId }, data: parseDates(data, ['startDate', 'endDate', 'nextService']) });
}

// ── REPORTS ──────────────────────────────────────────────────────────────────
async function dashboardStats(tenantId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    monthlyPayments, monthlyExpenses,
    activeJobs, pendingJobs,
    totalPaymentsAgg, totalJobValueAgg,
    overdueJobs, completedThisMonth,
  ] = await Promise.all([
    prisma.flPayment.aggregate({
      where: { tenantId, paidAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.flExpense.aggregate({
      where: { tenantId, expenseDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.flJob.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
    prisma.flJob.count({ where: { tenantId, status: 'PAYMENT_PENDING' } }),
    prisma.flPayment.aggregate({ where: { tenantId }, _sum: { amount: true } }),
    prisma.flJob.aggregate({ where: { tenantId }, _sum: { jobValue: true } }),
    prisma.flJob.findMany({
      where: {
        tenantId,
        endDate: { lt: now },
        status: { notIn: ['CLOSED', 'CANCELLED', 'COMPLETED'] },
      },
      select: { id: true, jobNumber: true, customerName: true, endDate: true },
      take: 10,
    }),
    prisma.flJob.count({
      where: { tenantId, status: 'COMPLETED', updatedAt: { gte: monthStart } },
    }),
  ]);

  const totalReceived = totalPaymentsAgg._sum.amount || 0;
  const totalJobValue = totalJobValueAgg._sum.jobValue || 0;

  return {
    earnedThisMonth: monthlyPayments._sum.amount || 0,
    expensesThisMonth: monthlyExpenses._sum.amount || 0,
    pendingAmount: Math.max(0, totalJobValue - totalReceived),
    activeJobs,
    pendingPaymentJobs: pendingJobs,
    completedThisMonth,
    overdueJobs,
  };
}

async function monthlyReport(tenantId, { month, year } = {}) {
  const now = new Date();
  const m = parseInt(month) || now.getMonth() + 1;
  const y = parseInt(year) || now.getFullYear();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);

  const [payments, expenses, jobs] = await Promise.all([
    prisma.flPayment.findMany({ where: { tenantId, paidAt: { gte: start, lte: end } } }),
    prisma.flExpense.findMany({ where: { tenantId, expenseDate: { gte: start, lte: end } } }),
    prisma.flJob.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      include: { payments: true, materials: true },
    }),
  ]);

  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return {
    month: m, year: y,
    totalIncome, totalExpenses,
    netProfit: totalIncome - totalExpenses,
    jobsCreated: jobs.length,
    avgJobValue: jobs.length ? jobs.reduce((s, j) => s + j.jobValue, 0) / jobs.length : 0,
  };
}

async function pendingPayments(tenantId) {
  const jobs = await prisma.flJob.findMany({
    where: { tenantId, status: { in: ['IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING'] } },
    include: { payments: true },
  });
  return jobs
    .map(j => {
      const paid = j.payments.reduce((s, p) => s + p.amount, 0);
      const pending = j.jobValue - paid;
      return { ...j, paidAmount: paid, pendingAmount: pending };
    })
    .filter(j => j.pendingAmount > 0)
    .sort((a, b) => b.pendingAmount - a.pendingAmount);
}

async function jobsReport(tenantId) {
  const jobs = await prisma.flJob.findMany({
    where: { tenantId },
    include: { payments: true, materials: true, helpers: true, expenses: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return jobs.map(j => {
    const received = j.payments.reduce((s, p) => s + p.amount, 0);
    const matCost = j.materials.reduce((s, m) => s + m.total, 0);
    const helperWages = j.helpers.reduce((s, h) => s + h.totalWages, 0);
    const otherExp = j.expenses.reduce((s, e) => s + e.amount, 0);
    const profit = j.jobValue - matCost - helperWages - otherExp;
    const margin = j.jobValue > 0 ? (profit / j.jobValue) * 100 : 0;
    return {
      id: j.id, jobNumber: j.jobNumber, customerName: j.customerName,
      workType: j.workType, status: j.status, jobValue: j.jobValue,
      received, pending: j.jobValue - received,
      matCost, helperWages, profit, margin: Math.round(margin),
      createdAt: j.createdAt,
    };
  });
}

// ── SETTINGS (module config + labels) ────────────────────────────────────────
const DEFAULT_FL_MODULES = ['jobs','clients','finance','expenses','bills','team','suppliers','tools','amc'];

async function getSettings(tenantId) {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { sidebarConfig: true, labelConfig: true } });
  const sidebar = t?.sidebarConfig || {};
  const labels  = t?.labelConfig  || {};
  return {
    activeModules: sidebar.flModules  ?? DEFAULT_FL_MODULES,
    moduleLabels:  labels.flLabels    ?? {},
  };
}

async function updateSettings(tenantId, { activeModules, moduleLabels }) {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { sidebarConfig: true, labelConfig: true } });
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      sidebarConfig: { ...(t?.sidebarConfig || {}), flModules: activeModules },
      labelConfig:   { ...(t?.labelConfig   || {}), flLabels:  moduleLabels  },
    },
  });
  return getSettings(tenantId);
}

// ── FINANCE REPORT (full tally) ───────────────────────────────────────────────
async function financeReport(tenantId, { year } = {}) {
  const y = parseInt(year) || new Date().getFullYear();
  const yearStart = new Date(y, 0, 1);
  const yearEnd   = new Date(y, 11, 31, 23, 59, 59);

  const [allPayments, allExpenses, allJobs, yearPayments, yearExpenses] = await Promise.all([
    prisma.flPayment.findMany({ where: { tenantId } }),
    prisma.flExpense.findMany({ where: { tenantId } }),
    prisma.flJob.findMany({ where: { tenantId }, include: { payments: true } }),
    prisma.flPayment.findMany({ where: { tenantId, paidAt: { gte: yearStart, lte: yearEnd } } }),
    prisma.flExpense.findMany({ where: { tenantId, expenseDate: { gte: yearStart, lte: yearEnd } } }),
  ]);

  const allTimeIncome   = allPayments.reduce((s, p) => s + p.amount, 0);
  const allTimeExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);

  const totalJobValue   = allJobs.reduce((s, j) => s + j.jobValue, 0);
  const totalReceived   = allPayments.reduce((s, p) => s + p.amount, 0);
  const outstanding     = Math.max(0, totalJobValue - totalReceived);

  // Month-by-month for selected year
  const monthly = [];
  for (let m = 1; m <= 12; m++) {
    const mStart = new Date(y, m - 1, 1);
    const mEnd   = new Date(y, m, 0, 23, 59, 59);
    const inc  = yearPayments.filter(p => new Date(p.paidAt) >= mStart && new Date(p.paidAt) <= mEnd).reduce((s, p) => s + p.amount, 0);
    const exp  = yearExpenses.filter(e => new Date(e.expenseDate) >= mStart && new Date(e.expenseDate) <= mEnd).reduce((s, e) => s + e.amount, 0);
    const jobs = allJobs.filter(j => new Date(j.createdAt) >= mStart && new Date(j.createdAt) <= mEnd).length;
    monthly.push({ month: m, name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1], income: inc, expenses: exp, profit: inc - exp, jobs });
  }

  // Top clients (by total received)
  const clientTotals = {};
  allJobs.forEach(j => {
    const received = j.payments.reduce((s, p) => s + p.amount, 0);
    if (!clientTotals[j.customerName]) clientTotals[j.customerName] = { name: j.customerName, received: 0, jobs: 0 };
    clientTotals[j.customerName].received += received;
    clientTotals[j.customerName].jobs++;
  });
  const topClients = Object.values(clientTotals).sort((a, b) => b.received - a.received).slice(0, 8);

  // Top work types
  const workTotals = {};
  allJobs.forEach(j => {
    const wt = j.workType || 'Other';
    const received = j.payments.reduce((s, p) => s + p.amount, 0);
    if (!workTotals[wt]) workTotals[wt] = { workType: wt, received: 0, jobs: 0 };
    workTotals[wt].received += received;
    workTotals[wt].jobs++;
  });
  const topWorkTypes = Object.values(workTotals).sort((a, b) => b.received - a.received).slice(0, 8);

  // Expense breakdown by category
  const expByCat = {};
  allExpenses.forEach(e => {
    expByCat[e.category] = (expByCat[e.category] || 0) + e.amount;
  });
  const expensesByCategory = Object.entries(expByCat).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);

  const yearIncome   = yearPayments.reduce((s, p) => s + p.amount, 0);
  const yearExp      = yearExpenses.reduce((s, e) => s + e.amount, 0);

  return {
    allTime:  { income: allTimeIncome, expenses: allTimeExpenses, profit: allTimeIncome - allTimeExpenses, outstanding },
    thisYear: { income: yearIncome, expenses: yearExp, profit: yearIncome - yearExp, year: y },
    monthly,
    topClients,
    topWorkTypes,
    expensesByCategory,
  };
}

// ── WhatsApp Automation Settings ─────────────────────────────────────────────
async function getWaSettings(tenantId) {
  const s = await prisma.flWaSettings.findUnique({ where: { tenantId } });
  if (s) return s;
  // Auto-create with defaults on first access
  return prisma.flWaSettings.create({ data: { tenantId } });
}

async function updateWaSettings(tenantId, data) {
  const allowed = [
    'notifyNewJob','notifyStatus','notifyPayment','notifyAmcRenewal',
    'followUpEnabled','followUpDays','followUpMsg',
    'payReminderEnabled','payReminderDays','payReminderMsg',
    'msgNewJob','msgStatus','msgPayment','msgAmcRenewal',
  ];
  const clean = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.flWaSettings.upsert({
    where:  { tenantId },
    create: { tenantId, ...clean },
    update: clean,
  });
}

// ── WhatsApp Broadcast ────────────────────────────────────────────────────────
async function getBroadcastTargets(tenantId, filter) {
  if (filter === 'pending_payment') {
    const jobs = await prisma.flJob.findMany({
      where: { tenantId, status: { in: ['IN_PROGRESS', 'COMPLETED', 'PAYMENT_PENDING'] } },
      include: { payments: true },
    });
    return jobs
      .filter(j => {
        const paid = j.payments.reduce((s, p) => s + p.amount, 0);
        return (j.jobValue || 0) - paid > 0 && j.customerPhone;
      })
      .map(j => ({ name: j.customerName, phone: j.customerPhone, ref: j.jobNumber }));
  }
  if (filter === 'active_jobs') {
    const jobs = await prisma.flJob.findMany({
      where: { tenantId, status: { in: ['ENQUIRY','ESTIMATE_SENT','IN_PROGRESS'] }, customerPhone: { not: null } },
      select: { customerName: true, customerPhone: true, jobNumber: true },
    });
    return jobs.map(j => ({ name: j.customerName, phone: j.customerPhone, ref: j.jobNumber }));
  }
  if (filter === 'amc') {
    const amcs = await prisma.flAMC.findMany({
      where: { tenantId, clientPhone: { not: null } },
      select: { clientName: true, clientPhone: true, workType: true },
    });
    return amcs.map(a => ({ name: a.clientName, phone: a.clientPhone, ref: a.workType }));
  }
  // 'all' — all clients with a phone
  const clients = await prisma.flClient.findMany({
    where: { tenantId, phone: { not: '' } },
    select: { name: true, phone: true },
  });
  return clients.map(c => ({ name: c.name, phone: c.phone, ref: null }));
}

async function sendBroadcast(tenantId, { message, filter = 'all' }) {
  const targets = await getBroadcastTargets(tenantId, filter);
  if (!targets.length) return { sentCount: 0, failCount: 0, total: 0 };

  const broadcast = await prisma.flWaBroadcast.create({
    data: { tenantId, message, filter, status: 'SENDING' },
  });

  let sentCount = 0, failCount = 0;

  for (const t of targets) {
    const body = message
      .replace(/\{name\}/g, t.name || 'there')
      .replace(/\{ref\}/g, t.ref || '');
    try {
      await wa.sendText(tenantId, t.phone, body);
      sentCount++;
    } catch { failCount++; }
    // Rate limit: 1 message per second to avoid WA ban
    await new Promise(r => setTimeout(r, 1000));
  }

  await prisma.flWaBroadcast.update({
    where: { id: broadcast.id },
    data: { sentCount, failCount, status: 'DONE' },
  });

  return { sentCount, failCount, total: targets.length };
}

async function listBroadcasts(tenantId) {
  return prisma.flWaBroadcast.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

async function previewBroadcast(tenantId, filter) {
  const targets = await getBroadcastTargets(tenantId, filter);
  return { count: targets.length, sample: targets.slice(0, 5) };
}

module.exports = {
  createJob, listJobs, getJob, updateJob, updateJobStatus, deleteJob,
  saveEstimate, getEstimate,
  addMaterial, listMaterials, deleteMaterial,
  recordPayment, listPayments,
  createHelper, listHelpers, assignHelper, updateJobHelper,
  createPartner, listPartners,
  createClient, listClients, getClient, updateClient,
  createExpense, listExpenses, deleteExpense,
  createSupplier, listSuppliers, updateSupplier,
  createTool, listTools, updateTool,
  createAMC, listAMC, updateAMC,
  dashboardStats, monthlyReport, pendingPayments, jobsReport,
  getSettings, updateSettings, financeReport,
  getWaSettings, updateWaSettings,
  sendBroadcast, listBroadcasts, previewBroadcast,
};
