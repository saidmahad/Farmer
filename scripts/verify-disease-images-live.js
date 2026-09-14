// One-off visual verification: load the Disease Library in a real browser,
// seed a session, wait for the disease cards, and check:
//   1. every card's <img> actually loaded (naturalWidth > 0),
//   2. no duplicated image srcs across cards,
//   3. no user-facing "FarmerAI" text anywhere on the page,
//   4. the brand text reads exactly "Famer".
const path = require('path');
const { chromium } = require(path.join('..', 'web', 'node_modules', 'playwright'));

const BASE = 'http://localhost:3000';

async function main() {
  // 1. Get a token via the API
  let token = '';
  const login = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@famer.test', password: 'testpass123' }),
  });
  if (login.ok) {
    token = (await login.json()).token || '';
  }
  if (!token) {
    const email = `vis_${Date.now()}@famer.test`;
    const reg = await fetch(`${BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Vis Check', email, password: 'vispass123', region: 'Test', language: 'en' }),
    });
    token = (await reg.json().catch(() => ({}))).token || '';
  }
  if (!token) throw new Error('no token');

  // 2. Decode the user payload for localStorage seeding (same as screenshot-group4.js)
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
  const user = { id: payload.id, name: 'Vis Check', email: payload.email || 'vis@famer.test', role: 'farmer' };

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(([tok, u]) => {
    localStorage.setItem('farmerai.token', tok);
    localStorage.setItem('farmerai.user', JSON.stringify(u));
    localStorage.setItem('farmerai.locale', 'en');
  }, [token, user]);

  await page.goto(`${BASE}/disease-library`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('li img', { timeout: 30000 });
  // Wait until every card image has settled (loaded or failed), max 60s.
  await page.waitForFunction(
    () => {
      const imgs = Array.from(document.querySelectorAll('li img'));
      return imgs.length > 0 && imgs.every((i) => i.complete);
    },
    { timeout: 60000 }
  );

  const report = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('li img, button img'));
    const cards = Array.from(document.querySelectorAll('h3')).map((h) => h.textContent?.trim());
    const results = [];
    const srcs = {};
    imgs.forEach((img) => {
      const src = img.getAttribute('src') || '';
      srcs[src] = (srcs[src] || 0) + 1;
      results.push({
        alt: img.getAttribute('alt'),
        src: src.split('/').pop().slice(0, 52),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        loaded: img.complete && img.naturalWidth > 0,
      });
    });
    const dupes = Object.entries(srcs).filter(([, c]) => c > 1);
    const bodyText = document.body.innerText || '';
    return {
      cardTitles: cards,
      images: results,
      brokenImages: results.filter((r) => !r.loaded).map((r) => r.alt),
      duplicateSrcs: dupes,
      farmerAiMentions: (bodyText.match(/FarmerAI/g) || []).length,
      famerMentions: (bodyText.match(/Famer\b/g) || []).length,
      brandText: document.querySelector('aside span.font-semibold')?.textContent || '(not found)',
      title: document.title,
    };
  });

  console.log(JSON.stringify(report, null, 2));

  await page.screenshot({ path: 'screenshots/disease-library-verified.png', fullPage: true });
  console.log('screenshot saved: screenshots/disease-library-verified.png');

  await browser.close();
}

main().catch((e) => {
  console.error('visual check failed:', e.message);
  process.exit(1);
});
