const prisma = require('../../config/prisma');
const { generateFeeReceiptNumber } = require('../../utils/generateNumber');

// Students
const listStudents = (tenantId, { search, batch, course, isActive } = {}) => {
  const where = { tenantId };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (batch) where.batch = batch;
  if (course) where.course = course;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  return prisma.student.findMany({ where, orderBy: { name: 'asc' } });
};

const getStudent = (tenantId, id) =>
  prisma.student.findUnique({
    where: { id, tenantId },
    include: { feeRecords: { orderBy: { dueDate: 'desc' } } },
  });

const createStudent = (tenantId, data) =>
  prisma.student.create({ data: { ...data, tenantId } });

const updateStudent = (tenantId, id, data) =>
  prisma.student.update({ where: { id, tenantId }, data });

// Fee Records
const listFees = (tenantId, { studentId, status, from, to } = {}) => {
  const where = { tenantId };
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;
  if (from || to) {
    where.dueDate = {};
    if (from) where.dueDate.gte = new Date(from);
    if (to) where.dueDate.lte = new Date(to);
  }
  return prisma.feeRecord.findMany({
    where,
    include: { student: true },
    orderBy: { dueDate: 'desc' },
  });
};

const createFee = async (tenantId, data) => {
  const netAmount = data.amount - (data.discount || 0);
  return prisma.feeRecord.create({
    data: { ...data, tenantId, netAmount, dueDate: new Date(data.dueDate) },
    include: { student: true },
  });
};

const collectFee = async (tenantId, feeId, { amount, method, notes }) => {
  const fee = await prisma.feeRecord.findUnique({ where: { id: feeId, tenantId } });
  if (!fee) throw Object.assign(new Error('Fee record not found'), { statusCode: 404 });
  if (fee.status === 'PAID' || fee.status === 'WAIVED') throw Object.assign(new Error(`Fee is already ${fee.status.toLowerCase()}`), { statusCode: 400 });

  const outstanding = fee.netAmount - fee.paidAmount;
  if (Number(amount) > outstanding) throw Object.assign(new Error(`Amount ₹${amount} exceeds outstanding balance of ₹${outstanding.toFixed(2)}`), { statusCode: 400 });

  const receiptNumber = await generateFeeReceiptNumber();
  const newPaid = fee.paidAmount + Number(amount);
  const status = newPaid >= fee.netAmount ? 'PAID' : 'PARTIAL';

  return prisma.feeRecord.update({
    where: { id: feeId },
    data: {
      paidAmount: newPaid,
      status,
      paymentMethod: method,
      paidAt: new Date(),
      receiptNumber,
      notes,
    },
  });
};

const updateFee = async (tenantId, feeId, data) => {
  const netAmount = data.amount - (data.discount || 0);
  return prisma.feeRecord.update({
    where: { id: feeId, tenantId },
    data: {
      description: data.description,
      amount: data.amount,
      discount: data.discount || 0,
      netAmount,
      dueDate: new Date(data.dueDate),
    },
  });
};

const waiveFee = (tenantId, feeId, notes) =>
  prisma.feeRecord.update({ where: { id: feeId, tenantId }, data: { status: 'WAIVED', notes } });

const getOverdueFees = (tenantId) =>
  prisma.feeRecord.findMany({
    where: { tenantId, status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lt: new Date() } },
    include: { student: true },
    orderBy: { dueDate: 'asc' },
  });

module.exports = {
  listStudents, getStudent, createStudent, updateStudent,
  listFees, createFee, updateFee, collectFee, waiveFee, getOverdueFees,
};
