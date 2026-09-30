import { expect, test } from "@playwright/test";

test("a partial WebGL context leaves the homepage usable", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    window.__partialWebglProbes = 0;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (kind === "webgl" || kind === "experimental-webgl") {
        window.__partialWebglProbes += 1;
        return {};
      }
      return original.call(this, kind, ...args);
    };
  });

  await page.goto("/");
  await expect(page.locator("canvas.event-horizon-canvas").first()).toBeAttached();
  await expect.poll(() => page.evaluate(() => window.__partialWebglProbes)).toBeGreaterThan(0);
  await expect(page.locator("body")).toContainText("Scout");
  expect(pageErrors.filter((message) => message.includes("getShaderParameter"))).toEqual([]);
});

test("Discover labels a failed CMS load even when sample cards remain", async ({ page }) => {
  await page.route("**/api/cms?scope=public", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "The space registry is temporarily unavailable." }),
  }));

  await page.goto("/discover");
  await expect(page.getByRole("status").filter({ hasText: "Live catalogue connection is temporarily unavailable" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry Connection" })).toBeVisible();
});
