const prisma = require('../../config/prisma');

// ─── Vendors ──────────────────────────────────────────────────────────────────

const listVendors = (tenantId, { search, isActive } = {}) => {
  const where = { tenantId };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (isActive !== undefined) where.isActive = isActive === 'true';
  return prisma.vendor.findMany({ where, orderBy: { name: 'asc' } });
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

// ─── Purchase Orders ──────────────────────────────────────────────────────────

let _poCounter = null;
const generatePONumber = async (tenantId) => {
  const count = await prisma.purchaseOrder.count({ where: { tenantId } });
  const year = new Date().getFullYear().toString().slice(-2);
  return `PO-${year}-${String(count + 1).padStart(5, '0')}`;
};

const listPurchaseOrders = (tenantId, { status, vendorId } = {}) => {
  const where = { tenantId };
  if (status) where.status = status;
  if (vendorId) where.vendorId = vendorId;
  return prisma.purchaseOrder.findMany({
    where,
    include: { vendor: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getPurchaseOrder = (tenantId, id) =>
  prisma.purchaseOrder.findUnique({
    where: { id, tenantId },
    include: { vendor: true, items: { include: { product: true } } },
  });

const createPurchaseOrder = async (tenantId, data) => {
  const poNumber = await generatePONumber(tenantId);
  const { vendorId, items: rawItems, expectedDate, notes } = data;

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

// Mark PO as received — update stock for all items
const receivePurchaseOrder = async (tenantId, id) => {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id, tenantId },
    include: { items: true },
  });
  if (!po) throw Object.assign(new Error('PO not found'), { statusCode: 404 });
  if (po.status === 'RECEIVED') throw Object.assign(new Error('Already received'), { statusCode: 400 });

  const stockOps = po.items
    .filter(i => i.productId)
    .map(i =>
      prisma.product.update({
        where: { id: i.productId },
        data: { stock: { increment: i.quantity }, costPrice: i.unitCost },
      })
    );

  const movementOps = po.items
    .filter(i => i.productId)
    .map(i =>
      prisma.stockMovement.create({
        data: {
          tenantId,
          productId: i.productId,
          type: 'PURCHASE',
          quantity: i.quantity,
          note: `PO received: ${po.poNumber}`,
        },
      })
    );

  await prisma.$transaction([
    prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED', receivedDate: new Date() },
    }),
    ...stockOps,
    ...movementOps,
  ]);

  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: { vendor: true, items: { include: { product: true } } },
  });
};

const cancelPurchaseOrder = (tenantId, id) =>
  prisma.purchaseOrder.update({ where: { id, tenantId }, data: { status: 'CANCELLED' } });

module.exports = {
  listVendors, getVendor, createVendor, updateVendor, deleteVendor,
  listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
};
