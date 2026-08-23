import { test, expect } from "@playwright/test";
import { gotoAndSettle, trackErrors } from "./helpers";

const directories = [
  ["/brokers", /Verified Advisors/i],
  ["/photographers", /Space Photographers/i],
  ["/researchers", /Space Researchers/i],
  ["/event-planners", /Event Professionals/i],
];

for (const [path, heading] of directories) {
  test(`${path} uses the shared truthful professional directory`, async ({ page }) => {
    const errors = trackErrors(page);
    const response = await gotoAndSettle(page, path);
    expect(response.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText("Named signals only")).toBeVisible();
    await expect(page.getByPlaceholder("SEARCH NAME, PLACE, OR SPECIALTY")).toBeVisible();
    await expect(page.getByText("Private saves never create a public count")).toBeVisible();
    await expect(page.getByText("What We Verify")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("professional cards expose stable profile and private-interest actions without nesting controls", async ({ page }) => {
  await gotoAndSettle(page, "/brokers");
  const firstCard = page.locator("article").first();
  await expect(firstCard.getByRole("link", { name: /View advisor/i })).toHaveAttribute("href", /\/brokers\//);
  await expect(firstCard.locator("a button, button a")).toHaveCount(0);
  await firstCard.getByRole("button", { name: /Save interest/i }).click();
  await expect(firstCard.getByText(/Sign in to keep this interest private/i)).toBeVisible();
  await expect(firstCard.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
});

test("professional directory is contained and motionless when requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [{ width: 320, height: 720 }, { width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await gotoAndSettle(page, "/photographers");
    const geometry = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    await expect(page.locator("canvas")).toHaveCount(0);
    const card = page.locator("article").first();
    if (await card.count()) expect(await card.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  }
});
