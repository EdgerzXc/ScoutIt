// Shared helpers for the full-system E2E pass.
//
// SAFETY CONTRACT (read before adding tests):
// - The dev server runs against LIVE Supabase + Airtable. Tests must be
//   read-and-render only: never publish, delete, archive, approve, spend
//   Connects, or send inquiries. Opening modals/wizards without submitting
//   is fine. The wishlist (scoutit_reactions) is device-local and safe.
// - `master-dev` is the owner's real dev account with real production
//   listings. Only MASTER_DEV_READONLY tests may use it, and they must not
//   click anything destructive.
import { expect } from '@playwright/test';

// Mock users. DashboardContext only preserves a localStorage mock whose id
// contains "master-dev"; anything else is wiped on mount unless a real
// Supabase session exists.
export const MOCK_OWNER_EMPTY = {
  id: 'master-dev-e2e-empty', // passes the includes("master-dev") check, owns zero rows
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
  // Next.js error overlays / boundaries render these strings.
  expect(bodyText).not.toContain('Application error');
  expect(bodyText).not.toContain('Unhandled Runtime Error');
  expect(bodyText).not.toContain('This page could not be found');
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
  return { slug: listing.slug, title: listing.title || listing.slug };
}
