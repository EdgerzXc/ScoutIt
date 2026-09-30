import { test, expect } from "@playwright/test";
import { BADGE_DEFINITIONS } from "../../src/lib/BadgeEngine.js";
import { auditVisibleText } from "../../scripts/audit/computed-contrast.js";

for (const width of [1280, 390]) {
  for (const mode of ["dark", "light"]) {
    test(`badge registry keeps owned and claim states readable in ${mode} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
      await page.route("**/api/badges", (route) => route.fulfill({
        json: { definitions: Object.values(BADGE_DEFINITIONS) },
      }));
      await page.addInitScript(({ selectedMode }) => {
        localStorage.setItem("scoutit_display_mode", selectedMode);
        localStorage.setItem("scoutit_user", JSON.stringify({ badges: [{ id: "PIONEER_BROKER" }] }));
      }, { selectedMode: mode });

      await page.goto("/badges", { waitUntil: "load" });
      const ownedCard = page.locator(".badges-lens .group").filter({ hasText: "Pioneer Advisor" });
      await expect(ownedCard.getByText("★ OWNED")).toBeVisible();
      const claimButton = page.getByRole("button", { name: /CLAIM FREE BADGE/ }).first();
      await expect(claimButton).toBeVisible();
      await expect(page.locator("body")).toHaveClass(mode === "light" ? /light-mode/ : /^(?!.*light-mode)/);

      const colors = await page.evaluate(() => {
        const sample = document.createElement("span");
        document.body.append(sample);
        const resolve = (property, value) => {
          sample.style[property] = value;
          return getComputedStyle(sample)[property];
        };
        const card = [...document.querySelectorAll(".badges-lens .group")]
          .find((element) => element.textContent.includes("Pioneer Advisor"));
        const button = document.querySelector(".badge-claim-btn");
        const result = {
          cardFill: getComputedStyle(card).backgroundColor,
          expectedSurface: resolve("backgroundColor", "var(--surface)"),
          buttonFill: getComputedStyle(button).backgroundColor,
          expectedFill: resolve("backgroundColor", "var(--accent-fill)"),
          buttonInk: getComputedStyle(button).color,
          expectedInk: resolve("color", "var(--on-accent)"),
          ambientDisplay: getComputedStyle(card.querySelector(".badge-ambient")).display,
        };
        sample.remove();
        return result;
      });
      expect(colors.cardFill).toBe(colors.expectedSurface);
      expect(colors.buttonFill).toBe(colors.expectedFill);
      expect(colors.buttonInk).toBe(colors.expectedInk);
      expect(colors.ambientDisplay).toBe(mode === "light" ? "none" : "block");

      const contrast = await page.evaluate(auditVisibleText, ".badges-lens");
      expect(contrast.checked).toBeGreaterThan(0);
      expect(contrast.failures, `${mode} ${width}px badge contrast`).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`badges-${mode}-${width}.png`), fullPage: true });
    });
  }
}
