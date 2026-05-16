const prisma = require('../../config/prisma');

// ── Indian Statutory Deduction Rules ─────────────────────────────────────────
// PF: 12% of basic salary (employee) + 12% (employer) — applicable if basic >= 1800/mo
// ESI: 0.75% employee + 3.25% employer — applicable if gross salary <= 21000/mo
// PT: Professional Tax — most states ₹200/month (if gross > 15000), else ₹150 or 0

const calcPF = (basic) => {
  if (basic < 1800) return { employee: 0, employer: 0 };
  const pfWage = Math.min(basic, 15000); // PF capped at ₹15,000 basic
  return { employee: Math.round(pfWage * 0.12), employer: Math.round(pfWage * 0.12) };
};

const calcESI = (gross) => {
  if (gross > 21000) return { employee: 0, employer: 0 };
  return { employee: Math.round(gross * 0.0075), employer: Math.round(gross * 0.0325) };
};

const calcPT = (gross) => {
  if (gross <= 10000) return 0;
  if (gross <= 15000) return 150;
  return 200;
};

const calcEntry = (staff, presentDays = 26, workingDays = 26) => {
  const basic = staff.salary || 0;
  const hra = Math.round(basic * 0.4);       // 40% of basic as HRA
  const allowances = Math.round(basic * 0.1); // 10% as transport/misc
  const grossFull = basic + hra + allowances;
  const proRata = workingDays > 0 ? presentDays / workingDays : 1;
  const grossSalary = Math.round(grossFull * proRata);

  const pf = calcPF(Math.round(basic * proRata));
  const esi = calcESI(grossSalary);
  const pt = calcPT(grossSalary);

  const totalDeductions = pf.employee + esi.employee + pt;
  const netSalary = grossSalary - totalDeductions;

  return {
    staffId: staff.id,
    basicSalary: Math.round(basic * proRata),
    hra: Math.round(hra * proRata),
    allowances: Math.round(allowances * proRata),
    grossSalary,
    pfEmployee: pf.employee,
    pfEmployer: pf.employer,
    esiEmployee: esi.employee,
    esiEmployer: esi.employer,
    professionalTax: pt,
    tds: 0,
    otherDeductions: 0,
    totalDeductions,
    netSalary,
    workingDays,
    presentDays,
  };
};

const getOrCreate = async (tenantId, month, year) => {
  const existing = await prisma.payrollRun.findUnique({
    where: { tenantId_month_year: { tenantId, month, year } },
    include: { entries: { include: { staff: { select: { id: true, name: true, role: true, salary: true } } } } },
  });
  if (existing) return existing;

  return prisma.payrollRun.create({
    data: { tenantId, month, year },
    include: { entries: true },
  });
};

const list = (tenantId) =>
  prisma.payrollRun.findMany({
    where: { tenantId },
    include: { _count: { select: { entries: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

const get = (tenantId, id) =>
  prisma.payrollRun.findUnique({
    where: { id, tenantId },
    include: { entries: { include: { staff: { select: { id: true, name: true, designation: true, salary: true } } } } },
  });

// Generate entries for all active staff for a given month/year
const processPayroll = async (tenantId, month, year) => {
  const run = await getOrCreate(tenantId, month, year);
  if (run.status !== 'DRAFT') throw Object.assign(new Error('Payroll already processed'), { statusCode: 400 });

  const allStaff = await prisma.staff.findMany({ where: { tenantId, isActive: true } });

  // Get attendance data for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const workingDays = 26;

  const attendanceCounts = await prisma.attendanceLog.groupBy({
    by: ['staffId'],
    where: { tenantId, punchIn: { gte: startDate, lte: endDate }, punchOut: { not: null } },
    _count: { id: true },
  });
  const attendanceMap = Object.fromEntries(attendanceCounts.map(a => [a.staffId, a._count.id]));

  const entries = allStaff.map(staff => {
    const presentDays = Math.min(attendanceMap[staff.id] || workingDays, workingDays);
    return calcEntry(staff, presentDays, workingDays);
  });

  const totals = entries.reduce((acc, e) => ({
    totalGross: acc.totalGross + e.grossSalary,
    totalDeductions: acc.totalDeductions + e.totalDeductions,
    totalNet: acc.totalNet + e.netSalary,
  }), { totalGross: 0, totalDeductions: 0, totalNet: 0 });

  await prisma.$transaction([
    prisma.payrollEntry.deleteMany({ where: { payrollRunId: run.id } }),
    prisma.payrollEntry.createMany({ data: entries.map(e => ({ ...e, payrollRunId: run.id })) }),
    prisma.payrollRun.update({ where: { id: run.id }, data: { status: 'PROCESSED', processedAt: new Date(), ...totals } }),
  ]);

  return prisma.payrollRun.findUnique({
    where: { id: run.id },
    include: { entries: { include: { staff: { select: { id: true, name: true, designation: true } } } } },
  });
};

const markPaid = async (tenantId, id) => {
  const run = await prisma.payrollRun.findUnique({ where: { id, tenantId } });
  if (!run) throw Object.assign(new Error('Payroll run not found'), { statusCode: 404 });
  if (run.status !== 'PROCESSED') throw Object.assign(new Error('Process payroll before marking as paid'), { statusCode: 400 });

  return prisma.payrollRun.update({
    where: { id },
    data: {
      status: 'PAID',
      entries: { updateMany: { where: { payrollRunId: id }, data: { status: 'PAID', paidAt: new Date() } } },
    },
  });
};

module.exports = { list, get, getOrCreate, processPayroll, markPaid };
