// Shared helpers for the full-system E2E pass.
//
// SAFETY CONTRACT (read before adding tests):
// - The dev server runs against LIVE Supabase + Airtable. Tests must be
//   read-and-render only: never publish, delete, archive, approve, spend
//   Connects, or send inquiries. Opening modals/wizards without submitting
//   is fine. The wishlist (scoutit_reactions) is device-local and safe.
// - `master-dev` is the owner's real dev account with real production
//   listings. The legacy MASTER_DEV_READONLY fixture is a local UI preview;
//   its private network responses must be mocked and it must never mutate.
import { expect } from '@playwright/test';

// Mock users. DashboardContext accepts this identity family only in the
// localhost E2E build; public hosts reject it even when a flag is present.
export const MOCK_OWNER_EMPTY = {
  id: 'master-dev-e2e-empty',
  name: 'E2E Owner',
  role: 'owner',
  tags: ['owner'],
  primaryMode: 'owner',
};

export const MASTER_DEV_READONLY = {
  id: 'master-dev',
  name: 'Master Dev',
  role: 'owner',
  tags: ['owner', 'broker', 'buyer'],
  primaryMode: 'owner',
};

export const MOCK_SEEKER = {
  id: 'e2e-seeker',
  name: 'E2E Seeker',
  role: 'buyer',
  tags: ['buyer'],
  primaryMode: 'buyer',
};

export async function signInAsMock(page, user) {
  await page.addInitScript((u) => {
    window.localStorage.setItem('scoutit_user', JSON.stringify(u));
  }, user);
}

// Console noise the app cannot control in headless Chromium: map tiles,
// WebGL context churn, font/asset 404s from third parties, Sentry transport.
const IGNORED_CONSOLE = [
  /mapbox/i,
  /maplibre/i,
  /webgl/i,
  /swiftshader/i,
  /favicon/i,
  /sentry/i,
  /google/i,
  /usgs/i,
  /downloadable font/i,
  /net::ERR_/i,
  /the server responded with a status of (404|403|401|429)/i,
  /Failed to load resource/i,
  /Failed to fetch/i,
  /hydration/i, // tracked separately in design-dna spec if it ever appears
  /ResizeObserver loop/i,
  /THREE\./,
  /Turnstile/i,
];

export function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

// The Design DNA contract: gold accent token + near-black canvas everywhere.
export async function expectDesignDNA(page) {
  const tokens = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      accent: root.getPropertyValue('--accent').trim(),
      bg: root.getPropertyValue('--bg').trim(),
      mono: root.getPropertyValue('--font-mono').trim(),
    };
  });
  expect(tokens.accent.toUpperCase()).toBe('#E8AE3C');
  expect(tokens.mono.length).toBeGreaterThan(0);

  // --bg must be near-black (default #0e0e0e; high-contrast mode #000000).
  const hex = tokens.bg.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  expect(luminance).toBeLessThan(40);
}

// Wait until the page has produced meaningful visible text — catches blank
// screens, crashed client components, and error boundaries in one probe.
export async function expectRealContent(page, minChars = 40) {
  await expect
    .poll(async () => (await page.locator('body').innerText()).trim().length, {
      timeout: 20000,
      message: 'page body never produced meaningful text content',
    })
    .toBeGreaterThan(minChars);

  const bodyText = await page.locator('body').innerText();
  // A wall of text is not proof the app rendered — anchor it first.
  await assertScoutItRendered(page);
  // Next.js error overlays / boundaries render these strings.
  expect(bodyText).not.toContain('Application error');
  expect(bodyText).not.toContain('Unhandled Runtime Error');
  expect(bodyText).not.toContain('This page could not be found');
}

// ── RENDER ANCHOR ────────────────────────────────────────────────────────
//
// A browser audit that finds zero defects has proved nothing unless it first
// proves it was looking at ScoutIt. A protected Vercel preview answers every
// request with an authentication wall; a parked domain, a cold 502, or a
// Cloudflare challenge all render plenty of text and no ScoutIt. Every
// assertion downstream then passes vacuously and the run reports green.
//
// `div.grain` and the Organization JSON-LD come from the root layout, so they
// exist on every ScoutIt page and on nothing else.

const INTERSTITIAL_MARKERS = [
  /authentication required/i,
  /vercel authentication/i,
  /deployment protection/i,
  /log in to vercel/i,
  /just a moment/i,
  /checking your browser/i,
  /attention required/i,
];

export async function assertScoutItRendered(page) {
  const bodyText = (await page.locator('body').innerText()).trim();

  for (const marker of INTERSTITIAL_MARKERS) {
    if (marker.test(bodyText)) {
      throw new Error(
        `Render anchor failed: the response is an interstitial, not ScoutIt (matched ${marker}). ` +
          'A protected preview cannot be audited without a bypass; measure production after merge instead.',
      );
    }
  }

  await expect(
    page.locator('div.grain'),
    'render anchor missing: div.grain is emitted by the ScoutIt root layout on every page',
  ).toHaveCount(1);

  const organizationSchema = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(
    organizationSchema.some((entry) => entry.includes('#organization')),
    'render anchor missing: the ScoutIt Organization JSON-LD was not emitted',
  ).toBe(true);
}

export async function gotoAndSettle(page, path) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  return response;
}

export async function openYourMove(page) {
  const tab = page.getByRole('tab', { name: /Your Move/i }).first();
  await expect(tab).toBeVisible({ timeout: 15000 });
  // Property pages stream useful server HTML before the large interactive
  // flow has always finished hydrating. Under a cold/full-suite compile the
  // tab can therefore be visible a fraction before React attaches onClick.
  // Retry normal actionability-checked clicks until the component confirms
  // the state change; never use force:true or invoke handlers directly.
  await expect.poll(async () => {
    if ((await tab.getAttribute('aria-selected')) !== 'true') {
      await tab.click();
    }
    return tab.getAttribute('aria-selected');
  }, { timeout: 15000 }).toBe('true');

  // Desktop panels remain in the DOM at opacity:0, so global role/test-id
  // locators can accidentally resolve controls from an inactive chapter.
  // Return the state-confirmed panel and keep every interaction scoped to it.
  const panel = page.locator('#panel-yourmove.chapter-panel.active').first();
  await expect(panel).toBeVisible({ timeout: 15000 });
  return panel;
}

export async function getCommercialListing(request) {
  const response = await request.get('/api/cms?type=properties');
  expect(response.ok(), 'the CMS property feed must be available for property E2E checks').toBe(true);

  const data = await response.json();
  const properties = Array.isArray(data) ? data : data.properties || data.records || data.data || [];
  const listing = properties.find((property) =>
    /commercial/i.test(String(property.spaceCategory || property.category || property.type || ''))
  );

  expect(listing, 'the live CMS feed needs at least one Commercial listing').toBeTruthy();
  expect(listing.slug, 'the Commercial listing needs its Airtable-computed slug').toBeTruthy();
  return {
    slug: listing.slug,
    title: listing.title || listing.slug,
    isSample: listing.is_sample === true || listing.isSample === true,
  };
}
