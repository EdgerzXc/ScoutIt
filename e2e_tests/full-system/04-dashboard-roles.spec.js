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

  test('sections remain directly reachable at 360px without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
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

  test('first-visit Help & Display closes on an outside touch without swallowing the page', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem('scoutit_help_seen_v1'));
    await gotoAndSettle(page, '/layer/metropolis');

    const panel = page.getByRole('complementary', { name: 'Help & Display' });
    await expect(panel).toBeVisible();
    await page.getByRole('heading', { name: 'Explore by Category' }).click();
    await expect(panel).toBeHidden();

    const commercial = page.getByRole('button', { name: 'Commercial' });
    await commercial.click();
    await expect(commercial).toHaveAttribute('aria-pressed', 'true');
  });

  test('Escape closes Help & Display and restores a sensible trigger', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('scoutit_help_seen_v1', 'true'));
    await gotoAndSettle(page, '/discover');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    await menu.click();
    await page.getByRole('button', { name: 'Help & Display', exact: true }).click();
    await expect(page.getByRole('complementary', { name: 'Help & Display' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('complementary', { name: 'Help & Display' })).toBeHidden();
    await expect(menu).toBeFocused();
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

  test('dashboard home signals what needs the user across all three workspaces', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);

    // A fixed payload, so the rail's severity rules are what is under test —
    // not whatever the local preview database happens to hold today.
    await page.route('**/api/dashboard/attention**', (route) => route.fulfill({
      status: 200,
      json: {
        severity: 'urgent',
        urgentCount: 1,
        attentionCount: 1,
        totalCount: 4,
        summary: '1 thing needs you now',
        unavailable: [],
        signals: [
          {
            id: 'inbox',
            label: 'Inbox',
            href: '/dashboard/inbox',
            severity: 'attention',
            count: 2,
            headline: '2 unread messages',
            detail: null,
          },
          {
            id: 'crm',
            label: 'CRM',
            href: '/dashboard/crm',
            severity: 'urgent',
            count: 2,
            headline: '2 overdue tasks',
            detail: 'Send the term sheet',
          },
          {
            id: 'calendar',
            label: 'Calendar',
            href: '/dashboard/calendar',
            severity: 'clear',
            count: 0,
            headline: 'No viewings in the next 24 hours',
            detail: null,
          },
        ],
      },
    }));

    await gotoAndSettle(page, '/dashboard');
    const rail = page.getByRole('region', { name: 'What needs you' });
    await expect(rail).toBeVisible({ timeout: 30_000 });
    await expect(rail.getByText('1 thing needs you now')).toBeVisible();
    await expect(rail.getByRole('link', { name: /CRM/ })).toHaveAttribute('href', '/dashboard/crm');
    await expect(rail.getByText('2 overdue tasks')).toBeVisible();
    await expect(rail.getByText('Send the term sheet')).toBeVisible();
    await expect(rail.getByText('2 unread messages')).toBeVisible();
    await expect(rail.getByText('No viewings in the next 24 hours')).toBeVisible();

    // A quiet workspace must not wear an urgency badge.
    const calendarCard = rail.getByRole('link', { name: /Calendar/ });
    await expect(calendarCard).not.toContainText(/^0$/);

    const type = await page.evaluate(() => {
      const region = document.querySelector('section[aria-label="What needs you"]');
      const headline = [...region.querySelectorAll('span')]
        .find((element) => element.textContent.trim() === '2 overdue tasks');
      const label = [...region.querySelectorAll('span')]
        .find((element) => element.textContent.trim() === 'CRM');
      return {
        headlineFamily: getComputedStyle(headline).fontFamily,
        headlineSize: Number.parseFloat(getComputedStyle(headline).fontSize),
        labelFamily: getComputedStyle(label).fontFamily,
      };
    });
    expect(type.headlineFamily).toMatch(/Geist/i);
    expect(type.headlineFamily).not.toMatch(/Mono/i);
    expect(type.headlineSize).toBeGreaterThanOrEqual(16);
    expect(type.labelFamily).toMatch(/Geist Mono/i);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(rail).toBeVisible();
    const hasPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasPageOverflow).toBe(false);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('CRM pipeline does not wait for workspace data it never renders', async ({ page }) => {
    // The CRM gated its whole page on DashboardContext's general isLoading
    // flag, which stays true until inventory, the Airtable CMS proxy, deals
    // and saved intel have all resolved -- in series. None of that appears on
    // this page. Measured 2026-08-29 on an empty local database: CRM 2,217ms
    // to first paint against Inbox 546ms and dashboard home 500ms, with
    // /api/cms alone taking 2.5s cold in production.
    await signInAsMock(page, MASTER_DEV_READONLY);

    await page.route('**/api/cms**', async (route) => {
      // Far longer than the budget below: if the CRM still blocks on this
      // request, the assertion that follows cannot pass by luck.
      await new Promise((resolve) => setTimeout(resolve, 8000));
      await route.fulfill({ status: 200, json: { properties: [] } });
    });

    // Armed before navigating, so proving the stalled route was exercised
    // does not race the assertion that the page rendered without it.
    const cmsRequest = page.waitForRequest('**/api/cms**', { timeout: 20000 });

    const startedAt = Date.now();
    await page.goto('/dashboard/crm');
    await expect(page.getByRole('heading', { name: 'Deal Intelligence' }))
      .toBeVisible({ timeout: 6000 });
    const visibleAfter = Date.now() - startedAt;

    // The pipeline must be on screen well before the stalled CMS call could
    // possibly have returned.
    expect(visibleAfter).toBeLessThan(6000);
    await cmsRequest;
  });

  test('each dashboard surface asks for the deal list once', async ({ page }) => {
    // DashboardContext loads deals for the role panels and the page loads them
    // for its own view. A trace on 2026-08-29 caught both on all three
    // surfaces, so every dashboard load asked the database for the same rows
    // twice. They now share one in-flight request.
    await signInAsMock(page, MASTER_DEV_READONLY);

    for (const [path, ready] of [
      ['/dashboard', 'section[aria-label="What needs you"]'],
      ['/dashboard/crm', 'h1'],
      ['/dashboard/inbox', 'body'],
    ]) {
      let dealListRequests = 0;
      const count = (request) => {
        const { pathname } = new URL(request.url());
        if (pathname === '/api/deals') dealListRequests += 1;
      };
      page.on('request', count);
      await page.goto(path);
      await page.locator(ready).first().waitFor({ timeout: 30000 });
      // Let any straggling mount effect fire before counting.
      await page.waitForTimeout(2500);
      page.off('request', count);

      expect(dealListRequests, `${path} requested /api/deals ${dealListRequests} times`)
        .toBeLessThanOrEqual(1);
    }
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
    await expect(page.getByRole('heading', { name: 'Deal Intelligence' })).toBeVisible({ timeout: 20_000 });
    const type = await page.evaluate(() => {
      const styleFor = (selector) => getComputedStyle(document.querySelector(selector));
      const heading = styleFor('h1');
      const subtitle = styleFor('h1 + p');
      const label = styleFor('[class*="text-label-caps"]');
      const helper = [...document.querySelectorAll('div')]
        .find((element) => element.textContent.trim() === 'No priced listings in your active pipeline yet');
      const helperStyle = getComputedStyle(helper);
      const search = styleFor('input[aria-label="Search deals"]');
      return {
        headingFamily: heading.fontFamily,
        headingWeight: Number(heading.fontWeight),
        subtitleFamily: subtitle.fontFamily,
        subtitleSize: Number.parseFloat(subtitle.fontSize),
        labelFamily: label.fontFamily,
        labelSize: Number.parseFloat(label.fontSize),
        helperSize: Number.parseFloat(helperStyle.fontSize),
        searchPaddingLeft: Number.parseFloat(search.paddingLeft),
        searchRadius: Number.parseFloat(search.borderRadius),
      };
    });
    expect(type.headingFamily).toMatch(/Geist/i);
    expect(type.subtitleFamily).toMatch(/Geist/i);
    expect(type.headingWeight).toBeGreaterThanOrEqual(600);
    expect(type.subtitleSize).toBeGreaterThanOrEqual(16);
    expect(type.helperSize).toBeGreaterThanOrEqual(16);
    expect(type.labelFamily).toMatch(/Geist Mono/i);
    expect(type.labelFamily).not.toBe(type.subtitleFamily);
    expect(type.labelSize).toBeGreaterThanOrEqual(12);
    expect(type.searchPaddingLeft).toBeGreaterThanOrEqual(44);
    expect(type.searchRadius).toBeGreaterThanOrEqual(9999);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: 'Deal Intelligence' })).toBeVisible();
    const hasPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasPageOverflow).toBe(false);
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
