const prisma = require('../../config/prisma');
const { adjustBranchStock } = require('./branches.service');

const pad = (n) => String(n).padStart(5, '0');

const generateTransferNumber = async () => {
  const count = await prisma.stockTransfer.count();
  const yymm = new Date().toISOString().slice(2, 7).replace('-', '');
  return `TRF-${yymm}-${pad(count + 1)}`;
};

const listTransfers = (tenantId, { fromBranchId, toBranchId, status, involvesBranchId } = {}) =>
  prisma.stockTransfer.findMany({
    where: {
      tenantId,
      // involvesBranchId = manager's branch — show all transfers they participate in
      ...(involvesBranchId && { OR: [{ fromBranchId: involvesBranchId }, { toBranchId: involvesBranchId }] }),
      ...(fromBranchId && !involvesBranchId && { fromBranchId }),
      ...(toBranchId   && !involvesBranchId && { toBranchId }),
      ...(status       && { status }),
    },
    include: {
      fromBranch: { select: { id: true, name: true, code: true } },
      toBranch:   { select: { id: true, name: true, code: true } },
      items: { include: { product: { select: { id: true, name: true, unit: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

const getTransfer = (tenantId, id) =>
  prisma.stockTransfer.findFirst({
    where: { id, tenantId },
    include: {
      fromBranch: true,
      toBranch:   true,
      items: { include: { product: true } },
    },
  });

const createTransfer = async (tenantId, { fromBranchId, toBranchId, items, notes, isEmergency = false }, userId) => {
  const transferNumber = await generateTransferNumber();
  return prisma.stockTransfer.create({
    data: {
      tenantId, transferNumber, fromBranchId, toBranchId,
      notes, isEmergency,
      requestedById: userId,
      items: { create: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost || 0 })) },
    },
    include: {
      fromBranch: true, toBranch: true,
      items: { include: { product: true } },
    },
  });
};

const approveTransfer = async (tenantId, id, userId) => {
  const transfer = await prisma.stockTransfer.findFirst({ where: { id, tenantId } });
  if (!transfer) throw Object.assign(new Error('Transfer not found'), { statusCode: 404 });
  if (transfer.status !== 'REQUESTED') throw Object.assign(new Error('Transfer already processed'), { statusCode: 400 });
  return prisma.stockTransfer.update({
    where: { id },
    data: { status: 'APPROVED', approvedById: userId },
  });
};

const markInTransit = (tenantId, id) =>
  prisma.stockTransfer.updateMany({ where: { id, tenantId, status: 'APPROVED' }, data: { status: 'IN_TRANSIT' } });

// Receive: deduct from source, add to destination
const receiveTransfer = async (tenantId, id) => {
  const transfer = await prisma.stockTransfer.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });
  if (!transfer) throw Object.assign(new Error('Transfer not found'), { statusCode: 404 });
  if (!['APPROVED', 'IN_TRANSIT'].includes(transfer.status)) {
    throw Object.assign(new Error('Transfer cannot be received in current status'), { statusCode: 400 });
  }

  // Adjust stock at both branches
  for (const item of transfer.items) {
    await adjustBranchStock(tenantId, transfer.fromBranchId, item.productId, -item.quantity);
    await adjustBranchStock(tenantId, transfer.toBranchId,   item.productId, +item.quantity);
  }

  return prisma.stockTransfer.update({ where: { id }, data: { status: 'RECEIVED' } });
};

const cancelTransfer = (tenantId, id) =>
  prisma.stockTransfer.updateMany({
    where: { id, tenantId, status: { in: ['REQUESTED', 'APPROVED'] } },
    data: { status: 'CANCELLED' },
  });

// Smart suggestion: which branch has surplus to fulfill a request
const getSurplusSuggestion = async (tenantId, productId, requestedQty) => {
  const stocks = await prisma.branchStock.findMany({
    where: { tenantId, productId },
    include: {
      branch:  { select: { id: true, name: true, code: true, isActive: true } },
      product: { select: { lowStockAlert: true } },
    },
  });

  const suggestions = stocks
    .filter(s => s.branch.isActive)
    .map(s => ({
      branchId:   s.branchId,
      branchName: s.branch.name,
      branchCode: s.branch.code,
      available:  s.quantity,
      surplus:    Math.max(0, s.quantity - (s.product.lowStockAlert || 0)),
      canFulfill: s.quantity >= requestedQty,
    }))
    .filter(s => s.surplus > 0)
    .sort((a, b) => b.surplus - a.surplus);

  return suggestions;
};

module.exports = {
  listTransfers, getTransfer, createTransfer,
  approveTransfer, markInTransit, receiveTransfer, cancelTransfer,
  getSurplusSuggestion,
};
