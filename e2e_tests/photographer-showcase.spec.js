import { test, expect } from '@playwright/test';

test.describe('Photographer Showcase & Council Metrics', () => {
  // Mock the localStorage to bypass the onboarding flow and jump straight into Photographer Mode
  // NOTE: `tags` is required — dashboard.page.js reads `parsed.tags` to set the active mode.
  //       providerType drives which HUD is rendered inside ProviderMode.
  const mockPhotographerUser = {
    id: "photographer-123",
    role: "provider",
    providerType: "photographer",
    name: "E2E Cinematic Shooter",
    connects_balance: 50,
    tags: ["provider"],
    primaryMode: "provider"
  };

  test.beforeEach(async ({ page }) => {
    // Use addInitScript for reliable localStorage injection before page load
    await page.addInitScript((user) => {
      localStorage.setItem('scoutit_user', JSON.stringify(user));
    }, mockPhotographerUser);
  });

  test('Photographer can configure deep Council metrics and see them update on the Preview Card', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');

    // Wait for the lazy-loaded ProviderMode to render
    await page.waitForTimeout(2000);

    // The actual heading is "{providerLabel} Command Center" — for photographer that's "Photographer Command Center"
    // ProviderMode.js line 117: `{providerLabel} Command Center`
    await expect(page.locator('h1:has-text("Photographer Command Center")').first()).toBeVisible({ timeout: 10000 });

    // Unlock the view if needed (Simulator button)
    const unlockBtn = page.locator('button:has-text("Simulate Unlock")');
    if (await unlockBtn.isVisible()) {
      await unlockBtn.click();
    }

    // Switch to the Showcase tab (PhotographerHUD tab)
    await page.click('text=My Showcase (Promotion)');

    // Verify the new Council metrics are visible
    await expect(page.locator('text=Compliance & Certs').first()).toBeVisible();
    await expect(page.locator('text=Premium Add-ons').first()).toBeVisible();
    
    // 1. Toggle "CAA Drone License" on
    const droneToggle = page.locator('div').filter({ hasText: /^CAA Drone License$/ }).locator('div.w-10');
    await droneToggle.click();

    // Verify the Gold Badge appears on the preview card
    await expect(page.locator('span:has-text("CAA Certified")').first()).toBeVisible();

    // 2. Toggle "Matterport 3D Tours" on
    const matterportToggle = page.locator('div').filter({ hasText: /^Matterport 3D Tours$/ }).locator('div.w-10');
    await matterportToggle.click();

    // Verify the Add-on appears in the preview list
    await expect(page.locator('text=Matterport 3D Tours').nth(1)).toBeVisible();

    // 3. Change Turnaround Time
    const turnaroundSelect = page.locator('select');
    await turnaroundSelect.selectOption('Next-Day Delivery');

    // Verify the preview card updates to Next-Day Delivery
    await expect(page.locator('text=Next-Day Delivery').nth(1)).toBeVisible();

    // Save the profile
    await page.click('text=Save Showcase Profile');

    // The toast notification should appear
    await expect(page.locator('text=Elite Roster Profile Updated').first()).toBeVisible();
  });
});
