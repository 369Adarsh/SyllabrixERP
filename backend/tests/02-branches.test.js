const { login, authed, OWNER } = require('./helpers/auth');
const prisma = require('./helpers/prisma');

describe('Branches — CRUD + Stock Network', () => {
  let token;
  let branches;
  let hqBranch;
  let nonHqBranch;
  let createdBranchId;

  beforeAll(async () => {
    token = await login(OWNER.email);
    const res = await authed(token).get('/api/v1/branches');
    branches = res.body.data;
    hqBranch    = branches.find(b => b.isHQ);
    nonHqBranch = branches.find(b => !b.isHQ && b.isActive);
  });

  afterAll(async () => {
    if (createdBranchId) {
      await prisma.branch.delete({ where: { id: createdBranchId } }).catch(() => {});
    }
  });

  // ── List ───────────────────────────────────────────────────────────────────

  test('GET /branches — returns all 4 seeded branches', async () => {
    const res = await authed(token).get('/api/v1/branches');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(4);
  });

  test('GET /branches — exactly one HQ branch', () => {
    const hqCount = branches.filter(b => b.isHQ).length;
    expect(hqCount).toBe(1);
  });

  test('GET /branches — HQ is first (ordered by isHQ desc)', () => {
    expect(branches[0].isHQ).toBe(true);
    expect(branches[0].code).toBe('MAIN');
  });

  test('GET /branches — all branches have required fields', () => {
    for (const b of branches) {
      expect(b).toHaveProperty('id');
      expect(b).toHaveProperty('name');
      expect(b).toHaveProperty('code');
      expect(b).toHaveProperty('isHQ');
      expect(b).toHaveProperty('isActive');
    }
  });

  // ── Create ─────────────────────────────────────────────────────────────────

  test('POST /branches — creates a new branch', async () => {
    const res = await authed(token).post('/api/v1/branches').send({
      name: 'Test Branch',
      code: 'TSTBR',
      city: 'Indore',
      phone: '9800000001',
      address: '1 Test Street',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Branch');
    expect(res.body.data.code).toBe('TSTBR');
    expect(res.body.data.isHQ).toBe(false);
    expect(res.body.data.isActive).toBe(true);
    createdBranchId = res.body.data.id;
  });

  test('GET /branches — after create, count is 5', async () => {
    const res = await authed(token).get('/api/v1/branches');
    expect(res.body.data.length).toBe(5);
  });

  // ── Update ─────────────────────────────────────────────────────────────────

  test('PUT /branches/:id — updates branch name and city', async () => {
    const res = await authed(token)
      .put(`/api/v1/branches/${createdBranchId}`)
      .send({ name: 'Test Branch Updated', city: 'Bhopal' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Test Branch Updated');
    expect(res.body.data.city).toBe('Bhopal');
  });

  // ── Toggle ─────────────────────────────────────────────────────────────────

  test('PATCH /branches/:id/toggle — cannot deactivate HQ branch', async () => {
    const res = await authed(token).patch(`/api/v1/branches/${hqBranch.id}/toggle`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/HQ/i);
  });

  test('PATCH /branches/:id/toggle — deactivates an active non-HQ branch', async () => {
    const res = await authed(token).patch(`/api/v1/branches/${createdBranchId}/toggle`);
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  test('PATCH /branches/:id/toggle — re-activates a deactivated branch', async () => {
    const res = await authed(token).patch(`/api/v1/branches/${createdBranchId}/toggle`);
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);
  });

  // ── Stock Network ──────────────────────────────────────────────────────────

  test('GET /branches/stock-network — returns branches and grid', async () => {
    const res = await authed(token).get('/api/v1/branches/stock-network');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('branches');
    expect(res.body.data).toHaveProperty('grid');
    expect(Array.isArray(res.body.data.branches)).toBe(true);
    expect(Array.isArray(res.body.data.grid)).toBe(true);
  });

  test('GET /branches/stock-network — grid has at least 36 products', async () => {
    const res = await authed(token).get('/api/v1/branches/stock-network');
    expect(res.body.data.grid.length).toBeGreaterThanOrEqual(36);
  });

  test('GET /branches/stock-network — each grid row has product + per-branch status', async () => {
    const res = await authed(token).get('/api/v1/branches/stock-network');
    const row = res.body.data.grid[0];
    expect(row).toHaveProperty('product');
    expect(row).toHaveProperty('branches');
    expect(row).toHaveProperty('totalQty');
    expect(row.product).toHaveProperty('name');
    expect(Array.isArray(row.branches)).toBe(true);
    for (const b of row.branches) {
      expect(b).toHaveProperty('branchId');
      expect(b).toHaveProperty('qty');
      expect(['OK', 'LOW', 'CRITICAL']).toContain(b.status);
    }
  });

  test('GET /branches/stock-network — HQ has higher stock than other branches', async () => {
    const res = await authed(token).get('/api/v1/branches/stock-network');
    const hqId = hqBranch.id;
    const totalHQStock = res.body.data.grid.reduce((sum, row) => {
      const b = row.branches.find(x => x.branchId === hqId);
      return sum + (b?.qty || 0);
    }, 0);
    const totalOtherStock = res.body.data.grid.reduce((sum, row) => {
      const others = row.branches.filter(x => x.branchId !== hqId);
      return sum + others.reduce((s, b) => s + b.qty, 0);
    }, 0);
    expect(totalHQStock).toBeGreaterThan(totalOtherStock / 3);
  });
});
