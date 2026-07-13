import { test, expect } from '@playwright/test';

test.describe('Owner Live Canvas (Editor v1)', () => {
  const mockOwnerUser = {
    id: "usr_mock_123",
    name: "Test Owner",
    role: "owner",
    tags: ["owner"],
    primaryMode: "owner"
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      localStorage.setItem('scoutit_user', JSON.stringify(user));
    }, mockOwnerUser);

    // Mock the update API to prevent actual DB writes during tests
    await page.route('**/api/dashboard/update*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });
  });

  test('Seamlessly edits the live property and updates the canvas in real-time', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2500);

    // Owner has no listings yet → Zero listings view
    // h3: "Create your first Property File" (OwnerMode.js line 387)
    await expect(page.locator('h3:has-text("Create your first Property File")').first()).toBeVisible({ timeout: 10000 });

    // Click "Start My First Listing" to open the wizard
    await page.locator('button:has-text("Start My First Listing")').click();
    await page.waitForTimeout(500);

    // Mode selector screen — look for the "Build from Scratch" option
    await expect(page.locator('h3:has-text("Build from Scratch")').first()).toBeVisible({ timeout: 10000 });

    // Click the Build from Scratch card
    await page.locator('h3:has-text("Build from Scratch")').click();
    await page.waitForTimeout(1000);

    // Live Editor should now be visible — check for the Must Haves section
    await expect(page.locator('h3').filter({ hasText: 'Basic Property Information' })).toBeVisible({ timeout: 10000 });

    // The right pane shows the live preview banner
    await expect(page.getByText('LIVE PREVIEW / DRAFT MODE').first()).toBeVisible();

    // Test real-time reactivity: change the property title
    const titleInput = page.locator('input[placeholder="e.g. Premium High-Rise Office in BGC Core"]');
    const newTitle = `Canvas Edit ${Date.now()}`;
    await titleInput.fill(newTitle);

    // The Live Canvas renders CommercialFlow/ResidentialFlow with:
    // <h1 className="hero-title">{d.title}</h1> (CommercialFlow.js line 947)
    const canvasTitle = page.locator('.hero-title').first();
    await expect(canvasTitle).toHaveText(newTitle, { timeout: 8000 });

    // LiveEditorWorkspace.js line 626: "Save Draft" — this used to read "Save as Draft" /
    // "Save Changes" depending on new-vs-editing state; the button text was since
    // simplified to a single "Save Draft" label regardless of state.
    const saveBtn = page.locator('button').filter({ hasText: /Save Draft/i }).first();
    
    // The button exists even when disabled (only enabled once all 5 must-haves are filled)
    await expect(saveBtn).toBeVisible({ timeout: 5000 });

    // The real test objective: the editor didn't crash and the canvas reflects the typed title.
    // We proved that with the .hero-title assertion above.
  });
});
