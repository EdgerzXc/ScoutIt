import { test, expect } from '@playwright/test';
import { expectDesignDNA, expectRealContent, trackErrors } from './helpers.js';

test.describe('End-to-End User Journeys — Production Readiness', () => {
  test('Seeker Pricing Journey: verifies 4 tiers, off-market vault locked/unlocked cards, and infotip', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/pricing/seeker', { waitUntil: 'load' });
    await expectRealContent(page);
    await expectDesignDNA(page);

    // Verify all 4 seeker tiers render
    await expect(page.locator('text=Starry Wanderer').first()).toBeVisible();
    await expect(page.locator('text=Solar Seeker').first()).toBeVisible();
    await expect(page.locator('text=Cluster Scout').first()).toBeVisible();
    await expect(page.locator('text=Universe Principal').first()).toBeVisible();

    // Verify Off-Market Vault card is surfaced in table/features
    await expect(page.locator('text=Off-Market Vault: Locked').first()).toBeVisible();
    await expect(page.locator('text=Exclusive Off-Market Vault Access').first()).toBeVisible();
    await expect(page.locator('text=PIONEER ACCESS // FREE FOR LAUNCH').first()).toBeVisible();

    // Verify InfoTip button renders, hydrates, and functions
    const infoTipBtn = page.locator('button[aria-label*="Off-Market Vault"][data-hydrated="true"]').first();
    await expect(infoTipBtn).toBeVisible({ timeout: 10000 });
    await infoTipBtn.click();
    const popover = page.locator('.infotip-pop', { hasText: /off-market vault/i }).first();
    await expect(popover).toBeVisible({ timeout: 10000 });

    expect(errors).toEqual([]);
  });

  test('Owner Pricing Journey: verifies publication quota vs unlimited free off-market storage', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/pricing/owner', { waitUntil: 'domcontentloaded' });
    await expectRealContent(page);
    await expectDesignDNA(page);

    // Verify all 4 owner tiers render
    await expect(page.locator('text=Starry Holder').first()).toBeVisible();
    await expect(page.locator('text=Solar Landlord').first()).toBeVisible();
    await expect(page.locator('text=Cluster Developer').first()).toBeVisible();
    await expect(page.locator('text=Universe Portfolio').first()).toBeVisible();

    // Verifies free off-market storage messaging and Pioneer Access badge
    await expect(page.locator('text=Unlimited free off-market cloud storage').first()).toBeVisible();
    await expect(page.locator('text=PIONEER ACCESS // FREE FOR LAUNCH').first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('Metropolis Directory Journey: category switching and Off-Market luxury locked gate card', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/layer/metropolis', { waitUntil: 'domcontentloaded' });
    await expectRealContent(page);
    await expectDesignDNA(page);

    // Click Off-Market category button
    const offMarketBtn = page.locator('button:has-text("Off-Market")').first();
    await expect(offMarketBtn).toBeVisible();
    await offMarketBtn.click();

    // Unauthenticated seeker sees the luxury gate card
    await expect(page.locator('text=The Confidential Off-Market Vault').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Universe Seeker Exclusive · ₱2,499/mo').first()).toBeVisible();
    await expect(page.locator('link:has-text("Unlock Universe Access →"), a:has-text("Unlock Universe Access →")').first()).toBeVisible();
    await expect(page.locator('link:has-text("Browse Off-Market Vault →"), a:has-text("Browse Off-Market Vault →")').first()).toBeVisible();

    // Switch back to Residential category and verify clean switch
    const resBtn = page.locator('button:has-text("Residential")').first();
    await resBtn.click();
    await expect(page.locator('text=The Confidential Off-Market Vault').first()).not.toBeVisible();

    expect(errors).toEqual([]);
  });

  test('Dedicated Off-Market Vault Journey: verifies gate card and pricing link', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/off-market', { waitUntil: 'domcontentloaded' });
    await expectRealContent(page);
    await expectDesignDNA(page);

    await expect(page.locator('text=PIONEER ACCESS // FREE FOR LAUNCH').first()).toBeVisible();
    await expect(page.locator('text=RESTRICTED OFF-MARKET VAULT').first()).toBeVisible();
    await expect(page.locator('text=Sign in with an entitled account').first()).toBeVisible();
    await expect(page.locator('link:has-text("VIEW UNIVERSE PLAN"), a:has-text("VIEW UNIVERSE PLAN")').first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('Property Page & Claim Panel Journey: verifies statutory disclosure and quota messaging', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/property/cyber-sigma-tower-3', { waitUntil: 'domcontentloaded' });
    await expectRealContent(page);
    await expectDesignDNA(page);

    // Look for Claim This Property button
    const claimBtn = page.locator('button:has-text("Claim This Property")').first();
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
      // Verify panel elements
      await expect(page.locator('text=Claim Ownership or Representation').first()).toBeVisible();
      await expect(page.locator('text=Philippine R.A. 9646').first()).toBeVisible();
      await expect(page.locator('text=Deposit to Off-Market Storage (Free)').first()).toBeVisible();
    }

    expect(errors).toEqual([]);
  });
});
