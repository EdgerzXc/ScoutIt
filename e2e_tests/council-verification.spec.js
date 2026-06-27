import { test, expect } from '@playwright/test';

const screenshotOptions = {
  fullPage: true,
  animations: 'disabled'
};

test.describe('Deep E2E Council Verification - Interactive Workflows', () => {

  test('1. Owner POV - Active Wizard Interaction', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('scoutit_user', JSON.stringify({
        id: 'usr-owner-demo',
        name: 'Demo Owner',
        role: 'owner',
        tags: ['owner'],
        primaryMode: 'owner'
      }));
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // If "Start My First Listing" exists (zero listings view)
    const startFirstBtn = page.getByText('Start My First Listing');
    // If "+ New Property File" exists (has listings view)
    const newPropertyBtn = page.getByText('+ New Property File', { exact: true });

    if (await startFirstBtn.isVisible()) {
      await startFirstBtn.click();
    } else if (await newPropertyBtn.isVisible()) {
      await newPropertyBtn.click();
    }

    // Wait for the modal/wizard to appear
    await page.waitForSelector('h1:has-text("How would you like to create this listing?")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e_tests/screenshots/deep_owner_wizard.png', ...screenshotOptions });
  });

  test('2. Buyer POV - Opening Inquiry Modal', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('scoutit_user', JSON.stringify({
        id: 'usr-buyer-demo',
        name: 'Demo Buyer',
        role: 'buyer',
        tags: ['buyer'],
        primaryMode: 'buyer'
      }));
    });

    await page.goto('/property/aurelia-residences');
    await page.waitForTimeout(3000);
    
    // Simulate clicking the floating "Inquire" button which dispatches the global event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('scoutit:property-inquire'));
    });

    // Wait for the inquiry modal to open and animate in
    await page.waitForSelector('h2:has-text("Schedule a Viewing")');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'e2e_tests/screenshots/deep_buyer_inquiry.png', ...screenshotOptions });
  });

  test('3. Broker POV - Opening Active Deal Workspace', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('scoutit_user', JSON.stringify({
        id: 'usr-broker-demo',
        name: 'Demo Broker',
        role: 'broker',
        tags: ['broker'],
        primaryMode: 'broker'
      }));
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // Broker Mode should load Active Deal Files or at least Market Intelligence
    // Try to click an active deal if one exists
    const activeDealCount = await page.locator('text="Open Workspace"').count();
    if (activeDealCount > 0) {
      await page.locator('text="Open Workspace"').first().click();
      await page.waitForSelector('text="Opportunity File"');
    } else {
      // If no deals, click to open a pitch modal
      const openDealCount = await page.locator('button:has-text("Open Deal File")').count();
      if (openDealCount > 0) {
        await page.locator('button:has-text("Open Deal File")').first().click();
        await page.waitForSelector('text="Draft Pitch"');
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e_tests/screenshots/deep_broker_workspace.png', ...screenshotOptions });
  });

});
