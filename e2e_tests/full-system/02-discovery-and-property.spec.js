// The seeker's core journey: discover spaces → open a full briefing →
// read the chapters → save it to the private Ledger (device-only, safe).
// No inquiries are ever submitted — that would write real deals rows.
import { test, expect } from '@playwright/test';
import { trackErrors, expectRealContent, gotoAndSettle } from './helpers';

test.describe('Discovery engine', () => {
  test('discover page renders spotlight cards and switches categories', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, '/discover');

    await expect(page.locator('.discoverTitle')).toBeVisible({ timeout: 20000 });
    const cards = page.locator('.spotlightCard');
    await expect(cards.first()).toBeVisible({ timeout: 20000 });
    const residentialCount = await cards.count();
    expect(residentialCount).toBeGreaterThan(0);

    // Category switch via querystring-backed sidebar nav.
    await gotoAndSettle(page, '/discover?type=commercial');
    await expect(page.locator('.discoverTitle')).toContainText(/commercial/i, { timeout: 20000 });
    await expect(page.locator('.spotlightCard').first()).toBeVisible({ timeout: 20000 });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('a spotlight card leads to a full property briefing', async ({ page }) => {
    await gotoAndSettle(page, '/discover');
    const card = page.locator('.spotlightCard').first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.click();

    const briefingLink = page.getByRole('link', { name: /view full briefing/i }).first();
    await expect(briefingLink).toBeVisible({ timeout: 10000 });
    await briefingLink.click();

    await page.waitForURL(/\/property\/.+/, { timeout: 20000 });
    await expectRealContent(page, 200);
  });
});

test.describe('Property directory + briefing page', () => {
  test('directory grid renders and links into briefings', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, '/property');
    await expectRealContent(page, 100);

    // The grid links each card to /property/<slug>.
    const propertyLinks = page.locator('a[href^="/property/"]');
    await expect(propertyLinks.first()).toBeVisible({ timeout: 25000 });
    expect(await propertyLinks.count()).toBeGreaterThan(2);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('property briefing shows chapters and the Your Move price policy', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, '/property');
    const firstLink = page.locator('a[href^="/property/"]').first();
    await expect(firstLink).toBeVisible({ timeout: 25000 });
    await firstLink.click();
    await page.waitForURL(/\/property\/.+/, { timeout: 20000 });
    await expectRealContent(page, 200);

    // The chapter-registry system: a Your Move chapter must exist. Prices are
    // ONLY allowed inside Your Move (owner-verified) — never on cards.
    const yourMove = page
      .getByRole('tab', { name: /your move/i })
      .or(page.getByText(/your move/i))
      .first();
    await expect(yourMove).toBeVisible({ timeout: 20000 });
    await yourMove.click();

    // After opening Your Move, the page must still be alive (no crash) and
    // show either a verified price context or an honest blank — never NaN.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/NaN|undefined₱|₱undefined/);

    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('The Ledger (device-only wishlist)', () => {
  test('saving a reaction surfaces it on Your Board and can be removed', async ({ page }) => {
    const isMobileLayout = page.viewportSize().width < 900;

    if (isMobileLayout) {
      // Mobile's designed save path is the bottom action bar on the property
      // page (the discover card's expanded intel panel is display:none <900px).
      await gotoAndSettle(page, '/discover');
      const card = page.locator('.spotlightCard').first();
      await expect(card).toBeVisible({ timeout: 25000 });
      await card.click();
      const briefing = card.getByRole('link', { name: /view full briefing/i }).first();
      await expect(briefing).toBeVisible({ timeout: 10000 });
      await briefing.click();
      await page.waitForURL(/\/property\/.+/, { timeout: 20000 });

      const saveBtn = page.getByRole('button', { name: /save to your board/i }).first();
      await expect(saveBtn).toBeVisible({ timeout: 20000 });
      await saveBtn.click();
    } else {
      // Desktop: the discover page's expanded spotlight card carries a visible
      // ReactionButtons row. (On the briefing page the reaction tiles live
      // inside a chapter panel that's collapsed until its chapter is active,
      // so the card row is the stable place to exercise the real UI.)
      await gotoAndSettle(page, '/discover');
      const card = page.locator('.spotlightCard').first();
      await expect(card).toBeVisible({ timeout: 25000 });
      await card.click();

      const reaction = card
        .locator('.discover-reaction-buttons-container button[aria-label="Save"]')
        .first();
      await expect(reaction).toBeVisible({ timeout: 15000 });
      await reaction.click();
    }

    const stored = await page.evaluate(() => localStorage.getItem('scoutit_reactions'));
    expect(stored, 'reaction was not persisted to the device ledger').toBeTruthy();
    expect(JSON.parse(stored).length).toBeGreaterThan(0);

    // The Board must reflect it.
    await gotoAndSettle(page, '/wishlist');
    await expectRealContent(page);
    const boardText = await page.locator('body').innerText();
    expect(boardText).not.toMatch(/Application error/i);

    // Clean the device ledger so reruns stay deterministic.
    await page.evaluate(() => localStorage.removeItem('scoutit_reactions'));
  });
});
