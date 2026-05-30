const prisma = require('../../config/prisma');

// ── Syllabrix Standard Category Taxonomy ──────────────────────────────────────
// Format: { code, name, icon, color, sortOrder, children: [{code, name, sortOrder}] }
const STD_TAXONOMY = [
  { code: 'ELEC', name: 'Electronics & Technology', icon: '💻', color: '#3B82F6', sortOrder: 1, children: [
    { code: 'ELEC-MOB', name: 'Mobile Phones & Tablets',    sortOrder: 1 },
    { code: 'ELEC-LAP', name: 'Laptops & Computers',        sortOrder: 2 },
    { code: 'ELEC-TVA', name: 'TV & Home Entertainment',    sortOrder: 3 },
    { code: 'ELEC-AUD', name: 'Audio & Earphones',          sortOrder: 4 },
    { code: 'ELEC-WRB', name: 'Smart Wearables',            sortOrder: 5 },
    { code: 'ELEC-PWR', name: 'Power & Charging',           sortOrder: 6 },
    { code: 'ELEC-CAM', name: 'Cameras & Photography',      sortOrder: 7 },
  ]},
  { code: 'FOOD', name: 'Food & Groceries', icon: '🛒', color: '#059669', sortOrder: 2, children: [
    { code: 'FOOD-GRN', name: 'Grains, Rice & Pulses',      sortOrder: 1 },
    { code: 'FOOD-OIL', name: 'Oils & Ghee',                sortOrder: 2 },
    { code: 'FOOD-SPC', name: 'Spices & Masalas',           sortOrder: 3 },
    { code: 'FOOD-DRY', name: 'Dairy, Eggs & Paneer',       sortOrder: 4 },
    { code: 'FOOD-SNK', name: 'Packaged Snacks & Biscuits', sortOrder: 5 },
    { code: 'FOOD-BVG', name: 'Beverages & Drinks',         sortOrder: 6 },
    { code: 'FOOD-FRS', name: 'Fresh Produce & Vegetables', sortOrder: 7 },
  ]},
  { code: 'PRCB', name: 'Personal Care & Beauty', icon: '✨', color: '#EC4899', sortOrder: 3, children: [
    { code: 'PRCB-SKN', name: 'Skin Care',             sortOrder: 1 },
    { code: 'PRCB-HRC', name: 'Hair Care',             sortOrder: 2 },
    { code: 'PRCB-HYG', name: 'Hygiene & Dental',     sortOrder: 3 },
    { code: 'PRCB-PRF', name: 'Perfumes & Deodorants',sortOrder: 4 },
    { code: 'PRCB-MKP', name: 'Makeup & Cosmetics',   sortOrder: 5 },
  ]},
  { code: 'CLTH', name: 'Clothing & Fashion', icon: '👗', color: '#8B5CF6', sortOrder: 4, children: [
    { code: 'CLTH-MEN', name: "Men's Wear",       sortOrder: 1 },
    { code: 'CLTH-WMN', name: "Women's Wear",     sortOrder: 2 },
    { code: 'CLTH-KDS', name: "Kids' Wear",       sortOrder: 3 },
    { code: 'CLTH-FTW', name: 'Footwear',         sortOrder: 4 },
    { code: 'CLTH-UND', name: 'Innerwear & Socks',sortOrder: 5 },
    { code: 'CLTH-BGS', name: 'Bags & Wallets',   sortOrder: 6 },
  ]},
  { code: 'HOME', name: 'Home & Kitchen', icon: '🏠', color: '#F59E0B', sortOrder: 5, children: [
    { code: 'HOME-KTA', name: 'Kitchen Appliances',       sortOrder: 1 },
    { code: 'HOME-KTU', name: 'Cookware & Utensils',      sortOrder: 2 },
    { code: 'HOME-APP', name: 'Home Appliances',          sortOrder: 3 },
    { code: 'HOME-CLN', name: 'Cleaning & Laundry',       sortOrder: 4 },
    { code: 'HOME-FRN', name: 'Furniture & Furnishing',   sortOrder: 5 },
    { code: 'HOME-DCR', name: 'Home Décor & Lighting',    sortOrder: 6 },
  ]},
  { code: 'HLTH', name: 'Health & Medicines', icon: '💊', color: '#EF4444', sortOrder: 6, children: [
    { code: 'HLTH-PRX', name: 'Prescription Medicines',      sortOrder: 1 },
    { code: 'HLTH-OTC', name: 'OTC & Supplements',           sortOrder: 2 },
    { code: 'HLTH-MED', name: 'Medical Devices & Equipment', sortOrder: 3 },
    { code: 'HLTH-FAD', name: 'First Aid & Bandages',        sortOrder: 4 },
    { code: 'HLTH-AYR', name: 'Ayurveda & Herbal',           sortOrder: 5 },
  ]},
  { code: 'INDL', name: 'Industrial & Hardware', icon: '🔧', color: '#64748B', sortOrder: 7, children: [
    { code: 'INDL-TLS', name: 'Tools & Equipment',       sortOrder: 1 },
    { code: 'INDL-ELC', name: 'Electrical Supplies',     sortOrder: 2 },
    { code: 'INDL-PLM', name: 'Plumbing & Fittings',     sortOrder: 3 },
    { code: 'INDL-SFT', name: 'Safety Equipment',        sortOrder: 4 },
    { code: 'INDL-CNS', name: 'Construction Materials',  sortOrder: 5 },
    { code: 'INDL-PNT', name: 'Paints & Coatings',       sortOrder: 6 },
  ]},
  { code: 'SERV', name: 'Services', icon: '🛠️', color: '#06B6D4', sortOrder: 8, children: [
    { code: 'SERV-PRF', name: 'Professional & Consulting', sortOrder: 1 },
    { code: 'SERV-RPR', name: 'Repair & Maintenance',      sortOrder: 2 },
    { code: 'SERV-BWN', name: 'Beauty & Wellness',         sortOrder: 3 },
    { code: 'SERV-TRL', name: 'Transport & Logistics',     sortOrder: 4 },
    { code: 'SERV-DGT', name: 'Digital & Tech Services',   sortOrder: 5 },
  ]},
  { code: 'EDUC', name: 'Education & Books', icon: '📚', color: '#10B981', sortOrder: 9, children: [
    { code: 'EDUC-TXT', name: 'Textbooks & Study Material', sortOrder: 1 },
    { code: 'EDUC-STN', name: 'Stationery & Craft',         sortOrder: 2 },
    { code: 'EDUC-TOY', name: 'Educational Toys',           sortOrder: 3 },
    { code: 'EDUC-CRS', name: 'Courses & Coaching Fees',    sortOrder: 4 },
  ]},
  { code: 'AUTO', name: 'Automobile & Parts', icon: '🚗', color: '#F97316', sortOrder: 10, children: [
    { code: 'AUTO-TYR', name: 'Tyres & Wheels',          sortOrder: 1 },
    { code: 'AUTO-ENG', name: 'Engine & Mechanical',     sortOrder: 2 },
    { code: 'AUTO-ELC', name: 'Auto Electronics',        sortOrder: 3 },
    { code: 'AUTO-ACC', name: 'Car Care & Accessories',  sortOrder: 4 },
    { code: 'AUTO-LUB', name: 'Lubricants & Fluids',     sortOrder: 5 },
  ]},
  { code: 'JEWL', name: 'Jewellery & Accessories', icon: '💎', color: '#A78BFA', sortOrder: 11, children: [
    { code: 'JEWL-GLD', name: 'Gold Jewellery',         sortOrder: 1 },
    { code: 'JEWL-SLV', name: 'Silver Jewellery',       sortOrder: 2 },
    { code: 'JEWL-FSN', name: 'Fashion Jewellery',      sortOrder: 3 },
    { code: 'JEWL-WTC', name: 'Watches',                sortOrder: 4 },
    { code: 'JEWL-EYW', name: 'Eyewear & Sunglasses',   sortOrder: 5 },
  ]},
  { code: 'AGRI', name: 'Agriculture & Farm', icon: '🌾', color: '#84CC16', sortOrder: 12, children: [
    { code: 'AGRI-SED', name: 'Seeds & Plants',             sortOrder: 1 },
    { code: 'AGRI-FRT', name: 'Fertilizers & Pesticides',   sortOrder: 2 },
    { code: 'AGRI-TLS', name: 'Farm Tools & Equipment',     sortOrder: 3 },
    { code: 'AGRI-IRG', name: 'Irrigation & Water',         sortOrder: 4 },
    { code: 'AGRI-LVS', name: 'Livestock & Poultry',        sortOrder: 5 },
  ]},
  { code: 'TBCO', name: 'Tobacco & Tobacco Products', icon: '🚬', color: '#78716C', sortOrder: 13, children: [
    { code: 'TBCO-CIG', name: 'Cigarettes & Bidis',           sortOrder: 1 },
    { code: 'TBCO-CHW', name: 'Chewing Tobacco & Gutka',      sortOrder: 2 },
    { code: 'TBCO-SMK', name: 'Pipe & Hookah Tobacco',        sortOrder: 3 },
    { code: 'TBCO-NIC', name: 'Nicotine Pouches & Patches',   sortOrder: 4 },
    { code: 'TBCO-ACC', name: 'Tobacco Accessories & Lighter', sortOrder: 5 },
  ]},
  { code: 'LQOR', name: 'Liquor & Alcoholic Beverages', icon: '🥃', color: '#B45309', sortOrder: 14, children: [
    { code: 'LQOR-BER', name: 'Beer & Cider',                  sortOrder: 1 },
    { code: 'LQOR-WSK', name: 'Whisky & Scotch',               sortOrder: 2 },
    { code: 'LQOR-RUM', name: 'Rum & Brandy',                  sortOrder: 3 },
    { code: 'LQOR-VDK', name: 'Vodka & Gin',                   sortOrder: 4 },
    { code: 'LQOR-WIN', name: 'Wine & Sparkling',               sortOrder: 5 },
    { code: 'LQOR-DSS', name: 'Desi Spirits & Country Liquor', sortOrder: 6 },
    { code: 'LQOR-MXR', name: 'Mixers & Bar Accessories',      sortOrder: 7 },
  ]},
];

const seedStandardCategories = async (tenantId) => {
  const existing = await prisma.category.findMany({
    where: { tenantId, isStandard: true },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map(c => c.code).filter(Boolean));

  for (const cat of STD_TAXONOMY) {
    let parentId;
    if (!existingCodes.has(cat.code)) {
      const parent = await prisma.category.create({
        data: {
          tenantId,
          name: cat.name,
          code: cat.code,
          icon: cat.icon,
          color: cat.color,
          sortOrder: cat.sortOrder,
          isStandard: true,
        },
      });
      parentId = parent.id;
    } else {
      const parent = await prisma.category.findFirst({ where: { tenantId, code: cat.code } });
      parentId = parent?.id;
    }
    if (parentId && cat.children?.length) {
      const newChildren = cat.children.filter(c => !existingCodes.has(c.code));
      if (newChildren.length > 0) {
        await prisma.category.createMany({
          data: newChildren.map(c => ({
            tenantId,
            name: c.name,
            code: c.code,
            parentId,
            sortOrder: c.sortOrder,
            isStandard: true,
            color: cat.color,
          })),
        });
      }
    }
  }
};

// ── Categories ─────────────────────────────────────────────────────────────

const deduplicateCategories = async (tenantId) => {
  const all = await prisma.category.findMany({
    where: { tenantId },
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // Group by normalised name (lowercase, trim)
  const byName = {};
  for (const cat of all) {
    const key = cat.name.trim().toLowerCase();
    if (!byName[key]) byName[key] = [];
    byName[key].push(cat);
  }

  let merged = 0;
  for (const dupes of Object.values(byName)) {
    if (dupes.length < 2) continue;
    // Keep: isStandard first, then most products, then oldest
    const keep = dupes.sort((a, b) =>
      (b.isStandard ? 1 : 0) - (a.isStandard ? 1 : 0) ||
      b._count.products - a._count.products
    )[0];
    const deleteIds = dupes.filter(d => d.id !== keep.id).map(d => d.id);
    // Re-assign all products from duplicates to the kept category
    await prisma.product.updateMany({
      where: { tenantId, categoryId: { in: deleteIds } },
      data: { categoryId: keep.id },
    });
    // Delete the duplicate categories
    await prisma.category.deleteMany({ where: { id: { in: deleteIds }, tenantId } });
    merged += deleteIds.length;
  }
  return { merged };
};

const listCategories = (tenantId) =>
  prisma.category.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      children: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
      _count: { select: { products: true } },
    },
  });

const createCategory = (tenantId, data) =>
  prisma.category.create({ data: { ...data, tenantId } });

const updateCategory = (tenantId, id, data) =>
  prisma.category.update({ where: { id, tenantId }, data });

const deleteCategory = async (tenantId, id) => {
  const cat = await prisma.category.findUnique({ where: { id, tenantId } });
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  if (cat.isStandard) throw Object.assign(new Error('Syllabrix standard categories cannot be deleted'), { statusCode: 403 });
  await prisma.product.updateMany({ where: { tenantId, categoryId: id }, data: { categoryId: null } });
  return prisma.category.delete({ where: { id, tenantId } });
};

// ── Products ───────────────────────────────────────────────────────────────

// When branchId is provided, overlay BranchStock.quantity onto each product's stock
// field so branch managers see their own stock, not the global total.
const overlayBranchStock = async (tenantId, branchId, products) => {
  if (!branchId || !products.length) return products;
  const branchStocks = await prisma.branchStock.findMany({
    where: { tenantId, branchId, productId: { in: products.map(p => p.id) } },
  });
  const qtyMap = Object.fromEntries(branchStocks.map(bs => [bs.productId, bs.quantity]));
  return products.map(p => ({ ...p, stock: qtyMap[p.id] ?? 0 }));
};

const listProducts = async (tenantId, { search, categoryId, lowStock, page, limit = 100, branchId } = {}) => {
  const where = { tenantId, isActive: true };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (categoryId) where.categoryId = categoryId;
  const include = { category: true, taxRate: true };
  if (!page) {
    const prods = await prisma.product.findMany({ where, include, orderBy: { name: 'asc' } });
    return overlayBranchStock(tenantId, branchId, prods);
  }
  const p = Number(page), l = Number(limit);
  const [rawProducts, total] = await Promise.all([
    prisma.product.findMany({ where, include, orderBy: { name: 'asc' }, skip: (p - 1) * l, take: l }),
    prisma.product.count({ where }),
  ]);
  const products = await overlayBranchStock(tenantId, branchId, rawProducts);
  return { products, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
};

const getProduct = (tenantId, id) =>
  prisma.product.findUnique({ where: { id, tenantId }, include: { category: true, taxRate: true } });

const sanitizeProduct = (data) => ({
  ...data,
  sellingPrice:   data.sellingPrice   != null ? Number(data.sellingPrice)   : undefined,
  costPrice:      data.costPrice       != null ? Number(data.costPrice)      : undefined,
  stock:          data.stock           != null ? Number(data.stock)          : undefined,
  lowStockAlert:  data.lowStockAlert   != null ? Number(data.lowStockAlert)  : undefined,
  categoryId:     data.categoryId  || null,
  taxRateId:      data.taxRateId   || null,
  expiryDate:     data.expiryDate  ? new Date(data.expiryDate).toISOString() : null,
});

const createProduct = (tenantId, data) =>
  prisma.product.create({ data: { ...sanitizeProduct(data), tenantId } });

const updateProduct = (tenantId, id, data) =>
  prisma.product.update({ where: { id, tenantId }, data: sanitizeProduct(data) });

const deleteProduct = (tenantId, id) =>
  prisma.product.update({ where: { id, tenantId }, data: { isActive: false } });

// ── Stock ──────────────────────────────────────────────────────────────────

const adjustStock = async (tenantId, productId, { type, quantity, notes, branchId }) => {
  const product = await prisma.product.findUnique({ where: { id: productId, tenantId } });
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

  const delta = type === 'PURCHASE' || type === 'RETURN' ? quantity : -quantity;
  const afterStock = product.stock + delta;

  if (afterStock < 0) throw Object.assign(new Error('Insufficient stock'), { statusCode: 400 });

  const ops = [
    prisma.product.update({ where: { id: productId }, data: { stock: afterStock } }),
    prisma.stockMovement.create({
      data: { tenantId, productId, type, quantity, beforeStock: product.stock, afterStock, notes },
    }),
  ];

  if (branchId) {
    ops.push(
      prisma.branchStock.upsert({
        where: { branchId_productId: { branchId, productId } },
        update: { quantity: { increment: delta } },
        create: { tenantId, branchId, productId, quantity: Math.max(0, delta) },
      })
    );
  }

  const [updated] = await prisma.$transaction(ops);
  return updated;
};

const getStockMovements = (tenantId, productId) =>
  prisma.stockMovement.findMany({
    where: { tenantId, ...(productId ? { productId } : {}) },
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

const getLowStockProducts = async (tenantId, branchId) => {
  if (branchId) {
    // For a branch, low stock is determined by BranchStock.quantity vs Product.lowStockAlert
    const stocks = await prisma.branchStock.findMany({
      where: { tenantId, branchId },
      include: { product: { include: { category: true } } },
    });
    return stocks
      .filter(bs => bs.quantity <= bs.product.lowStockAlert)
      .map(bs => ({ ...bs.product, stock: bs.quantity }));
  }
  return prisma.$queryRaw`
    SELECT * FROM products
    WHERE "tenantId" = ${tenantId}
    AND "isActive" = true
    AND stock <= "lowStockAlert"
  `;
};

const getExpiringProducts = (tenantId, days = 30) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
  return prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      expiryDate: { not: null, lte: cutoff },
    },
    include: { category: { select: { name: true } } },
    orderBy: { expiryDate: 'asc' },
  });
};

// ── Tax Rates ──────────────────────────────────────────────────────────────

const listTaxRates = (tenantId) => prisma.taxRate.findMany({ where: { tenantId } });
const createTaxRate = (tenantId, data) => prisma.taxRate.create({ data: { ...data, tenantId } });
const deleteTaxRate = (tenantId, id) => prisma.taxRate.delete({ where: { id, tenantId } });

// ── Purchase Orders ────────────────────────────────────────────────────────

const { generatePONumber } = require('../../utils/generateNumber');

const listPurchaseOrders = (tenantId) =>
  prisma.purchaseOrder.findMany({
    where: { tenantId },
    include: { vendor: { select: { name: true } }, items: true },
    orderBy: { createdAt: 'desc' },
  });

const getPurchaseOrder = (tenantId, id) =>
  prisma.purchaseOrder.findUnique({
    where: { id, tenantId },
    include: { vendor: true, items: { include: { product: true } } },
  });

const createPurchaseOrder = async (tenantId, { vendorId, expectedDate, notes, items }) => {
  const poNumber = await generatePONumber();
  let subtotal = 0, taxAmount = 0, total = 0;
  const lineItems = items.map(i => {
    const lineTotal = i.quantity * i.unitCost;
    const tax = lineTotal * ((i.taxRate || 0) / 100);
    subtotal += lineTotal;
    taxAmount += tax;
    total += lineTotal + tax;
    return { ...i, taxAmount: tax, total: lineTotal + tax };
  });
  return prisma.purchaseOrder.create({
    data: {
      tenantId, vendorId: vendorId || null, poNumber, expectedDate: expectedDate ? new Date(expectedDate) : null,
      notes, subtotal, taxAmount, total,
      items: { create: lineItems },
    },
    include: { items: true },
  });
};

const updatePurchaseOrder = (tenantId, id, data) =>
  prisma.purchaseOrder.update({ where: { id, tenantId }, data });

const deletePurchaseOrder = (tenantId, id) =>
  prisma.purchaseOrder.delete({ where: { id, tenantId } });

// Mark as received → auto-increment stock for each item
const receivePurchaseOrder = async (tenantId, id, receivedItems) => {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id, tenantId },
    include: { items: true },
  });
  if (!po) throw Object.assign(new Error('PO not found'), { statusCode: 404 });
  if (po.status === 'RECEIVED') throw Object.assign(new Error('PO already received'), { statusCode: 400 });

  // receivedItems: [{ itemId, receivedQty }] — can do partial receipt
  const updates = [];
  for (const ri of receivedItems) {
    const poItem = po.items.find(i => i.id === ri.itemId);
    if (!poItem || !poItem.productId) continue;
    const qty = Number(ri.receivedQty || poItem.quantity);
    if (qty <= 0) continue;

    const currentProduct = await prisma.product.findUnique({ where: { id: poItem.productId }, select: { stock: true } });
    const beforeStock = currentProduct?.stock || 0;

    updates.push(
      prisma.purchaseItem.update({ where: { id: ri.itemId }, data: { receivedQty: { increment: qty } } }),
      prisma.product.update({
        where: { id: poItem.productId },
        data: { stock: { increment: qty } },
      }),
      prisma.stockMovement.create({
        data: {
          tenantId, productId: poItem.productId, type: 'PURCHASE',
          quantity: qty,
          beforeStock,
          afterStock: beforeStock + qty,
          reference: po.poNumber,
        },
      })
    );
  }

  const allReceived = receivedItems.every(ri => {
    const poItem = po.items.find(i => i.id === ri.itemId);
    return poItem && (ri.receivedQty || poItem.quantity) >= poItem.quantity;
  });

  updates.push(
    prisma.purchaseOrder.update({
      where: { id },
      data: { status: allReceived ? 'RECEIVED' : 'PARTIAL', receivedDate: new Date() },
    })
  );

  await prisma.$transaction(updates);
  return prisma.purchaseOrder.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
};

const getCategoryReport = async (tenantId) => {
  const categories = await prisma.category.findMany({
    where: { tenantId, parentId: null },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      children: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { products: { where: { isActive: true }, select: { id: true, stock: true, costPrice: true, sellingPrice: true, name: true } } },
      },
      products: { where: { isActive: true }, select: { id: true, stock: true, costPrice: true, sellingPrice: true, name: true } },
    },
  });

  const summarise = (products) => ({
    count: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalStock: products.reduce((s, p) => s + p.stock, 0),
    inventoryValue: products.reduce((s, p) => s + (p.costPrice || p.sellingPrice) * p.stock, 0),
    retailValue: products.reduce((s, p) => s + p.sellingPrice * p.stock, 0),
  });

  return categories.map(cat => {
    const allProducts = [
      ...cat.products,
      ...cat.children.flatMap(c => c.products),
    ];
    return {
      id: cat.id, name: cat.name, code: cat.code, icon: cat.icon, color: cat.color,
      isStandard: cat.isStandard,
      summary: summarise(allProducts),
      subcategories: cat.children.map(sub => ({
        id: sub.id, name: sub.name, code: sub.code, isStandard: sub.isStandard,
        summary: summarise(sub.products),
        products: sub.products.map(p => ({ id: p.id, name: p.name, stock: p.stock, value: (p.costPrice || p.sellingPrice) * p.stock })),
      })),
      directProducts: cat.products.map(p => ({ id: p.id, name: p.name, stock: p.stock, value: (p.costPrice || p.sellingPrice) * p.stock })),
    };
  });
};

const getAllStockMovements = (tenantId) =>
  prisma.stockMovement.findMany({
    where: { tenantId },
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

module.exports = {
  seedStandardCategories, STD_TAXONOMY, deduplicateCategories,
  listCategories, createCategory, updateCategory, deleteCategory, getCategoryReport,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  adjustStock, getStockMovements, getAllStockMovements, getLowStockProducts, getExpiringProducts,
  listTaxRates, createTaxRate, deleteTaxRate,
  listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder,
  deletePurchaseOrder, receivePurchaseOrder,
};
