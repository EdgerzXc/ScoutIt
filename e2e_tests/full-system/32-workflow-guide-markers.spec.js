// A-139 step 4(a) — the workflows as a browser test. Every guideTarget the
// EXECUTABLE buyer guide names must be visible on the real page, plus the
// dashboard markers the owner/broker guides rest on. Strictly read-and-render:
// pages are visited, markers asserted, nothing submitted, no writes of any
// kind (helpers.js safety contract).
import { test, expect } from '@playwright/test';
import {
  signInAsMock,
  trackErrors,
  expectRealContent,
  gotoAndSettle,
  openYourMove,
  MOCK_OWNER_EMPTY,
} from './helpers';

// Mock identities must satisfy isDevelopmentMockId (^master-dev) plus the
// localhost E2E flag, or the dashboard ignores them and lands on onboarding.
const MOCK_BROKER = {
  id: 'master-dev-e2e-broker',
  name: 'E2E Broker',
  role: 'broker',
  tags: ['broker'],
  primaryMode: 'broker',
};

const MOCK_SEEKER_E2E = {
  id: 'master-dev-e2e-seeker',
  name: 'E2E Seeker',
  role: 'buyer',
  tags: ['buyer'],
  primaryMode: 'buyer',
};

test.describe('Buyer guide markers resolve on real pages', () => {
  test('home launchpad → discover search → property directory → your move', async ({ page }) => {
    const errors = trackErrors(page);

    await gotoAndSettle(page, '/');
    await expect(page.locator('[data-scoutit-guide="scoutit-home-launchpad"]').first()).toBeVisible({ timeout: 25000 });

    await gotoAndSettle(page, '/discover');
    await expect(page.locator('[data-scoutit-guide="scoutit-discover-search"]').first()).toBeVisible({ timeout: 25000 });

    await gotoAndSettle(page, '/property');
    await expectRealContent(page, 100);
    await expect(page.locator('[data-scoutit-guide="scoutit-property-directory"]').first()).toBeVisible({ timeout: 25000 });

    const propertyLinks = page.locator('a[href^="/property/"]');
    await expect(propertyLinks.first()).toBeVisible({ timeout: 25000 });
    await propertyLinks.first().click();
    await expect(page).toHaveURL(/\/property\/.+/, { timeout: 20000 });
    // Your Move chapter opens read-only. The guide marker lives on the panel
    // itself. The inquiry modal is never submitted — that would write a deal.
    const panel = await openYourMove(page);
    await expect(panel).toHaveAttribute('data-scoutit-guide', 'property-your-move-actions');

    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('Workspace guide markers resolve for mock roles', () => {
  test('owner portfolio table + creation entry point render', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MOCK_OWNER_EMPTY);
    await gotoAndSettle(page, '/dashboard');
    await expectRealContent(page);
    // Zero-listings owner: the portfolio shell still renders its marker.
    await expect(page.locator('[data-scoutit-guide="owner-portfolio-table"]').first()).toBeVisible({ timeout: 25000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('broker command hub renders its roster marker', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MOCK_BROKER);
    await gotoAndSettle(page, '/dashboard');
    await expectRealContent(page);
    await expect(page.locator('[data-scoutit-guide="broker-lead-roster-view"]').first()).toBeVisible({ timeout: 25000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('seeker dashboard renders without a public-profile dead end', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MOCK_SEEKER_E2E);
    await gotoAndSettle(page, '/dashboard');
    await expectRealContent(page);
    // No link on this dashboard may point at a public profile URL that can
    // never resolve for a seeker (buyer/owner panels are never public).
    const hrefs = await page
      .locator('a[href^="/profile/"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(hrefs, `dead public-profile links: ${hrefs.join(', ')}`).toEqual([]);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('verified broker directory renders its license marker', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, '/brokers');
    await expectRealContent(page, 40);
    await expect(page.locator('[data-scoutit-guide="broker-prc-license-form"]').first()).toBeVisible({ timeout: 25000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
