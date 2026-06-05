const prisma = require('../../config/prisma');

const yymm = () => {
  const d = new Date();
  return `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ── Daily OPD Summary ─────────────────────────────────────────────────────────

const dailyOPD = async (tenantId, date) => {
  const start = new Date(date || new Date().toISOString().slice(0, 10));
  const end = new Date(start); end.setDate(end.getDate() + 1);

  const [tokens, bills] = await Promise.all([
    prisma.opdToken.findMany({ where: { tenantId, visitDate: { gte: start, lt: end } } }),
    prisma.clinicBill.findMany({ where: { tenantId, billDate: { gte: start, lt: end }, status: { in: ['PAID', 'PARTIAL'] } } }),
  ]);

  const statusCounts = tokens.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
  return {
    date: start.toISOString().slice(0, 10),
    totalTokens: tokens.length,
    completed: statusCounts.COMPLETED || 0,
    waiting: statusCounts.WAITING || 0,
    inConsultation: statusCounts.IN_CONSULTATION || 0,
    noShow: statusCounts.SKIPPED || 0,
    noShowRate: tokens.length > 0 ? ((statusCounts.SKIPPED || 0) / tokens.length * 100).toFixed(1) : 0,
    totalCollection: bills.reduce((s, b) => s + b.paidAmount, 0),
    newPatients: 0,
  };
};

// ── Monthly Revenue Trend (last 12 months) ─────────────────────────────────────

const monthlyRevenue = async (tenantId) => {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }) });
  }

  const bills = await prisma.clinicBill.findMany({
    where: {
      tenantId,
      status: { in: ['PAID', 'PARTIAL'] },
      billDate: { gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) },
    },
    select: { billDate: true, paidAmount: true, totalAmount: true },
  });

  return months.map((m) => {
    const monthBills = bills.filter((b) => {
      const d = new Date(b.billDate);
      return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
    });
    return {
      ...m,
      revenue: monthBills.reduce((s, b) => s + b.paidAmount, 0),
      bills: monthBills.length,
    };
  });
};

// ── Patient Growth (new registrations per month) ───────────────────────────────

const patientGrowth = async (tenantId) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const customers = await prisma.customer.findMany({
    where: { tenantId, createdAt: { gte: start } },
    select: { createdAt: true },
  });

  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = customers.filter((c) => {
      const cd = new Date(c.createdAt);
      return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
    }).length;
    months.push({ label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), count });
  }
  return months;
};

// ── Diagnosis Frequency ────────────────────────────────────────────────────────

const diagnosisFrequency = async (tenantId) => {
  const notes = await prisma.clinicalNote.findMany({
    where: { tenantId, soapA: { not: null } },
    select: { soapA: true },
    take: 500,
    orderBy: { createdAt: 'desc' },
  });

  const freq = {};
  notes.forEach((n) => {
    if (!n.soapA) return;
    // Extract first line or first sentence as the diagnosis
    const diag = n.soapA.split('\n')[0].split('.')[0].trim().toLowerCase();
    if (diag.length > 3 && diag.length < 80) freq[diag] = (freq[diag] || 0) + 1;
  });

  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([diagnosis, count]) => ({ diagnosis, count }));
};

// ── Doctor-wise Performance ────────────────────────────────────────────────────

const doctorPerformance = async (tenantId, period = 30) => {
  const start = new Date(); start.setDate(start.getDate() - period);

  const bills = await prisma.clinicBill.findMany({
    where: { tenantId, status: { in: ['PAID', 'PARTIAL'] }, billDate: { gte: start } },
    select: { doctorName: true, paidAmount: true, totalAmount: true, billDate: true },
  });

  const doctorMap = {};
  bills.forEach((b) => {
    const name = b.doctorName || 'Unassigned';
    if (!doctorMap[name]) doctorMap[name] = { patients: 0, revenue: 0 };
    doctorMap[name].patients += 1;
    doctorMap[name].revenue += b.paidAmount;
  });

  return Object.entries(doctorMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([doctor, stats]) => ({
      doctor,
      patients: stats.patients,
      revenue: stats.revenue,
      avgBill: stats.patients > 0 ? (stats.revenue / stats.patients).toFixed(0) : 0,
    }));
};

// ── OPD Trend (last 30 days) ──────────────────────────────────────────────────

const opdTrend = async (tenantId) => {
  const now = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const start = new Date(days[0]);
  const tokens = await prisma.opdToken.findMany({
    where: { tenantId, visitDate: { gte: start } },
    select: { visitDate: true, status: true },
  });

  return days.map((day) => {
    const dayTokens = tokens.filter((t) => t.visitDate.toISOString().slice(0, 10) === day);
    return {
      date: day,
      total: dayTokens.length,
      completed: dayTokens.filter((t) => t.status === 'COMPLETED').length,
      noShow: dayTokens.filter((t) => t.status === 'SKIPPED').length,
    };
  });
};

module.exports = { dailyOPD, monthlyRevenue, patientGrowth, diagnosisFrequency, doctorPerformance, opdTrend };
