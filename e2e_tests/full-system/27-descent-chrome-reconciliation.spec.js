import { test, expect } from "@playwright/test";
import { gotoAndSettle, trackErrors } from "./helpers";

const DESCENT_ROUTES = [
  "/layer/orbit",
  "/layer/stratosphere",
  "/layer/metropolis",
  "/layer/crust",
  "/layer/mantle",
  "/layer/core",
  "/about-you",
];

for (const viewport of [
  { label: "compact phone", width: 320, height: 720 },
  { label: "desktop", width: 1440, height: 1000 },
]) {
  test(`shared descent chrome stays coherent at ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const route of DESCENT_ROUTES) {
      const errors = trackErrors(page);
      const response = await gotoAndSettle(page, route);
      expect(response.status(), route).toBeLessThan(400);

      const nav = page.getByRole("navigation", { name: "Layer navigation" });
      await expect(nav, route).toBeVisible();
      await expect(nav.getByRole("link", { name: "ScoutIt", exact: true }), route).toBeVisible();
      await expect(page.locator("h1").first(), route).toBeVisible();

      const geometry = await page.evaluate(() => {
        const navNode = document.querySelector('nav[aria-label="Layer navigation"]');
        const brand = document.querySelector('a[aria-label="ScoutIt"]');
        const actionable = Array.from(navNode.querySelectorAll("a"));
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          navHeight: navNode.getBoundingClientRect().height,
          brandCenter: brand.getBoundingClientRect().left + brand.getBoundingClientRect().width / 2,
          viewportCenter: window.innerWidth / 2,
          smallestTarget: Math.min(...actionable.map((node) => node.getBoundingClientRect().height)),
        };
      });

      expect(geometry.scrollWidth, route).toBeLessThanOrEqual(geometry.clientWidth + 1);
      expect(geometry.navHeight, route).toBe(52);
      expect(Math.abs(geometry.brandCenter - geometry.viewportCenter), route).toBeLessThanOrEqual(1);
      expect(geometry.smallestTarget, route).toBeGreaterThanOrEqual(44);
      expect(errors, route).toEqual([]);
    }
  });
}

test("shared chrome exposes a visible keyboard focus treatment", async ({ page }) => {
  await gotoAndSettle(page, "/layer/crust");
  const brand = page.getByRole("navigation", { name: "Layer navigation" }).getByRole("link", { name: "ScoutIt", exact: true });
  await brand.focus();
  await expect(brand).toBeFocused();
  const focus = await brand.evaluate((node) => {
    const style = getComputedStyle(node);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focus.outlineStyle).toBe("solid");
  expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);
});

test("shared chrome removes foreground animation for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoAndSettle(page, "/layer/crust");

  const transition = page.getByRole("region", { name: "Continue to Mantle" });
  const arrow = transition.locator("span").last();
  await expect(transition).toBeVisible();
  expect(await arrow.evaluate((node) => getComputedStyle(node).animationName)).toBe("none");

  const nextLayer = transition.getByRole("link");
  expect(await nextLayer.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0s");
});
test("Orbit exposes an honest loading state before an empty sample response", async ({ page }) => {
  await page.route("**/api/showcase", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ entries: [] }) });
  });

  const response = await page.goto("/layer/orbit", { waitUntil: "domcontentloaded" });
  expect(response.status()).toBeLessThan(400);
  const region = page.getByRole("region", { name: "Orbit Demand Rankings" });
  await expect(region).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("status")).toContainText("Reading the current sample index");
  await expect(region).toHaveAttribute("aria-busy", "false");
  await expect(page.getByText("No spaces recorded in this category yet.")).toBeVisible();
});

test("Orbit keeps foreground controls valid, focusable, and touch-sized", async ({ page }) => {
  await gotoAndSettle(page, "/layer/orbit");
  await expect(page.locator("a button, button a")).toHaveCount(0);

  const filters = page.getByRole("navigation", { name: "Orbit Space Categories" }).getByRole("button");
  expect(await filters.count()).toBeGreaterThan(0);
  await expect.poll(async () => {
    const heights = await filters.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
    return Math.min(...heights);
  }, { message: "Orbit category controls never reached their 44px styled size" }).toBeGreaterThanOrEqual(44);

  const firstFilter = filters.first();
  await firstFilter.focus();
  await expect.poll(async () => {
    const focus = await firstFilter.evaluate((node) => getComputedStyle(node).outlineWidth);
    return Number.parseFloat(focus);
  }, { message: "Orbit category focus ring never reached its 2px styled width" }).toBeGreaterThanOrEqual(2);
});

test("Stratosphere route-local motion and focus match the shared system", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoAndSettle(page, "/layer/stratosphere");

  const headline = page.locator(".strat-intro");
  expect(await headline.evaluate((node) => getComputedStyle(node).animationName)).toBe("none");

  const mapDoor = page.getByRole("link", { name: /See it on the map/i });
  await mapDoor.focus();
  await expect(mapDoor).toBeFocused();
  const focus = await mapDoor.evaluate((node) => getComputedStyle(node).outlineWidth);
  expect(Number.parseFloat(focus)).toBeGreaterThanOrEqual(2);
  expect(await mapDoor.evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
});

test("remaining layer foreground controls share touch, focus, and motion contracts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const controls = [
    { route: "/layer/crust", find: () => page.getByRole("tab", { name: /Verified advisors/i }) },
    { route: "/layer/mantle", find: () => page.getByRole("button", { name: /Pause atmosphere|Resume atmosphere/i }) },
    { route: "/layer/core", find: () => page.getByRole("button").filter({ hasText: "Seeker" }).first() },
    { route: "/about-you", find: () => page.getByRole("button", { name: "Previous", exact: true }) },
  ];

  for (const { route, find } of controls) {
    await gotoAndSettle(page, route);
    const control = find();
    await expect(control, route).toBeEnabled();
    await expect.poll(async () => control.evaluate((node) => node.getBoundingClientRect().height), {
      message: `${route} control never reached its 44px styled size`,
    }).toBeGreaterThanOrEqual(44);

    await control.focus();
    await expect(control, route).toBeFocused();
    await expect.poll(async () => Number.parseFloat(await control.evaluate((node) => getComputedStyle(node).outlineWidth)), {
      message: `${route} control never exposed its 2px focus ring`,
    }).toBeGreaterThanOrEqual(2);
    expect(await control.evaluate((node) => getComputedStyle(node).transitionDuration), route).toBe("0s");
  }
});
