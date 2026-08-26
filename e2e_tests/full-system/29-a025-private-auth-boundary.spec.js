import { expect, test } from "@playwright/test";
import { gotoAndSettle, signInAsMock, MOCK_OWNER_EMPTY, trackErrors } from "./helpers";

const PRIVATE_DATA_REQUEST = /(?:\/api\/(?:deals|viewing-appointments|calendar|availability|notifications|admin)(?:[/?]|$)|\/rest\/v1\/(?:properties|saved_intel)(?:[/?]|$))/;

const PRIVATE_ROUTES = [
  "/dashboard",
  "/dashboard/inbox",
  "/dashboard/crm",
  "/dashboard/calendar",
  "/dashboard/inventory/example-property",
  "/admin",
];

test.describe("A-025 verified private-workspace boundary", () => {
  for (const route of PRIVATE_ROUTES) {
    test(`keeps anonymous ${route} away from private data`, async ({ page }) => {
      const privateRequests = [];
      page.on("request", (request) => {
        if (PRIVATE_DATA_REQUEST.test(request.url())) privateRequests.push(request.url());
      });

      await gotoAndSettle(page, route);

      await expect(page).toHaveURL(/\/onboarding\?next=/, { timeout: 20_000 });
      await expect(page.getByRole("heading", { name: /Sign in or create an account/i })).toBeVisible();
      expect(new URL(page.url()).searchParams.get("next")).toBe(route);
      expect(privateRequests, `anonymous private requests from ${route}`).toEqual([]);
    });
  }

  test("retains a verified localhost fixture's inbox deep link", async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MOCK_OWNER_EMPTY);
    await page.route("**/api/deals**", (route) => route.fulfill({ status: 200, json: { deals: [] } }));
    await page.route("**/api/notifications**", (route) => route.fulfill({ status: 200, json: { notifications: [] } }));

    await gotoAndSettle(page, "/dashboard/inbox");

    await expect(page).toHaveURL(/\/dashboard\/inbox/);
    await expect(page.getByRole("heading", { name: /Leads & Inbox/i })).toBeVisible({ timeout: 20_000 });
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("keeps email and code sign-in usable when Google Identity cannot load", async ({ page }) => {
    await page.route("https://accounts.google.com/**", (route) => route.abort("failed"));
    await gotoAndSettle(page, "/onboarding");

    await expect(page.getByText("Google sign-in is temporarily unavailable. Use email or a secure code instead.", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Email address")).toBeEnabled();
    await page.getByRole("button", { name: "Sign in with a code" }).click();
    await expect(page.getByRole("button", { name: /Send verification code/i })).toBeVisible();
  });

  test("does not request a second missing grain asset", async ({ page }) => {
    const grainRequests = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/grain.png") grainRequests.push(request.url());
    });

    await gotoAndSettle(page, "/onboarding");
    expect(grainRequests).toEqual([]);
  });

  test("keeps first-visit help from covering the sign-in controls", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("scoutit_help_seen_v1"));
    await gotoAndSettle(page, "/onboarding");

    // The floating help panel must not claim the first visit on the auth route.
    await expect(page.getByRole("button", { name: "Close Help & Display" })).toHaveCount(0);

    const codeButton = page.getByRole("button", { name: "Sign in with a code" });
    await expect(codeButton).toBeVisible();
    // Playwright's actionability check fails if another element covers it.
    await codeButton.click({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /Send verification code/i })).toBeVisible();
  });
});
