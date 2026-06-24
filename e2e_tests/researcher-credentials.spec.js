import { test, expect } from '@playwright/test';

test.describe('Researcher Credentials & Investigator Dossier Flow', () => {
  const mockResearcherUser = {
    id: "researcher-456",
    role: "provider",
    providerType: "researcher",
    name: "E2E Due Diligence Agent",
    connects_balance: 100,
    tags: ["provider"],
    primaryMode: "provider"
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      localStorage.setItem('scoutit_user', JSON.stringify(user));
    }, mockResearcherUser);
  });

  test('Researcher can configure legal access and see them update on the Investigator Dossier preview', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2500);

    // h1: "Researcher Command Center" (ProviderMode.js line 117)
    await expect(page.locator('h1:has-text("Researcher Command Center")').first()).toBeVisible({ timeout: 10000 });

    // Click the Credentials tab (ResearcherHUD.js line 129)
    await page.locator('button:has-text("My Credentials (Dossier)")').click();
    await page.waitForTimeout(500);

    // Verify credentials section is visible (ResearcherHUD.js line 216)
    await expect(page.getByText('Legal & Access Credentials').first()).toBeVisible();
    await expect(page.getByText('Base Rates (Connects)').first()).toBeVisible();

    // 1. Toggle "PRC Licensed Appraiser" on (ResearcherHUD.js line 217)
    // The ToggleSwitch label wraps inside a div; find the toggle container
    const prcRow = page.locator('div').filter({ hasText: /^PRC Licensed Appraiser$/ });
    await prcRow.locator('div[class*="rounded-full"]').first().click();

    // Preview card: "PRC Licensed Real Estate Appraiser" text renders in a div, 
    // not a span. Use getByText for flexible matching (ResearcherHUD.js line 295).
    await expect(page.getByText('PRC Licensed Real Estate Appraiser').first()).toBeVisible({ timeout: 5000 });

    // 2. Toggle "LRA Direct Access (Title Tracing)" on (ResearcherHUD.js line 218)
    const lraRow = page.locator('div').filter({ hasText: /^LRA Direct Access \(Title Tracing\)$/ });
    await lraRow.locator('div[class*="rounded-full"]').first().click();

    // Preview: "LRA Direct Access (Title/Lien Tracing)" (ResearcherHUD.js line 300)
    await expect(page.getByText('LRA Direct Access').first()).toBeVisible({ timeout: 5000 });

    // 3. Save the profile (ResearcherHUD.js line 258)
    await page.locator('button:has-text("Save Dossier Security Profile")').click();

    // Toast: "Investigator Dossier Updated." (ResearcherHUD.js line 256)
    await expect(page.getByText('Investigator Dossier Updated').first()).toBeVisible({ timeout: 5000 });
  });
});
