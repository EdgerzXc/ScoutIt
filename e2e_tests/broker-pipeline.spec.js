import { test, expect } from '@playwright/test';

test.describe('Broker Mode Handshake Pipeline', () => {
  // A simple mock for localStorage to simulate logging in as a Broker
  // NOTE: `tags` is required — dashboard.page.js reads `parsed.tags` to set the active mode.
  //       Without it, the page redirects to /onboarding.
  const mockBrokerUser = {
    id: "broker-123",
    role: "broker",
    name: "E2E Test Broker",
    connects_balance: 10,
    tags: ["broker"],
    primaryMode: "broker"
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to a page to establish origin so we can set localStorage
    await page.addInitScript((user) => {
      localStorage.setItem('scoutit_user', JSON.stringify(user));
    }, mockBrokerUser);
  });

  test('Broker can see incoming handshakes and accept them', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');

    // Wait for dynamic content to load (BrokerMode is lazy-loaded)
    await page.waitForTimeout(2000);

    // We expect the broker dashboard sections to be visible.
    // Target the always-visible h3 headings (not the responsive h2 which toggles with lg:hidden/lg:flex)
    // h3: "Active Deal Files" is always rendered in BrokerMode.js line 312
    await expect(page.locator('h3:has-text("Active Deal Files")').first()).toBeVisible({ timeout: 10000 });

    // h3: "Market Intelligence Feed" is always rendered in BrokerMode.js line 363
    await expect(page.locator('h3:has-text("Market Intelligence Feed")').first()).toBeVisible();
  });
});
