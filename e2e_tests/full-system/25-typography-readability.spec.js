import { test, expect } from "@playwright/test";
import { gotoAndSettle } from "./helpers";

test.setTimeout(180_000);
const ROUTES = ["/", "/about", "/about-you", "/layer/core", "/layer/mantle", "/discover", "/property", "/property/one-ecom-center", "/intel", "/pricing", "/onboarding", "/dashboard"];

test("representative ScoutIt surfaces keep visible interface text at or above 12px", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ROUTES) {
    const response = await gotoAndSettle(page, route);
    expect(response.status(), route).toBeLessThan(400);
    const offenders = await page.evaluate(() => {
      const isVisible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
      };
      return [...document.querySelectorAll("body *")]
        .filter((element) => {
          if (!isVisible(element) || element.closest('[aria-hidden="true"]')) return false;
          if (["SCRIPT", "STYLE", "SVG", "CANVAS"].includes(element.tagName)) return false;
          return [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        })
        .map((element) => {
          const style = getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
            fontSize: Number.parseFloat(style.fontSize),
            selector: element.id ? `#${element.id}` : `.${[...element.classList].slice(0, 3).join(".")}`,
          };
        })
        .filter((entry) => entry.fontSize < 12)
        .slice(0, 30);
    });
    expect(offenders, `${route}: ${JSON.stringify(offenders)}`).toEqual([]);
  }
});
