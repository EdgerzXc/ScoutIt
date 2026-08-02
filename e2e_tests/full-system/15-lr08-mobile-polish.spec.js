import { test, expect } from '@playwright/test';

test.describe('LR-08 Mobile launch polish and honest data sweep', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('renders homepage at mobile viewport', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('renders property search at mobile viewport', async ({ page }) => {
    await page.goto('/property', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('renders onboarding flow at mobile viewport', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});
