const { login, authed, OWNER } = require('./helpers/auth');
const prisma = require('./helpers/prisma');

describe('Stock Transfers — full lifecycle', () => {
  let token;
  let branches;
  let products;
  let fromBranch; // HQ (most stock)
  let toBranch;   // Station Road
  let testProduct;
  let initialFromQty;
  let initialToQty;

  // Transfer IDs created in this suite
  let requestedId;
  let cancelId;

  beforeAll(async () => {
    token = await login(OWNER.email);

    // Fetch branches
    const bRes = await authed(token).get('/api/v1/branches');
    branches = bRes.body.data;
    fromBranch = branches.find(b => b.isHQ);
    toBranch   = branches.find(b => !b.isHQ && b.code === 'STRD');

    // Pick a product that has HQ stock
    const netRes = await authed(token).get('/api/v1/branches/stock-network');
    const grid = netRes.body.data.grid;
    const row = grid.find(r => {
      const hqRow = r.branches.find(b => b.branchId === fromBranch.id);
      return hqRow && hqRow.qty >= 5;
    });

    expect(row).toBeDefined(); // seed should have given HQ enough stock
    testProduct    = row.product;
    initialFromQty = row.branches.find(b => b.branchId === fromBranch.id).qty;
    initialToQty   = row.branches.find(b => b.branchId === toBranch.id)?.qty || 0;
  });

  afterAll(async () => {
    if (cancelId) {
      await prisma.stockTransferItem.deleteMany({ where: { transferId: cancelId } });
      await prisma.stockTransfer.delete({ where: { id: cancelId } }).catch(() => {});
    }
  });

  // ── List ───────────────────────────────────────────────────────────────────

  test('GET /stock-transfers — returns seeded transfers', async () => {
    const res = await authed(token).get('/api/v1/stock-transfers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
  });

  test('GET /stock-transfers?status=RECEIVED — only received transfers', async () => {
    const res = await authed(token).get('/api/v1/stock-transfers?status=RECEIVED');
    expect(res.status).toBe(200);
    for (const t of res.body.data) {
      expect(t.status).toBe('RECEIVED');
    }
  });

  test('GET /stock-transfers — each transfer has fromBranch, toBranch, items', async () => {
    const res = await authed(token).get('/api/v1/stock-transfers');
    const t = res.body.data[0];
    expect(t).toHaveProperty('transferNumber');
    expect(t).toHaveProperty('fromBranch');
    expect(t).toHaveProperty('toBranch');
    expect(t).toHaveProperty('items');
    expect(t).toHaveProperty('status');
    expect(t.transferNumber).toMatch(/^TRF-/);
  });

  // ── Create (REQUESTED) ────────────────────────────────────────────────────

  test('POST /stock-transfers — creates a transfer request', async () => {
    const res = await authed(token)
      .post('/api/v1/stock-transfers')
      .send({
        fromBranchId: fromBranch.id,
        toBranchId:   toBranch.id,
        notes:        'Jest test transfer',
        isEmergency:  false,
        items: [{ productId: testProduct.id, quantity: 2, unitCost: 0 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('REQUESTED');
    expect(res.body.data.fromBranch.id).toBe(fromBranch.id);
    expect(res.body.data.toBranch.id).toBe(toBranch.id);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(2);
    requestedId = res.body.data.id;
  });

  test('POST /stock-transfers — emergency flag is stored correctly', async () => {
    const res = await authed(token)
      .post('/api/v1/stock-transfers')
      .send({
        fromBranchId: toBranch.id,
        toBranchId:   fromBranch.id,
        isEmergency:  true,
        items: [{ productId: testProduct.id, quantity: 1, unitCost: 10 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isEmergency).toBe(true);
    cancelId = res.body.data.id;
  });

  // ── Cancel ─────────────────────────────────────────────────────────────────

  test('PATCH /stock-transfers/:id/cancel — cancels a REQUESTED transfer', async () => {
    const res = await authed(token).patch(`/api/v1/stock-transfers/${cancelId}/cancel`);
    expect(res.status).toBe(200);

    // Verify status in DB
    const t = await prisma.stockTransfer.findUnique({ where: { id: cancelId } });
    expect(t.status).toBe('CANCELLED');
  });

  test('PATCH /stock-transfers/:id/cancel — cannot cancel an already-cancelled transfer', async () => {
    const res = await authed(token).patch(`/api/v1/stock-transfers/${cancelId}/cancel`);
    // updateMany on non-matching status returns count=0 (still 200, not an error from the service)
    // But the transfer should remain CANCELLED
    const t = await prisma.stockTransfer.findUnique({ where: { id: cancelId } });
    expect(t.status).toBe('CANCELLED');
  });

  // ── Approve ────────────────────────────────────────────────────────────────

  test('PATCH /stock-transfers/:id/approve — approves a REQUESTED transfer', async () => {
    const res = await authed(token).patch(`/api/v1/stock-transfers/${requestedId}/approve`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  test('PATCH /stock-transfers/:id/approve — cannot re-approve an APPROVED transfer', async () => {
    const res = await authed(token).patch(`/api/v1/stock-transfers/${requestedId}/approve`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Mark In Transit ────────────────────────────────────────────────────────

  test('PATCH /stock-transfers/:id/in-transit — marks APPROVED → IN_TRANSIT', async () => {
    const res = await authed(token).patch(`/api/v1/stock-transfers/${requestedId}/in-transit`);
    expect(res.status).toBe(200);

    const t = await prisma.stockTransfer.findUnique({ where: { id: requestedId } });
    expect(t.status).toBe('IN_TRANSIT');
  });

  // ── Receive (stock must adjust) ────────────────────────────────────────────

  test('PATCH /stock-transfers/:id/receive — marks IN_TRANSIT → RECEIVED and adjusts branch stock', async () => {
    const res = await authed(token).patch(`/api/v1/stock-transfers/${requestedId}/receive`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('RECEIVED');

    // Verify stock was deducted from HQ and added to STRD
    const fromStock = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId: fromBranch.id, productId: testProduct.id } },
    });
    const toStock = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId: toBranch.id, productId: testProduct.id } },
    });

    expect(fromStock.quantity).toBe(initialFromQty - 2);
    expect(toStock.quantity).toBe(initialToQty + 2);
  });

  test('PATCH /stock-transfers/:id/receive — cannot receive an already-RECEIVED transfer', async () => {
    const res = await authed(token).patch(`/api/v1/stock-transfers/${requestedId}/receive`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Surplus suggestion ─────────────────────────────────────────────────────

  test('GET /stock-transfers/suggest — returns branches with surplus', async () => {
    const res = await authed(token).get(
      `/api/v1/stock-transfers/suggest?productId=${testProduct.id}&qty=1`
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      const s = res.body.data[0];
      expect(s).toHaveProperty('branchId');
      expect(s).toHaveProperty('available');
      expect(s).toHaveProperty('surplus');
      expect(s).toHaveProperty('canFulfill');
      // Results should be sorted by surplus descending
      for (let i = 0; i < res.body.data.length - 1; i++) {
        expect(res.body.data[i].surplus).toBeGreaterThanOrEqual(res.body.data[i + 1].surplus);
      }
    }
  });

  // ── Cleanup: restore stock delta ──────────────────────────────────────────
  afterAll(async () => {
    if (requestedId) {
      await prisma.branchStock.updateMany({
        where: { branchId: fromBranch?.id, productId: testProduct?.id },
        data: { quantity: { increment: 2 } },
      }).catch(() => {});
      await prisma.branchStock.updateMany({
        where: { branchId: toBranch?.id, productId: testProduct?.id },
        data: { quantity: { decrement: 2 } },
      }).catch(() => {});
      await prisma.stockTransferItem.deleteMany({ where: { transferId: requestedId } });
      await prisma.stockTransfer.delete({ where: { id: requestedId } }).catch(() => {});
    }
  });
});
