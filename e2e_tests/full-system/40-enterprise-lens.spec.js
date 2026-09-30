import { test, expect } from "@playwright/test";

test.describe("A-170 Enterprise page follows the dark default and White Lens", () => {
  for (const width of [1280, 390]) {
    test(`${width}px title, card headings, and action re-ink`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/enterprise", { waitUntil: "load" });

      const title = page.getByRole("heading", { level: 1, name: "Enterprise Accounts" });
      const cardHeading = page.locator(".enterprise-card h2").first();
      const action = page.getByRole("link", { name: /Preview the Enterprise Console/ });
      await expect(title).toBeVisible();
      await expect(cardHeading).toBeVisible();
      expect(await cardHeading.evaluate((heading) => getComputedStyle(heading).fontSize)).toBe("17px");
      await expect(page.locator("body")).not.toHaveClass(/light-mode/);
      expect(await title.evaluate((heading) => getComputedStyle(heading).color)).toBe("rgb(219, 219, 219)");
      expect(await action.evaluate((link) => getComputedStyle(link).backgroundColor)).toBe("rgb(232, 174, 60)");
      if (process.env.SCOUTIT_CAPTURE_ENTERPRISE === "1") {
        await page.screenshot({ path: testInfo.outputPath("enterprise-dark.png") });
        await action.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath("enterprise-dark-cta.png") });
      }

      await page.evaluate(() => document.body.classList.add("light-mode"));
      await expect.poll(() => title.evaluate((heading) => getComputedStyle(heading).color))
        .toBe("rgb(17, 17, 19)");
      await expect.poll(() => action.evaluate((link) => getComputedStyle(link).backgroundColor))
        .toBe("rgb(179, 179, 179)");
      if (process.env.SCOUTIT_CAPTURE_ENTERPRISE === "1") {
        await title.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath("enterprise-lens.png") });
        await action.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath("enterprise-lens-cta.png") });
      }
    });
  }
});
