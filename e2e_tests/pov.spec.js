import { test, expect } from '@playwright/test';

// Configuration for consistent screenshots
const screenshotOptions = {
  fullPage: true,
  animations: 'disabled'
};

test.describe('Council POV Checks', () => {

  test('Buyer POV - Browsing and details', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    // Give time for any background video/images to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e_tests/screenshots/1_buyer_homepage.png', ...screenshotOptions });

    // 2. Discover page
    await page.goto('/discover');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e_tests/screenshots/2_buyer_discover.png', ...screenshotOptions });

    // 3. Property Listing (Wait for grid to load)
    await page.goto('/property');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e_tests/screenshots/3_buyer_property_list.png', ...screenshotOptions });

    // 4. Specific Property (Aurelia Residences)
    await page.goto('/property/aurelia-residences');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e_tests/screenshots/4_buyer_property_dossier.png', ...screenshotOptions });

    // 5. Wishlist / Board
    await page.goto('/wishlist');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e_tests/screenshots/5_buyer_wishlist.png', ...screenshotOptions });
  });

  test('Broker POV - Dashboard', async ({ page }) => {
    // Set mock user for Broker in localStorage to bypass login
    await page.addInitScript(() => {
      window.localStorage.setItem('scoutit_user', JSON.stringify({
        id: 'usr-broker-demo',
        name: 'Demo Broker',
        role: 'broker'
      }));
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e_tests/screenshots/6_broker_dashboard.png', ...screenshotOptions });
  });

  test('Casual User - Onboarding & Services', async ({ page }) => {
    // Onboarding
    await page.goto('/onboarding');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e_tests/screenshots/7_casual_onboarding.png', ...screenshotOptions });

    // Photographers (Waitlist UI)
    await page.goto('/photographers');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e_tests/screenshots/8_casual_photographers.png', ...screenshotOptions });
  });
});
