const prisma = require('../config/prisma');

const pad = (n, len = 5) => String(n).padStart(len, '0');

const generateInvoiceNumber = async (tenantId) => {
  const count = await prisma.invoice.count({ where: { tenantId } });
  const year = new Date().getFullYear().toString().slice(-2);
  return `INV-${year}-${pad(count + 1)}`;
};

const generateReceiptNumber = async (tenantId) => {
  const count = await prisma.transaction.count({ where: { tenantId } });
  return `RCP-${pad(count + 1)}`;
};

const generateFeeReceiptNumber = async (tenantId) => {
  const count = await prisma.feeRecord.count({ where: { tenantId } });
  return `FEE-${pad(count + 1)}`;
};

module.exports = { generateInvoiceNumber, generateReceiptNumber, generateFeeReceiptNumber };
