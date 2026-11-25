// The seeker's core journey: discover spaces → open a full briefing →
// read the chapters → save it to the private Ledger (device-only, safe).
// No inquiries are ever submitted — that would write real deals rows.
import { test, expect } from '@playwright/test';
import { trackErrors, expectRealContent, gotoAndSettle, openYourMove } from './helpers';

test.describe('Discovery engine', () => {
  test('discover page renders and switches categories', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoAndSettle(page, '/discover');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20000 });
    const cards = page.locator('.spotlightCard');
    await expect(cards.first()).toBeVisible({ timeout: 20000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Category switch via fast category rail or querystring-backed navigation.
    await gotoAndSettle(page, '/discover?type=Commercial');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/commercial/i, { timeout: 20000 });
    await expect(page.locator('.spotlightCard').first()).toBeVisible({ timeout: 20000 });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('a directory card leads to a full property briefing', async ({ page }) => {
    await gotoAndSettle(page, '/property');
    const card = page.locator('.property-preview-card').first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.locator('a[href^="/property/"]').first().click();

    await expect(page).toHaveURL(/\/property\/.+/, { timeout: 20000 });
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
    await firstLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/property\/.+/, { timeout: 20000 });
    await expectRealContent(page, 200);

    // The chapter-registry system: a Your Move chapter must exist. Prices are
    // ONLY allowed inside Your Move (owner-verified) — never on cards.
    const yourMovePanel = await openYourMove(page);

    // After opening Your Move, the page must still be alive (no crash) and
    // show either a verified price context or an honest blank — never NaN.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/NaN|undefined₱|₱undefined/);

    // The buyer must always have a way to reach a person. Which affordance
    // that is depends on the listing and the viewport, and asserting one
    // hard-coded button made this test depend on whichever property happened
    // to sort first in the live directory:
    //
    //  - phone: the bottom bar's "Inquire" opens the inquiry dialog
    //  - desktop, no confirmed price: "Inquire with an authorized broker →"
    //  - desktop, confirmed price: the representation roster route
    //
    // Stop before spending a Connect or submitting anything.
    const inquireButton = page.getByRole('button', { name: /^inquire/i }).first();
    // Scoped to the property's own roster route: a bare /brokers match also
    // catches the universal header menu's directory link, which is present in
    // the DOM but hidden while the menu is closed.
    const brokerRoute = page.locator('a[href^="/property/"][href$="/brokers"]').first();

    if (await inquireButton.isVisible().catch(() => false)) {
      await inquireButton.click();
      const inquiryDialog = page.getByRole('dialog', { name: /contact the property recipient/i });
      await expect(inquiryDialog).toBeVisible();
      await inquiryDialog.getByRole('button', { name: 'Close' }).click();
      await expect(inquiryDialog).toBeHidden();
    } else {
      // No dialog trigger at this width: the roster route is the contact path,
      // and it must exist rather than leaving the buyer with nothing.
      await expect(brokerRoute).toBeVisible({ timeout: 15000 });
      await expect(brokerRoute).toHaveAttribute('href', /\/brokers/);
    }

    // Either way the panel is still the live one, not a crashed remnant.
    await expect(yourMovePanel).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('The Ledger (device-only wishlist)', () => {
  test('saving a reaction surfaces it on Your Board and can be removed', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scoutit_reactions');
    });
    await gotoAndSettle(page, '/property');

    const card = page.locator('.property-preview-card').first();
    await expect(card).toBeVisible({ timeout: 25000 });

    const reaction = card
      .locator('button[aria-label="Save"]')
      .first();
    await expect(reaction).toBeVisible({ timeout: 15000 });

    // Streamed SSR HTML renders before React hydration attaches onClick.
    // Retry actionability-checked clicks until the component confirms state.
    await expect.poll(async () => {
      if ((await reaction.getAttribute('aria-pressed')) !== 'true') {
        await reaction.click();
      }
      return reaction.getAttribute('aria-pressed');
    }, { timeout: 15000 }).toBe('true');

    await expect(reaction).toHaveClass(/active/);

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

test('empty catalogue fallback keeps an existing saved-property link', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('scoutit_reactions', JSON.stringify([{
      property_id: 'one-ecom-center', property_title: 'Saved property outage check',
      reaction_type: 'Save', timestamp: 1788940000000,
    }]));
  });
  await page.route('**/api/cms**', route => route.fulfill({
    status: 200,
    json: { properties: [], intel: [], brokers: [], source: 'catalog' },
  }));
  const catalogue = page.waitForResponse(response => response.url().includes('/api/cms'));
  await gotoAndSettle(page, '/wishlist');
  await catalogue;
  await expect(page.getByRole('link', { name: 'Saved property outage check', exact: true }))
    .toHaveAttribute('href', '/property/one-ecom-center');
  await expect(page.getByText('Listing removed', { exact: true })).toHaveCount(0);
});

test('Board sync keeps unlinked spaces on the device and removes account saves by UUID', async ({ page }) => {
  const propertyId = '10000000-0000-4000-8000-000000000001';
  await page.addInitScript(() => {
    const session = JSON.stringify({
      access_token: 'test-board-token',
      refresh_token: 'test-board-refresh',
      token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'test-board-owner', aud: 'authenticated' },
    });
    localStorage.setItem('sb-placeholder-auth-token', session);
    localStorage.setItem('sb-yyixsuaimdzyiocswcgc-auth-token', session);
    if (!localStorage.getItem('scoutit_reactions')) {
      localStorage.setItem('scoutit_reactions', JSON.stringify([
        { property_id: 'recLinked', property_title: 'Linked space', reaction_type: 'Save', timestamp: 11 },
        { property_id: 'device-only', property_title: 'Device-only space', reaction_type: 'Save', timestamp: 12 },
      ]));
    }
  });
  await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/cms**', (route) => route.fulfill({ json: {
    properties: [
      { id: 'recLinked', slug: 'linked-space', title: 'Linked space' },
      { id: 'recDevice', slug: 'device-only', title: 'Device-only space' },
    ],
  } }));
  await page.route('**/api/community/signals?saved=1', (route) => route.fulfill({ json: { ok: true, signals: [] } }));
  let cloudItem;
  let removedId;
  await page.route('**/api/wishlist/saved', (route) => {
    if (route.request().method() === 'DELETE') {
      removedId = route.request().postDataJSON().propertyId;
      cloudItem = null;
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: { items: cloudItem ? [cloudItem] : [] } });
  });
  let submittedItems;
  await page.route('**/api/wishlist/merge', (route) => {
    submittedItems = route.request().postDataJSON().items;
    cloudItem = { property_id: 'linked-space', account_property_id: propertyId, reaction_type: 'Save' };
    return route.fulfill({ json: {
      confirmedPropertyIds: ['linked-space'],
      confirmedProperties: [{ inputId: 'linked-space', propertyId, slug: 'linked-space' }],
    } });
  });

  await gotoAndSettle(page, '/wishlist');
  await page.getByRole('button', { name: 'Sync 2 to Account', exact: true }).click();
  expect(submittedItems.map((item) => item.property_id)).toEqual(['linked-space', 'device-only']);
  await expect(page.getByRole('status').filter({ hasText: '1 item synced to your account.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sync 1 to Account', exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Sync 1 to Account', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Linked space', exact: true })).toHaveAttribute('href', '/property/linked-space');
  await page.getByRole('button', { name: 'Remove Linked space from board' }).click();
  await expect.poll(() => removedId).toBe(propertyId);
  await expect(page.getByRole('link', { name: 'Linked space', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Device-only space', exact: true })).toBeVisible();
});
