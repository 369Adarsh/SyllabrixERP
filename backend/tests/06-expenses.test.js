const { login, authed, OWNER } = require('./helpers/auth');
const prisma = require('./helpers/prisma');

describe('Expenses — CRUD + branch filtering', () => {
  let token;
  let hqBranch;
  let otherBranch;
  let createdIds = [];

  beforeAll(async () => {
    token = await login(OWNER.email);

    const bRes = await authed(token).get('/api/v1/branches');
    const branches = bRes.body.data;
    hqBranch    = branches.find(b => b.isHQ);
    otherBranch = branches.find(b => !b.isHQ && b.code === 'STRD');
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await prisma.expense.delete({ where: { id } }).catch(() => {});
    }
  });

  // ── List ───────────────────────────────────────────────────────────────────

  test('GET /expenses — returns all 150 seeded expenses', async () => {
    const res = await authed(token).get('/api/v1/expenses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(150);
  });

  test('GET /expenses?branchId=HQ — only HQ branch expenses', async () => {
    const res = await authed(token).get(`/api/v1/expenses?branchId=${hqBranch.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const e of res.body.data) {
      expect(e.branchId).toBe(hqBranch.id);
    }
  });

  test('GET /expenses?branchId=HQ vs branchId=STRD — different counts', async () => {
    const [hqRes, strdRes] = await Promise.all([
      authed(token).get(`/api/v1/expenses?branchId=${hqBranch.id}`),
      authed(token).get(`/api/v1/expenses?branchId=${otherBranch.id}`),
    ]);
    expect(hqRes.body.data.length).toBeGreaterThan(0);
    expect(strdRes.body.data.length).toBeGreaterThan(0);
    // They should be different sets (different branchIds)
    const hqIds  = new Set(hqRes.body.data.map(e => e.id));
    const strdIds = new Set(strdRes.body.data.map(e => e.id));
    const overlap = [...hqIds].filter(id => strdIds.has(id));
    expect(overlap.length).toBe(0);
  });

  test('GET /expenses?category=RENT — only RENT category', async () => {
    const res = await authed(token).get('/api/v1/expenses?category=RENT');
    expect(res.status).toBe(200);
    for (const e of res.body.data) {
      expect(e.category).toBe('RENT');
    }
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // ── Create without branchId ────────────────────────────────────────────────

  test('POST /expenses — creates expense without branchId', async () => {
    const res = await authed(token)
      .post('/api/v1/expenses')
      .send({
        category: 'SUPPLIES',
        description: 'Jest test expense',
        amount: 500,
        method: 'CASH',
        date: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(500);
    expect(res.body.data.category).toBe('SUPPLIES');
    expect(res.body.data.branchId).toBeNull();
    createdIds.push(res.body.data.id);
  });

  // ── Create with branchId ───────────────────────────────────────────────────

  test('POST /expenses — creates expense with branchId (HQ)', async () => {
    const res = await authed(token)
      .post('/api/v1/expenses')
      .send({
        category: 'UTILITIES',
        description: 'Jest HQ electricity bill',
        amount: 3500,
        method: 'BANK_TRANSFER',
        branchId: hqBranch.id,
        date: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.branchId).toBe(hqBranch.id);
    expect(res.body.data.category).toBe('UTILITIES');
    createdIds.push(res.body.data.id);
  });

  test('POST /expenses — created HQ expense appears in branchId filter', async () => {
    const latestId = createdIds[createdIds.length - 1];
    const res = await authed(token).get(`/api/v1/expenses?branchId=${hqBranch.id}`);
    const found = res.body.data.find(e => e.id === latestId);
    expect(found).toBeDefined();
  });

  test('POST /expenses — HQ expense does NOT appear in STRD filter', async () => {
    const latestId = createdIds[createdIds.length - 1];
    const res = await authed(token).get(`/api/v1/expenses?branchId=${otherBranch.id}`);
    const found = res.body.data.find(e => e.id === latestId);
    expect(found).toBeUndefined();
  });

  // ── Update ─────────────────────────────────────────────────────────────────

  test('PUT /expenses/:id — updates amount and description', async () => {
    const id = createdIds[0];
    const res = await authed(token)
      .put(`/api/v1/expenses/${id}`)
      .send({ amount: 750, description: 'Jest updated expense' });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(750);
    expect(res.body.data.description).toBe('Jest updated expense');
  });

  // ── Summary ────────────────────────────────────────────────────────────────

  test('GET /expenses/summary — returns totals by category', async () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 12, 1).toISOString().split('T')[0];
    const to   = now.toISOString().split('T')[0];

    const res = await authed(token).get(`/api/v1/expenses/summary?from=${from}&to=${to}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data.total).toBeGreaterThan(0);
  });

  // ── Delete ─────────────────────────────────────────────────────────────────

  test('DELETE /expenses/:id — deletes and 404s afterward', async () => {
    // Create one just to delete
    const create = await authed(token)
      .post('/api/v1/expenses')
      .send({ category: 'OTHER', description: 'to delete', amount: 1, method: 'CASH', date: new Date().toISOString() });
    const id = create.body.data.id;

    const del = await authed(token).delete(`/api/v1/expenses/${id}`);
    expect(del.status).toBe(200);

    // Confirm gone from DB
    const gone = await prisma.expense.findUnique({ where: { id } });
    expect(gone).toBeNull();
  });
});
