// scripts/screenshot-group4.js
// Captures Group 4 pages (Soil, Plants, Diseases, Calendar) in EN + AR.
//
// Flow:
//   1. Pre-seed a fresh test user via POST /api/register.
//   2. Sign in via POST /api/login to capture the JWT.
//   3. For each locale (EN, AR), pre-seed localStorage (auth token + locale),
//      then navigate to each page and snapshot.
//
// Output: docs/screenshots/group4-{en,ar}-{soil,plants,diseases,calendar}.png

const path = require('path');
const fs = require('fs');

const PLAYWRIGHT = path.join('..', 'web', 'node_modules', 'playwright');
const { chromium } = require(PLAYWRIGHT);

const ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';
const API = process.env.API_ORIGIN || 'http://localhost:3000';
const EMAIL = `g4_${Date.now()}@farmerai.test`;
const PASSWORD = 'Group4Pass!';
const UNIQUE = Date.now().toString(36);

const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { route: '/soil-prediction', slug: 'soil', wait: 'h1' },
  { route: '/plant-explorer', slug: 'plants', wait: 'h1' },
  { route: '/plant-explorer?plant=rice', slug: 'plants-detail', wait: 'h1, h2' },
  { route: '/disease-library', slug: 'diseases', wait: 'h1' },
  { route: '/disease-library?disease=rice-blast', slug: 'diseases-detail', wait: 'h1, h2' },
  { route: '/growth-calendar', slug: 'calendar', wait: 'h1' },
];

async function api(pathname, init = {}) {
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { error: text }; }
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${pathname} → ${res.status}: ${body.error || text}`);
  }
  return body;
}

async function main() {
  console.log(`[g4] registering ${EMAIL}`);
  await api('/api/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'G4 Test',
      email: EMAIL,
      password: PASSWORD,
      region: 'Punjab',
      land_size: '5 acres',
      farm_type: 'Crop farming',
      language: 'en',
    }),
  });

  const { token } = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  console.log('[g4] got token');

  const browser = await chromium.launch();
  try {
    for (const locale of ['en', 'ar']) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      // addInitScript runs in every page before user script — this makes
      // the token + user + locale visible to the React auth & i18n
      // Provider from the very first render, so the user lands on the
      // protected route instead of being bounced to /sign-in.
      const userBlob = {
        id: 1,
        name: 'G4 Test',
        email: EMAIL,
        role: 'farmer',
        region: 'Punjab',
        land_size: 5,
        farm_type: 'Commercial',
        language: locale,
      };
      await ctx.addInitScript(
        ({ token, locale, user }) => {
          try {
            localStorage.setItem('farmerai.token', token);
            localStorage.setItem('farmerai.user', JSON.stringify(user));
            localStorage.setItem('farmerai.locale', locale);
          } catch {}
        },
        { token, locale, user: userBlob }
      );

      const page = await ctx.newPage();

      for (const target of PAGES) {
        const url = `${ORIGIN}${target.route}`;
        process.stdout.write(`[g4] ${locale} ${target.slug} → ${url} ... `);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForSelector(target.wait, { timeout: 10000 }).catch(() => {});
        // Give the apiFetch + render a moment to settle (esp. detail pages
        // where data is fetched after the initial paint).
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1500);
        const filename = path.join(OUT_DIR, `group4-${locale}-${target.slug}.png`);
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`saved ${path.basename(filename)}`);
      }

      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  console.log('[g4] done');
}

main().catch((err) => {
  console.error('[g4] failed:', err);
  process.exit(1);
});
