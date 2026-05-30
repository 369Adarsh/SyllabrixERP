const request = require('supertest');
const app = require('../src/app');
const { login, authed, OWNER } = require('./helpers/auth');

describe('Auth — login, token, /me', () => {
  let token;

  beforeAll(async () => {
    token = await login(OWNER.email);
  });

  // ── Login ──────────────────────────────────────────────────────────────────

  test('POST /auth/login — valid credentials returns 200 + accessToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: OWNER.email, password: OWNER.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(OWNER.email);
    expect(res.body.data.user.role).toBe('OWNER');
  });

  test('POST /auth/login — wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: OWNER.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /auth/login — unknown email returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@nowhere.test', password: 'Test@1234' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /auth/login — missing fields returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: OWNER.email });

    expect(res.status).toBe(400);
  });

  // ── GET /me ────────────────────────────────────────────────────────────────

  test('GET /auth/me — no token returns 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /auth/me — invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer this.is.not.a.real.token');
    expect(res.status).toBe(401);
  });

  test('GET /auth/me — valid token returns user + tenant', async () => {
    const res = await authed(token).get('/api/v1/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(OWNER.email);
    expect(res.body.data.user.role).toBe('OWNER');
    expect(res.body.data.tenant).toBeDefined();
    expect(res.body.data.tenant.hasBranches).toBe(true);
    expect(res.body.data.tenant.name).toBe('Sharma Grocery Chain');
  });

  // ── Manager login ──────────────────────────────────────────────────────────

  test('Manager login — returns MANAGER role and branchId', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'amit@sharmachain.test', password: 'Test@1234' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('MANAGER');
    expect(res.body.data.user.branchId).toBeTruthy();
  });
});
