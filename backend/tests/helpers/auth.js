const request = require('supertest');
const app = require('../../src/app');

// Shared auth helper — login and return access token
const login = async (email, password = 'Test@1234') => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  if (!res.body?.data?.accessToken) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken;
};

// Return authed supertest agent for cleaner chaining
const authed = (token) => ({
  get:    (url)  => request(app).get(url).set('Authorization', `Bearer ${token}`),
  post:   (url)  => request(app).post(url).set('Authorization', `Bearer ${token}`),
  put:    (url)  => request(app).put(url).set('Authorization', `Bearer ${token}`),
  patch:  (url)  => request(app).patch(url).set('Authorization', `Bearer ${token}`),
  delete: (url)  => request(app).delete(url).set('Authorization', `Bearer ${token}`),
});

// Credentials for Sharma Grocery Chain
const OWNER    = { email: 'raj@sharmachain.test',   password: 'Test@1234' };
const MANAGER  = { email: 'amit@sharmachain.test',  password: 'Test@1234' }; // Station Road

module.exports = { login, authed, OWNER, MANAGER };
