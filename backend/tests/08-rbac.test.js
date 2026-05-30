const request = require('supertest');
const app = require('../src/app');
const { login, authed, OWNER, MANAGER } = require('./helpers/auth');
const prisma = require('./helpers/prisma');

describe('RBAC — role-based access control', () => {
  let ownerToken;
  let managerToken;
  let managerUser;

  beforeAll(async () => {
    [ownerToken, managerToken] = await Promise.all([
      login(OWNER.email),
      login(MANAGER.email),
    ]);

    // Get manager's own user data so we know their branchId
    const meRes = await authed(managerToken).get('/api/v1/auth/me');
    managerUser = meRes.body.data.user;
  });

  // ── Unauthenticated ────────────────────────────────────────────────────────

  test('No token → GET /branches returns 401', async () => {
    const res = await request(app).get('/api/v1/branches');
    expect(res.status).toBe(401);
  });

  test('No token → GET /inventory/products returns 401', async () => {
    const res = await request(app).get('/api/v1/inventory/products');
    expect(res.status).toBe(401);
  });

  test('No token → GET /reports/sales returns 401', async () => {
    const res = await request(app).get('/api/v1/reports/sales');
    expect(res.status).toBe(401);
  });

  test('No token → POST /pos/sale returns 401', async () => {
    const res = await request(app).post('/api/v1/pos/sale').send({});
    expect(res.status).toBe(401);
  });

  // ── Manager read access ────────────────────────────────────────────────────

  test('Manager → GET /branches returns 200 (read allowed)', async () => {
    const res = await authed(managerToken).get('/api/v1/branches');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('Manager → GET /inventory/products returns 200', async () => {
    const res = await authed(managerToken).get('/api/v1/inventory/products');
    expect(res.status).toBe(200);
  });

  test('Manager → GET /reports/dashboard returns 200', async () => {
    const res = await authed(managerToken).get('/api/v1/reports/dashboard');
    expect(res.status).toBe(200);
  });

  test('Manager → GET /pos/transactions returns 200', async () => {
    const res = await authed(managerToken).get('/api/v1/pos/transactions');
    expect(res.status).toBe(200);
  });

  // ── Manager write restrictions ─────────────────────────────────────────────

  test('Manager → POST /inventory/products returns 403 (OWNER/ADMIN only)', async () => {
    const res = await authed(managerToken)
      .post('/api/v1/inventory/products')
      .send({ name: 'Forbidden Product', sellingPrice: 10, stock: 0 });
    expect(res.status).toBe(403);
  });

  test('Manager → DELETE /inventory/products/:id returns 403', async () => {
    // Use a bogus ID — we just need to hit the auth guard
    const res = await authed(managerToken)
      .delete('/api/v1/inventory/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(403);
  });

  test('Manager → POST /inventory/products/:id/stock returns 403', async () => {
    const pRes = await authed(ownerToken).get('/api/v1/inventory/products');
    const products = Array.isArray(pRes.body.data) ? pRes.body.data : pRes.body.data?.products;
    const pid = products[0].id;

    const res = await authed(managerToken)
      .post(`/api/v1/inventory/products/${pid}/stock`)
      .send({ type: 'PURCHASE', quantity: 10 });
    expect(res.status).toBe(403);
  });

  test('Manager → DELETE /expenses/:id returns 403 (OWNER/ADMIN only)', async () => {
    const res = await authed(managerToken)
      .delete('/api/v1/expenses/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(403);
  });

  // ── Manager expense create (allowed: OWNER/ADMIN/ACCOUNTANT) ──────────────

  test('Manager → POST /expenses returns 403 (not OWNER/ADMIN/ACCOUNTANT)', async () => {
    const res = await authed(managerToken)
      .post('/api/v1/expenses')
      .send({ category: 'OTHER', description: 'test', amount: 100, method: 'CASH', date: new Date().toISOString() });
    // MANAGER is not in the OWNER/ADMIN/ACCOUNTANT list for this route
    expect(res.status).toBe(403);
  });

  // ── Owner has full access ──────────────────────────────────────────────────

  test('Owner → POST /inventory/products returns 201', async () => {
    const res = await authed(ownerToken)
      .post('/api/v1/inventory/products')
      .send({ name: 'RBAC Test Product', sku: 'RBAC-TST-999', sellingPrice: 5, stock: 0 });
    expect(res.status).toBe(201);

    await prisma.product.delete({ where: { id: res.body.data.id } }).catch(() => {});
  });

  test('Owner → DELETE /inventory/products/:id returns 200 or 404 (not 403)', async () => {
    const res = await authed(ownerToken)
      .delete('/api/v1/inventory/products/00000000-0000-0000-0000-000000000000');
    // 404 = not found is fine; 403 = access denied is the failure case
    expect(res.status).not.toBe(403);
  });

  // ── Tax rate delete is OWNER only ──────────────────────────────────────────

  test('Manager → DELETE /inventory/tax-rates/:id returns 403', async () => {
    const res = await authed(managerToken)
      .delete('/api/v1/inventory/tax-rates/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(403);
  });

  test('Admin user cannot hit platform routes', async () => {
    const res = await authed(ownerToken).get('/api/platform/tenants');
    // Platform routes require a platform JWT (SA token), not a tenant token
    expect(res.status).toBe(401);
  });

  // ── Health check is public ─────────────────────────────────────────────────

  test('GET /health — public, no auth required', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
