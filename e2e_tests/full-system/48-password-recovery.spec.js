import { expect, test } from "@playwright/test";

test("opens password recovery from account sign-in", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Email a reset code" })).toBeDisabled();
  const email = page.getByLabel("Email address");
  await email.fill("recovery@example.com");
  await page.getByRole("button", { name: "I have a code" }).click();
  await expect(page.getByLabel("Reset code")).toBeVisible();
  await expect(email).toHaveValue("recovery@example.com");
  await page.getByRole("button", { name: "Request a new code" }).click();
  await expect(page.getByRole("button", { name: "Email a reset code" })).toBeDisabled();
  await expect(email).toHaveValue("recovery@example.com");
});

test("accepts a valid recovery code after an expired attempt without persisting a session", async ({ page }) => {
  const email = "recovery@example.com";
  const password = "A fresh password 38!";
  const user = { id: "00000000-0000-4000-8000-000000000001", email, aud: "authenticated" };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
  const requests = [];
  let verifyAttempts = 0;

  await page.route("**/auth/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
      "access-control-allow-methods": "POST, PUT, OPTIONS",
      "access-control-expose-headers": "x-supabase-api-version",
      "x-supabase-api-version": "2024-01-01",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });

    if (path.endsWith("/verify") && method === "POST") {
      requests.push({ path, body: request.postDataJSON() });
      verifyAttempts += 1;
      if (verifyAttempts === 1) {
        return route.fulfill({ status: 403, headers, json: { code: "otp_expired", message: "expired" } });
      }
      return route.fulfill({ headers, json: {
        access_token: `${header}.${claims}.fixture`,
        refresh_token: "fixture-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        user,
      } });
    }
    if (path.endsWith("/user") && method === "PUT") {
      requests.push({ path, body: request.postDataJSON() });
      return route.fulfill({ headers, json: user });
    }
    if (path.endsWith("/logout") && method === "POST") {
      requests.push({ path });
      return route.fulfill({ status: 204, headers });
    }
    return route.fulfill({ status: 401, headers, json: { code: "session_not_found" } });
  });

  const { promise: scriptsPending, resolve: releaseScripts } = Promise.withResolvers();
  await page.route("**/_next/static/**/*.js*", async (route) => {
    await scriptsPending;
    await route.continue();
  });
  try {
    await page.goto("/reset-password?step=code", { waitUntil: "commit" });
    await page.getByLabel("Email address").fill(email);
  } finally {
    releaseScripts();
  }
  await page.waitForLoadState("load");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByLabel("Reset code").fill("123456");
  await page.getByLabel("New password", { exact: true }).fill(password);
  await page.getByLabel("Confirm new password").fill("A different password 39!");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("The passwords do not match.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Confirm new password")).toBeFocused();
  await expect(page.getByLabel("Email address")).toHaveValue(email);
  expect(requests).toEqual([]);
  await page.getByLabel("Confirm new password").fill(password);
  const nativeFieldNames = await page.getByLabel("Reset code").evaluate((input) => [...new FormData(input.form).keys()]);
  expect(nativeFieldNames).toEqual([]);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("This code is invalid or has expired. Request a new code and try again.", { exact: true })).toBeVisible();

  await page.getByLabel("Reset code").fill("654321");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();
  expect(requests).toEqual([
    { path: "/auth/v1/verify", body: expect.objectContaining({ email, token: "123456", type: "recovery" }) },
    { path: "/auth/v1/verify", body: expect.objectContaining({ email, token: "654321", type: "recovery" }) },
    { path: "/auth/v1/user", body: expect.objectContaining({ password }) },
    { path: "/auth/v1/logout" },
  ]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.includes("auth-token") || key.includes("password-recovery")))).toEqual([]);
});
