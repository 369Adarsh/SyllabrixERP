const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const computeStaffDay = (staff) => {
  const logs = staff.attendanceLogs || [];
  const lastLog = logs[logs.length - 1];
  let hoursWorked = 0;
  let inTime = null;
  for (const log of logs) {
    if (log.punchType === 'IN') { inTime = new Date(log.punchTime); }
    else if (log.punchType === 'OUT' && inTime) {
      hoursWorked += (new Date(log.punchTime) - inTime) / 3600000;
      inTime = null;
    }
  }
  // If still punched IN (no OUT yet), count up to now
  if (inTime) hoursWorked += (Date.now() - inTime) / 3600000;
  return {
    ...staff,
    todayLogs: logs,
    currentStatus: lastLog?.punchType ?? 'ABSENT',
    isCurrentlyIn: lastLog?.punchType === 'IN',
    firstIn: logs.find(l => l.punchType === 'IN')?.punchTime ?? null,
    hoursWorked: Math.round(hoursWorked * 10) / 10,
  };
};

const today = async (tenantId, { branchId } = {}) => {
  const { start, end } = todayRange();
  const allStaff = await prisma.staff.findMany({
    where: { tenantId, isActive: true, ...(branchId && { branchId }) },
    include: {
      attendanceLogs: {
        where: { tenantId, punchTime: { gte: start, lt: end } },
        orderBy: { punchTime: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
  return allStaff.map(computeStaffDay);
};

const punch = async (tenantId, staffId, punchType, method = 'MANUAL', notes = null) => {
  const staff = await prisma.staff.findFirst({ where: { id: staffId, tenantId } });
  if (!staff) throw Object.assign(new Error('Staff not found'), { status: 404 });

  const { start, end } = todayRange();
  const logs = await prisma.attendanceLog.findMany({
    where: { tenantId, staffId, punchTime: { gte: start, lt: end } },
    orderBy: { punchTime: 'desc' },
  });
  const lastType = logs[0]?.punchType;
  if (lastType === punchType) {
    throw Object.assign(new Error(`Already punched ${punchType} today`), { status: 409 });
  }

  return prisma.attendanceLog.create({
    data: { tenantId, staffId, punchType, method, notes },
    include: { staff: true },
  });
};

// Called by biometric device push (ZKTeco / FingerJet / etc.)
const devicePunch = async (tenantId, biometricId, punchType, punchTime, deviceId) => {
  const staff = await prisma.staff.findFirst({ where: { tenantId, biometricId } });
  if (!staff) throw Object.assign(new Error('Biometric ID not enrolled'), { status: 404 });
  return prisma.attendanceLog.create({
    data: {
      tenantId,
      staffId: staff.id,
      punchType,
      punchTime: punchTime ? new Date(punchTime) : new Date(),
      method: 'BIOMETRIC',
      deviceId,
    },
    include: { staff: true },
  });
};

const report = async (tenantId, fromDate, toDate, staffId, branchId) => {
  const where = {
    tenantId,
    punchTime: { gte: new Date(fromDate), lte: new Date(`${toDate}T23:59:59`) },
  };
  if (staffId) where.staffId = staffId;
  if (branchId) where.staff = { branchId };
  return prisma.attendanceLog.findMany({
    where,
    include: { staff: { select: { id: true, name: true, role: true, department: true, branchId: true } } },
    orderBy: [{ staffId: 'asc' }, { punchTime: 'asc' }],
  });
};

// Aggregate report: daily summary per staff for a date range
const summary = async (tenantId, fromDate, toDate, branchId) => {
  const logs = await report(tenantId, fromDate, toDate, null, branchId);
  const byStaff = {};
  for (const log of logs) {
    const sid = log.staffId;
    if (!byStaff[sid]) byStaff[sid] = { staff: log.staff, days: {}, totalHours: 0 };
    const day = new Date(log.punchTime).toISOString().slice(0, 10);
    if (!byStaff[sid].days[day]) byStaff[sid].days[day] = [];
    byStaff[sid].days[day].push(log);
  }
  return Object.values(byStaff).map(({ staff, days, totalHours }) => {
    let hours = 0;
    let presentDays = 0;
    for (const dayLogs of Object.values(days)) {
      presentDays++;
      let inT = null;
      for (const l of dayLogs) {
        if (l.punchType === 'IN') inT = new Date(l.punchTime);
        else if (l.punchType === 'OUT' && inT) { hours += (new Date(l.punchTime) - inT) / 3600000; inT = null; }
      }
    }
    return { staff, presentDays, totalHours: Math.round(hours * 10) / 10 };
  });
};

module.exports = { today, punch, devicePunch, report, summary };
