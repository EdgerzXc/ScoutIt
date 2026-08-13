import path from "node:path";
import { test, expect } from "@playwright/test";

const axePath = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");

test.setTimeout(90_000);
async function scanRules(page, rules) {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async (ruleNames) => {
    const result = await window.axe.run(document, {
      runOnly: { type: "rule", values: ruleNames },
    });
    return result.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map((node) => node.target),
      diagnostics: nodes.map((node) => node.failureSummary),
    }));
  }, rules);
}

test.describe("shared accessibility roots", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("scoutit_display_mode", "dark");
      localStorage.setItem("scoutit-display-mode", "dark");
      localStorage.setItem("scoutit_lite_mode", "0");
    });
  });
  for (const route of ["/", "/onboarding", "/settings", "/showcase/chatbox", "/dashboard/calendar"]) {
    test(`${route} has no audited form-name or footer-contrast blocker`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      const violations = await scanRules(page, ["label", "select-name", "color-contrast"]);


      expect(violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    });
  }

  test("property map and scroll rails expose names and keyboard focus", async ({ page }) => {
    const rules = ["aria-command-name", "select-name", "scrollable-region-focusable", "link-in-text-block", "landmark-unique"];

    await page.goto("/property/one-ecom-center", { waitUntil: "domcontentloaded" });
    const locationTab = page.getByRole("tab", { name: "Location" }).first();
    await expect(locationTab).toBeVisible({ timeout: 20000 });
    await locationTab.click();
    await expect(page.locator(".maplibregl-marker, .leaflet-marker-icon").first()).toBeVisible({ timeout: 20000 });
    let violations = await scanRules(page, rules);
    expect(violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);

    const legend = page.getByLabel("Answer authority legend");
    await legend.focus();
    await expect(legend).toBeFocused();

    await page.setViewportSize({ width: 393, height: 851 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Answer authority legend")).toBeVisible({ timeout: 20000 });
    violations = await scanRules(page, rules);
    expect(violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  });

  for (const route of [
    "/descent",
    "/property/audit-invalid-property",
    "/property/one-ecom-center/brokers",
    "/dashboard/crm",
    "/profile/audit-invalid-user",
    "/property/audit-invalid-property/unit/audit-invalid-unit",
  ]) {
    test(`${route} exposes one top-level, uniquely named main landmark`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("main")).toHaveCount(1);
      const violations = await scanRules(page, [
        "landmark-one-main",
        "landmark-no-duplicate-main",
        "landmark-main-is-top-level",
        "landmark-unique",
        "region",
      ]);
      expect(violations).toEqual([]);
    });
  }
  for (const route of [
    "/about",
    "/enterprise",
    "/settings",
    "/property",
    "/property/one-ecom-center",
    "/brokers/e7f3634b-65d7-4adc-90ea-0544b61d988d",
    "/layer/crust",
    "/descent",
    "/intel",
    "/admin",
  ]) {
    test(`${route} has a logical visible heading sequence`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20000 });
      const violations = await scanRules(page, ["page-has-heading-one", "heading-order"]);
      expect(violations).toEqual([]);
    });
  }
  for (const route of [
    "/badges",
    "/brokers",
    "/photographers",
    "/researchers",
    "/discover",
    "/pricing/bundles",
    "/privacy",
    "/terms",
    "/intel",
    "/layer/core",
    "/layer/metropolis",
    "/layer/orbit",
    "/brokers/e7f3634b-65d7-4adc-90ea-0544b61d988d",
    "/profile/Maria%20Santos",
    "/property/one-ecom-center",
  ]) {
    test(`${route} has no audited dark-mode contrast blocker`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const violations = await scanRules(page, ["color-contrast", "link-in-text-block"]);
      expect(violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    });
  }
  test("article data rails are keyboard reachable", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto("/intel/bgc-spatial-movement", { waitUntil: "domcontentloaded" });
    const rail = page.getByLabel("Scrollable article data table").first();
    await expect(rail).toBeVisible({ timeout: 20000 });
    await rail.focus();
    await expect(rail).toBeFocused();
    const violations = await scanRules(page, ["scrollable-region-focusable"]);
    expect(violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  });
});