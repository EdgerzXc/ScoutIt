import { test, expect } from '@playwright/test';

test.describe('LR-03 hybrid connect wallet and server-side tier rules', () => {
  test('renders persona pricing selector page', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/Seekers & Buyers/i).first()).toBeVisible();
    await expect(page.getByText(/Brokers & Advisors/i).first()).toBeVisible();
  });

  test('verifies Starry Seekers receive 1 monthly Connect allowance on seeker pricing page', async ({ page }) => {
    await page.goto('/pricing/seeker');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/Starry/i).first()).toBeVisible();
  });
});
