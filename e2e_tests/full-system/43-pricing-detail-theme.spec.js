import { test, expect } from "@playwright/test";
import { auditVisibleText } from "../../scripts/audit/computed-contrast.js";

const ROUTES = ["seeker", "owner", "broker", "creator", "bundles"];

for (const route of ROUTES) {
  for (const width of [1280, 390]) {
    for (const mode of ["dark", "light"]) {
      test(`${route} pricing follows ${mode} tokens at ${width}px`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
        await page.addInitScript((selectedMode) => {
          localStorage.setItem("scoutit_display_mode", selectedMode);
        }, mode);
        await page.goto(`/pricing/${route}`, { waitUntil: "load" });
        const popular = page.getByText("Most Popular").first().locator("..");
        await expect(popular).toBeVisible();
        await page.waitForFunction(() => {
          const layout = document.querySelector(".pricing-layout");
          return layout && getComputedStyle(layout).backgroundColor !== "rgba(0, 0, 0, 0)";
        });

        const theme = await page.evaluate(() => {
          const sample = document.createElement("span");
          document.body.append(sample);
          const resolve = (property, value) => {
            sample.style[property] = value;
            return getComputedStyle(sample)[property];
          };
          const popularBadge = [...document.querySelectorAll(".pricing-grid *, .bundles-grid *")]
            .find((element) => element.textContent.trim() === "Most Popular");
          const card = popularBadge?.parentElement;
          const price = card?.querySelector(".font-display-md");
          const ambient = document.querySelector(".pricing-detail-ambient");
          const result = {
            ground: getComputedStyle(document.querySelector(".pricing-layout")).backgroundColor,
            expectedGround: resolve("backgroundColor", "var(--bg)"),
            titleInk: getComputedStyle(document.querySelector(".page-title")).color,
            expectedInk: resolve("color", "var(--text-primary)"),
            priceInk: price && getComputedStyle(price).color,
            cardFill: card && getComputedStyle(card).backgroundColor,
            cardImage: card && getComputedStyle(card).backgroundImage,
            expectedCard: resolve("backgroundColor", "var(--surface)"),
            ambientDisplay: ambient && getComputedStyle(ambient).display,
          };
          sample.remove();
          return result;
        });
        expect(theme.ground).toBe(theme.expectedGround);
        expect(theme.titleInk).toBe(theme.expectedInk);
        expect(theme.priceInk).toBe(theme.expectedInk);
        if (mode === "light") {
          expect(theme.cardFill).toBe(theme.expectedCard);
          expect(theme.cardImage).toBe("none");
          expect(theme.ambientDisplay).toBe("none");
        } else {
          expect(theme.cardImage).not.toBe("none");
          expect(theme.ambientDisplay).toBe("block");
        }

        const contrast = await page.evaluate(auditVisibleText, ".pricing-layout");
        expect(contrast.checked).toBeGreaterThan(0);
        expect(contrast.failures, `${route} ${mode} ${width}px contrast`).toEqual([]);
        if (process.env.SCOUTIT_CAPTURE_PRICING_DETAIL === "1") {
          await page.screenshot({ path: testInfo.outputPath(`${route}-${mode}-${width}.png`), fullPage: true });
        }
      });
    }
  }
}
