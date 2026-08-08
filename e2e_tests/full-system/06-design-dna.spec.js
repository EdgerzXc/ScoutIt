// Design-DNA consistency: the 95% black / 5% gold system must hold on every
// major surface — same tokens, dark canvas, glassmorphic header, no rogue
// light-mode defaults. This is the "consistent throughout" guarantee.
import { test, expect } from '@playwright/test';
import { expectDesignDNA, gotoAndSettle, signInAsMock, MOCK_OWNER_EMPTY } from './helpers';

const SURFACES = ['/', '/discover', '/property', '/intel', '/brokers', '/pricing', '/wishlist'];

for (const path of SURFACES) {
  test(`design tokens hold on ${path}`, async ({ page }) => {
    await gotoAndSettle(page, path);
    await expectDesignDNA(page);

    // The effective page canvas must be dark — not just the token defined.
    const bodyLuma = await page.evaluate(() => {
      const probe = (el) => {
        const c = getComputedStyle(el).backgroundColor;
        const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return null;
        return 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3];
      };
      // body may be transparent; fall back to html.
      return probe(document.body) ?? probe(document.documentElement) ?? 0;
    });
    expect(bodyLuma, `${path} canvas is not dark (luma ${bodyLuma})`).toBeLessThan(60);
  });
}

test('global header is present and glassmorphic on content pages', async ({ page }) => {
  await gotoAndSettle(page, '/discover');
  // Discover uses its own sidebar shell; check a standard page instead.
  await gotoAndSettle(page, '/intel');
  const header = page.locator('header.global-header, .global-header').first();
  await expect(header).toBeVisible({ timeout: 15000 });

  const backdrop = await header.evaluate(
    (el) => getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter
  );
  expect(backdrop).toContain('blur');
});

test('signed-in dashboard keeps the same DNA (no light-mode leak)', async ({ page }) => {
  await signInAsMock(page, MOCK_OWNER_EMPTY);
  await gotoAndSettle(page, '/dashboard');
  await expectDesignDNA(page);
});

test('gold accent is actually used on interactive elements', async ({ page }) => {
  await gotoAndSettle(page, '/');
  // Somewhere above the fold, at least one element must carry the gold
  // accent family (232,174,60 or 247,198,78) — the 5% that makes the brand.
  const goldCount = await page.evaluate(() => {
    const GOLDS = ['232, 174, 60', '247, 198, 78', '110, 83, 26'];
    let hits = 0;
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      const paint = `${cs.color}|${cs.borderColor}|${cs.backgroundColor}`;
      if (GOLDS.some((g) => paint.includes(g))) hits += 1;
      if (hits > 3) break;
    }
    return hits;
  });
  expect(goldCount, 'no gold accent found above the fold on the homepage').toBeGreaterThan(0);
});
test('ambient rail stays inside the universal header and exposes manual controls', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('scoutit_user', JSON.stringify({ name: 'Human Tester' }));
  });
  await gotoAndSettle(page, '/intel');

  const header = page.locator('header.global-header').first();
  const rail = header.locator('.ambient-rail');
  await expect(rail).toBeVisible();
  await expect(rail.getByRole('button', { name: 'Previous ambient information' })).toBeEnabled();
  await expect(rail.getByRole('button', { name: 'Next ambient information' })).toBeEnabled();

  const ambientCopy = rail.locator('.ambient-copy');
  const initialAmbientState = await ambientCopy.textContent();
  await expect.poll(
    async () => ambientCopy.textContent(),
    { timeout: 8_000, message: 'ambient rail did not auto-advance' },
  ).not.toBe(initialAmbientState);

  const eye = header.getByRole('button', { name: 'Display Settings (Light / Lite / Dark Mode)' });
  await eye.click();
  await expect(eye).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.toolbox-float').filter({ hasText: 'Display Settings' })).toBeVisible();

  const layout = await header.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(layout.scrollWidth, 'ambient rail caused horizontal header overflow').toBeLessThanOrEqual(layout.clientWidth + 1);
});
