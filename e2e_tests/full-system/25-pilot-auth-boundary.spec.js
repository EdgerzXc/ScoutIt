import { expect, test } from "@playwright/test";
import { gotoAndSettle, trackErrors } from "./helpers";

test.describe("controlled-pilot auth and display boundary", () => {
  test("tells a new email user about confirmation before account creation", async ({ page }) => {
    await gotoAndSettle(page, "/onboarding");
    await expect(page.getByText(
      "Authenticate first. New email accounts must be confirmed before private profile setup.",
      { exact: true },
    )).toBeVisible();
  });

  test("rejects an arbitrary cached browser identity at the dashboard", async ({ page }) => {
    const errors = trackErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem("scoutit_user", JSON.stringify({
        id: "forged-production-user",
        name: "Forged User",
        tags: ["owner"],
        primaryMode: "owner",
      }));
    });

    await gotoAndSettle(page, "/dashboard");
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: /Sign in or create an account/i })).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("offers only pilot-accepted display choices", async ({ page }) => {
    await gotoAndSettle(page, "/about");
    const displaySettingsButton = page.getByRole("button", {
      name: "Help & Display (Guide / Dark / High Contrast / Lite Mode)",
    }).first();

    if ((page.viewportSize()?.width || 0) > 600) {
      await expect.poll(async () => {
        if ((await displaySettingsButton.getAttribute("aria-expanded")) !== "true") {
          await displaySettingsButton.click();
        }
        return displaySettingsButton.getAttribute("aria-expanded");
      }, { timeout: 15000 }).toBe("true");
    } else {
      const menuButton = page.getByRole("button", { name: "Menu" });
      await expect.poll(async () => {
        if ((await menuButton.getAttribute("aria-expanded")) !== "true") await menuButton.click();
        return menuButton.getAttribute("aria-expanded");
      }, { timeout: 15000 }).toBe("true");
      await page.getByRole("button", { name: "Help & Display", exact: true }).click();
    }

    await expect(page.getByText("Dark Mode", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("High Contrast", { exact: true })).toBeVisible();
    await expect(page.getByText(/Lite Mode/).first()).toBeVisible();
    await expect(page.getByText("Light Mode", { exact: true })).toHaveCount(0);
  });
});
