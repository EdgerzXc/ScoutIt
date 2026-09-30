import { test, expect } from "@playwright/test";
import { auditVisibleText } from "../../scripts/audit/computed-contrast.js";

const CHOICE_KEY = "scoutit_presentation_choice_seen_v1";

async function freshVisit(page, path = "/about", { consent = "denied" } = {}) {
  await page.addInitScript(({ consent }) => {
    document.addEventListener("DOMContentLoaded", () => {
      window.__presentationFirstPaint = {
        light: document.body.classList.contains("light-mode"),
        simple: document.documentElement.classList.contains("simple-mode"),
      };
    }, { once: true });
    if (sessionStorage.getItem("scoutit_test_fresh_visit")) return;
    sessionStorage.setItem("scoutit_test_fresh_visit", "1");
    localStorage.removeItem("scoutit_help_seen_v1");
    localStorage.removeItem("scoutit_presentation_choice_seen_v1");
    localStorage.removeItem("scoutit_display_mode");
    localStorage.removeItem("scoutit_simple_mode");
    if (consent === null) localStorage.removeItem("scoutit_cookie_consent");
    else localStorage.setItem("scoutit_cookie_consent", consent);
  }, { consent });
  await page.goto(path, { waitUntil: "load" });
}

test.describe("A-083 first-visit presentation choice", () => {
  test.use({ colorScheme: "light" });

  for (const width of [1280, 390]) {
    for (const appearance of ["dark", "light"]) {
      for (const detail of ["pro", "simple"]) {
        test(`${width}px ${appearance} + ${detail} is an independent, persistent choice`, async ({ page }) => {
          await page.setViewportSize({ width, height: 800 });
          await freshVisit(page);
          const chooser = page.getByRole("dialog", { name: "Choose your view" });
          await expect(chooser).toBeVisible();
          await expect(page.locator("body")).not.toHaveClass(/light-mode/);
          await expect(page.locator("html")).not.toHaveClass(/simple-mode/);
          await expect(chooser.getByRole("radio", { name: /Dark/ })).toBeChecked();
          await expect(chooser.getByRole("radio", { name: /Pro/ })).toBeChecked();
          await expect(page.getByRole("complementary", { name: "Help & Display" })).toHaveCount(0);

          if (appearance === "light") await chooser.getByText("White Lens", { exact: true }).click();
          if (detail === "simple") await chooser.getByText("Simple", { exact: true }).click();
          await chooser.getByRole("button", { name: "Use these choices" }).click();

          await expect(chooser).toHaveCount(0);
          await expect(page.locator("body")).toHaveClass(appearance === "light" ? /light-mode/ : /^(?!.*light-mode)/);
          await expect(page.locator("html")).toHaveClass(detail === "simple" ? /simple-mode/ : /^(?!.*simple-mode)/);
          const help = page.getByRole("complementary", { name: "Help & Display" });
          await expect(help).toBeVisible();
          await help.getByRole("button", { name: "Close Help & Display" }).click();

          expect(await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY)).toBe("1");
          expect(await page.evaluate(() => localStorage.getItem("scoutit_display_mode"))).toBe(appearance);
          expect(await page.evaluate(() => localStorage.getItem("scoutit_simple_mode"))).toBe(detail === "simple" ? "1" : "0");

          await page.reload({ waitUntil: "load" });
          await expect(chooser).toHaveCount(0);
          await expect(page.locator("body")).toHaveClass(appearance === "light" ? /light-mode/ : /^(?!.*light-mode)/);
          await expect(page.locator("html")).toHaveClass(detail === "simple" ? /simple-mode/ : /^(?!.*simple-mode)/);
          expect(await page.evaluate(() => window.__presentationFirstPaint)).toEqual({
            light: appearance === "light",
            simple: detail === "simple",
          });
        });
      }
    }
  }

  for (const width of [1280, 390]) {
    test(`${width}px dismissal keeps Dark + Pro without saving affirmative preferences`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await freshVisit(page);
      const chooser = page.getByRole("dialog", { name: "Choose your view" });
      await expect(chooser).toBeVisible();
      await chooser.getByRole("button", { name: "Keep Dark + Pro", exact: true }).click();
      await expect(chooser).toHaveCount(0);
      await expect(page.getByRole("complementary", { name: "Help & Display" })).toBeVisible();
      const state = await page.evaluate((key) => ({
        marker: localStorage.getItem(key),
        theme: localStorage.getItem("scoutit_display_mode"),
        detail: localStorage.getItem("scoutit_simple_mode"),
        light: document.body.classList.contains("light-mode"),
        simple: document.documentElement.classList.contains("simple-mode"),
      }), CHOICE_KEY);
      expect(state).toEqual({ marker: "1", theme: null, detail: null, light: false, simple: false });
    });
  }

  test("Escape dismisses the mobile chooser and Tab stays inside it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await freshVisit(page);
    const chooser = page.getByRole("dialog", { name: "Choose your view" });
    await expect(chooser.getByRole("button", { name: "Keep Dark and Pro" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(chooser.getByRole("button", { name: "Use these choices" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(chooser).toHaveCount(0);
    await expect(page.getByRole("complementary", { name: "Help & Display" })).toBeVisible();
  });

  test("an existing White Lens + Simple preference is preserved without a new chooser", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("scoutit_help_seen_v1");
      localStorage.removeItem("scoutit_presentation_choice_seen_v1");
      localStorage.setItem("scoutit_display_mode", "light");
      localStorage.setItem("scoutit_simple_mode", "1");
    });
    await page.goto("/about", { waitUntil: "load" });
    await expect(page.getByRole("dialog", { name: "Choose your view" })).toHaveCount(0);
    await expect(page.getByRole("complementary", { name: "Help & Display" })).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/light-mode/);
    await expect(page.locator("html")).toHaveClass(/simple-mode/);
    expect(await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY)).toBe("existing");
  });

  test("a returning visitor without a saved choice sees the chooser once", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("scoutit_help_seen_v1", "1");
      localStorage.removeItem("scoutit_presentation_choice_seen_v1");
      localStorage.removeItem("scoutit_display_mode");
      localStorage.removeItem("scoutit_simple_mode");
    });
    await page.goto("/about", { waitUntil: "load" });
    const chooser = page.getByRole("dialog", { name: "Choose your view" });
    await expect(chooser).toBeVisible();
    await chooser.getByRole("button", { name: "Keep Dark + Pro", exact: true }).click();
    await expect(page.getByRole("complementary", { name: "Help & Display" })).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY)).toBe("1");
  });

  test("onboarding remains usable and defers the choice to a public route", async ({ page }) => {
    await freshVisit(page, "/onboarding");
    await expect(page.getByRole("dialog", { name: "Choose your view" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign in with a code" })).toBeVisible();
    await page.goto("/about", { waitUntil: "load" });
    await expect(page.getByRole("dialog", { name: "Choose your view" })).toBeVisible();
  });

  test("cookie consent is resolved before the presentation choice", async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_GA_ID, "Requires the CI test GA ID baked into the build");
    await freshVisit(page, "/about", { consent: null });
    const cookie = page.getByRole("dialog", { name: "Cookie consent" });
    const chooser = page.getByRole("dialog", { name: "Choose your view" });
    await expect(cookie).toBeVisible();
    await expect(chooser).toHaveCount(0);
    await cookie.getByRole("button", { name: "DECLINE" }).click();
    await expect(cookie).toHaveCount(0);
    await expect(chooser).toBeVisible();
  });

  test("the chooser's rendered text meets the contrast gate", async ({ page }) => {
    await freshVisit(page);
    const chooser = page.getByRole("dialog", { name: "Choose your view" });
    await expect(chooser).toBeVisible();
    await expect(chooser).toHaveCSS("opacity", "1");
    const result = await page.evaluate(auditVisibleText, '[role="dialog"][aria-labelledby="presentation-title"]');
    expect(result.checked).toBeGreaterThan(0);
    expect(result.failures).toEqual([]);
  });
});
