// Schedule sync: a viewing that both parties agree on flows into the shared
// appointments list (CRM Appointments tab + the Calendar page).
//
// SAFETY CONTRACT (see full-system/helpers.js): the dev server runs against LIVE
// Supabase. These tests must never write real data. So the lifecycle is exercised
// two ways, both safe:
//   1. Auth-wall contract — anonymous POST/PATCH must be rejected (no write).
//   2. UI flow — the network is fully MOCKED, so the calendar renders and the
//      host's Accept/Decline drives the confirm flow without touching the DB.
import { test, expect } from '@playwright/test';

// A mock owner whose id contains "master-dev" so DashboardContext keeps it
// (anything else is wiped on mount unless a real Supabase session exists).
const MOCK_HOST = {
  id: 'master-dev-e2e-cal',
  name: 'E2E Host',
  role: 'owner',
  tags: ['owner'],
  primaryMode: 'owner',
};

const PENDING_APPT = {
  id: 'appt-e2e-1',
  dealId: 'deal-e2e-1',
  propertyId: 'prop-e2e-1',
  propertyTitle: 'The Paragon Tower',
  scheduledAt: new Date(Date.now() + 2 * 864e5).toISOString(), // 2 days out
  status: 'pending',
  notes: '',
  isHost: true,
  contactName: 'Jordan Buyer',
  dealStatus: 'accepted',
};

test.describe('Viewing appointment lifecycle', () => {
  // ── 1. Contract: the write routes reject anonymous callers (no live writes) ──
  test('POST /api/viewing-appointments rejects anonymous requests', async ({ request }) => {
    const res = await request.post('/api/viewing-appointments', {
      data: { dealId: 'e2e-void', scheduledAt: new Date().toISOString() },
    });
    // 401 unauthorized (no token); never a 2xx, which would mean an open write path.
    expect(res.status(), 'anonymous booking must be rejected').toBe(401);
  });

  test('PATCH /api/viewing-appointments/:id rejects anonymous requests', async ({ request }) => {
    const res = await request.patch('/api/viewing-appointments/appt-e2e-void', {
      data: { status: 'confirmed' },
    });
    expect(res.status(), 'anonymous confirm must be rejected').toBe(401);
  });

  // ── 2. UI flow: host opens the Calendar, sees the pending viewing, confirms it ──
  test('Host confirms a pending viewing from the Calendar and it flips to confirmed', async ({ page }) => {
    await page.addInitScript((u) => {
      window.localStorage.setItem('scoutit_user', JSON.stringify(u));
    }, MOCK_HOST);

    let patchedStatus = null;

    // Availability config — return an empty saved schedule so the page uses defaults.
    await page.route('**/api/availability**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: { config: { weekly_schedule: {} }, appointments: [] } });
      } else {
        await route.fulfill({ status: 200, json: { success: true } });
      }
    });

    // Appointments feed — pending until the host confirms, then confirmed.
    await page.route('**/api/viewing-appointments', async (route) => {
      const appt = { ...PENDING_APPT, status: patchedStatus || PENDING_APPT.status };
      await route.fulfill({ status: 200, json: { appointments: [appt] } });
    });

    // Host confirms → record the status the UI sent.
    await page.route('**/api/viewing-appointments/*', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      patchedStatus = body.status;
      await route.fulfill({ status: 200, json: { success: true, status: body.status } });
    });

    await page.goto('http://localhost:3000/dashboard/calendar');

    // The real, wired viewing (not the old "John Doe" mock) is rendered.
    await expect(page.getByText('The Paragon Tower')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Jordan Buyer')).toBeVisible();

    // As the host of a pending request, Accept / Decline are available.
    const acceptBtn = page.getByRole('button', { name: 'Accept' });
    await expect(acceptBtn).toBeVisible();

    await acceptBtn.click();

    // The confirm hit the PATCH route with status "confirmed"…
    await expect.poll(() => patchedStatus, { timeout: 10000 }).toBe('confirmed');

    // …and the row updates to the confirmed badge (Accept/Decline gone).
    await expect(page.getByText('confirmed', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept' })).toHaveCount(0);
  });

  // ── 3. UI flow: the guest sees the same viewing as confirmed (read-only) ──
  test('Guest sees the confirmed viewing without host controls', async ({ page }) => {
    await page.addInitScript((u) => {
      window.localStorage.setItem('scoutit_user', JSON.stringify(u));
    }, { ...MOCK_HOST, id: 'master-dev-e2e-guest' });

    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({ status: 200, json: { config: { weekly_schedule: {} }, appointments: [] } });
    });

    // From the guest's perspective the API returns isHost:false + confirmed.
    await page.route('**/api/viewing-appointments', async (route) => {
      await route.fulfill({
        status: 200,
        json: { appointments: [{ ...PENDING_APPT, status: 'confirmed', isHost: false }] },
      });
    });

    await page.goto('http://localhost:3000/dashboard/calendar');

    await expect(page.getByText('The Paragon Tower')).toBeVisible({ timeout: 15000 });
    // Guests can't confirm — no Accept/Decline, just the confirmed state.
    await expect(page.getByRole('button', { name: 'Accept' })).toHaveCount(0);
    await expect(page.getByText('confirmed', { exact: false })).toBeVisible();
  });
});
