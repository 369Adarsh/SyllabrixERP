const prisma = require('../../config/prisma');

// ─── Vendors ──────────────────────────────────────────────────────────────────

const listVendors = (tenantId, { search, isActive } = {}) => {
  const where = { tenantId };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (isActive !== undefined) where.isActive = isActive === 'true';
  return prisma.vendor.findMany({
    where,
    include: { catalog: { where: { isActive: true }, select: { id: true } } },
    orderBy: { name: 'asc' },
  });
};

const getVendor = (tenantId, id) =>
  prisma.vendor.findUnique({
    where: { id, tenantId },
    include: { purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });

const createVendor = (tenantId, data) =>
  prisma.vendor.create({ data: { ...data, tenantId } });

const updateVendor = (tenantId, id, data) => {
  const allowed = ['name', 'contactPerson', 'phone', 'email', 'address', 'gstin', 'paymentTerms', 'notes', 'isActive'];
  const update = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.vendor.update({ where: { id, tenantId }, data: update });
};

const deleteVendor = (tenantId, id) =>
  prisma.vendor.update({ where: { id, tenantId }, data: { isActive: false } });

// ─── Vendor Catalog ───────────────────────────────────────────────────────────

const listVendorCatalog = (tenantId, vendorId) =>
  prisma.vendorProduct.findMany({
    where: { tenantId, vendorId, isActive: true },
    include: { product: { select: { id: true, name: true, sku: true, stock: true, lowStockAlert: true, unit: true } } },
    orderBy: { itemName: 'asc' },
  });

const addCatalogItem = (tenantId, vendorId, data) =>
  prisma.vendorProduct.create({
    data: {
      tenantId,
      vendorId,
      itemName: data.itemName,
      vendorSku: data.vendorSku || null,
      vendorPrice: Number(data.vendorPrice || 0),
      minOrderQty: Number(data.minOrderQty || 1),
      productId: data.productId || null,
      notes: data.notes || null,
    },
    include: { product: { select: { id: true, name: true, stock: true, unit: true } } },
  });

const updateCatalogItem = (tenantId, id, data) => {
  const allowed = ['itemName', 'vendorSku', 'vendorPrice', 'minOrderQty', 'productId', 'notes', 'isActive'];
  const update = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  if (update.vendorPrice !== undefined) update.vendorPrice = Number(update.vendorPrice);
  if (update.minOrderQty !== undefined) update.minOrderQty = Number(update.minOrderQty);
  return prisma.vendorProduct.update({
    where: { id, tenantId },
    data: update,
    include: { product: { select: { id: true, name: true, stock: true } } },
  });
};

const deleteCatalogItem = (tenantId, id) =>
  prisma.vendorProduct.delete({ where: { id, tenantId } });

// ─── Reorder Suggestions ───────────────────────────────────────────────────────

const getReorderSuggestions = async (tenantId) => {
  const products = await prisma.product.findMany({
    where: { tenantId, isActive: true },
    include: {
      vendorProducts: {
        where: { isActive: true },
        include: { vendor: { select: { id: true, name: true } } },
        orderBy: { vendorPrice: 'asc' },
      },
    },
  });
  return products
    .filter(p => p.stock <= p.lowStockAlert)
    .sort((a, b) => a.stock - b.stock)
    .map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      lowStockAlert: p.lowStockAlert,
      unit: p.unit,
      suggestedQty: Math.ceil(Math.max(p.lowStockAlert * 3 - p.stock, p.lowStockAlert)),
      vendors: p.vendorProducts.map(vp => ({
        vendorProductId: vp.id,
        vendorId: vp.vendorId,
        vendorName: vp.vendor.name,
        itemName: vp.itemName,
        vendorSku: vp.vendorSku,
        vendorPrice: vp.vendorPrice,
        minOrderQty: vp.minOrderQty,
      })),
    }));
};

// ─── Purchase Orders ──────────────────────────────────────────────────────────

let _poCounter = null;
const generatePONumber = async (tenantId) => {
  const count = await prisma.purchaseOrder.count({ where: { tenantId } });
  const year = new Date().getFullYear().toString().slice(-2);
  return `PO-${year}-${String(count + 1).padStart(5, '0')}`;
};

const listPurchaseOrders = (tenantId, { status, vendorId, branchId } = {}) => {
  const where = { tenantId };
  if (status) where.status = status;
  if (vendorId) where.vendorId = vendorId;
  if (branchId) where.branchId = branchId;
  return prisma.purchaseOrder.findMany({
    where,
    include: { vendor: true, items: { include: { product: true } }, grns: { select: { id: true, grnNumber: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getPurchaseOrder = (tenantId, id) =>
  prisma.purchaseOrder.findUnique({
    where: { id, tenantId },
    include: { vendor: true, items: { include: { product: true } }, grns: { include: { lines: true } } },
  });

const createPurchaseOrder = async (tenantId, data) => {
  const poNumber = await generatePONumber(tenantId);
  const { vendorId, branchId, items: rawItems, expectedDate, notes } = data;

  const items = rawItems.map(i => ({
    productId: i.productId || null,
    description: i.description,
    quantity: Number(i.quantity),
    unitCost: Number(i.unitCost),
    taxRate: Number(i.taxRate || 0),
    taxAmount: Number(i.unitCost) * Number(i.quantity) * (Number(i.taxRate || 0) / 100),
    total: Number(i.unitCost) * Number(i.quantity),
  }));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = items.reduce((s, i) => s + i.taxAmount, 0);

  return prisma.purchaseOrder.create({
    data: {
      tenantId,
      poNumber,
      vendorId: vendorId || null,
      branchId: branchId || null,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      notes,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      items: { create: items },
    },
    include: { vendor: true, items: { include: { product: true } } },
  });
};

// Mark PO as received — supports partial receipt via receivedItems: [{itemId, receivedQty}]
const receivePurchaseOrder = async (tenantId, id, receivedItems = []) => {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id, tenantId },
    include: { items: true },
  });
  if (!po) throw Object.assign(new Error('PO not found'), { statusCode: 404 });
  if (po.status === 'RECEIVED') throw Object.assign(new Error('Already received'), { statusCode: 400 });

  // If no receivedItems provided, default to full quantities for all items
  const receipt = receivedItems.length > 0
    ? receivedItems
    : po.items.map(i => ({ itemId: i.id, receivedQty: i.quantity - (i.receivedQty || 0) }));

  const ops = [];
  let allFullyReceived = true;

  for (const ri of receipt) {
    const poItem = po.items.find(i => i.id === ri.itemId);
    if (!poItem) continue;
    const qty = Number(ri.receivedQty || 0);
    if (qty <= 0) { allFullyReceived = false; continue; }

    const remaining = poItem.quantity - (poItem.receivedQty || 0);
    if (qty < remaining) allFullyReceived = false;

    ops.push(prisma.purchaseItem.update({
      where: { id: ri.itemId },
      data: { receivedQty: { increment: qty } },
    }));

    if (poItem.productId) {
      const current = await prisma.product.findUnique({ where: { id: poItem.productId }, select: { stock: true } });
      const before = current?.stock || 0;
      ops.push(
        prisma.product.update({ where: { id: poItem.productId }, data: { stock: { increment: qty }, costPrice: poItem.unitCost } }),
        prisma.stockMovement.create({
          data: { tenantId, productId: poItem.productId, type: 'PURCHASE', quantity: qty, beforeStock: before, afterStock: before + qty, notes: `PO: ${po.poNumber}` },
        })
      );
    }
  }

  ops.push(prisma.purchaseOrder.update({
    where: { id },
    data: { status: allFullyReceived ? 'RECEIVED' : 'PARTIAL', receivedDate: new Date() },
  }));

  await prisma.$transaction(ops);

  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: { vendor: true, items: { include: { product: true } } },
  });
};

const cancelPurchaseOrder = (tenantId, id) =>
  prisma.purchaseOrder.update({ where: { id, tenantId }, data: { status: 'CANCELLED' } });

module.exports = {
  listVendors, getVendor, createVendor, updateVendor, deleteVendor,
  listVendorCatalog, addCatalogItem, updateCatalogItem, deleteCatalogItem,
  getReorderSuggestions,
  listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
};
