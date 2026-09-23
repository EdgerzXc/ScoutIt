// U-034: every private workspace surface stays inside a 390px phone with
// DATA rendered — not just empty states (those were U-033's proof).
//
// Page-level contract, same as the public-surface specs:
// document.scrollWidth <= clientWidth + 1. Inner rails/tables may scroll in
// their own containers; the page itself must never grow past the viewport.
import { test, expect } from '@playwright/test';
import {
  signInAsMock,
  trackErrors,
  expectRealContent,
  gotoAndSettle,
  MASTER_DEV_READONLY,
} from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

// Long, realistic content shaped to stress wrapping: a 34-char title, a
// 60-char unbroken URL token, a dashed tracking ID, and a UUID owner id.
const LONG_DEALS = [
  {
    id: 'deal-e2e-overflow-1',
    property_title: 'The Super-Long-Named Premium High-Rise Office in BGC Core Tower',
    propertyTitle: 'The Super-Long-Named Premium High-Rise Office in BGC Core Tower',
    other_party: 'Alexandra Constantinopoulos-Fernandez III',
    otherParty: 'Alexandra Constantinopoulos-Fernandez III',
    last_message:
      'Hi! See https://scoutit.space/property/this-is-a-very-long-unbroken-url-token-that-must-wrap-anywhere for details.',
    lastMessage:
      'Hi! See https://scoutit.space/property/this-is-a-very-long-unbroken-url-token-that-must-wrap-anywhere for details.',
    status: 'pending',
    myRole: 'owner',
    unreadCount: 2,
  },
  {
    id: 'deal-e2e-overflow-2',
    property_title: 'Jazz Residences Unit 12-A STR Listing With Extra Words Here',
    propertyTitle: 'Jazz Residences Unit 12-A STR Listing With Extra Words Here',
    other_party: 'broker-8f3a2c1e-9b4d-4f6a-a1c2-3d4e5f607182',
    otherParty: 'broker-8f3a2c1e-9b4d-4f6a-a1c2-3d4e5f607182',
    last_message: 'TRK-2026-09-22-PHX-88412 confirmed for Friday viewing.',
    lastMessage: 'TRK-2026-09-22-PHX-88412 confirmed for Friday viewing.',
    status: 'accepted',
    myRole: 'broker',
    unreadCount: 0,
  },
];

const LONG_MESSAGES = [
  {
    id: 'msg-e2e-1',
    sender: 'them',
    body: 'Sharing the file reference https://scoutit.space/property/this-is-a-very-long-unbroken-url-token-that-must-wrap-anywhere plus tracking TRK-2026-09-22-PHX-88412.',
    timestamp: new Date().toISOString(),
    attachments: [],
  },
  {
    id: 'msg-e2e-2',
    sender: 'me',
    body: 'Noted, will confirm the viewing slot tomorrow morning.',
    timestamp: new Date().toISOString(),
    attachments: [],
  },
];

async function mockWorkspaceData(page) {
  await page.route('**/api/deals', (route) =>
    route.fulfill({ status: 200, json: { deals: LONG_DEALS } }),
  );
  await page.route('**/api/deals/*/messages', (route) =>
    route.fulfill({ status: 200, json: { messages: LONG_MESSAGES } }),
  );
  await page.route('**/api/viewing-appointments', (route) =>
    route.fulfill({ status: 200, json: { appointments: [] } }),
  );
  await page.route('**/api/crm/tasks', (route) =>
    route.fulfill({ status: 200, json: { tasks: [] } }),
  );
}

async function expectNoPageOverflow(page, route) {
  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    geometry.scrollWidth,
    `${route} overflows the 390px viewport (${geometry.scrollWidth}px > ${geometry.clientWidth}px)`,
  ).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

test.describe('mobile workspace overflow (390px, data rendered)', () => {
  test('/dashboard home with attention signals', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockWorkspaceData(page);
    await page.route('**/api/dashboard/attention', (route) =>
      route.fulfill({
        status: 200,
        json: {
          severity: 'urgent',
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
          ],
        },
      }),
    );
    await gotoAndSettle(page, '/dashboard');
    await expect(
      page.getByRole('region', { name: 'What needs you' }),
    ).toBeVisible({ timeout: 30000 });
    await expectNoPageOverflow(page, '/dashboard');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('/dashboard/inbox list and open thread', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockWorkspaceData(page);
    await gotoAndSettle(page, '/dashboard/inbox');
    await expectRealContent(page);
    // The default tab is ACTIVE; the long-titled pending deal lives in
    // WAITING — switching tabs is part of the mobile exercise.
    await page.getByRole('button', { name: /waiting/i }).first().click();
    // Long title and counterparty render in the list without breaking layout.
    await expect(
      page.getByText('The Super-Long-Named Premium High-Rise Office', { exact: false }),
    ).toBeVisible({ timeout: 30000 });
    await expectNoPageOverflow(page, '/dashboard/inbox (list)');
    // Open the thread: the ChatBox message column must also hold.
    await page
      .getByText('The Super-Long-Named Premium High-Rise Office', { exact: false })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /back to leads/i })).toBeVisible({
      timeout: 15000,
    });
    await expectNoPageOverflow(page, '/dashboard/inbox (thread)');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('/dashboard/crm pipeline with deals', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockWorkspaceData(page);
    await gotoAndSettle(page, '/dashboard/crm');
    await expect(
      page.getByRole('heading', { name: 'Deal Intelligence' }),
    ).toBeVisible({ timeout: 30000 });
    // Kanban columns scroll inside their own rail; the page must not grow.
    await expectNoPageOverflow(page, '/dashboard/crm');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('/dashboard/calendar agenda default', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockWorkspaceData(page);
    await gotoAndSettle(page, '/dashboard/calendar');
    await expectRealContent(page);
    await expectNoPageOverflow(page, '/dashboard/calendar');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('/admin console tabs and queues', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    // Data-filled queues: long titles, UUID owners, and credential rows must
    // wrap inside their cards instead of pushing the page wide.
    await page.route('**/api/admin/pending', (route) =>
      route.fulfill({
        status: 200,
        json: {
          properties: [
            {
              id: 'prop-e2e-overflow-1',
              title: 'The Super-Long-Named Premium High-Rise Office in BGC Core Tower',
              type: 'Commercial',
              location: 'Bonifacio Global City, Taguig City, Metro Manila, Philippines',
              coordinates: [121.045, 14.554],
              owner_id: 'owner-8f3a2c1e-9b4d-4f6a-a1c2-3d4e5f607182',
            },
          ],
        },
      }),
    );
    await page.route('**/api/admin/pdf-verify', (route) =>
      route.fulfill({
        status: 200,
        json: {
          drafts: [
            {
              id: 'draft-e2e-overflow-1',
              title: 'Jazz Residences Unit 12-A Short-Term Rental Listing With Extra Words',
              type: 'Residential',
              location: 'Bel-Air, Makati City',
              pdf_source_url: null,
            },
          ],
        },
      }),
    );
    await page.route('**/api/admin/prc', (route) =>
      route.fulfill({
        status: 200,
        json: {
          data: [
            {
              id: 'broker-8f3a2c1e-9b4d-4f6a-a1c2-3d4e5f607182',
              display_name: 'Alexandra Constantinopoulos-Fernandez III',
              prc_license: '0034567',
              dhsud_number: 'NCR-B-12/34-5678',
              prc_expiry: '2027-06-30',
              firm: 'Constantinopoulos Fernandez Realty Corporation',
              prc_verified: false,
              prc_verified_at: null,
            },
          ],
        },
      }),
    );
    // The flags tab fetches on mount; an unmocked 401 logs a console error
    // (race-dependent), so serve a stable payload with long copy instead.
    await page.route('**/api/admin/feature-flags', (route) =>
      route.fulfill({
        status: 200,
        json: {
          flags: [
            {
              id: 'global_read_only',
              is_enabled: false,
              description: 'Freezes every write path across the entire platform immediately',
              updated_at: new Date().toISOString(),
            },
            {
              id: 'pilot_external_signups_enabled_for_all_regions',
              is_enabled: true,
              description: 'Opens invited pilot signups beyond the initial Metro Manila cohort',
              updated_at: new Date().toISOString(),
            },
          ],
        },
      }),
    );
    await gotoAndSettle(page, '/admin');
    await expectRealContent(page);
    await expect(
      page.getByRole('heading', { name: 'Admin Console' }),
    ).toBeVisible({ timeout: 30000 });
    await expectNoPageOverflow(page, '/admin (flags)');
    // Each queue tab renders a distinct panel or an honest error state —
    // either way the page must hold its width.
    for (const tab of ['Pending Approvals', 'PRC Verification', 'PDF Drafts']) {
      await page.getByRole('button', { name: new RegExp(tab) }).first().click();
      await expectRealContent(page);
      await expectNoPageOverflow(page, `/admin (${tab})`);
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('/dashboard/open-gate role switch', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await gotoAndSettle(page, '/dashboard/open-gate');
    await expectRealContent(page);
    await expect(
      page.getByRole('heading', { name: 'Open Gate' }),
    ).toBeVisible({ timeout: 30000 });
    await expectNoPageOverflow(page, '/dashboard/open-gate');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('/dashboard/calendar agenda with long events and a pending viewing', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockWorkspaceData(page);
    const tomorrow = new Date(Date.now() + 864e5);
    const at = (h) => {
      const d = new Date(tomorrow);
      d.setHours(h, 0, 0, 0);
      return d.toISOString();
    };
    await page.route('**/api/calendar/events*', (route) =>
      route.fulfill({
        status: 200,
        json: {
          events: [
            {
              id: 'ev-e2e-long-1',
              title: 'Site visit at The Super-Long-Named Premium High-Rise Office in BGC Core Tower',
              startsAt: at(10),
              endsAt: at(11),
              location: 'Bonifacio Global City, Taguig City, Metro Manila, Philippines 1634',
              color: 'gold',
            },
          ],
        },
      }),
    );
    await page.route('**/api/viewing-appointments', (route) =>
      route.fulfill({
        status: 200,
        json: {
          appointments: [
            {
              id: 'appt-e2e-long-1',
              dealId: 'deal-e2e-overflow-2',
              propertyTitle: 'Jazz Residences Unit 12-A STR Listing With Extra Words Here',
              scheduledAt: at(14),
              endsAt: at(15),
              status: 'pending',
              isHost: true,
              contactName: 'Alexandra Constantinopoulos-Fernandez III',
            },
          ],
        },
      }),
    );
    await gotoAndSettle(page, '/dashboard/calendar');
    await expect(
      page.getByText('Site visit at The Super-Long-Named Premium', { exact: false }),
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole('button', { name: 'Confirm' }),
    ).toBeVisible({ timeout: 15000 });
    await expectNoPageOverflow(page, '/dashboard/calendar (agenda with data)');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('/dashboard broker lens roster with long titles', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MASTER_DEV_READONLY);
    await mockWorkspaceData(page);
    await page.route('**/api/dashboard/attention', (route) =>
      route.fulfill({
        status: 200,
        json: { severity: 'clear', summary: 'All quiet', unavailable: [], signals: [] },
      }),
    );
    await gotoAndSettle(page, '/dashboard');
    await expectRealContent(page);
    // Switch to the broker lens through the mobile profile menu.
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: /broker workspace/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Broker Intelligence' }),
    ).toBeVisible({ timeout: 30000 });
    await expectNoPageOverflow(page, '/dashboard (broker lens)');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('/dashboard owner wizard entry choices', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, {
      id: 'master-dev-e2e-empty',
      name: 'E2E Owner',
      role: 'owner',
      tags: ['owner'],
      primaryMode: 'owner',
    });
    await mockWorkspaceData(page);
    await gotoAndSettle(page, '/dashboard');
    await expect(
      page.getByRole('heading', { name: /add your first property/i }),
    ).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: /add property/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /how would you like to add this property/i }),
    ).toBeVisible({ timeout: 15000 });
    await expectNoPageOverflow(page, '/dashboard (wizard entry)');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
