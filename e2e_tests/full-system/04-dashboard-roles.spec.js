// The private dashboard in its three meaningful auth states:
//  1. logged out  → must gate, not crash
//  2. empty owner → must show the zero-listings state + a working wizard
//  3. master-dev  → READ-ONLY roster/inbox/CRM render (real production data —
//                   never click anything that mutates)
import { test, expect } from '@playwright/test';
import {
  signInAsMock,
  trackErrors,
  expectRealContent,
  gotoAndSettle,
  MOCK_OWNER_EMPTY,
  MASTER_DEV_READONLY,
} from './helpers';

test.describe('Logged out', () => {
  test('dashboard gates anonymous visitors gracefully', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, '/dashboard');
    await expectRealContent(page);

    // Should point at onboarding/sign-in once the auth check resolves —
    // never render a broken empty shell. (Waits out the loading state.)
    await expect(page.locator('body')).toContainText(
      /sign in|log in|create|onboard|account|access/i,
      { timeout: 30000 }
    );
    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('Owner with zero listings (safe mock)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('dashboard shows the empty state and opens the creation wizard', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MOCK_OWNER_EMPTY);
    await gotoAndSettle(page, '/dashboard');
    await expectRealContent(page);

    // Zero-listings owner state → the first-listing CTA.
    const startBtn = page
      .getByText('Start My First Listing')
      .or(page.getByText('+ New Property File', { exact: true }))
      .first();
    await expect(startBtn).toBeVisible({ timeout: 25000 });
    await startBtn.click();

    // The creation-mode chooser must appear. We open it and STOP — no draft
    // is created, nothing is submitted.
    await expect(
      page.getByText(/How would you like to create this listing\?/i)
    ).toBeVisible({ timeout: 15000 });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('settings, badges and profile render for a signed-in user', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MOCK_OWNER_EMPTY);

    for (const path of ['/settings', '/badges', '/profile']) {
      await gotoAndSettle(page, path);
      await expectRealContent(page);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText, `${path} crashed`).not.toMatch(/Application error/i);
      // Let in-flight data fetches finish before navigating away, otherwise
      // the abort surfaces as a "Failed to fetch" console error we'd flag.
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('master-dev (READ-ONLY — real data)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('owner dashboard renders the live roster without errors', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await gotoAndSettle(page, '/dashboard');
    await expectRealContent(page, 100);

    // Either a roster of property files or the welcome header must render.
    await expect(
      page
        .locator('h1')
        .filter({ hasText: /Active Listings|Welcome back/i })
        .first()
    ).toBeVisible({ timeout: 30000 });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('inbox renders threads or a clean empty state', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await gotoAndSettle(page, '/dashboard/inbox');
    await expectRealContent(page);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('CRM cockpit renders pipeline surfaces', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await gotoAndSettle(page, '/dashboard/crm');
    await expectRealContent(page);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('calendar renders', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await gotoAndSettle(page, '/dashboard/calendar');
    await expectRealContent(page);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
