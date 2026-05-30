const { login, authed, OWNER } = require('./helpers/auth');

describe('Reports — sales, top products, P&L, branch filtering', () => {
  let token;
  let hqBranch;
  let otherBranch;

  // Date range covering all seeded data (last 13 months)
  const from = new Date(Date.now() - 395 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const to   = new Date().toISOString().split('T')[0];

  beforeAll(async () => {
    token = await login(OWNER.email);

    const bRes = await authed(token).get('/api/v1/branches');
    const branches = bRes.body.data;
    hqBranch    = branches.find(b => b.isHQ);
    otherBranch = branches.find(b => !b.isHQ && b.code === 'STRD');
  });

  // ── Sales report ───────────────────────────────────────────────────────────

  test('GET /reports/sales — returns summary + daily data array', async () => {
    const res = await authed(token).get(`/api/v1/reports/sales?from=${from}&to=${to}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data.summary.totalRevenue).toBeGreaterThan(0);
    expect(res.body.data.summary.totalTransactions).toBeGreaterThanOrEqual(572);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });

  test('GET /reports/sales — each data point has date + revenue', async () => {
    const res = await authed(token).get(`/api/v1/reports/sales?from=${from}&to=${to}`);
    const point = res.body.data.data[0];
    expect(point).toHaveProperty('date');
    expect(point).toHaveProperty('revenue');
    expect(point).toHaveProperty('transactions');
  });

  test('GET /reports/sales?groupBy=month — month-grouped keys (YYYY-MM)', async () => {
    const res = await authed(token).get(`/api/v1/reports/sales?from=${from}&to=${to}&groupBy=month`);
    expect(res.status).toBe(200);
    for (const d of res.body.data.data) {
      expect(d.date).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  test('GET /reports/sales?branchId=HQ — revenue lower than all-branches', async () => {
    const [allRes, hqRes] = await Promise.all([
      authed(token).get(`/api/v1/reports/sales?from=${from}&to=${to}`),
      authed(token).get(`/api/v1/reports/sales?from=${from}&to=${to}&branchId=${hqBranch.id}`),
    ]);
    expect(hqRes.status).toBe(200);
    expect(hqRes.body.data.summary.totalRevenue).toBeGreaterThan(0);
    expect(hqRes.body.data.summary.totalRevenue).toBeLessThan(
      allRes.body.data.summary.totalRevenue
    );
  });

  test('GET /reports/sales — branchId=HQ + branchId=STRD < all-branches total (multi-branch split)', async () => {
    const [allRes, hqRes, strdRes] = await Promise.all([
      authed(token).get(`/api/v1/reports/sales?from=${from}&to=${to}`),
      authed(token).get(`/api/v1/reports/sales?from=${from}&to=${to}&branchId=${hqBranch.id}`),
      authed(token).get(`/api/v1/reports/sales?from=${from}&to=${to}&branchId=${otherBranch.id}`),
    ]);
    const combined = hqRes.body.data.summary.totalRevenue + strdRes.body.data.summary.totalRevenue;
    expect(combined).toBeLessThanOrEqual(allRes.body.data.summary.totalRevenue + 1); // ±1 for float
  });

  test('GET /reports/sales — payment method breakdown present', async () => {
    const res = await authed(token).get(`/api/v1/reports/sales?from=${from}&to=${to}`);
    expect(res.body.data.summary).toHaveProperty('byPaymentMethod');
    expect(typeof res.body.data.summary.byPaymentMethod).toBe('object');
  });

  // ── Top products ───────────────────────────────────────────────────────────

  test('GET /reports/top-products — returns array sorted by revenue desc', async () => {
    const res = await authed(token).get(`/api/v1/reports/top-products?from=${from}&to=${to}&limit=10`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (let i = 0; i < res.body.data.length - 1; i++) {
      expect(res.body.data[i].revenue).toBeGreaterThanOrEqual(res.body.data[i + 1].revenue);
    }
  });

  test('GET /reports/top-products — each entry has product, qty, revenue', async () => {
    const res = await authed(token).get(`/api/v1/reports/top-products?from=${from}&to=${to}`);
    const entry = res.body.data[0];
    expect(entry).toHaveProperty('product');
    expect(entry).toHaveProperty('qty');
    expect(entry).toHaveProperty('revenue');
    expect(entry.product).toHaveProperty('name');
  });

  test('GET /reports/top-products?branchId=HQ — returns HQ-specific top products', async () => {
    const res = await authed(token).get(
      `/api/v1/reports/top-products?from=${from}&to=${to}&branchId=${hqBranch.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // ── Top customers ──────────────────────────────────────────────────────────

  test('GET /reports/top-customers — returns sorted by totalSpent', async () => {
    const res = await authed(token).get(`/api/v1/reports/top-customers?from=${from}&to=${to}&limit=10`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (let i = 0; i < res.body.data.length - 1; i++) {
      expect(res.body.data[i].totalSpent).toBeGreaterThanOrEqual(res.body.data[i + 1].totalSpent);
    }
  });

  // ── Profit & Loss ──────────────────────────────────────────────────────────

  test('GET /reports/pl — returns tradingAccount + plAccount', async () => {
    const res = await authed(token).get(`/api/v1/reports/pl?from=${from}&to=${to}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('tradingAccount');
    expect(res.body.data).toHaveProperty('plAccount');
    expect(res.body.data).toHaveProperty('period');
  });

  test('GET /reports/pl — trading account has revenue, cogs, grossProfit', async () => {
    const res = await authed(token).get(`/api/v1/reports/pl?from=${from}&to=${to}`);
    const ta = res.body.data.tradingAccount;
    expect(ta).toHaveProperty('revenue');
    expect(ta.revenue.total).toBeGreaterThan(0);
    expect(ta).toHaveProperty('cogs');
    expect(ta).toHaveProperty('grossProfit');
  });

  test('GET /reports/pl — P&L account has operating expenses breakdown', async () => {
    const res = await authed(token).get(`/api/v1/reports/pl?from=${from}&to=${to}`);
    const pl = res.body.data.plAccount;
    expect(pl.operatingExpenses).toHaveProperty('byCategory');
    expect(pl.operatingExpenses.operational).toBeGreaterThan(0);
    expect(Array.isArray(pl.operatingExpenses.byCategory)).toBe(true);
  });

  test('GET /reports/pl?branchId=HQ — P&L for HQ only (lower revenue)', async () => {
    const [allRes, hqRes] = await Promise.all([
      authed(token).get(`/api/v1/reports/pl?from=${from}&to=${to}`),
      authed(token).get(`/api/v1/reports/pl?from=${from}&to=${to}&branchId=${hqBranch.id}`),
    ]);
    expect(hqRes.status).toBe(200);
    expect(hqRes.body.data.tradingAccount.revenue.total).toBeLessThan(
      allRes.body.data.tradingAccount.revenue.total
    );
    // HQ expenses should be less than or equal to total (branch-filtered)
    expect(hqRes.body.data.plAccount.operatingExpenses.operational).toBeLessThanOrEqual(
      allRes.body.data.plAccount.operatingExpenses.operational
    );
  });

  // ── Dashboard ──────────────────────────────────────────────────────────────

  test('GET /reports/dashboard — returns business-type-aware stats', async () => {
    const res = await authed(token).get('/api/v1/reports/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('businessType');
    expect(res.body.data).toHaveProperty('today');
    expect(res.body.data).toHaveProperty('month');
    expect(res.body.data.businessType).toBe('KIRANA');
  });

  // ── Invoice report ─────────────────────────────────────────────────────────

  test('GET /reports/invoices — returns totals and byStatus breakdown', async () => {
    const res = await authed(token).get(`/api/v1/reports/invoices?from=${from}&to=${to}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totals');
    expect(res.body.data).toHaveProperty('byStatus');
  });
});
