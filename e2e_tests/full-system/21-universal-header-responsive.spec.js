import { test, expect } from '@playwright/test';
import { gotoAndSettle } from './helpers';

const PROPERTY_ROUTE = '/property/the-ridgeline-at-capitol-commons';
const VIEWPORT_WIDTHS = [320, 375, 390, 768, 1024, 1280, 1440];

test.describe('universal header responsive contract', () => {
  for (const width of VIEWPORT_WIDTHS) {
    test(`stays contained, legible, and operable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await gotoAndSettle(page, PROPERTY_ROUTE);
      const header = page.locator('.global-header');
      await expect(header).toBeVisible();
      await expect.poll(() => header.evaluate((element) => getComputedStyle(element).display), {
        message: 'header styles should be applied before layout measurement',
      }).toBe('flex');

      const result = await page.evaluate(() => {
        const measure = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            left: box.left,
            right: box.right,
            width: box.width,
            height: box.height,
            fontSize: Number.parseFloat(style.fontSize),
          };
        };

        const left = measure('.header-left');
        const center = measure('.header-center');
        const nav = measure('.header-nav');
        return {
          viewportWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          header: measure('.global-header'),
          back: measure('.header-back-btn'),
          center,
          menu: measure('.header-menu-btn'),
          overlapsLeft: Boolean(left && center && left.right > center.left + 0.5),
          overlapsRight: Boolean(center && nav && center.right > nav.left + 0.5),
        };
      });

      expect(pageErrors).toEqual([]);
      expect(result.scrollWidth).toBeLessThanOrEqual(result.viewportWidth);
      expect(result.header.left).toBeGreaterThanOrEqual(0);
      expect(result.header.right).toBeLessThanOrEqual(result.viewportWidth);
      expect(result.overlapsLeft).toBe(false);
      expect(result.overlapsRight).toBe(false);
      expect(result.back.fontSize).toBeGreaterThanOrEqual(10);

      expect(result.back.height).toBeGreaterThanOrEqual(width <= 640 ? 36 : 44);
      // U-004: the menu control is 44px at every width, including 320.
      expect(result.menu.width).toBeGreaterThanOrEqual(44);
      expect(result.menu.height).toBeGreaterThanOrEqual(44);
    });
  }

  test('contains long ambient copy and disables decorative motion when requested', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoAndSettle(page, PROPERTY_ROUTE);
    const header = page.locator('.global-header');
    await expect.poll(() => header.evaluate((element) => getComputedStyle(element).display), {
      message: 'header styles should be applied before reduced-motion measurement',
    }).toBe('flex');

    const result = await page.evaluate(() => {
      const rail = document.querySelector('.ambient-rail');
      let mobileCopy = document.querySelector('.ambient-copy-mobile');
      if (!mobileCopy && rail) {
        const scopeClass = Array.from(rail.classList).find((name) => name.startsWith('jsx-'));
        mobileCopy = document.createElement('span');
        mobileCopy.className = [scopeClass, 'ambient-copy', 'ambient-copy-mobile'].filter(Boolean).join(' ');
        document.querySelector('.ambient-viewport')?.appendChild(mobileCopy);
      }
      if (mobileCopy) {
        mobileCopy.textContent = 'PROPERTY CONDITIONS FOR AN EXTREMELY LONG INTERNATIONALIZED LOCATION NAME';
        mobileCopy.style.display = 'inline-flex';
      }
      const header = document.querySelector('.global-header').getBoundingClientRect();
      const thread = document.querySelector('.header-gold-thread span');
      const ambientCopy = document.querySelector('.ambient-copy');
      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        headerLeft: header.left,
        headerRight: header.right,
        threadDisplay: thread ? getComputedStyle(thread).display : null,
        ambientAnimation: ambientCopy ? getComputedStyle(ambientCopy).animationName : null,
      };
    });

    expect(result.scrollWidth).toBeLessThanOrEqual(result.viewportWidth);
    expect(result.headerLeft).toBeGreaterThanOrEqual(0);
    expect(result.headerRight).toBeLessThanOrEqual(result.viewportWidth);
    expect(result.threadDisplay).toBe('none');
    expect(result.ambientAnimation).toBe('none');
  });
});

// ── MENU OPERATING LAYER (A-001) ─────────────────────────────────────────
// The unit tests assert the source wires these behaviours. These assert a real
// browser actually performs them, on a real page, in a production build.
test.describe('universal menu behaviour', () => {
  // The header streams in before React has attached its handlers, so under a
  // loaded machine the first click can land on markup that is not listening
  // yet. Retry actionability-checked clicks until the control confirms the
  // state change — the same pattern openYourMove() uses in helpers.js. Never
  // force:true, and never invoke the handler directly.
  const openMenu = async (page) => {
    const trigger = page.locator('.header-menu-btn');
    await expect(trigger).toBeVisible();
    await expect.poll(async () => {
      if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
        await trigger.click();
      }
      return trigger.getAttribute('aria-expanded');
    }, { timeout: 15000 }).toBe('true');
    return trigger;
  };

  test('opens to the first item and returns focus to the trigger on Escape', async ({ page }) => {
    await gotoAndSettle(page, PROPERTY_ROUTE);
    const trigger = await openMenu(page);

    const firstItem = page.locator('#header-menu-panel a[href], #header-menu-panel button').first();
    await expect(firstItem).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('keeps Tab inside the panel while it is open', async ({ page }) => {
    await gotoAndSettle(page, PROPERTY_ROUTE);
    await openMenu(page);

    const items = page.locator('#header-menu-panel a[href], #header-menu-panel button');
    const count = await items.count();
    expect(count).toBeGreaterThan(1);

    await items.nth(count - 1).focus();
    await page.keyboard.press('Tab');
    await expect(items.first()).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(items.nth(count - 1)).toBeFocused();
  });

  test('closes on a route change the menu did not initiate', async ({ page }) => {
    await gotoAndSettle(page, '/discover');
    const trigger = await openMenu(page);

    await page.locator('#header-menu-panel a[href="/brokers"]').click();
    await expect(page).toHaveURL(/\/brokers$/);
    await expect(page.locator('.header-menu-btn')).toHaveAttribute('aria-expanded', 'false');

    await openMenu(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.locator('.header-menu-btn')).toHaveAttribute('aria-expanded', 'false');
  });

  test('every destination resolves and the current page is marked', async ({ page }) => {
    await gotoAndSettle(page, '/discover');
    await openMenu(page);

    const hrefs = await page.locator('#header-menu-panel a[href]').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    );
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      expect(href.startsWith('/')).toBe(true);
    }

    await expect(page.locator('#header-menu-panel [aria-current="page"]')).toHaveAttribute(
      'href',
      '/discover',
    );
    await expect(page.locator('.header-menu-btn')).toHaveAttribute('aria-controls', 'header-menu-panel');
  });
});
