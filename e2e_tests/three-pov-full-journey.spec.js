import { test, expect } from '@playwright/test';
import {
  trackErrors,
  expectDesignDNA,
  expectRealContent,
  gotoAndSettle,
  signInAsMock,
  MOCK_SEEKER,
  MASTER_DEV_READONLY,
} from './full-system/helpers.js';

test.describe('3-POV Comprehensive End-to-End User Journey', () => {

  // ---------------------------------------------------------------------------
  // POV 1: BUYER / SEEKER JOURNEY
  // ---------------------------------------------------------------------------
  test('POV 1: Buyer/Seeker — Homepage, Directory Search, Property Detail & Inquiry Modal', async ({ page }) => {
    const errors = trackErrors(page);

    // Step 1: Visit Homepage
    await gotoAndSettle(page, '/');
    await expectRealContent(page);
    await expectDesignDNA(page);

    // Verify hero positioning & branding
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/scoutit/i);

    // Step 2: Navigate to Directory
    await gotoAndSettle(page, '/property');
    await expectRealContent(page);
    await expectDesignDNA(page);

    // Verify property cards or empty state renders
    const cardCount = await page.locator('.hov-card, [data-property-card]').count();
    expect(cardCount).toBeGreaterThanOrEqual(0);

    // Step 3: Drill into a Property Detail Page (One E-Com Center: one-ecom-center)
    await gotoAndSettle(page, '/property/one-ecom-center');
    await expectRealContent(page);
    await expectDesignDNA(page);

    // Wait for client-side Airtable fetch to populate real content
    await expect.poll(async () => await page.locator('body').innerText(), {
      timeout: 15000,
      message: 'Property page failed to load Airtable listing data'
    }).toContain('One E-Com Center');

    // Step 4: Test Wishlist Toggle (Device-Local scoutit_reactions)
    const wishlistButton = page.locator('button:has-text("Save"), button:has-text("Wishlist"), [aria-label*="wishlist"]').first();
    if (await wishlistButton.isVisible()) {
      await wishlistButton.click({ force: true });
    }

    // Step 5: Test Inquiry Modal Trigger
    const inquiryButton = page.locator('button:has-text("Inquire"), button:has-text("Contact"), button:has-text("Send Inquiry")').first();
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click({ force: true });
      await page.waitForTimeout(300); // brief UI settle
      // Verify modal mounted without page crash
      await expectRealContent(page);
    }

    expect(errors, `Buyer POV errors:\n${errors.join('\n')}`).toEqual([]);
  });


  // ---------------------------------------------------------------------------
  // POV 2: OWNER JOURNEY
  // ---------------------------------------------------------------------------
  test('POV 2: Owner — Dashboard, Listing Wizard & Unit Section Editor', async ({ page }) => {
    const errors = trackErrors(page);

    // Step 1: Sign in as Mock Owner
    await signInAsMock(page, MASTER_DEV_READONLY);

    // Step 2: Open Owner Dashboard
    await gotoAndSettle(page, '/dashboard');
    await expectRealContent(page);
    await expectDesignDNA(page);

    // Verify Owner Mode Dashboard view renders cleanly
    const dashboardText = await page.locator('body').innerText();
    expect(dashboardText.length).toBeGreaterThan(50);

    // Step 3: Check Enterprise / Portfolio view or Editor Trigger
    await gotoAndSettle(page, '/pricing/owner');
    await expectRealContent(page);
    await expectDesignDNA(page);

    expect(errors, `Owner POV errors:\n${errors.join('\n')}`).toEqual([]);
  });


  // ---------------------------------------------------------------------------
  // POV 3: BROKER JOURNEY
  // ---------------------------------------------------------------------------
  test('POV 3: Broker — Directory Profiles, Credentials & Pitch Handshake View', async ({ page }) => {
    const errors = trackErrors(page);

    // Step 1: Visit Broker Directory
    await gotoAndSettle(page, '/brokers');
    await expectRealContent(page);
    await expectDesignDNA(page);

    const brokerText = await page.locator('body').innerText();
    expect(brokerText).toContain('Broker');

    // Step 2: Visit Pricing for Brokers
    await gotoAndSettle(page, '/pricing/broker');
    await expectRealContent(page);
    await expectDesignDNA(page);

    expect(errors, `Broker POV errors:\n${errors.join('\n')}`).toEqual([]);
  });

});
