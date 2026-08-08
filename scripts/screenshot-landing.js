// scripts/screenshot-landing.js
// Quick visual smoke for the Group 2 landing rebuild.
//
// Captures two screenshots of the Landing page into docs/screenshots/:
//   - landing-en.png  (default locale, English)
//   - landing-ar.png  (locale forced to Arabic to confirm RTL flips)
//
// The Arabic shot is the meaningful one — it proves the layout flips
// for RTL (logos/icons start-aligned, copy right-aligned, divider lines
// on the correct side). The English shot is the baseline.

const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join('..', 'web', 'node_modules', 'playwright'));

const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = process.env.LANDING_URL || 'http://localhost:5173/';

async function shoot(page, locale, filename) {
  // Pre-set the locale before the SPA boots. The LanguageProvider reads
  // this key on first mount.
  await page.addInitScript((loc) => {
    try { window.localStorage.setItem('farmerai.locale', loc); } catch {}
  }, locale);

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('h1', { timeout: 10000 });
  // small delay so fonts swap in
  await page.waitForTimeout(500);

  const htmlDir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
  const htmlLang = await page.evaluate(() => document.documentElement.getAttribute('lang'));

  const out = path.join(OUT_DIR, filename);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`  → wrote ${out}  (dir=${htmlDir}, lang=${htmlLang})`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  console.log('Capturing EN baseline...');
  await shoot(page, 'en', 'landing-en.png');

  console.log('Capturing AR with RTL flipped...');
  await shoot(page, 'ar', 'landing-ar.png');

  await browser.close();
  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});