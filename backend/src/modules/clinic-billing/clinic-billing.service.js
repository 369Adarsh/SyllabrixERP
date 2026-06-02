const prisma = require('../../config/prisma');
const { generateClinicBillNumber } = require('../../utils/generateNumber');
const { PROCEDURES } = require('../../data/clinic-procedures');

// ── Helpers ───────────────────────────────────────────────────────────────────

const computeTotals = (items = [], discountAmount = 0) => {
  let subtotal = 0, exemptAmount = 0, taxableAmount = 0, gstAmount = 0;

  items.forEach((item) => {
    const lineBase = item.quantity * item.unitPrice - (item.discount || 0);
    subtotal += lineBase;
    if (item.isGstExempt) {
      exemptAmount += lineBase;
    } else {
      taxableAmount += lineBase;
      gstAmount += lineBase * (item.taxRate / 100);
    }
  });

  const totalAmount = subtotal - discountAmount + gstAmount;
  return { subtotal, exemptAmount, taxableAmount, gstAmount, totalAmount };
};

const computeItemTotal = (item) => {
  const lineBase = item.quantity * item.unitPrice - (item.discount || 0);
  const taxAmount = item.isGstExempt ? 0 : lineBase * (item.taxRate / 100);
  return { taxAmount, lineTotal: lineBase + taxAmount };
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

const listBills = async (tenantId, params = {}) => {
  const { status, date, limit = 100, offset = 0 } = params;
  const where = { tenantId };
  if (status) where.status = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.billDate = { gte: start, lt: end };
  }

  const [bills, total] = await Promise.all([
    prisma.clinicBill.findMany({
      where,
      include: { items: { orderBy: { id: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    }),
    prisma.clinicBill.count({ where }),
  ]);
  return { bills, total };
};

const getBillById = async (tenantId, id) => {
  const bill = await prisma.clinicBill.findUnique({
    where: { id },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  if (!bill || bill.tenantId !== tenantId) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });
  return bill;
};

const createBill = async (tenantId, data) => {
  const {
    patientId, patientName, patientPhone,
    appointmentId, doctorId, doctorName,
    discountAmount = 0, notes, items = [],
    cashAmount = 0, upiAmount = 0, cardAmount = 0,
  } = data;

  const billNumber = await generateClinicBillNumber();
  const enriched = items.map((item) => ({ ...item, ...computeItemTotal(item) }));
  const totals = computeTotals(enriched, discountAmount);
  const paidAmount = cashAmount + upiAmount + cardAmount;
  const dueAmount = Math.max(0, totals.totalAmount - paidAmount);
  const status = paidAmount >= totals.totalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';

  return prisma.clinicBill.create({
    data: {
      tenantId, billNumber,
      patientId: patientId || null,
      patientName,
      patientPhone: patientPhone || null,
      appointmentId: appointmentId || null,
      doctorId: doctorId || null,
      doctorName: doctorName || null,
      discountAmount,
      ...totals,
      cashAmount, upiAmount, cardAmount,
      paidAmount, dueAmount, status,
      notes: notes || null,
      items: {
        create: enriched.map((item) => ({
          category: item.category,
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          isGstExempt: item.isGstExempt ?? true,
          taxRate: item.taxRate || 0,
          taxAmount: item.taxAmount,
          lineTotal: item.lineTotal,
        })),
      },
    },
    include: { items: { orderBy: { id: 'asc' } } },
  });
};

const updateBill = async (tenantId, id, data) => {
  const bill = await prisma.clinicBill.findUnique({ where: { id } });
  if (!bill || bill.tenantId !== tenantId) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });

  const {
    discountAmount = bill.discountAmount,
    notes, items,
    cashAmount, upiAmount, cardAmount,
    status: explicitStatus,
  } = data;

  let totals = {};
  if (items) {
    const enriched = items.map((item) => ({ ...item, ...computeItemTotal(item) }));
    totals = computeTotals(enriched, discountAmount);

    await prisma.clinicBillItem.deleteMany({ where: { billId: id } });
    await prisma.clinicBillItem.createMany({
      data: enriched.map((item) => ({
        billId: id,
        category: item.category,
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        isGstExempt: item.isGstExempt ?? true,
        taxRate: item.taxRate || 0,
        taxAmount: item.taxAmount,
        lineTotal: item.lineTotal,
      })),
    });
  } else {
    totals = {
      subtotal: bill.subtotal, exemptAmount: bill.exemptAmount,
      taxableAmount: bill.taxableAmount, gstAmount: bill.gstAmount,
      totalAmount: bill.totalAmount,
    };
  }

  const ca = cashAmount ?? bill.cashAmount;
  const ua = upiAmount ?? bill.upiAmount;
  const ka = cardAmount ?? bill.cardAmount;
  const paidAmount = ca + ua + ka;
  const dueAmount = Math.max(0, totals.totalAmount - paidAmount);
  const status = explicitStatus || (paidAmount >= totals.totalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING');

  return prisma.clinicBill.update({
    where: { id },
    data: {
      discountAmount,
      ...totals,
      cashAmount: ca, upiAmount: ua, cardAmount: ka,
      paidAmount, dueAmount, status,
      ...(notes !== undefined && { notes }),
    },
    include: { items: { orderBy: { id: 'asc' } } },
  });
};

const deleteBill = async (tenantId, id) => {
  const bill = await prisma.clinicBill.findUnique({ where: { id } });
  if (!bill || bill.tenantId !== tenantId) throw Object.assign(new Error('Not found'), { statusCode: 404 });
  return prisma.clinicBill.delete({ where: { id } });
};

// ── Day-end Summary ───────────────────────────────────────────────────────────

const dayEndSummary = async (tenantId, date) => {
  const start = new Date(date || new Date().toISOString().slice(0, 10));
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const bills = await prisma.clinicBill.findMany({
    where: { tenantId, billDate: { gte: start, lt: end }, status: { in: ['PAID', 'PARTIAL'] } },
    include: { items: true },
  });

  const summary = {
    date: start.toISOString().slice(0, 10),
    totalBills: bills.length,
    totalCollection: 0,
    cashTotal: 0, upiTotal: 0, cardTotal: 0,
    byCategory: { CONSULTATION: 0, PROCEDURE: 0, MEDICINE: 0, DIAGNOSTIC: 0, OTHER: 0 },
    outstanding: 0,
  };

  bills.forEach((b) => {
    summary.totalCollection += b.paidAmount;
    summary.cashTotal += b.cashAmount;
    summary.upiTotal += b.upiAmount;
    summary.cardTotal += b.cardAmount;
    summary.outstanding += b.dueAmount;
    b.items.forEach((item) => {
      const cat = summary.byCategory[item.category] !== undefined ? item.category : 'OTHER';
      summary.byCategory[cat] += item.lineTotal;
    });
  });

  return summary;
};

// ── Outstanding ───────────────────────────────────────────────────────────────

const getOutstanding = async (tenantId) => {
  const bills = await prisma.clinicBill.findMany({
    where: { tenantId, status: { in: ['PENDING', 'PARTIAL'] } },
    orderBy: { billDate: 'desc' },
    include: { items: { select: { category: true, lineTotal: true } } },
  });
  const total = bills.reduce((sum, b) => sum + b.dueAmount, 0);
  return { bills, total };
};

// ── Procedure catalog ─────────────────────────────────────────────────────────
const getProcedures = () => PROCEDURES;

module.exports = { listBills, getBillById, createBill, updateBill, deleteBill, dayEndSummary, getOutstanding, getProcedures };
