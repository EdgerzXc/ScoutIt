import { test, expect } from '@playwright/test';

test.describe('Designer Studio Profile Flow', () => {
  const mockDesignerUser = {
    id: "designer-789",
    role: "provider",
    providerType: "designer",
    name: "E2E Spatial Stager",
    connects_balance: 150,
    tags: ["provider"],
    primaryMode: "provider"
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      localStorage.setItem('scoutit_user', JSON.stringify(user));
    }, mockDesignerUser);
  });

  test('Designer can configure their Software Stack and Aesthetic and see them update on the Studio Preview', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2500);

    // Verify h1 heading renders correctly (ProviderMode.js line 117)
    await expect(page.locator('h1:has-text("Designer Command Center")').first()).toBeVisible({ timeout: 10000 });

    // Switch to the Design Studio tab (DesignerHUD.js line 111)
    await page.locator('button:has-text("Design Studio (Profile)")').click();
    await page.waitForTimeout(500);

    // Verify the Studio configuration section is visible (DesignerHUD.js line 159)
    await expect(page.locator('h3:has-text("Studio Identity")').first()).toBeVisible();

    // 1. Change the Aesthetic Identity - fill the input field
    // The input has value={aesthetic} and onChange updates the aesthetic state
    const aestheticInput = page.locator('input[type="text"]').first();
    await aestheticInput.clear();
    await aestheticInput.fill('Ultra-Minimalist Japandi');

    // The preview card (right column) shows aesthetic as a <p> tag (DesignerHUD.js line 248)
    // It's the only rendered instance of the typed text (the input value is an attribute, not text content)
    await expect(page.locator('p:has-text("Ultra-Minimalist Japandi")').first()).toBeVisible({ timeout: 5000 });

    // 2. Toggle "Blender / Maya" on (DesignerHUD.js line 212)
    const blenderToggle = page.locator('div').filter({ hasText: /^Blender \/ Maya$/ }).locator('div').filter({ hasAttribute: 'class' }).first();
    await blenderToggle.click();

    // Verify "Blender" span appears on the preview card (DesignerHUD.js line 277)
    await expect(page.locator('span:has-text("Blender")').first()).toBeVisible({ timeout: 5000 });

    // 3. Toggle "Physical Furniture Staging" on (DesignerHUD.js line 204)
    const physicalToggle = page.locator('div').filter({ hasText: /^Physical Furniture Staging$/ }).locator('div').filter({ hasAttribute: 'class' }).first();
    await physicalToggle.click();

    // "Full Physical Logistics & Furniture Staging" is rendered in the preview (DesignerHUD.js line 263)
    await expect(page.getByText('Full Physical Logistics & Furniture Staging').first()).toBeVisible({ timeout: 5000 });

    // Save the profile (DesignerHUD.js line 221)
    await page.locator('button:has-text("Save Studio Profile")').click();

    // Toast fires: "Design Studio Profile Updated." (DesignerHUD.js line 219)
    await expect(page.getByText('Design Studio Profile Updated').first()).toBeVisible({ timeout: 5000 });
  });
});
