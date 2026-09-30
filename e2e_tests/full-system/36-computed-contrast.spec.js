import { test, expect } from "@playwright/test";
import { auditVisibleText } from "../../scripts/audit/computed-contrast.js";
import { BADGE_DEFINITIONS } from "../../src/lib/BadgeEngine.js";
import { getShowcaseEntries } from "../../src/data/mock/mockShowcase.js";

const PUBLIC_ROUTES = [
  "/", "/about", "/about-you", "/contact", "/descent", "/discover",
  "/property", "/intel", "/brokers", "/photographers", "/researchers",
  "/event-planners", "/wishlist", "/pricing", "/enterprise", "/badges",
  "/terms", "/privacy", "/showcase", "/transit", "/stratosphere",
];

// A-153 coverage extension, 2026-09-29. Every route here is parameterless,
// publicly reachable, and verified to render real copy against the OFFLINE
// production server (scratch/route-render-probe.mjs: 47-763 words of text).
// The descent layers, the five pricing detail pages, the off-market gate, the
// onboarding screen and the chatbox mockup were all outside the sweep before
// this — i.e. the lens went unmeasured on them while A-170 kept migrating them.
// Deliberately NOT here: /admin, /dashboard, /profile (anonymous requests get
// an auth shell, so a green result would be a lie — see A-170's standing hole),
// /login and /community (they only redirect), and every /[slug] route (they
// need a live Airtable row; see test:e2e:live-cms).
const DESCENT_AND_DETAIL_ROUTES = [
  "/onboarding", "/off-market", "/showcase/chatbox",
  "/layer/orbit", "/layer/metropolis", "/layer/crust", "/layer/mantle", "/layer/core",
  "/layer/stratosphere",
  "/pricing/seeker", "/pricing/owner", "/pricing/broker", "/pricing/creator",
  "/pricing/bundles",
];

const showcaseEntries = getShowcaseEntries([
  { slug: "contrast-commercial", title: "Commercial Building", spaceCategory: "Commercial", city: "Taguig" },
  { slug: "contrast-residential", title: "Residential Building", spaceCategory: "Residential", city: "Makati" },
  { slug: "contrast-str", title: "STR Suite", spaceCategory: "STR", city: "Pasay" },
  { slug: "contrast-hospitality", title: "Hospitality Space", spaceCategory: "Hospitality", city: "Manila" },
]);

async function openInMode(page, path, mode, cookieConsent = "denied") {
  // These public surfaces otherwise depend on live Airtable/Supabase records.
  // CI has placeholder credentials; seeded responses keep their actual cards in view.
  if (path === "/showcase") {
    await page.route("**/api/showcase", (route) => route.fulfill({ json: { entries: showcaseEntries } }));
  }
  if (path === "/badges") {
    await page.route("**/api/badges", (route) => route.fulfill({
      json: { definitions: Object.values(BADGE_DEFINITIONS) },
    }));
  }
  await page.addInitScript(({ mode, cookieConsent }) => {
    localStorage.setItem("scoutit_display_mode", mode);
    localStorage.setItem("scoutit_help_seen_v1", "true");
    if (cookieConsent) localStorage.setItem("scoutit_cookie_consent", cookieConsent);
    else localStorage.removeItem("scoutit_cookie_consent");
  }, { mode, cookieConsent });
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  // Analytics and live catalog polling can keep the network busy indefinitely.
  // Load + hydrated styled JSX are the stable render anchors for this audit.
  if (path !== "/") {
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  }
  await page.locator("body").waitFor();
  // Styled JSX can arrive after streamed HTML. Sampling it before hydration
  // mistakes an unstyled first frame for the page's final contrast.
  if (path !== "/") {
    await page.waitForFunction(() => {
      const button = document.querySelector(".header-back-btn");
      return !button || getComputedStyle(button).backgroundColor !== "rgba(0, 0, 0, 0)";
    });
  } else {
    // The CTA is in streamed HTML before its styled JSX arrives. Its text and
    // fill briefly transition from the unstyled frame, which is not the settled
    // appearance this sweep measures.
    await page.waitForFunction(() => {
      const button = document.querySelector(".hero-cta-primary");
      if (!button) return false;
      const reference = document.createElement("span");
      reference.style.color = "var(--on-accent)";
      reference.style.backgroundColor = "var(--accent-fill)";
      document.body.append(reference);
      const actual = getComputedStyle(button);
      const expected = getComputedStyle(reference);
      const ready = actual.color === expected.color &&
        actual.backgroundColor === expected.backgroundColor;
      reference.remove();
      return ready;
    });
  }
  if (path === "/showcase") await page.locator(".sc-stat-num").first().waitFor();
  if (path === "/badges") await page.getByText("Alpha Cartographer").waitFor();
}

test.describe("A-153 computed public text contrast", () => {
  // The homepage's raymarched canvas can starve style reads on CI hardware.
  // Reduced motion is a supported presentation, while text ink remains the
  // same contract in both appearance modes.
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  // Stated settle budget for this sweep. The descent layers stream a heavy
  // shell, and with two Chromium workers on one machine the wait for <body>
  // can outlast the 30s default while the page itself is fine: light
  // /layer/crust failed that way on 2026-09-29 (locator('body') timeout, zero
  // contrast failures when the same route was measured on its own). CI retries
  // twice and hides it; a local run shows it and tempts someone to drop the
  // route. A named budget is the honest fix for a settle flake.
  test.describe.configure({ timeout: 60_000 });

  for (const mode of ["dark", "light"]) {
    for (const path of [...PUBLIC_ROUTES, ...DESCENT_AND_DETAIL_ROUTES]) {
      test(`${mode} text on ${path}`, async ({ page }) => {
        await openInMode(page, path, mode);
        const result = await page.evaluate(auditVisibleText);
        expect(result.checked, `No visible text was checked on ${path}`).toBeGreaterThan(0);
        expect(result.failures,
          `${mode} ${path}: ${result.failures.length} failed; ${result.uncertain} image/filtered nodes need visual review`
        ).toEqual([]);
      });
    }

    test(`${mode} text on /showcase at mobile width`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await openInMode(page, "/showcase", mode);
      const result = await page.evaluate(auditVisibleText);
      expect(result.checked).toBeGreaterThan(0);
      expect(result.failures, `${mode} mobile showcase text`).toEqual([]);
    });
  }

  test("the A-172 cookie failure is red before its fix and green now", async ({ page }) => {
    await openInMode(page, "/", "light", null);
    await page.getByRole("dialog", { name: "Cookie consent" }).waitFor();
    const current = await page.evaluate(auditVisibleText, ".cookie-lens");
    expect(current.checked).toBeGreaterThan(0);
    expect(current.failures).toEqual([]);

    const oldColor = await page.addStyleTag({ content:
      'body.light-mode .cookie-lens > p { color: #45454d !important; }' });
    const regression = await page.evaluate(auditVisibleText, ".cookie-lens");
    expect(regression.failures.some((failure) => failure.ratio < 2.1 &&
      /Cookies|ScoutIt keeps/.test(failure.text))).toBe(true);
    await oldColor.evaluate((element) => element.remove());

    const repaired = await page.evaluate(auditVisibleText, ".cookie-lens");
    expect(repaired.failures).toEqual([]);
  });
});
