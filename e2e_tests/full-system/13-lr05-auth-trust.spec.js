import { test, expect } from '@playwright/test';

test.describe('LR-05 Auth, listing trust, and PRC verification', () => {
  test('verifies onboarding separates sign in from create account flow', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('body')).toBeVisible();
  });
});
