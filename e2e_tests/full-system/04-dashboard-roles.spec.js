// The private dashboard in its three meaningful auth states:
//  1. logged out  → must gate, not crash
//  2. empty owner → must show the zero-listings state + a working wizard
//  3. master-dev: local preview roster/inbox/CRM render with isolated data
import { test, expect } from '@playwright/test';
import {
  signInAsMock,
  trackErrors,
  expectRealContent,
  gotoAndSettle,
  MOCK_OWNER_EMPTY,
  MASTER_DEV_READONLY,
} from './helpers';

const PENDING_APPOINTMENT = {
  id: 'appt-e2e-1',
  dealId: 'deal-e2e-1',
  propertyId: 'prop-e2e-1',
  propertyTitle: 'The Paragon Tower',
  scheduledAt: new Date(Date.now() + 2 * 864e5).toISOString(),
  status: 'pending',
  notes: '',
  isHost: true,
  contactName: 'Jordan Buyer',
  dealStatus: 'accepted',
};

async function mockAvailability(page) {
  await page.route('**/api/availability**', async (route) => {
    await route.fulfill({
      status: 200,
      json: { config: { weekly_schedule: {} }, appointments: [] },
    });
  });
}

async function openAgenda(page) {
  const agendaButton = page.getByRole('button', { name: 'Agenda' });
  await expect.poll(async () => {
    const classes = await agendaButton.getAttribute('class');
    if (!classes?.includes('bg-gold-accent')) await agendaButton.click();
    return agendaButton.getAttribute('class');
  }, { timeout: 15000 }).toContain('bg-gold-accent');
}

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

    // Zero-listings owner state → the first-listing CTA. The label is
    // "Add Property →" under the "Add your first property" panel; the old
    // "Get Started" wording no longer exists anywhere in the app.
    await expect(page.getByRole('heading', { name: /Add your first property/i })).toBeVisible({ timeout: 25000 });
    const startBtn = page.getByRole('button', { name: /Add Property/i }).first();
    await expect(startBtn).toBeVisible({ timeout: 25000 });
    await startBtn.click();

    // The creation-mode chooser must appear. Current copy is "How would you
    // like to add this property?"; the manual route is "I'll build it myself".
    await expect(
      page.getByRole('heading', { name: /How would you like to add this property/i })
    ).toBeVisible({ timeout: 15000 });

    // Preserve the old Live Canvas regression coverage inside the safe suite:
    // open the editor and prove the preview reacts, then STOP before saving.
    await page.getByRole('heading', { name: /build it myself/i }).click();
    await expect(page.getByRole('heading', { name: /Basic Property Information/i })).toBeVisible();
    await expect(page.getByText('LIVE PREVIEW / DRAFT MODE').first()).toBeVisible();

    const titleInput = page.getByPlaceholder('e.g. Premium High-Rise Office in BGC Core');
    await titleInput.fill('E2E Live Preview');
    await expect(page.locator('.hero-title').first()).toHaveText('E2E Live Preview');

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

test.describe('Settings information architecture', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('sections remain directly reachable at 360px without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 360, height: 800 },
    });
    const page = await context.newPage();
    try {
      await page.goto('/settings', { waitUntil: 'domcontentloaded' });
      const sectionNav = page.getByRole('navigation', { name: 'Settings sections' });
      await expect(sectionNav).toBeVisible();
      await expect(sectionNav.getByRole('link')).toHaveCount(5);

      await sectionNav.getByRole('link', { name: 'Privacy' }).click();
      await expect(page).toHaveURL(/\/settings#privacy$/);
      await expect(page.locator('#privacy')).toBeVisible();

      await sectionNav.getByRole('link', { name: 'Display & guide' }).click();
      await expect(page).toHaveURL(/\/settings#display-guide$/);
      await expect(page.locator('#display-guide')).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        nav: document.querySelector('[aria-label="Settings sections"]')?.scrollWidth || 0,
      }));
      expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
      expect(dimensions.nav).toBeGreaterThan(dimensions.viewport / 2);
    } finally {
      await context.close();
    }
  });

  test('the Eye opens the Help & Display hub at 360px', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, '/discover');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByText('Explore', { exact: true })).toBeVisible();
    await expect(page.getByText('Workspace', { exact: true })).toBeVisible();
    await expect(page.getByText('Help', { exact: true })).toBeVisible();
    await expect(page.getByText('Account', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Help & Display', exact: true }).click();
    await expect(page.getByText('Help & Display', { exact: true }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close Help & Display' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('page help is non-blocking, keyboard dismissible, and restores Eye focus', async ({ page }) => {
    await gotoAndSettle(page, '/discover');
    const eye = page.getByRole('button', { name: 'Menu', exact: true });
    const help = page.getByRole('button', { name: 'Help for this page' });
    if (!(await help.isVisible().catch(() => false))) {
      await eye.click();
      await page.getByRole('button', { name: 'Help & Display', exact: true }).click();
    }
    await help.click();
    const dialog = page.getByRole('dialog', { name: /filter, then narrow/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'false');
    await expect(page.locator('[data-scoutit-guide="scoutit-discover-search"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(eye).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test('a server-selected owner journey resumes after reload', async ({ page }) => {
    await page.route('**/api/profile/me/role', (route) => route.fulfill({ status: 200, json: { role: 'owner' } }));
    await gotoAndSettle(page, '/discover');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    const openHelp = async () => {
      await menu.click();
      await page.getByRole('button', { name: 'Help & Display', exact: true }).click();
    };
    await openHelp();
    await page.getByRole('button', { name: 'Start guided journey' }).click();
    let dialog = page.getByRole('dialog', { name: /owner workspace/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /next/i }).click();
    await expect(page.getByRole('dialog', { name: /create property listing/i })).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss guide' }).click();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await openHelp();
    await page.getByRole('button', { name: 'Resume guided journey' }).click();
    dialog = page.getByRole('dialog', { name: /create property listing/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Restart journey' }).click();
    await expect(page.getByRole('dialog', { name: /owner workspace/i })).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss guide' }).click();
  });
});

test.describe('Calendar viewing lifecycle (fully mocked)', () => {
  test('host can confirm a pending viewing', async ({ page }) => {
    await signInAsMock(page, { ...MOCK_OWNER_EMPTY, id: 'master-dev-e2e-calendar-host' });
    await mockAvailability(page);

    let patchedStatus = null;
    await page.route('**/api/viewing-appointments', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          appointments: [
            { ...PENDING_APPOINTMENT, status: patchedStatus || PENDING_APPOINTMENT.status },
          ],
        },
      });
    });
    await page.route('**/api/viewing-appointments/*', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      patchedStatus = body.status;
      await route.fulfill({ status: 200, json: { success: true, status: body.status } });
    });

    await gotoAndSettle(page, '/dashboard/calendar?view=agenda');
    await openAgenda(page);
    await expect(page.getByText('The Paragon Tower')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Jordan Buyer')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect.poll(() => patchedStatus, { timeout: 10000 }).toBe('confirmed');
    await expect(page.getByText('confirmed', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Confirm' })).toHaveCount(0);
  });

  test('guest sees a confirmed viewing without host controls', async ({ page }) => {
    await signInAsMock(page, { ...MOCK_OWNER_EMPTY, id: 'master-dev-e2e-calendar-guest' });
    await mockAvailability(page);
    await page.route('**/api/viewing-appointments', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          appointments: [
            { ...PENDING_APPOINTMENT, status: 'confirmed', isHost: false },
          ],
        },
      });
    });

    await gotoAndSettle(page, '/dashboard/calendar?view=agenda');
    await openAgenda(page);
    await expect(page.getByText('The Paragon Tower')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Confirm' })).toHaveCount(0);
    await expect(page.getByText('confirmed', { exact: false })).toBeVisible();
  });
});

test.describe('master-dev (isolated local preview)', () => {
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
    await page.route('**/api/deals**', (route) => route.fulfill({ status: 200, json: { deals: [] } }));
    await page.route('**/api/viewing-appointments**', (route) => route.fulfill({ status: 200, json: { appointments: [] } }));
    await page.route('**/api/crm/tasks**', (route) => route.fulfill({ status: 200, json: { tasks: [] } }));
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
