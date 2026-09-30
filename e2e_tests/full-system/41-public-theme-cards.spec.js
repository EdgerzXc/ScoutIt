import { test, expect } from "@playwright/test";

const firstChannel = (color) => Number(color.match(/rgba?\((\d+)/)?.[1] || 0);

test.describe("A-170 public pages keep dark default and re-ink in White Lens", () => {
  for (const width of [1280, 390]) {
    test(`${width}px pricing cards stay readable through lens and hover`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/pricing", { waitUntil: "load" });
      const heading = page.getByRole("heading", { level: 1 });
      const seeker = page.locator('a[href="/pricing/seeker"]');
      const seekerSurface = seeker.locator(".absolute.inset-0").first();
      await expect(heading).toBeVisible();
      await expect(seeker).toBeVisible();
      await expect(page.locator("body")).not.toHaveClass(/light-mode/);
      expect(firstChannel(await heading.evaluate((node) => getComputedStyle(node).color))).toBeGreaterThan(180);

      await page.evaluate(() => document.body.classList.add("light-mode"));
      await expect.poll(async () => firstChannel(await heading.evaluate((node) => getComputedStyle(node).color)))
        .toBeLessThan(80);
      await expect.poll(async () => firstChannel(await seekerSurface.evaluate((node) => getComputedStyle(node).backgroundColor)))
        .toBeGreaterThan(180);
      if (width > 640) {
        await seeker.hover();
        await expect.poll(async () => firstChannel(await seekerSurface.evaluate((node) => getComputedStyle(node).backgroundColor)))
          .toBeGreaterThan(180);
      }
      if (process.env.SCOUTIT_CAPTURE_PUBLIC_THEMES === "1") {
        await seeker.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath("pricing-lens.png") });
      }
    });

    test(`${width}px transit title follows the selected appearance`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/transit", { waitUntil: "load" });
      const heading = page.getByRole("heading", { level: 1, name: "Metro Manila Rail Network" });
      await expect(heading).toBeVisible();
      await expect(page.locator("body")).not.toHaveClass(/light-mode/);
      expect(firstChannel(await heading.evaluate((node) => getComputedStyle(node).color))).toBeGreaterThan(180);
      await page.evaluate(() => document.body.classList.add("light-mode"));
      await expect.poll(async () => firstChannel(await heading.evaluate((node) => getComputedStyle(node).color)))
        .toBeLessThan(80);
    });
  }
});
