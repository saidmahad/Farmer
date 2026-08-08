// scripts/verify-plant-explorer-ui.js
// Browser-level verification of the Plant Explorer against the running
// server (http://localhost:3000). Requires: server up, web/dist built,
// Playwright chromium installed.
//
//   node scripts/verify-plant-explorer-ui.js
//
// Verifies: grid renders ~64 crops, images load from Wikimedia, search by
// common/scientific/category terms filters correctly, category chips work,
// the Onion detail view has content, and no console errors occur.

const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.join('..', 'web', 'node_modules', 'playwright'));

const BASE = process.env.APP_URL || 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TOKEN = process.env.APP_TOKEN || '';

let failures = 0;
const notes = [];

function check(cond, label, extra = '') {
  if (cond) {
    console.log(`  PASS ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label} ${extra}`);
  }
}

async function main() {
  if (!TOKEN) throw new Error('Set APP_TOKEN to a valid session token first.');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err).slice(0, 300)));

  // Inject the session before the SPA boots: the route guard requires both
  // the token and the cached user object (see lib/auth.tsx).
  await page.addInitScript((tok) => {
    try {
      window.localStorage.setItem('farmerai.token', tok);
      window.localStorage.setItem(
        'farmerai.user',
        JSON.stringify({
          id: 1,
          name: 'Browser Test Farmer',
          email: 'browser@example.com',
          role: 'farmer',
          region: null,
          land_size: null,
          farm_type: null,
          language: 'en',
        })
      );
      window.localStorage.setItem('farmerai.locale', 'en');
    } catch {}
  }, TOKEN);

  await page.goto(`${BASE}/plant-explorer`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('ul.grid', { timeout: 20000 });
  await page.waitForTimeout(3500); // let images start loading

  // ---- grid -------------------------------------------------------------
  const cardCount = await page.locator('ul.grid > li').count();
  check(cardCount >= 55, `grid renders many crops (${cardCount})`);
  notes.push(`grid card count: ${cardCount}`);

  const countText = await page.locator('p', { hasText: /crops|dhir|نباتات/ }).first().textContent().catch(() => null);
  console.log(`  result-count line: ${countText}`);
  if (countText) check(countText.includes('/') && /\d/.test(countText), 'result count line visible');

  const firstNames = await page.locator('ul.grid > li h3').allTextContents();
  notes.push('sample card names: ' + firstNames.slice(0, 8).join(', '));

  // ---- images load ------------------------------------------------------
  // Images are lazy-loaded, so scroll through the whole grid first.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
  const broken = await page.evaluate(() => {
    let brokenCount = 0;
    document.querySelectorAll('ul.grid img').forEach((img) => {
      if (!img.complete || img.naturalWidth === 0) brokenCount++;
    });
    return brokenCount;
  });
  check(broken === 0, `no broken images in grid (broken=${broken})`);

  const srcs = await page.locator('ul.grid img').evaluateAll((imgs) => imgs.slice(0, 12).map((i) => i.src));
  const allWikimedia = srcs.every((s) => s.includes('upload.wikimedia.org'));
  check(allWikimedia, 'grid images come from Wikimedia Commons', srcs[0] || '');

  // ---- search -----------------------------------------------------------
  const searchInput = page.locator('input[placeholder*="Search plants" i]');
  async function countFor(q) {
    await searchInput.fill(q);
    await page.waitForTimeout(600);
    return page.locator('ul.grid > li').count();
  }

  const rice = await countFor('rice');
  check(rice === 1, `search "rice" → 1 card (got ${rice})`);

  const oryza = await countFor('Oryza');
  check(oryza === 1, `search "Oryza" → 1 card (got ${oryza})`);

  const cereal = await countFor('cereal');
  check(cereal === 8, `search "cereal" → 8 cereal cards (got ${cereal})`);

  const noMatch = await countFor('zzzzzznope');
  check(noMatch === 0, `search gibberish → 0 cards (got ${noMatch})`);

  await searchInput.fill('');
  await page.waitForTimeout(500);

  // ---- category filter --------------------------------------------------
  const fruitsChip = page.locator('button', { hasText: /^Fruits$/ }).first();
  await fruitsChip.click();
  await page.waitForTimeout(600);
  const fruits = await page.locator('ul.grid > li').count();
  check(fruits === 10, `Fruits filter → 10 cards (got ${fruits})`);
  const fruitNames = await page.locator('ul.grid > li h3').allTextContents();
  check(
    ['Mango', 'Banana', 'Apple'].every((n) => fruitNames.some((f) => f.startsWith(n))),
    'Fruits filter shows mango/banana/apple',
    fruitNames.join(',')
  );

  const allChip = page.locator('button', { hasText: /^All$/ }).first();
  await allChip.click();
  await page.waitForTimeout(600);
  const allCount = await page.locator('ul.grid > li').count();
  check(allCount === cardCount, `All filter restores full grid (${allCount})`);

  // ---- detail view (Onion) ----------------------------------------------
  await page.locator('ul.grid > li', { hasText: 'Onion' }).first().click();
  await page.waitForSelector('h1', { timeout: 15000 });
  await page.waitForTimeout(2000);
  const detailTitle = await page.locator('h1').textContent();
  check(detailTitle === 'Onion', `detail opens for Onion (title="${detailTitle}")`);

  const heroOk = await page.evaluate(() => {
    const img = document.querySelector('header img');
    return img ? img.complete && img.naturalWidth > 0 : false;
  });
  check(heroOk, 'detail hero image loads');
  const heroSrc = await page.locator('header img').getAttribute('src');
  check((heroSrc || '').includes('Onions'), 'hero image is the onion photo', heroSrc || '');

  const panelRows = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section'));
    const overview = sections.find((s) => s.textContent.includes('Overview'));
    const agronomy = sections.find((s) => s.textContent.includes('Agronomy'));
    const pests = sections.find((s) => s.textContent.includes('Common pests'));
    const resources = sections.find((s) => s.textContent.includes('Learning resources'));
    const dtCount = (el) => (el ? el.querySelectorAll('dt, li').length : 0);
    return {
      overview: dtCount(overview),
      agronomy: dtCount(agronomy),
      pests: dtCount(pests),
      resources: dtCount(resources),
    };
  });
  console.log(`  detail panel row counts: ${JSON.stringify(panelRows)}`);
  check(panelRows.overview >= 4, 'Overview panel has data');
  check(panelRows.agronomy >= 4, 'Agronomy panel has data');
  check(panelRows.pests >= 3, 'Pests panel has data');
  check(panelRows.resources >= 1, 'Resources panel has data');

  await page.screenshot({ path: path.join(OUT_DIR, 'plant-explorer-detail-onion.png'), fullPage: false });

  // back to grid, screenshot
  await page.getByRole('button', { name: /back to plants|ku noqo dhirta|العودة إلى النباتات/i }).click();
  await page.waitForSelector('ul.grid', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, 'plant-explorer-grid.png'), fullPage: true });

  const realErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('Failed to load resource')
  );
  check(realErrors.length === 0, 'no console/page errors', realErrors.join(' | '));

  await browser.close();

  console.log('\n--- NOTES ---');
  notes.forEach((n) => console.log('  ' + n));
  console.log(`\n${failures === 0 ? 'ALL UI CHECKS PASSED' : failures + ' UI CHECK(S) FAILED'}`);
  process.exitCode = failures ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
