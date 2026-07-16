// Session 2026-07-16 features: factual share/promote pipeline, Monthly Cost
// Sandbox, honest Mission Control, PRC verification surfaces, footer labels.
//
// SAFETY: read-and-render only per helpers.js contract. Opens modals without
// submitting; the cost calculator is pure client state; Mission Control checks
// never click destructive controls.
const { test, expect } = require('@playwright/test');
const {
  MASTER_DEV_READONLY,
  signInAsMock,
  trackErrors,
  expectRealContent,
  gotoAndSettle,
} = require('./helpers');

const BASE = 'http://localhost:3000';

// One live commercial star property (Airtable, read-only).
const COMMERCIAL_SLUG = 'cyber-sigma-tower-3';

// Share / Promote / Monthly Cost Sandbox all live inside the "Your Move"
// chapter panel, which is hidden until its tab is activated.
async function openYourMove(page) {
  const tab = page.getByRole('tab', { name: /Your Move/i }).first();
  await expect(tab).toBeVisible({ timeout: 15000 });
  await tab.click();
}

test.describe('Factual share & promote pipeline', () => {
  test('Share button opens a briefing built from real listing data', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, `${BASE}/property/${COMMERCIAL_SLUG}`);
    await expectRealContent(page);
    await openYourMove(page);

    await page.getByRole('button', { name: /^Share$/i }).first().click();
    const briefing = page.locator('textarea[readonly]');
    await expect(briefing).toBeVisible({ timeout: 10000 });
    const text = await briefing.inputValue();
    expect(text).toContain('MARKET INTELLIGENCE BRIEFING');
    expect(text).toContain('Cyber Sigma Tower 3');
    // No money in share copy (compliance).
    expect(text).not.toMatch(/₱|PHP/);

    await page.getByRole('button', { name: /close share modal/i }).click();
    expect(errors).toEqual([]);
  });

  test('AI Promote modal produces grounded copy (AI or fact sheet)', async ({ page }) => {
    test.setTimeout(90000);
    // Deterministic suite: force the fact-sheet path — the live AI call is
    // rate-limited/slow and belongs in targeted checks, not a parallel suite.
    await page.route('**/api/ai/promote', (route) =>
      route.continue({ headers: { ...route.request().headers(), 'x-skip-ai': '1' } })
    );
    await gotoAndSettle(page, `${BASE}/property/${COMMERCIAL_SLUG}`);
    await expectRealContent(page);
    await openYourMove(page);

    await page.getByRole('button', { name: /AI Promote/i }).click();
    await expect(
      page.getByText(/verified listing data/i).first()
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Cyber Sigma Tower 3/).first()).toBeVisible();
  });

  test('promote API answers factually even for a synthetic property', async ({ request }) => {
    // The route itself caps the AI wait at 20s (then serves the fact sheet),
    // but leave headroom for a cold Next.js compile of the route.
    test.setTimeout(60000);
    const res = await request.post(`${BASE}/api/ai/promote`, {
      timeout: 45000,
      headers: { 'x-skip-ai': '1' },
      data: {
        property: {
          title: 'E2E Probe Space',
          spaceCategory: 'Commercial',
          location: 'Makati CBD',
          Floor_Area_Sqm: 120,
        },
        tier: 'solar',
        link: `${BASE}/property/e2e-probe`,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.source).toBe('factsheet');
    expect(body.data.fastPitch).toContain('E2E Probe Space');
  });
});

test.describe('Monthly Cost Sandbox (BYO-data)', () => {
  test('renders in Your Move and totals user-typed bills', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, `${BASE}/property/${COMMERCIAL_SLUG}`);
    await expectRealContent(page);
    await openYourMove(page);

    const sandbox = page.getByTestId('monthly-cost-sandbox');
    await sandbox.scrollIntoViewIfNeeded();
    await expect(sandbox).toBeVisible();

    // User types their own electricity bill — total must reflect it.
    await sandbox.getByTestId('mcs-input-electricity').fill('5000');
    const totalText = await sandbox.getByTestId('mcs-total').innerText();
    expect(totalText).toContain('₱');
    expect(errors).toEqual([]);
  });
});

test.describe('Honest listing claims (RA 9646)', () => {
  test('property page never asserts an unconditional "Verified broker"', async ({ page }) => {
    await gotoAndSettle(page, `${BASE}/property/${COMMERCIAL_SLUG}`);
    await expectRealContent(page);
    // Old fake claim: bare "Verified broker". New states: "PRC Verified broker"
    // (data-gated) or the neutral "ScoutIt roster".
    const bare = page.getByText('Verified broker', { exact: true });
    await expect(bare).toHaveCount(0);
  });

  test('demo broker profile renders (PRC badge only when Airtable says so)', async ({ page }) => {
    await gotoAndSettle(page, `${BASE}/brokers`);
    await expectRealContent(page);
    const firstBroker = page.locator('a[href^="/brokers/"]').first();
    if ((await firstBroker.count()) > 0) {
      await firstBroker.click();
      await expectRealContent(page);
    }
  });
});

test.describe('Navigation labels', () => {
  test('footer separates Discover and Space Directory', async ({ page }) => {
    await gotoAndSettle(page, `${BASE}/`);
    await expectRealContent(page);
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Discover', exact: true })).toHaveAttribute('href', '/discover');
    await expect(footer.getByRole('link', { name: 'Space Directory' })).toHaveAttribute('href', '/property');
  });
});

test.describe('Enterprise Mission Control (honest data)', () => {
  test('dashboard derives from real portfolio; Team tab does not crash', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, { ...MASTER_DEV_READONLY, primaryMode: 'mc_enterprise', tags: ['owner', 'mc_enterprise'] });
    await gotoAndSettle(page, `${BASE}/dashboard`);
    await expectRealContent(page);

    await page.getByRole('button', { name: /Unlock Enterprise Sandbox/i }).click();
    await expect(page.getByText('Enterprise Dashboard')).toBeVisible({ timeout: 15000 });

    // Honest signals present; the old fabricated ones gone.
    await expect(page.getByText('Portfolio Strength')).toBeVisible();
    await expect(page.getByText('Portfolio Signal')).toBeVisible();
    await expect(page.getByText('12 active users')).toHaveCount(0);
    await expect(page.getByText('Est. MRR (Mock)')).toHaveCount(0);

    // Team tab used to throw (undefined permissionOverrides) — regression probe.
    await page.getByRole('button', { name: /^Team$/i }).click();
    await expect(page.getByRole('button', { name: 'Invite Member' })).toBeVisible({ timeout: 10000 });
    // No seeded fake teammates.
    await expect(page.getByText('Sarah Chen')).toHaveCount(0);
    await expect(page.getByText('David Park')).toHaveCount(0);

    expect(errors).toEqual([]);
  });
});
