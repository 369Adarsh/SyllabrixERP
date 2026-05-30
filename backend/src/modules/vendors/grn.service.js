const prisma = require('../../config/prisma');

const generateGRNNumber = async (tenantId) => {
  const count = await prisma.goodsReceiptNote.count({ where: { tenantId } });
  return `GRN-${String(count + 1).padStart(4, '0')}`;
};

// List GRNs — optionally filtered by PO or branch
const listGRNs = (tenantId, { poId, branchId } = {}) => {
  const where = { tenantId };
  if (poId) where.poId = poId;
  if (branchId) where.branchId = branchId;
  return prisma.goodsReceiptNote.findMany({
    where,
    include: {
      po: { select: { poNumber: true, vendorId: true } },
      lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getGRN = (tenantId, id) =>
  prisma.goodsReceiptNote.findUnique({
    where: { id, tenantId },
    include: {
      po: { include: { vendor: true, items: { include: { product: true } } } },
      lines: { include: { product: true } },
      bills: { select: { id: true, billNumber: true, total: true, status: true } },
    },
  });

// Create a DRAFT GRN from a PO — pre-fills expected quantities
const createGRN = async (tenantId, poId) => {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId, tenantId },
    include: { items: { include: { product: true } } },
  });
  if (!po) throw Object.assign(new Error('PO not found'), { statusCode: 404 });
  if (po.status === 'CANCELLED') throw Object.assign(new Error('Cannot receive a cancelled PO'), { statusCode: 400 });

  const grnNumber = await generateGRNNumber(tenantId);

  return prisma.goodsReceiptNote.create({
    data: {
      tenantId,
      branchId: po.branchId || null,
      poId,
      grnNumber,
      status: 'DRAFT',
      lines: {
        create: po.items.map(item => ({
          poItemId:    item.id,
          productId:   item.productId,
          description: item.description,
          orderedQty:  item.quantity,
          receivedQty: item.quantity,   // default to ordered qty — user adjusts
          unitCost:    item.unitCost,
          variance:    0,
        })),
      },
    },
    include: {
      po: { include: { vendor: true, items: true } },
      lines: { include: { product: { select: { id: true, name: true, sku: true, stock: true } } } },
    },
  });
};

// Confirm GRN — update lines, update stock, update PO status
const confirmGRN = async (tenantId, grnId, { lines, notes, receivedAt }) => {
  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id: grnId, tenantId },
    include: { po: { include: { items: true } }, lines: true },
  });
  if (!grn) throw Object.assign(new Error('GRN not found'), { statusCode: 404 });
  if (grn.status === 'CONFIRMED') throw Object.assign(new Error('GRN already confirmed'), { statusCode: 400 });

  const ops = [];

  // Update each GRN line with actual received values
  for (const line of lines) {
    const grnLine = grn.lines.find(l => l.id === line.id);
    if (!grnLine) continue;

    const receivedQty = Number(line.receivedQty ?? 0);
    const unitCost    = Number(line.unitCost ?? grnLine.unitCost);
    const variance    = receivedQty - grnLine.orderedQty;

    ops.push(prisma.gRNLine.update({
      where: { id: line.id },
      data: { receivedQty, unitCost, variance, varNotes: line.varNotes || null },
    }));

    // Update PO item receivedQty
    ops.push(prisma.purchaseItem.update({
      where: { id: grnLine.poItemId },
      data: { receivedQty: { increment: receivedQty } },
    }));

    // Update inventory stock if product linked
    if (grnLine.productId && receivedQty > 0) {
      const product = await prisma.product.findUnique({
        where: { id: grnLine.productId },
        select: { stock: true },
      });
      const before = product?.stock || 0;
      ops.push(
        prisma.product.update({
          where: { id: grnLine.productId },
          data: { stock: { increment: receivedQty }, costPrice: unitCost },
        }),
        prisma.stockMovement.create({
          data: {
            tenantId,
            productId: grnLine.productId,
            type: 'PURCHASE',
            quantity: receivedQty,
            beforeStock: before,
            afterStock: before + receivedQty,
            notes: `GRN: ${grn.grnNumber} (PO: ${grn.po.poNumber})`,
          },
        })
      );
    }
  }

  // Determine new PO status
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: grn.poId },
    include: { items: true },
  });

  // After this GRN's lines are applied, check if all PO items are fully received
  const updatedReceivedMap = {};
  for (const line of lines) {
    const grnLine = grn.lines.find(l => l.id === line.id);
    if (grnLine) updatedReceivedMap[grnLine.poItemId] = Number(line.receivedQty ?? 0);
  }

  const allFullyReceived = po.items.every(item => {
    const existingReceived = item.receivedQty || 0;
    const newReceived = updatedReceivedMap[item.id] || 0;
    return (existingReceived + newReceived) >= item.quantity;
  });

  ops.push(prisma.purchaseOrder.update({
    where: { id: grn.poId },
    data: { status: allFullyReceived ? 'RECEIVED' : 'PARTIAL', receivedDate: new Date() },
  }));

  // Confirm the GRN
  ops.push(prisma.goodsReceiptNote.update({
    where: { id: grnId },
    data: {
      status: 'CONFIRMED',
      notes: notes || grn.notes,
      receivedAt: receivedAt ? new Date(receivedAt) : grn.receivedAt,
    },
  }));

  await prisma.$transaction(ops);

  return prisma.goodsReceiptNote.findUnique({
    where: { id: grnId },
    include: {
      po: { include: { vendor: true, items: true } },
      lines: { include: { product: { select: { id: true, name: true, sku: true, stock: true } } } },
    },
  });
};

// Get variance summary for a GRN (for bill matching)
const getVarianceSummary = async (tenantId, grnId) => {
  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id: grnId, tenantId },
    include: { lines: { include: { product: { select: { name: true } } } } },
  });
  if (!grn) throw Object.assign(new Error('GRN not found'), { statusCode: 404 });

  const lines = grn.lines.map(l => ({
    description:  l.description,
    product:      l.product?.name,
    orderedQty:   l.orderedQty,
    receivedQty:  l.receivedQty,
    variance:     l.variance,
    unitCost:     l.unitCost,
    totalReceived: l.receivedQty * l.unitCost,
    hasVariance:  l.variance !== 0,
    varNotes:     l.varNotes,
  }));

  return {
    grnNumber:    grn.grnNumber,
    status:       grn.status,
    totalOrdered: lines.reduce((s, l) => s + l.orderedQty, 0),
    totalReceived: lines.reduce((s, l) => s + l.receivedQty, 0),
    totalValue:   lines.reduce((s, l) => s + l.totalReceived, 0),
    hasVariances: lines.some(l => l.hasVariance),
    lines,
  };
};

module.exports = { listGRNs, getGRN, createGRN, confirmGRN, getVarianceSummary };
