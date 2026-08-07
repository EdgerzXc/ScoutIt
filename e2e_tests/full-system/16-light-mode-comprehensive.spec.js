// Comprehensive Light Mode & Mobile E2E Audit
// Verifies that Light Mode ("White Gold" aesthetics) renders clean, high-contrast,
// non-broken styling across all public routes on both Desktop and Mobile viewports.

import { test, expect } from '@playwright/test';
import { gotoAndSettle } from './helpers';

const LIGHT_MODE_ROUTES = [
  '/',
  '/about',
  '/discover',
  '/property',
  '/intel',
  '/brokers',
  '/photographers',
  '/researchers',
  '/event-planners',
  '/wishlist',
  '/pricing',
  '/enterprise',
  '/badges',
  '/terms',
  '/privacy',
  '/showcase',
  '/transit',
];

async function enableLightMode(page) {
  await page.evaluate(() => {
    document.body.classList.remove('high-contrast');
    document.body.classList.add('light-mode');
    localStorage.setItem('scoutit_display_mode', 'light');
  });
}

test.describe('Light Mode Desktop Audit (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const path of LIGHT_MODE_ROUTES) {
    test(`renders clean light-mode aesthetics on ${path}`, async ({ page }) => {
      await gotoAndSettle(page, path);
      await enableLightMode(page);

      // Verify canvas luminance unless it's a dark island by design
      const canvasInfo = await page.evaluate((urlPath) => {
        const isDarkIsland = urlPath === '/' && document.querySelector('.cinematic-container');
        const probe = (el) => {
          if (!el) return null;
          const bg = getComputedStyle(el).backgroundColor;
          const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!m) return null;
          return { r: +m[1], g: +m[2], b: +m[3], luma: 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3] };
        };

        const bgInfo = probe(document.body) || probe(document.documentElement) || { luma: 255 };
        return { isDarkIsland, luma: bgInfo.luma };
      }, path);

      if (!canvasInfo.isDarkIsland) {
        expect(canvasInfo.luma, `Light mode background on ${path} should be light (luma > 180, got ${canvasInfo.luma})`).toBeGreaterThan(180);
      }

      // Check text primary color contrast & no blue font leak
      const textCheck = await page.evaluate(() => {
        const h1 = document.querySelector('h1, h2, .page-title, .manifesto-title');
        if (!h1) return { found: false, color: '', isBlue: false };
        const color = getComputedStyle(h1).color;
        const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return { found: true, color, isBlue: false };
        const r = +m[1], g = +m[2], b = +m[3];
        // Blue leak check: blue component significantly higher than red/green
        const isBlue = b > 180 && b > r + 50 && b > g + 50;
        return { found: true, color, r, g, b, isBlue };
      });

      if (textCheck.found) {
        expect(textCheck.isBlue, `Text on ${path} should not be colored blue (got ${textCheck.color})`).toBe(false);
      }
    });
  }
});

test.describe('Light Mode Mobile Audit (390x844 - iPhone 13)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  for (const path of LIGHT_MODE_ROUTES) {
    test(`mobile viewport renders light-mode without horizontal scroll leak on ${path}`, async ({ page }) => {
      await gotoAndSettle(page, path);
      await enableLightMode(page);

      // Verify no horizontal overflow on mobile
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `Mobile page ${path} width (${scrollWidth}px) exceeds viewport (390px)`).toBeLessThanOrEqual(395);

      // Check BottomNav visibility if present
      const navVisible = await page.evaluate(() => {
        const nav = document.querySelector('.bottom-nav, nav[aria-label="Mobile navigation"]');
        if (!nav) return true; // route without bottom nav is fine
        const style = getComputedStyle(nav);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });

      expect(navVisible, `Mobile BottomNav should be visible on ${path}`).toBe(true);

      // Verify mobile touch target size (buttons & interactive items >= 36px height)
      const touchTargetCheck = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.bottom-nav-item, .header-menu-btn, .header-back-btn, .header-profile-btn'));
        const small = items.filter(el => {
          const r = el.getBoundingClientRect();
          return r.height > 0 && r.height < 36;
        });
        return { total: items.length, smallCount: small.length };
      });

      expect(touchTargetCheck.smallCount, `All primary navigation items on ${path} should meet mobile touch target minimum (36px+)`).toBe(0);
    });
  }
});
