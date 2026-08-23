import { test, expect } from "@playwright/test";
import { gotoAndSettle, trackErrors } from "./helpers";

test("Crust deep links to a truthful professional dossier", async ({ page }) => {
  const errors = trackErrors(page);
  const response = await gotoAndSettle(page, "/layer/crust?category=research");

  expect(response.status()).toBeLessThan(400);
  const researchTab = page.getByRole("tab", { name: /Site Research/i });
  await expect(researchTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Site researchers");
  await expect(page.getByRole("tabpanel")).toContainText("What ScoutIt has checked");
  await expect(page.getByRole("tabpanel")).toContainText("ScoutIt does not turn research into legal");
  await expect(page.getByRole("link", { name: /Browse researcher profiles/i })).toHaveAttribute("href", "/researchers");
  expect(errors).toEqual([]);
});

test("Crust category tabs support arrow, Home, End, and browser history", async ({ page }) => {
  await gotoAndSettle(page, "/layer/crust?category=photography");
  const photography = page.getByRole("tab", { name: /Space Photography/i });
  await expect(photography).toHaveAttribute("aria-selected", "true");
  await photography.focus();
  await page.keyboard.press("ArrowRight");

  const research = page.getByRole("tab", { name: /Site Research/i });
  await expect(research).toBeFocused();
  await expect(research).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/category=research/);

  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: /Event Design/i })).toHaveAttribute("aria-selected", "true");
  await page.goBack();
  await expect(research).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: /Verified Advisors/i })).toHaveAttribute("aria-selected", "true");
});

test("Crust remains readable and contained from compact phone to desktop", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await gotoAndSettle(page, "/layer/crust?category=events");
    await expect(page.getByRole("heading", { level: 2, name: /Event planners & space designers/i })).toBeVisible();
    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      minimumVisibleText: Math.min(...Array.from(document.querySelectorAll("body *"))
        .filter((node) => node.textContent.trim() && getComputedStyle(node).display !== "none" && getComputedStyle(node).visibility !== "hidden")
        .map((node) => Number.parseFloat(getComputedStyle(node).fontSize))
        .filter(Number.isFinite)),
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(geometry.minimumVisibleText).toBeGreaterThanOrEqual(12);
  }
});

test("Crust does not start WebGL or foreground motion when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoAndSettle(page, "/layer/crust?category=photography");

  await expect(page.locator("canvas")).toHaveCount(0);
  const motion = await page.getByRole("tabpanel").evaluate((node) => {
    const style = getComputedStyle(node);
    return { transitionDuration: style.transitionDuration, transform: style.transform };
  });
  expect(motion.transitionDuration).toBe("0s");
  expect(motion.transform).toBe("none");
});