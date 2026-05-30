const prisma = require('../../config/prisma');

const genReturnNumber = async (tenantId) => {
  const count = await prisma.saleReturn.count({ where: { tenantId } });
  const year  = new Date().getFullYear();
  return `RET-${year}-${String(count + 1).padStart(4, '0')}`;
};

// List all returns for a tenant, newest first
const list = (tenantId, { branchId } = {}) =>
  prisma.saleReturn.findMany({
    where: { tenantId, ...(branchId && { branchId }) },
    include: {
      items:       true,
      customer:    { select: { id: true, name: true, phone: true } },
      invoice:     { select: { id: true, invoiceNumber: true } },
      transaction: { select: { id: true, receiptNumber: true } },
      branch:      { select: { id: true, name: true, code: true, isHQ: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

// Look up an invoice with its items (for the return modal)
const getInvoiceItems = async (tenantId, invoiceNumber) => {
  const inv = await prisma.invoice.findFirst({
    where: { tenantId, invoiceNumber },
    include: {
      items:    { include: { product: { select: { id: true, name: true, stock: true } } } },
      customer: { select: { id: true, name: true, phone: true } },
    },
  });
  if (!inv) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  return inv;
};

// Look up a POS transaction with its items (for the return modal)
const getTransactionItems = async (tenantId, receiptNumber) => {
  const tx = await prisma.transaction.findFirst({
    where: { tenantId, receiptNumber },
    include: {
      items:    { include: { product: { select: { id: true, name: true, stock: true } } } },
      customer: { select: { id: true, name: true, phone: true } },
    },
  });
  if (!tx) throw Object.assign(new Error('Receipt not found'), { statusCode: 404 });
  return tx;
};

// Create a return: restock products (global + branch) + optionally issue store-credit note
const create = async (tenantId, data) => {
  const { sourceType, invoiceId, transactionId, customerId, reason, refundMethod, notes, items } = data;

  if (!items?.length) throw Object.assign(new Error('No items to return'), { statusCode: 400 });

  // Resolve the branchId from the original sale document
  let branchId = data.branchId || null;
  if (!branchId && transactionId) {
    const tx0 = await prisma.transaction.findUnique({ where: { id: transactionId }, select: { branchId: true } });
    branchId = tx0?.branchId || null;
  }
  if (!branchId && invoiceId) {
    const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { branchId: true } });
    branchId = inv?.branchId || null;
  }

  const returnNumber = await genReturnNumber(tenantId);
  const refundAmount = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);

  const result = await prisma.$transaction(async (tx) => {
    const ret = await tx.saleReturn.create({
      data: {
        tenantId,
        returnNumber,
        sourceType,
        invoiceId:     invoiceId     || null,
        transactionId: transactionId || null,
        customerId:    customerId    || null,
        branchId:      branchId      || null,
        reason,
        refundMethod,
        refundAmount,
        notes: notes || null,
        items: {
          create: items.map((i) => ({
            productId:   i.productId   || null,
            description: i.description,
            quantity:    Number(i.quantity),
            unitPrice:   Number(i.unitPrice),
            total:       Number(i.quantity) * Number(i.unitPrice),
          })),
        },
      },
      include: { items: true },
    });

    // Restock global Product.stock + BranchStock for each returned item
    for (const item of items) {
      if (!item.productId) continue;
      const prod = await tx.product.findUnique({ where: { id: item.productId } });
      if (!prod) continue;
      const qty      = Number(item.quantity);
      const newStock = (prod.stock || 0) + qty;

      await tx.product.update({ where: { id: item.productId }, data: { stock: newStock } });

      // Also restock at the branch level
      if (branchId) {
        await tx.branchStock.upsert({
          where: { branchId_productId: { branchId, productId: item.productId } },
          update: { quantity: { increment: qty } },
          create: { tenantId, branchId, productId: item.productId, quantity: qty },
        });
      }

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId:   item.productId,
          type:        'RETURN',
          quantity:    qty,
          beforeStock: prod.stock || 0,
          afterStock:  newStock,
          reference:   returnNumber,
          notes:       `Return: ${reason}`,
        },
      });
    }

    // Store credit → create credit note
    if (refundMethod === 'STORE_CREDIT' && customerId) {
      await tx.creditNote.create({
        data: {
          tenantId,
          customerId,
          creditNoteNumber: `CN-R-${returnNumber}`,
          invoiceId: invoiceId || null,
          total:     refundAmount,
          reason:    `Store credit for return ${returnNumber}`,
          status:    'ISSUED',
        },
      });
    }

    return ret;
  });

  return result;
};

// Summary stats
const summary = async (tenantId, { branchId } = {}) => {
  const base = { tenantId, ...(branchId && { branchId }) };
  const [total, byMethod, recent, byBranchRaw] = await Promise.all([
    prisma.saleReturn.aggregate({ where: base, _sum: { refundAmount: true }, _count: true }),
    prisma.saleReturn.groupBy({ by: ['refundMethod'], where: base, _sum: { refundAmount: true }, _count: true }),
    prisma.saleReturn.count({ where: { ...base, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
    !branchId
      ? prisma.saleReturn.groupBy({ by: ['branchId'], where: { tenantId }, _sum: { refundAmount: true }, _count: true })
      : Promise.resolve(null),
  ]);

  let byBranch = null;
  if (byBranchRaw) {
    const branchIds = byBranchRaw.map(b => b.branchId).filter(Boolean);
    const branches  = branchIds.length
      ? await prisma.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true, code: true, isHQ: true } })
      : [];
    const branchMap = Object.fromEntries(branches.map(b => [b.id, b]));
    byBranch = byBranchRaw.map(r => ({
      branch:        r.branchId ? branchMap[r.branchId] || null : null,
      totalRefunded: r._sum.refundAmount || 0,
      totalReturns:  r._count,
    })).sort((a, b) => b.totalRefunded - a.totalRefunded);
  }

  return {
    totalRefunded: total._sum.refundAmount || 0,
    totalReturns:  total._count,
    last30Days:    recent,
    byMethod,
    byBranch,
  };
};

module.exports = { list, getInvoiceItems, getTransactionItems, create, summary };
