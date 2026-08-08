// scripts/screenshot.mjs
// Drives the running dev server to capture proof-of-work screenshots for
// build group 1. Run with: node scripts/screenshot.mjs
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const OUT = 'screenshots';
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 1. Landing (public)
await page.goto(BASE + '/', { waitUntil: 'load' });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/01-landing.png` });

// 2. Auth (public, demo entry)
await page.goto(BASE + '/auth', { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/02-auth.png` });

// 3. Demo login -> protected dashboard (Layout + guard)
await page.getByRole('button', { name: /preview the app/i }).click();
await page.waitForURL('**/dashboard');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/03-dashboard.png` });

// 4. Sidebar navigation -> Crop Recommendation (active state moves)
await page.getByRole('link', { name: /crop recommendation/i }).first().click();
await page.waitForURL('**/crop-recommendation');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/04-crop-recommendation.png` });

// 5. Language switcher -> Hindi (i18n foundation live)
await page.getByRole('button', { name: /EN|HI|TA|TE|KN/ }).first().click();
await page.waitForTimeout(300);
await page.getByText('हिन्दी').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/05-hindi.png` });

// 6. Guard: visiting /dashboard while logged out redirects to /auth
await page.evaluate(() => window.localStorage.clear());
await page.goto(BASE + '/dashboard', { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/06-auth-redirect.png` });

await browser.close();
console.log('screenshots captured in', OUT);
