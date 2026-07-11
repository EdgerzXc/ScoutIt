// The verified-ecosystem directories: brokers, photographers, researchers,
// event planners. Each directory must render provider cards and click
// through to a working public profile.
import { test, expect } from '@playwright/test';
import { trackErrors, expectRealContent, gotoAndSettle } from './helpers';

// Broker cards open dedicated /brokers/[slug] pages; provider cards
// (photographers / researchers / event planners) open shared /profile/[name]
// pages. The empty branch must see an EXPLICIT roster message — a directory
// silently rendering nothing is a failure.
const DIRECTORIES = [
  { path: '/brokers', profilePrefix: '/brokers/' },
  { path: '/photographers', profilePrefix: '/profile/' },
  { path: '/researchers', profilePrefix: '/profile/' },
  { path: '/event-planners', profilePrefix: '/profile/' },
];

for (const { path, profilePrefix } of DIRECTORIES) {
  test(`${path} directory renders and opens a profile`, async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, path);
    await expectRealContent(page);

    // Card grids are client-fetched; wait for either cards or the explicit
    // empty-roster state before judging.
    const profileLinks = page.locator(`main a[href^="${profilePrefix}"]`);
    const emptyState = page.locator('.roster-state, .coming-soon-banner');
    await expect(profileLinks.first().or(emptyState.first())).toBeVisible({ timeout: 20000 });

    const count = await profileLinks.count();
    if (count === 0) {
      // Legitimate only when the page says so out loud (small live network /
      // founding-member GTM state) — never as a silent blank grid.
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(
        /no .{0,20}(roster|match|found)|coming soon|founding (member|lens|designer|analyst)/i
      );
    } else {
      await profileLinks.first().click();
      await page.waitForURL(new RegExp(`${profilePrefix.replace(/\//g, '\\/')}.+`), {
        timeout: 20000,
      });
      await expectRealContent(page, 100);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toMatch(/Application error|not be found/i);
    }

    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('intel hub lists briefings and opens an article', async ({ page }) => {
  const errors = trackErrors(page);
  await gotoAndSettle(page, '/intel');
  await expectRealContent(page);

  const articleLinks = page.locator('a[href^="/intel/"]');
  await expect(articleLinks.first()).toBeVisible({ timeout: 20000 });
  await articleLinks.first().click();
  await page.waitForURL(/\/intel\/.+/, { timeout: 20000 });
  await expectRealContent(page, 150);

  expect(errors, errors.join('\n')).toEqual([]);
});
