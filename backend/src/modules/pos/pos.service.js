const prisma = require('../../config/prisma');
const { generateReceiptNumber } = require('../../utils/generateNumber');
const { calculateLineItem } = require('../../utils/gst');

const createSale = async (tenantId, { customerId, items, paymentMethod, amountPaid, discountAmount = 0, notes }) => {
  const receiptNumber = await generateReceiptNumber(tenantId);

  let subtotal = 0, taxAmount = 0, total = 0;
  const lineItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId, tenantId },
      include: { taxRate: true },
    });
    if (!product) throw Object.assign(new Error(`Product ${item.productId} not found`), { statusCode: 404 });
    if (product.stock < item.quantity) {
      throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { statusCode: 400 });
    }

    const gstRate = product.taxRate?.rate || 0;
    const calc = calculateLineItem(item.quantity, product.sellingPrice, item.discount || 0, gstRate);
    subtotal += calc.subtotal;
    taxAmount += calc.taxAmount;
    total += calc.total;

    lineItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      discount: item.discount || 0,
      taxAmount: calc.taxAmount,
      total: calc.total,
    });
  }

  const finalTotal = total - discountAmount;
  const change = amountPaid - finalTotal;

  const transaction = await prisma.$transaction(async (tx) => {
    const sale = await tx.transaction.create({
      data: {
        tenantId, customerId, receiptNumber,
        subtotal, discountAmount, taxAmount,
        total: finalTotal, amountPaid, change,
        paymentMethod, notes,
        items: { create: lineItems },
      },
      include: { items: true, customer: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      const prod = await tx.product.findUnique({ where: { id: item.productId } });
      await tx.stockMovement.create({
        data: {
          tenantId, productId: item.productId, type: 'SALE',
          quantity: item.quantity,
          beforeStock: prod.stock + item.quantity,
          afterStock: prod.stock,
          reference: receiptNumber,
        },
      });
    }

    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: { totalSpent: { increment: finalTotal } },
      });
    }

    return sale;
  });

  return transaction;
};

const listTransactions = (tenantId, { from, to, customerId } = {}) => {
  const where = { tenantId };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (customerId) where.customerId = customerId;

  return prisma.transaction.findMany({
    where,
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
};

const getTransaction = (tenantId, id) =>
  prisma.transaction.findUnique({
    where: { id, tenantId },
    include: { items: { include: { product: true } }, customer: true },
  });

module.exports = { createSale, listTransactions, getTransaction };
