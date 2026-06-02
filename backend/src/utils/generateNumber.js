const prisma = require('../config/prisma');

const pad = (n, len = 5) => String(n).padStart(len, '0');
const yymm = () => {
  const d = new Date();
  return `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// receiptNumber is globally unique in the DB (no per-tenant scope on the constraint).
// So we must search across ALL tenants to find the true highest sequence for the month.

const generateInvoiceNumber = async () => {
  const prefix = `SYLINV-${yymm()}`;
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });
  const seq = last ? (parseInt(last.invoiceNumber.slice(-5)) || 0) + 1 : 1;
  return `${prefix}-${pad(seq)}`;
};

const generateReceiptNumber = async () => {
  const prefix = `RCP-${yymm()}`;
  const last = await prisma.transaction.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });
  const seq = last ? (parseInt(last.receiptNumber.slice(-5)) || 0) + 1 : 1;
  return `${prefix}-${pad(seq)}`;
};

const generateFeeReceiptNumber = async () => {
  const prefix = `FEE-${yymm()}`;
  const last = await prisma.feeRecord.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });
  const seq = last ? (parseInt(last.receiptNumber.slice(-5)) || 0) + 1 : 1;
  return `${prefix}-${pad(seq)}`;
};

const generatePONumber = async () => {
  const prefix = `PO-${yymm()}`;
  const last = await prisma.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: 'desc' },
    select: { poNumber: true },
  });
  const seq = last ? (parseInt(last.poNumber.slice(-5)) || 0) + 1 : 1;
  return `${prefix}-${pad(seq)}`;
};

const generateClinicBillNumber = async () => {
  const prefix = `SYLCB-${yymm()}`;
  const last = await prisma.clinicBill.findFirst({
    where: { billNumber: { startsWith: prefix } },
    orderBy: { billNumber: 'desc' },
    select: { billNumber: true },
  });
  const seq = last ? (parseInt(last.billNumber.slice(-5)) || 0) + 1 : 1;
  return `${prefix}-${pad(seq)}`;
};

const generateLabOrderNumber = async () => {
  const prefix = `LO-${yymm()}`;
  const last = await prisma.labOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });
  const seq = last ? (parseInt(last.orderNumber.slice(-5)) || 0) + 1 : 1;
  return `${prefix}-${pad(seq)}`;
};

const generateRxNumber = async () => {
  const prefix = `SYLRX-${yymm()}`;
  const last = await prisma.prescription.findFirst({
    where: { rxNumber: { startsWith: prefix } },
    orderBy: { rxNumber: 'desc' },
    select: { rxNumber: true },
  });
  const seq = last ? (parseInt(last.rxNumber.slice(-5)) || 0) + 1 : 1;
  return `${prefix}-${pad(seq)}`;
};

module.exports = { generateInvoiceNumber, generateReceiptNumber, generateFeeReceiptNumber, generatePONumber, generateRxNumber, generateLabOrderNumber, generateClinicBillNumber };
