const { login, authed, OWNER } = require('./helpers/auth');
const prisma = require('./helpers/prisma');

describe('Inventory — products, stock adjust, branch stock', () => {
  let token;
  let testProduct;
  let hqBranch;
  let createdProductId;

  beforeAll(async () => {
    token = await login(OWNER.email);

    const bRes = await authed(token).get('/api/v1/branches');
    hqBranch = bRes.body.data.find(b => b.isHQ);

    const pRes = await authed(token).get('/api/v1/inventory/products');
    const products = Array.isArray(pRes.body.data) ? pRes.body.data : pRes.body.data?.products;
    testProduct = products[0];

    // Clean up any leftover test product from a previous failed run
    const stale = await prisma.product.findFirst({ where: { sku: 'JEST-TST-001' } });
    if (stale) {
      await prisma.branchStock.deleteMany({ where: { productId: stale.id } });
      await prisma.stockMovement.deleteMany({ where: { productId: stale.id } });
      await prisma.product.delete({ where: { id: stale.id } });
    }
  });

  afterAll(async () => {
    if (createdProductId) {
      await prisma.branchStock.deleteMany({ where: { productId: createdProductId } }).catch(() => {});
      await prisma.stockMovement.deleteMany({ where: { productId: createdProductId } }).catch(() => {});
      await prisma.product.delete({ where: { id: createdProductId } }).catch(() => {});
    }
  });

  // ── List products ──────────────────────────────────────────────────────────

  test('GET /inventory/products — returns 36 seeded products', async () => {
    const res = await authed(token).get('/api/v1/inventory/products');
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body.data) ? res.body.data : res.body.data?.products;
    expect(list.length).toBe(36);
  });

  test('GET /inventory/products — search by name filters correctly', async () => {
    const res = await authed(token).get('/api/v1/inventory/products?search=atta');
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body.data) ? res.body.data : res.body.data?.products;
    for (const p of list) {
      expect(p.name.toLowerCase()).toContain('atta');
    }
  });

  test('GET /inventory/products/:id — returns single product with category + taxRate', async () => {
    const res = await authed(token).get(`/api/v1/inventory/products/${testProduct.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testProduct.id);
    expect(res.body.data).toHaveProperty('category');
    expect(res.body.data).toHaveProperty('taxRate');
    expect(res.body.data.sellingPrice).toBeGreaterThan(0);
  });

  test('GET /inventory/products/:id — unknown ID returns 200 with null data', async () => {
    const res = await authed(token).get('/api/v1/inventory/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  // ── Create product ─────────────────────────────────────────────────────────

  test('POST /inventory/products — creates a new product', async () => {
    const res = await authed(token)
      .post('/api/v1/inventory/products')
      .send({
        name: 'Jest Test Product',
        sku: 'JEST-TST-001',
        sellingPrice: 99,
        costPrice: 60,
        stock: 50,
        lowStockAlert: 5,
        unit: 'pcs',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Jest Test Product');
    expect(res.body.data.sellingPrice).toBe(99);
    createdProductId = res.body.data.id;
  });

  test('GET /inventory/products — after create, total is 37', async () => {
    const res = await authed(token).get('/api/v1/inventory/products');
    const list = Array.isArray(res.body.data) ? res.body.data : res.body.data?.products;
    expect(list.length).toBe(37);
  });

  // ── Adjust stock (global) ──────────────────────────────────────────────────

  test('POST /inventory/products/:id/stock — PURCHASE adds stock', async () => {
    const before = await prisma.product.findUnique({ where: { id: createdProductId } });

    const res = await authed(token)
      .post(`/api/v1/inventory/products/${createdProductId}/stock`)
      .send({ type: 'PURCHASE', quantity: 20, notes: 'Jest restock' });

    expect(res.status).toBe(200);

    const after = await prisma.product.findUnique({ where: { id: createdProductId } });
    expect(after.stock).toBe(before.stock + 20);
  });

  test('POST /inventory/products/:id/stock — SALE removes stock', async () => {
    const before = await prisma.product.findUnique({ where: { id: createdProductId } });

    const res = await authed(token)
      .post(`/api/v1/inventory/products/${createdProductId}/stock`)
      .send({ type: 'SALE', quantity: 5, notes: 'Jest manual sale' });

    expect(res.status).toBe(200);

    const after = await prisma.product.findUnique({ where: { id: createdProductId } });
    expect(after.stock).toBe(before.stock - 5);
  });

  test('POST /inventory/products/:id/stock — cannot go below zero', async () => {
    const before = await prisma.product.findUnique({ where: { id: createdProductId } });

    const res = await authed(token)
      .post(`/api/v1/inventory/products/${createdProductId}/stock`)
      .send({ type: 'SALE', quantity: before.stock + 9999 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient/i);
  });

  // ── Adjust stock with branchId ─────────────────────────────────────────────

  test('POST /inventory/products/:id/stock — PURCHASE with branchId upserts BranchStock', async () => {
    const res = await authed(token)
      .post(`/api/v1/inventory/products/${createdProductId}/stock`)
      .send({ type: 'PURCHASE', quantity: 10, branchId: hqBranch.id, notes: 'Jest branch restock' });

    expect(res.status).toBe(200);

    const branchStock = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId: hqBranch.id, productId: createdProductId } },
    });
    expect(branchStock).not.toBeNull();
    expect(branchStock.quantity).toBeGreaterThanOrEqual(10);
  });

  test('POST /inventory/products/:id/stock — SALE with branchId decrements BranchStock', async () => {
    const before = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId: hqBranch.id, productId: createdProductId } },
    });
    const qtyBefore = before?.quantity || 0;

    const res = await authed(token)
      .post(`/api/v1/inventory/products/${createdProductId}/stock`)
      .send({ type: 'SALE', quantity: 3, branchId: hqBranch.id });

    expect(res.status).toBe(200);

    const after = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId: hqBranch.id, productId: createdProductId } },
    });
    expect(after.quantity).toBe(qtyBefore - 3);
  });

  // ── Stock movements ────────────────────────────────────────────────────────

  test('GET /inventory/products/:id/movements — returns movement history', async () => {
    const res = await authed(token).get(`/api/v1/inventory/products/${createdProductId}/movements`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Should have the PURCHASE and SALE we just did
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    for (const m of res.body.data) {
      expect(m).toHaveProperty('type');
      expect(m).toHaveProperty('quantity');
      expect(m).toHaveProperty('beforeStock');
      expect(m).toHaveProperty('afterStock');
    }
  });

  // ── Low stock alert ────────────────────────────────────────────────────────

  test('GET /inventory/products/low-stock — returns products at/below lowStockAlert', async () => {
    const res = await authed(token).get('/api/v1/inventory/products/low-stock');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const p of res.body.data) {
      expect(p.stock).toBeLessThanOrEqual(p.lowStockAlert);
    }
  });

  // ── Tax rates ──────────────────────────────────────────────────────────────

  test('GET /inventory/tax-rates — returns at least 2 seeded tax rates', async () => {
    const res = await authed(token).get('/api/v1/inventory/tax-rates');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    for (const t of res.body.data) {
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('rate');
      expect(typeof t.rate).toBe('number');
    }
  });
});
