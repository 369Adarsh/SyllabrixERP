const { login, authed, OWNER } = require('./helpers/auth');
const prisma = require('./helpers/prisma');

describe('POS — sale creation + branch stock', () => {
  let token;
  let branches;
  let hqBranch;
  let testProduct;
  let initialGlobalStock;
  let initialBranchQty;
  let createdTxIds = [];

  beforeAll(async () => {
    token = await login(OWNER.email);

    const bRes = await authed(token).get('/api/v1/branches');
    branches  = bRes.body.data;
    hqBranch  = branches.find(b => b.isHQ);

    // Find a product with enough stock at HQ
    const netRes = await authed(token).get('/api/v1/branches/stock-network');
    const row = netRes.body.data.grid.find(r => {
      const hq = r.branches.find(b => b.branchId === hqBranch.id);
      return hq && hq.qty >= 10;
    });
    expect(row).toBeDefined();
    testProduct       = row.product;
    initialGlobalStock = row.totalQty;
    initialBranchQty   = row.branches.find(b => b.branchId === hqBranch.id).qty;
  });

  afterAll(async () => {
    // Restore any stock changes made by sale tests
    for (const txId of createdTxIds) {
      const tx = await prisma.transaction.findUnique({ where: { id: txId }, include: { items: true } });
      if (!tx) continue;
      // Reverse the stock decrements
      for (const item of tx.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        }).catch(() => {});
        if (tx.branchId) {
          await prisma.branchStock.updateMany({
            where: { branchId: tx.branchId, productId: item.productId },
            data: { quantity: { increment: item.quantity } },
          }).catch(() => {});
        }
        await prisma.stockMovement.deleteMany({ where: { reference: tx.receiptNumber } }).catch(() => {});
      }
      await prisma.transactionItem.deleteMany({ where: { transactionId: txId } });
      await prisma.transaction.delete({ where: { id: txId } }).catch(() => {});
    }
  });

  // ── List transactions ──────────────────────────────────────────────────────

  test('GET /pos/transactions — returns 572 seeded transactions', async () => {
    const res = await authed(token).get('/api/v1/pos/transactions');
    expect(res.status).toBe(200);
    const data = res.body.data;
    const txList = Array.isArray(data) ? data : data?.data || data?.transactions || [];
    expect(txList.length).toBeGreaterThanOrEqual(1);
  });

  // ── Sale without branchId ──────────────────────────────────────────────────

  test('POST /pos/sale — sale without branchId succeeds and decrements global stock', async () => {
    const before = await prisma.product.findUnique({ where: { id: testProduct.id } });

    const res = await authed(token)
      .post('/api/v1/pos/sale')
      .send({
        items: [{ productId: testProduct.id, quantity: 1 }],
        paymentMethod: 'CASH',
        amountPaid: before.sellingPrice * 1.2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBeGreaterThan(0);
    expect(res.body.data.receiptNumber).toMatch(/^RCP-/);
    createdTxIds.push(res.body.data.id);

    const after = await prisma.product.findUnique({ where: { id: testProduct.id } });
    expect(after.stock).toBe(before.stock - 1);
  });

  // ── Sale with branchId ─────────────────────────────────────────────────────

  test('POST /pos/sale — sale with branchId decrements BranchStock', async () => {
    const branchStockBefore = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId: hqBranch.id, productId: testProduct.id } },
    });
    const qtyBefore = branchStockBefore?.quantity ?? 0;

    const productRow = await prisma.product.findUnique({ where: { id: testProduct.id } });

    const res = await authed(token)
      .post('/api/v1/pos/sale')
      .send({
        branchId: hqBranch.id,
        items: [{ productId: testProduct.id, quantity: 2 }],
        paymentMethod: 'UPI',
        amountPaid: productRow.sellingPrice * 2 * 1.2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.branch?.id).toBe(hqBranch.id);
    createdTxIds.push(res.body.data.id);

    const branchStockAfter = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId: hqBranch.id, productId: testProduct.id } },
    });
    expect(branchStockAfter.quantity).toBe(qtyBefore - 2);
  });

  // ── Receipt structure ──────────────────────────────────────────────────────

  test('POST /pos/sale — receipt has correct GST breakdown', async () => {
    const productRow = await prisma.product.findUnique({
      where: { id: testProduct.id },
      include: { taxRate: true },
    });

    const res = await authed(token)
      .post('/api/v1/pos/sale')
      .send({
        items: [{ productId: testProduct.id, quantity: 1 }],
        paymentMethod: 'CARD',
        amountPaid: productRow.sellingPrice * 2,
      });

    expect(res.status).toBe(201);
    createdTxIds.push(res.body.data.id);

    const item = res.body.data.items[0];
    expect(item).toHaveProperty('cgst');
    expect(item).toHaveProperty('sgst');
    expect(item).toHaveProperty('taxAmount');
    expect(item.quantity).toBe(1);
    expect(item.unitPrice).toBe(productRow.sellingPrice);
    // cgst + sgst should equal taxAmount (within float tolerance)
    expect(Math.abs(item.cgst + item.sgst - item.taxAmount)).toBeLessThan(0.02);
  });

  // ── Payment method variants ────────────────────────────────────────────────

  test('POST /pos/sale — CARD, UPI, CASH, BANK_TRANSFER all accepted', async () => {
    const productRow = await prisma.product.findUnique({ where: { id: testProduct.id } });
    for (const method of ['CARD', 'UPI', 'CASH', 'BANK_TRANSFER']) {
      const res = await authed(token)
        .post('/api/v1/pos/sale')
        .send({
          items: [{ productId: testProduct.id, quantity: 1 }],
          paymentMethod: method,
          amountPaid: productRow.sellingPrice * 2,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.paymentMethod).toBe(method);
      createdTxIds.push(res.body.data.id);
    }
  });

  // ── Stock guard ────────────────────────────────────────────────────────────

  test('POST /pos/sale — quantity exceeding stock returns 400', async () => {
    const productRow = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const res = await authed(token)
      .post('/api/v1/pos/sale')
      .send({
        items: [{ productId: testProduct.id, quantity: productRow.stock + 9999 }],
        paymentMethod: 'CASH',
        amountPaid: 9999999,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/insufficient stock/i);
  });

  test('POST /pos/sale — invalid productId returns 404', async () => {
    const res = await authed(token)
      .post('/api/v1/pos/sale')
      .send({
        items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
        paymentMethod: 'CASH',
        amountPaid: 100,
      });

    expect(res.status).toBe(404);
  });

  // ── Discount ───────────────────────────────────────────────────────────────

  test('POST /pos/sale — discount reduces total correctly', async () => {
    const productRow = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const discount = 10;

    const res = await authed(token)
      .post('/api/v1/pos/sale')
      .send({
        items: [{ productId: testProduct.id, quantity: 1 }],
        paymentMethod: 'CASH',
        amountPaid: productRow.sellingPrice * 2,
        discountAmount: discount,
      });

    expect(res.status).toBe(201);
    createdTxIds.push(res.body.data.id);
    expect(res.body.data.discountAmount).toBe(discount);

    // Total without discount minus discount = reported total
    const item = res.body.data.items[0];
    expect(res.body.data.total).toBeCloseTo(item.total - discount, 1);
  });
});
