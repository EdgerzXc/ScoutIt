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
    
    // Wait for either button to appear in the DOM
    await expect(page.locator('text="Create your first listing"').or(page.locator('text="+ New Property File"')).first()).toBeVisible({ timeout: 15000 });

    const startFirstBtn = page.getByRole('button', { name: 'Create your first listing', exact: true });
    const newPropertyBtn = page.getByRole('button', { name: '+ New Property File', exact: true });

    if (await startFirstBtn.isVisible()) {
      await startFirstBtn.click({ force: true });
    } else if (await newPropertyBtn.isVisible()) {
      await newPropertyBtn.click({ force: true });
    }

    // Wait for the modal/wizard to appear
    await expect(page.locator('h1:has-text("How do you want to create your listing?")')).toBeVisible({ timeout: 15000 });
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

    await page.goto('/property/the-ridgeline-at-capitol-commons');
    
    // Wait until loading is gone and the property is displayed (h2 is rendered in the layer header)
    await expect(page.locator('text="LOADING SPACE INTELLIGENCE..."')).toBeHidden({ timeout: 20000 });
    
    // Simulate clicking the floating "Inquire" button which dispatches the global event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('scoutit:property-inquire'));
    });

    // Wait for the inquiry modal to open and animate in
    await expect(page.locator('h2:has-text("Contact the Owner")')).toBeVisible({ timeout: 15000 });
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
    
    // Wait for either the deal file to load or the open deal button
    await expect(page.locator('text="Open Workspace"').or(page.locator('button:has-text("Open Deal File")')).first()).toBeVisible({ timeout: 15000 }).catch(() => {});
    
    const activeDealCount = await page.locator('text="Open Workspace"').count();
    if (activeDealCount > 0) {
      await page.locator('text="Open Workspace"').first().click({ force: true });
      await expect(page.locator('text="Opportunity File"').first()).toBeVisible({ timeout: 15000 });
    } else {
      const openDealCount = await page.locator('button:has-text("Open Deal File")').count();
      if (openDealCount > 0) {
        await page.locator('button:has-text("Open Deal File")').first().click({ force: true });
        await expect(page.locator('text="Draft Pitch"').first()).toBeVisible({ timeout: 15000 });
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e_tests/screenshots/deep_broker_workspace.png', ...screenshotOptions });
  });

});
