const prisma = require('../../config/prisma');
const { generateReceiptNumber } = require('../../utils/generateNumber');
const { calculateLineItem } = require('../../utils/gst');
const { checkLowStock } = require('../automation/automation.service');

const createSale = async (tenantId, { customerId, branchId, items, paymentMethod, amountPaid, discountAmount = 0, notes }) => {
  const receiptNumber = await generateReceiptNumber();

  // Pre-fetch all products outside the transaction to avoid timeout
  const productMap = {};
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
    productMap[item.productId] = product;

    const gstRate = product.taxRate?.rate || 0;
    const calc = calculateLineItem(item.quantity, product.sellingPrice, item.discount || 0, gstRate);
    subtotal += calc.subtotal;
    taxAmount += calc.taxAmount;
    total += calc.total;

    lineItems.push({
      productId: product.id,
      name: product.name,
      hsnCode: product.hsnCode || null,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      discount: item.discount || 0,
      gstRate,
      taxAmount: calc.taxAmount,
      cgst: calc.cgst,
      sgst: calc.sgst,
      igst: calc.igst,
      total: calc.total,
    });
  }

  const finalTotal = total - discountAmount;
  const change = amountPaid - finalTotal;

  const transaction = await prisma.$transaction(async (tx) => {
    // Create sale record
    const sale = await tx.transaction.create({
      data: {
        tenantId, customerId, receiptNumber,
        ...(branchId && { branchId }),
        subtotal, discountAmount, taxAmount,
        total: finalTotal, amountPaid, change,
        paymentMethod, notes,
        items: { create: lineItems },
      },
      include: { items: true, customer: true, branch: { select: { id: true, name: true, code: true } } },
    });

    // Run all stock updates + movement records in parallel (avoids sequential await timeout)
    await Promise.all(items.map(item => {
      const product = productMap[item.productId];
      const ops = [
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }),
        tx.stockMovement.create({
          data: {
            tenantId, productId: item.productId, type: 'SALE',
            quantity: item.quantity,
            beforeStock: product.stock,
            afterStock: product.stock - item.quantity,
            reference: receiptNumber,
          },
        }),
      ];

      // Deduct from branch stock when sale is branch-specific
      if (branchId) {
        ops.push(
          tx.branchStock.upsert({
            where: { branchId_productId: { branchId, productId: item.productId } },
            update: { quantity: { decrement: item.quantity } },
            create: { tenantId, branchId, productId: item.productId, quantity: 0 },
          }),
        );
      }

      return Promise.all(ops);
    }));

    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalSpent: { increment: finalTotal },
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
      });
    }

    return sale;
  }, { timeout: 30000 });

  // Fire low-stock checks asynchronously (don't block the sale response)
  for (const item of items) {
    checkLowStock(tenantId, item.productId).catch(() => {});
  }

  return transaction;
};

const listTransactions = (tenantId, { from, to, customerId, branchId } = {}) => {
  const where = { tenantId };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (customerId) where.customerId = customerId;
  if (branchId) where.branchId = branchId;

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
