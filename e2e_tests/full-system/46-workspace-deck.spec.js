// A-205 Workspace Deck: the dashboard, inbox, CRM and calendar behave as
// one swipeable deck on phones — Workspace default, swipe-left to Inbox,
// swipe-right to CRM — with a tab strip mirroring the gesture.
//
// Synthetic swipes dispatch real TouchEvents against the live page: React's
// root-delegated touch handlers fire exactly as they do for a finger, so a
// passing swipe here proves the recogniser claims the gesture end to end.
import { test, expect } from '@playwright/test';
import {
  signInAsMock,
  trackErrors,
  gotoAndSettle,
  MASTER_DEV_READONLY,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function mockDeckData(page) {
  await page.route('**/api/deals', (route) =>
    route.fulfill({ status: 200, json: { deals: [] } }),
  );
  await page.route('**/api/viewing-appointments', (route) =>
    route.fulfill({ status: 200, json: { appointments: [] } }),
  );
  await page.route('**/api/dashboard/attention', (route) =>
    route.fulfill({ status: 200, json: { severity: 'none', summary: '', unavailable: [], signals: [] } }),
  );
}

// Finger drag from (x1, y) to (x2, y) against a CSS selector.
async function swipe(page, selector, x1, x2, y = 500) {
  await page.evaluate(
    ({ selector, x1, x2, y }) => {
      const target = document.querySelector(selector);
      if (!target) throw new Error(`swipe target missing: ${selector}`);
      const touch = (clientX) => new Touch({ identifier: 7, target, clientX, clientY: y });
      const fire = (type, touches) =>
        target.dispatchEvent(
          new TouchEvent(type, { touches, bubbles: true, cancelable: true, composed: true }),
        );
      fire('touchstart', [touch(x1)]);
      fire('touchmove', [touch((x1 + x2) / 2)]);
      fire('touchmove', [touch(x2)]);
      fire('touchend', []);
    },
    { selector, x1, x2, y },
  );
}

test.describe('workspace deck (390px phone)', () => {
  test('deck tab strip mirrors the deck on /dashboard', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockDeckData(page);
    await gotoAndSettle(page, '/dashboard');
    const strip = page.getByRole('navigation', { name: 'Deal workspace' });
    await expect(strip).toBeVisible({ timeout: 30000 });
    for (const tab of ['Workspace', 'Inbox', 'CRM', 'Calendar']) {
      await expect(strip.getByRole('link', { name: tab, exact: true })).toBeVisible();
    }
    await expect(
      strip.getByRole('link', { name: 'Workspace', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('tapping Inbox in the strip navigates without errors', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockDeckData(page);
    await gotoAndSettle(page, '/dashboard');
    const strip = page.getByRole('navigation', { name: 'Deal workspace' });
    await strip.getByRole('link', { name: 'Inbox', exact: true }).click();
    await page.waitForURL('**/dashboard/inbox');
    const inboxStrip = page.getByRole('navigation', { name: 'Deal workspace' });
    await expect(
      inboxStrip.getByRole('link', { name: 'Inbox', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('swipe-left on Workspace lands on Inbox (owner mapping)', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockDeckData(page);
    await gotoAndSettle(page, '/dashboard');
    await expect(
      page.getByRole('navigation', { name: 'Deal workspace' }),
    ).toBeVisible({ timeout: 30000 });
    // Dispatch inside the deck subtree: DashboardLayout nests DeckPanel
    // within <main>, so the target must be a descendant for the delegated
    // touch handlers to fire (bubbling only travels upward).
    await swipe(page, 'main div', 300, 100);
    await page.waitForURL('**/dashboard/inbox', { timeout: 10000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('swipe-right on Inbox returns to Workspace', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockDeckData(page);
    await gotoAndSettle(page, '/dashboard/inbox');
    await expect(
      page.getByRole('navigation', { name: 'Deal workspace' }),
    ).toBeVisible({ timeout: 30000 });
    // The inbox list is the swipe surface; drag right across it.
    await swipe(page, 'main div', 100, 300);
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
