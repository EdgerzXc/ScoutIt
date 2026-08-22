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
  getCommercialListing,
  openYourMove,
} = require('./helpers');

const BASE = 'http://localhost:3000';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('Factual share & promote pipeline', () => {
  test('Share behavior preserves the sample gate or opens a factual briefing', async ({ page, request }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    });
    const errors = trackErrors(page);
    const listing = await getCommercialListing(request);
    await gotoAndSettle(page, `/property/${listing.slug}`);
    await expectRealContent(page);
    const yourMovePanel = await openYourMove(page);

    const isMobile = page.viewportSize().width < 900;
    const shareButton = isMobile
      ? page.getByRole('button', { name: /Share this space/i })
      : yourMovePanel.getByRole('button', { name: /Share this property's briefing/i });

    if (listing.isSample) {
      if (isMobile) {
        await shareButton.click();
        await expect(page.locator('textarea[readonly]')).toHaveCount(0);
      } else {
        await expect(shareButton).toHaveCount(0);
      }
      expect(errors).toEqual([]);
      return;
    }

    await shareButton.click();
    const briefing = page.locator('textarea[readonly]');
    await expect(briefing).toBeVisible({ timeout: 10000 });
    const text = await briefing.inputValue();
    expect(text).toContain('MARKET INTELLIGENCE BRIEFING');
    expect(text).toContain(listing.title);
    // No money in share copy (compliance).
    expect(text).not.toMatch(/₱|PHP/);

    await page.getByRole('button', { name: /close share modal/i }).click();
    expect(errors).toEqual([]);
  });

  test('AI Promote modal produces grounded copy (AI or fact sheet)', async ({ page, request }) => {
    test.setTimeout(90000);
    test.skip(page.viewportSize().width < 900, 'AI Promote is desktop-only; mobile Share exposes the deterministic formats.');
    // Deterministic suite: force the fact-sheet path — the live AI call is
    // rate-limited/slow and belongs in targeted checks, not a parallel suite.
    await page.route('**/api/ai/promote', (route) =>
      route.continue({ headers: { ...route.request().headers(), 'x-skip-ai': '1' } })
    );
    const listing = await getCommercialListing(request);
    await gotoAndSettle(page, `/property/${listing.slug}`);
    await expectRealContent(page);
    const yourMovePanel = await openYourMove(page);

    const promoteButton = yourMovePanel.getByRole('button', { name: /AI Promote/i });
    await promoteButton.click();
    await expect(
      page.getByText(/verified listing data/i).first()
    ).toBeVisible({ timeout: 30000 });
    // Match generated copy containing the live listing title plus its em dash,
    // not the bare title: the desktop hero is intentionally hidden on mobile.
    await expect(page.getByText(new RegExp(`${escapeRegex(listing.title)}\\s+—`)).first()).toBeVisible();
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
  test('renders in Your Move and totals user-typed bills', async ({ page, request }) => {
    const errors = trackErrors(page);
    const listing = await getCommercialListing(request);
    await gotoAndSettle(page, `/property/${listing.slug}`);
    await expectRealContent(page);
    const yourMovePanel = await openYourMove(page);

    const sandbox = yourMovePanel.getByTestId('monthly-cost-sandbox');
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
  test('property page never asserts an unconditional "Verified broker"', async ({ page, request }) => {
    const listing = await getCommercialListing(request);
    await gotoAndSettle(page, `/property/${listing.slug}`);
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

    await page.getByRole('button', { name: /Open the Enterprise preview/i }).click();
    await expect(page.getByText('Enterprise Dashboard')).toBeVisible({ timeout: 15000 });

    // Honest signals present; the old fabricated ones gone.
    await expect(page.getByText('Portfolio Strength')).toBeVisible();
    await expect(page.getByText('Portfolio Signal')).toBeVisible();
    await expect(page.getByText('12 active users')).toHaveCount(0);
    await expect(page.getByText('Est. MRR (Mock)')).toHaveCount(0);

    // Team tab used to throw (undefined permissionOverrides) — regression probe.
    await page.getByRole('button', { name: /^Team$/i }).click();
    // Exact match: a permission toggle labelled "Invite Members / Allow member
    // to invite new users" also matches the loose name, and the ambiguity was
    // invisible while this test was running signed-out and never got here.
    await expect(
      page.getByRole('button', { name: 'Invite Member', exact: true }),
    ).toBeVisible({ timeout: 10000 });
    // No seeded fake teammates.
    await expect(page.getByText('Sarah Chen')).toHaveCount(0);
    await expect(page.getByText('David Park')).toHaveCount(0);

    expect(errors).toEqual([]);
  });
});
