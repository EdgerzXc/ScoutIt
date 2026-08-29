import path from "node:path";
import { test, expect } from "@playwright/test";
import { gotoAndSettle, trackErrors } from "./helpers";

const axePath = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");

const VIEWPORTS = [
  { name: "compact phone", width: 320, height: 720 },
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
];

for (const viewport of VIEWPORTS) {
  test(`Mantle disclosure remains readable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = trackErrors(page);
    const response = await gotoAndSettle(page, "/layer/mantle");

    expect(response.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: /how scoutit thinks/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /operating archive/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /our story/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /platform architecture/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /data philosophy/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /trust & verification/i })).toBeVisible();
    await expect(page.locator(".mantle-archive")).toHaveAttribute("data-flow-source", "fact_layer.mantle");

    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(errors).toEqual([]);
  });
}

test("every Mantle disclosure has stable deep-link state", async ({ page }) => {
  for (const [hash, title] of [
    ["story", /decision was fragmented/i],
    ["architecture", /two data systems/i],
    ["philosophy", /blank is better/i],
    ["trust", /verification is specific/i],
  ]) {
    // A unique query forces a fresh document load so this verifies direct hash
    // entry instead of Playwright's same-document fragment navigation.
    await gotoAndSettle(page, `/layer/mantle?deepLink=${hash}#${hash}`);
    await expect(page.locator(`.archive-index button[aria-pressed="true"]`)).toContainText(
      new RegExp(hash === "philosophy" ? "Data Philosophy" : hash, "i"),
      { timeout: 15000 },
    );
    await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 15000 });

  }
});

test("Mantle restores focus after pointer and keyboard disclosure changes", async ({ page }) => {
  await gotoAndSettle(page, "/layer/mantle");

  const helpPanel = page.getByRole("complementary", { name: "Help & Display" });
  await expect(helpPanel).toBeVisible();
  await page.getByRole("heading", { name: /how scoutit thinks/i }).click();
  await expect(helpPanel).toBeHidden();

  await page.getByRole("button", { name: /platform architecture/i }).click();
  await expect(page).toHaveURL(/#architecture$/);
  await expect(page.getByRole("heading", { name: /two data systems/i })).toBeFocused();

  const philosophy = page.getByRole("button", { name: /data philosophy/i });
  await philosophy.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#philosophy$/);
  await expect(page.getByRole("heading", { name: /blank is better/i })).toBeFocused();
});

test("Mantle atmosphere can be paused and reduced motion never starts WebGL", async ({ page }) => {
  await gotoAndSettle(page, "/layer/mantle");
  const helpPanel = page.getByRole("complementary", { name: "Help & Display" });
  await expect(helpPanel).toBeVisible();
  await page.getByRole("heading", { name: /how scoutit thinks/i }).click();
  await expect(helpPanel).toBeHidden();

  const toggle = page.locator(".atmosphere-toggle");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".mantle-atmosphere canvas")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".mantle-atmosphere canvas")).toHaveCount(0);
  await expect(page.locator(".archive-disclosure")).toHaveCSS("animation-name", "none");
});

test("Mantle uses its solid non-WebGL transparency fallback", async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
  });
  await gotoAndSettle(page, "/layer/mantle");

  await expect(page.locator(".archive-shell")).toHaveCSS("backdrop-filter", "none");
  await expect(page.locator(".mantle-atmosphere")).toHaveCSS("display", "none");
});

test("Mantle remains inside its disclosure performance budget", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoAndSettle(page, "/layer/mantle");
  const budget = await page.evaluate(() => ({
    domNodes: document.querySelectorAll("*").length,
    heavyweightMedia: document.querySelectorAll("img, video, canvas, iframe").length,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  expect(budget.domNodes).toBeLessThanOrEqual(300);
  expect(budget.heavyweightMedia).toBe(0);
  expect(budget.horizontalOverflow).toBeLessThanOrEqual(1);
});


test("Mantle has no serious semantic or dark-contrast blocker", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("scoutit_display_mode", "dark");
    localStorage.setItem("scoutit-display-mode", "dark");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await gotoAndSettle(page, "/layer/mantle#architecture");
    await expect(page.getByRole("main")).toHaveCount(1);
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: {
          type: "rule",
          values: [
            "color-contrast",
            "heading-order",
            "landmark-one-main",
            "landmark-main-is-top-level",
            "aria-command-name",
            "button-name",
          ],
        },
      });
      return result.violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        targets: nodes.map((node) => node.target),
      }));
    });
    expect(violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  }
});
