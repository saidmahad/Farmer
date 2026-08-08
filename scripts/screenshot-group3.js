// scripts/screenshot-group3.js
// Captures the protected pages (Dashboard, CropRecommendation list +
// detail) in EN and AR to verify Group 3 end-to-end.
//
// Runs through the full flow:
//   1. Land on /auth?mode=signup, fill the 2-step form.
//   2. After login, land on /dashboard — capture.
//   3. Click "Browse all crops" → /crop-recommendation — capture list.
//   4. Click the first crop card — capture detail view with advice.
//
// Auth state is seeded via addInitScript so screenshots are stable.

const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join('..', 'web', 'node_modules', 'playwright'));

const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = process.env.LANDING_URL || 'http://localhost:5173';

const TEST_USER = {
  name: 'Salma Tester',
  email: 'salma.g3@example.com',
  password: 'hunter1234',
  region: 'Punjab',
  land_size: 2.5,
  farm_type: 'Commercial',
  language: 'en',
};

async function shootFlow(page, locale, outPrefix) {
  // Pre-seed locale + a freshly-issued token so we skip the signup flow.
  await page.addInitScript((args) => {
    try {
      window.localStorage.setItem('farmerai.locale', args.locale);
      window.localStorage.setItem('farmerai.token', args.token);
      window.localStorage.setItem('farmerai.user', JSON.stringify(args.user));
    } catch {}
  }, {
    locale,
    token: TEST_USER.token,
    user: TEST_USER.user,
  });

  // 1. Dashboard
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForSelector('h1', { timeout: 10000 });
  await page.waitForTimeout(800);
  const dashDir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
  await page.screenshot({ path: path.join(OUT_DIR, `${outPrefix}-dashboard.png`), fullPage: true });
  console.log(`  → dashboard (${locale}, dir=${dashDir})`);

  // 2. CropRecommendation list
  await page.goto(`${BASE}/crop-recommendation`, { waitUntil: 'networkidle' });
  await page.waitForSelector('h1', { timeout: 10000 });
  // Wait for the crop grid to render at least one card
  await page.waitForFunction(
    () => document.querySelectorAll('button[type="button"]').length > 4,
    { timeout: 10000 }
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, `${outPrefix}-crops-list.png`), fullPage: true });
  console.log(`  → crops-list (${locale})`);

  // 3. Click first crop card — find one inside the grid by aria/role.
  //    The cards are <button> elements with crop_name inside h3. We click
  //    the first one whose visible text isn't a nav button.
  const firstCard = await page.locator('ul > li > button').first();
  await firstCard.click();
  await page.waitForURL(/\/crop-recommendation\?crop=/, { timeout: 10000 });
  await page.waitForSelector('h1', { timeout: 10000 });
  // Wait for the advice card to populate (either loading disappears or text appears)
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, `${outPrefix}-crop-detail.png`), fullPage: true });
  console.log(`  → crop-detail (${locale})`);
}

async function preflight() {
  // Sign in once to harvest a real JWT, so the seeded user is genuinely
  // authenticated for the protected routes.
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }),
  });
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  return null;
}

(async () => {
  // Register the test user through the API once.
  const reg = await fetch(`${BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  });
  if (!reg.ok && reg.status !== 409) {
    console.error('Register failed:', reg.status, await reg.text());
    process.exit(1);
  }
  if (reg.ok) console.log('Registered test user.');

  // Sign in to get a real JWT + user payload
  const loginRes = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }),
  });
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    process.exit(1);
  }
  const data = await loginRes.json();
  TEST_USER.token = data.token;
  TEST_USER.user = data.user;
  console.log('Got token for', TEST_USER.email);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();

  console.log('Capturing EN baseline...');
  await shootFlow(page, 'en', 'group3-en');

  console.log('Capturing AR with RTL flipped...');
  await shootFlow(page, 'ar', 'group3-ar');

  await browser.close();
  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});