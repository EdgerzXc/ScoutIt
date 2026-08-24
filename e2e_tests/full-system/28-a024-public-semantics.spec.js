import path from "node:path";
import { test, expect } from "@playwright/test";
import { gotoAndSettle } from "./helpers";

const axePath = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");

async function axeViolations(page, rules) {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async (values) => {
    const result = await window.axe.run(document, {
      runOnly: { type: "rule", values },
    });
    return result.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map((node) => node.target),
    }));
  }, rules);
}

test.describe("A-024 public semantic and contrast repairs", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("scoutit_display_mode", "dark"));
  });

  test("Discovery has one page title and uniquely named navigation landmarks", async ({ page }) => {
    await gotoAndSettle(page, "/discover");
    expect(await axeViolations(page, ["landmark-unique"])).toEqual([]);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("Descent has one page title while Orbit remains a section", async ({ page }) => {
    await gotoAndSettle(page, "/descent");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 2, name: /Top-Ranked Spaces/i })).toBeVisible();
  });

  test("Crust uses a valid tab panel element and readable inactive indices", async ({ page }) => {
    await gotoAndSettle(page, "/layer/crust?category=advisors");
    const violations = await axeViolations(page, ["aria-allowed-role", "color-contrast"]);
    expect(violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
    await expect(page.getByRole("tabpanel")).toHaveJSProperty("tagName", "DIV");
  });
});
