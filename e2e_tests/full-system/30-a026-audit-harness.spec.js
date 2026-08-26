import { test, expect } from "@playwright/test";
import { assertScoutItRendered, gotoAndSettle } from "./helpers";

test.describe("A-026 portable audit harness and non-vacuous assertions", () => {
  test("render anchor verifies canonical ScoutIt layout elements on public routes", async ({ page }) => {
    await gotoAndSettle(page, "/about");
    await assertScoutItRendered(page);
  });

  test("render anchor rejects interstitial or non-ScoutIt responses", async ({ page }) => {
    // Navigate to a blank HTML data URL simulating an interstitial authentication wall
    await page.goto("data:text/html,<html><body><h1>Authentication Required</h1><p>Log in to Vercel to view this deployment.</p></body></html>");
    let error;
    try {
      await assertScoutItRendered(page);
    } catch (e) {
      error = e;
    }
    expect(error?.message).toMatch(/Render anchor failed: the response is an interstitial/i);
  });

  test("render anchor rejects pages missing root grain or organization structured data", async ({ page }) => {
    // Navigate to a bare HTML page with text but missing ScoutIt markers
    await page.goto("data:text/html,<html><body><h1>Unrelated Generic App</h1></body></html>");
    let error;
    try {
      await assertScoutItRendered(page);
    } catch (e) {
      error = e;
    }
    expect(error?.message).toMatch(/render anchor missing/i);
  });


  test("U-011 regression: nonexistent nested property routes return real 404 responses", async ({ page }) => {
    const invalidBrokers = await page.goto("/property/audit-invalid-property/brokers", { waitUntil: "domcontentloaded" });
    expect(invalidBrokers?.status()).toBe(404);

    const invalidUnit = await page.goto("/property/audit-invalid-property/unit/audit-invalid-unit", { waitUntil: "domcontentloaded" });
    expect(invalidUnit?.status()).toBe(404);

    const invalidParent = await page.goto("/property/audit-invalid-property", { waitUntil: "domcontentloaded" });
    expect(invalidParent?.status()).toBe(404);
  });
});
