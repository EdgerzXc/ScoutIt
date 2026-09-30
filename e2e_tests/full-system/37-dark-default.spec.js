import { test, expect } from "@playwright/test";

test.describe("A-083 dark appearance default", () => {
  // An OS light preference must not silently opt someone into White Lens.
  test.use({ colorScheme: "light" });

  for (const width of [1280, 390]) {
    test(`a fresh ${width}px visit paints Dark without saving a theme choice`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.addInitScript(() => {
        document.addEventListener("DOMContentLoaded", () => {
          window.__initialAppearance = {
            light: document.body.classList.contains("light-mode"),
            highContrast: document.body.classList.contains("high-contrast"),
          };
        }, { once: true });
      });

      await page.goto("/about", { waitUntil: "load" });
      const state = await page.evaluate(() => ({
        initial: window.__initialAppearance,
        light: document.body.classList.contains("light-mode"),
        highContrast: document.body.classList.contains("high-contrast"),
        stored: localStorage.getItem("scoutit_display_mode"),
        background: getComputedStyle(document.body).getPropertyValue("--bg").trim(),
      }));

      expect(state.initial).toEqual({ light: false, highContrast: false });
      expect(state.light).toBe(false);
      expect(state.highContrast).toBe(false);
      expect(state.stored).toBeNull();
      expect(state.background.toLowerCase()).toBe("#0d0d0d");
    });
  }

  test("White Lens is opt-in and switching back to Dark survives reload", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/about", { waitUntil: "load" });
    const openDisplay = () => page.getByRole("button", {
      name: "Help & Display (Guide / Dark / High Contrast / Lite Mode / Simple Mode)",
    });
    const panel = () => page.getByRole("complementary", { name: "Help & Display" });

    await openDisplay().click();
    await panel().getByRole("button", { name: /Light \/ White Lens/ }).click();
    await expect(page.locator("body")).toHaveClass(/light-mode/);
    expect(await page.evaluate(() => localStorage.getItem("scoutit_display_mode"))).toBe("light");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toHaveClass(/light-mode/);
    await openDisplay().click();
    await panel().getByRole("button", { name: /Dark Mode/ }).click();
    await expect(page.locator("body")).not.toHaveClass(/light-mode|high-contrast/);
    expect(await page.evaluate(() => localStorage.getItem("scoutit_display_mode"))).toBe("dark");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toHaveClass(/light-mode|high-contrast/);
    expect(await page.evaluate(() => localStorage.getItem("scoutit_display_mode"))).toBe("dark");
  });
});
