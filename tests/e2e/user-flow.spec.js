// tests/e2e/user-flow.spec.js
//
// End-to-end test of the full user journey: register -> login -> select
// a crop -> view advice. Uses Playwright (not installed by default —
// see README "End-to-end testing" for setup).
//
// Run with: npx playwright test tests/e2e

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

function uniqueEmail() {
  return `e2e_${Date.now()}@example.com`;
}

test.describe('Agricultural Advisory System — user flow', () => {
  test('a new farmer can register, sign in, pick a crop, and see advice', async ({ page }) => {
    const email = uniqueEmail();

    // --- Register ---
    await page.goto(`${BASE_URL}/register.html`);
    await page.fill('#name', 'E2E Test Farmer');
    await page.fill('#email', email);
    await page.fill('#password', 'testpass123');
    await page.click('#submitBtn');

    await expect(page).toHaveURL(/crops\.html/);
    await expect(page.locator('h1')).toHaveText('Which crop are you growing?');

    // --- Crop selection ---
    const firstCard = page.locator('.crop-card').first();
    await expect(firstCard).toBeVisible();
    const cropName = await firstCard.locator('.crop-name').textContent();
    await firstCard.click();

    // --- Advice page ---
    await expect(page).toHaveURL(/advice\.html\?crop_id=\d+/);
    await expect(page.locator('#cropTitle')).toHaveText(cropName);
    await expect(page.locator('#narrative')).not.toBeEmpty();
    await expect(page.locator('#planting')).not.toBeEmpty();
    await expect(page.locator('#irrigation')).not.toBeEmpty();
    await expect(page.locator('#fertilizer')).not.toBeEmpty();

    // --- Log out returns to sign-in ---
    await page.click('#logoutBtn');
    await expect(page).toHaveURL(/index\.html/);
    await expect(page.locator('h1')).toHaveText('Sign in');
  });

  test('login rejects an unknown account with a visible error', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.fill('#email', 'nobody@example.com');
    await page.fill('#password', 'whatever123');
    await page.click('#submitBtn');

    const error = page.locator('#errorAlert');
    await expect(error).toHaveClass(/show/);
    await expect(error).toContainText('Invalid email or password');
  });

  test('crop selection page is unreachable without a session', async ({ page }) => {
    await page.goto(`${BASE_URL}/crops.html`);
    await expect(page).toHaveURL(/index\.html/);
  });
});
