// Every public route must load, render real content, throw no client-side
// errors, and keep the dark/gold Design DNA. This is the base heartbeat of
// the whole site — if a route breaks, this catches it before anything deeper.
import { test, expect } from '@playwright/test';
import { trackErrors, expectDesignDNA, expectRealContent, gotoAndSettle } from './helpers';

// route → a string that proves the RIGHT page rendered (not just any page).
// Anchors are chosen from copy the page owns (headings, kickers, labels).
const PUBLIC_ROUTES = [
  { path: '/', anchor: /scout/i },
  { path: '/about', anchor: /scout/i },
  { path: '/discover', anchor: /Discovery|Spotlights/i },
  { path: '/property', anchor: /director|space|propert/i },
  { path: '/intel', anchor: /intel/i },
  { path: '/brokers', anchor: /broker/i },
  { path: '/photographers', anchor: /photograph/i },
  { path: '/researchers', anchor: /research/i },
  { path: '/event-planners', anchor: /planner|event/i },
  { path: '/wishlist', anchor: /board|ledger|wishlist|saved/i },
  { path: '/pricing', anchor: /pricing|tier|cosmic/i },
  { path: '/pricing/seeker', anchor: /seeker/i },
  { path: '/pricing/owner', anchor: /owner/i },
  { path: '/pricing/broker', anchor: /broker/i },
  { path: '/pricing/creator', anchor: /creator|photograph/i },
  { path: '/pricing/bundles', anchor: /bundle/i },
  { path: '/enterprise', anchor: /enterprise/i },
  { path: '/onboarding', anchor: /scout|account|welcome/i },
  { path: '/badges', anchor: /badge/i },
  { path: '/terms', anchor: /terms/i },
  { path: '/privacy', anchor: /privacy/i },
  // /showcase is "The Board" — the ranked most-inquired leaderboard.
  { path: '/showcase', anchor: /most inquired|top rated|board/i },
  { path: '/transit', anchor: /transit/i },
  { path: '/descent', anchor: /descent|layer|orbit/i },
  // The six descent-layer pages.
  { path: '/layer/orbit', anchor: /board|orbit/i },
  { path: '/layer/stratosphere', anchor: /intel|stratosphere/i },
  { path: '/layer/metropolis', anchor: /explore|metropolis|discover/i },
  { path: '/layer/crust', anchor: /network|crust/i },
  { path: '/layer/mantle', anchor: /archive|mantle/i },
  { path: '/layer/core', anchor: /workspace|core/i },
];

for (const { path, anchor } of PUBLIC_ROUTES) {
  test(`public route ${path} renders cleanly`, async ({ page }) => {
    const errors = trackErrors(page);
    const response = await gotoAndSettle(page, path);

    expect(response, `no response for ${path}`).toBeTruthy();
    expect(response.status(), `${path} returned HTTP ${response.status()}`).toBeLessThan(400);

    await expectRealContent(page);
    await expect(page.locator('body')).toContainText(anchor, { timeout: 15000 });
    await expectDesignDNA(page);

    expect(errors, `client errors on ${path}:\n${errors.join('\n')}`).toEqual([]);
  });
}

test('unknown route returns the 404 surface, not a crash', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-real-page-e2e', {
    waitUntil: 'domcontentloaded',
  });
  expect(response.status()).toBe(404);
  // Even the 404 should hold the dark canvas, not a white default page.
  await expectDesignDNA(page);
});
