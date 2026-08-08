// tests/api.test.js
// Backend unit/integration tests using Node's built-in test runner
// (node --test). No extra test framework dependency required.
//
// Run with: npm test

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Use an isolated, throwaway database and a fixed JWT secret for tests
// so runs never touch the real dev database.
const TEST_DB = path.join(__dirname, 'test.db');
if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
process.env.DB_PATH = TEST_DB;
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
process.env.NODE_ENV = 'test';

let app;
let server;
let baseUrl;

test.before(async () => {
  // Run the real migration chain against the isolated test DB first, so
  // the test environment matches a fresh production deploy (full
  // plant/disease/video/crops catalog seeded, exactly as `npm start` does).
  require('../db/migrations/run');

  // Build a minimal app instance mirroring server.js, without starting
  // on a fixed port (each test run binds to an ephemeral port).
  const express = require('express');
  const authRoutes = require('../routes/auth');
  const cropRoutes = require('../routes/crops');
  const adviceRoutes = require('../routes/advice');

  app = express();
  app.use(express.json());
  app.use('/api', authRoutes);
  app.use('/api/crops', cropRoutes);
  app.use('/api/advice', adviceRoutes);

  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(() => {
  server.close();
  // Close the singleton better-sqlite3 connection before removing the
  // file — otherwise the file stays locked on Windows (EBUSY).
  require('../db').close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  for (const ext of ['-wal', '-shm']) {
    const f = TEST_DB + ext;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

async function post(pathname, body) {
  const res = await fetch(baseUrl + pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, body: await res.json() };
}

async function get(pathname, token) {
  const res = await fetch(baseUrl + pathname, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return { status: res.status, body: await res.json() };
}

test('POST /api/register rejects a short password', async () => {
  const { status, body } = await post('/api/register', {
    name: 'Test User',
    email: 'short@example.com',
    password: '123'
  });
  assert.equal(status, 400);
  assert.match(body.error, /8 characters/);
});

test('POST /api/register creates a user and returns a token', async () => {
  const { status, body } = await post('/api/register', {
    name: 'Amina Farmer',
    email: 'amina@example.com',
    password: 'secure1234'
  });
  assert.equal(status, 201);
  assert.ok(body.token);
  assert.equal(body.user.email, 'amina@example.com');
});

test('POST /api/register rejects a duplicate email', async () => {
  const { status, body } = await post('/api/register', {
    name: 'Amina Again',
    email: 'amina@example.com',
    password: 'secure1234'
  });
  assert.equal(status, 409);
  assert.match(body.error, /already exists/);
});

test('POST /api/login rejects wrong password', async () => {
  const { status, body } = await post('/api/login', {
    email: 'amina@example.com',
    password: 'wrong-password'
  });
  assert.equal(status, 401);
  assert.match(body.error, /Invalid email or password/);
});

test('POST /api/login succeeds with correct credentials', async () => {
  const { status, body } = await post('/api/login', {
    email: 'amina@example.com',
    password: 'secure1234'
  });
  assert.equal(status, 200);
  assert.ok(body.token);
});

test('GET /api/crops requires authentication', async () => {
  const { status, body } = await get('/api/crops');
  assert.equal(status, 401);
  assert.ok(body.error);
});

test('GET /api/crops returns the seeded catalog crop list when authenticated', async () => {
  const login = await post('/api/login', { email: 'amina@example.com', password: 'secure1234' });
  const { status, body } = await get('/api/crops', login.body.token);
  assert.equal(status, 200);
  // The crops table is mirrored from the verified plant catalog (migration
  // 007) — 64 crops today. Requiring >= 64 keeps the test resilient to
  // future catalog additions.
  assert.ok(body.crops.length >= 64, `expected >= 64 crops, got ${body.crops.length}`);
  const names = body.crops.map((c) => c.crop_name);
  assert.ok(names.includes('Rice (Paddy)'), 'catalog crop should be listed');
});

test('GET /api/advice returns template advice for a valid crop', async () => {
  const login = await post('/api/login', { email: 'amina@example.com', password: 'secure1234' });
  const crops = await get('/api/crops', login.body.token);
  const crop = crops.body.crops.find((c) => c.crop_name === 'Rice (Paddy)') || crops.body.crops[0];
  const cropId = crop.id;

  const { status, body } = await get(`/api/advice?crop_id=${cropId}`, login.body.token);
  assert.equal(status, 200);
  assert.equal(body.source, 'template'); // no ANTHROPIC_API_KEY set in test env
  assert.ok(body.advice.length > 0);
  assert.ok(body.fields.planting_method);
});

test('GET /api/advice 404s for an unknown crop id', async () => {
  const login = await post('/api/login', { email: 'amina@example.com', password: 'secure1234' });
  const { status } = await get('/api/advice?crop_id=999999', login.body.token);
  assert.equal(status, 404);
});
