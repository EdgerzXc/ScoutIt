import { expect, test } from "@playwright/test";

const factorId = "10000000-0000-4000-8000-000000000002";
const user = { id: "10000000-0000-4000-8000-000000000001", email: "settings@example.com", aud: "authenticated", app_metadata: {}, user_metadata: {}, factors: [] };
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-expose-headers": "x-supabase-api-version",
  "x-supabase-api-version": "2024-01-01",
};

function authSession(account, aal) {
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const jwtHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const jwtPayload = Buffer.from(JSON.stringify({ sub: account.id, exp: expiry, aal })).toString("base64url");
  return { access_token: `${jwtHeader}.${jwtPayload}.fixture`, refresh_token: "fixture-refresh", expires_at: expiry, expires_in: 3600, token_type: "bearer", user: account };
}

function seedSession(page, session) {
  return page.addInitScript((value) => {
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (this === localStorage && /^sb-.+-auth-token$/.test(key)) {
        this.setItem(key, JSON.stringify(value));
        Storage.prototype.getItem = getItem;
      }
      return getItem.call(this, key);
    };
  }, session);
}

test.beforeEach(({ baseURL }) => {
  test.skip(!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname), "Uses local mocked auth endpoints");
});

test("Settings displays the authenticator QR as an image and supports manual setup", async ({ page }) => {
  const setupKey = "JBSWY3DPEHPK3PXP";
  await seedSession(page, authSession(user, "aal1"));
  await page.route("**/rest/v1/**", (route) => route.request().method() === "OPTIONS"
    ? route.fulfill({ status: 204, headers })
    : route.fulfill({ headers, json: { display_name: "Test Account", active_roles: ["owner"], role: "owner" } }));
  await page.route("**/auth/v1/**", (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/user")) return route.fulfill({ headers, json: user });
    if (path.endsWith("/factors") && request.method() === "POST") {
      expect(request.postDataJSON()).toMatchObject({ factor_type: "totp" });
      return route.fulfill({ headers, json: {
        id: factorId, type: "totp", totp: {
          qr_code: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M0 0h24v24H0z"/></svg>',
          secret: setupKey,
        },
      } });
    }
    return route.fulfill({ status: 404, headers, json: { code: "fixture_route_not_found" } });
  });

  await page.goto("/settings#security");
  const enable = page.getByRole("button", { name: "Enable Two-Factor Authentication" });
  await enable.click();
  const image = page.getByRole("img", { name: "Authenticator setup QR code" });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBe(24);
  await expect(image).toHaveAttribute("src", /^data:image\/svg\+xml;charset=utf-8,/);
  await page.getByText("Enter a setup key instead", { exact: true }).click();
  await expect(page.getByText(setupKey, { exact: true })).toBeVisible();
  await page.getByLabel("Authenticator verification code").fill("abc123");
  await expect(page.getByLabel("Authenticator verification code")).toHaveValue("123");
  await page.getByRole("button", { name: "Cancel setup" }).click();
  await expect(enable).toBeVisible();
  await expect(page.getByText(setupKey, { exact: true })).toHaveCount(0);
  await expect(image).toHaveCount(0);
});

test("Onboarding loads the profile only after verifying a registered authenticator", async ({ page }) => {
  const account = { ...user, factors: [{ id: factorId, factor_type: "totp", status: "verified", friendly_name: "My authenticator" }] };
  const initialSession = authSession(account, "aal1");
  const verifiedSession = authSession(account, "aal2");
  const profileTokens = [];
  const submittedCodes = [];
  await seedSession(page, initialSession);

  await page.route("**/rest/v1/user_profiles**", (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    const token = request.headers().authorization;
    expect(token).toBe(`Bearer ${verifiedSession.access_token}`);
    if (new URL(request.url()).searchParams.get("select") === "*") profileTokens.push(token);
    return route.fulfill({ headers, json: { display_name: "Test Account", primary_mode: "buyer" } });
  });
  await page.route("**/auth/v1/**", (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/user")) return route.fulfill({ headers, json: account });
    if (path.endsWith(`/factors/${factorId}/challenge`)) {
      expect(request.headers().authorization).toBe(`Bearer ${initialSession.access_token}`);
      return route.fulfill({ headers, json: { id: "challenge-fixture", type: "totp", expires_at: initialSession.expires_at } });
    }
    if (path.endsWith(`/factors/${factorId}/verify`)) {
      const { code, challenge_id: challengeId } = request.postDataJSON();
      expect(challengeId).toBe("challenge-fixture");
      submittedCodes.push(code);
      return code === "123456"
        ? route.fulfill({ headers, json: verifiedSession })
        : route.fulfill({ status: 422, headers, json: { code: "mfa_verification_failed", message: "Invalid code" } });
    }
    return route.fulfill({ status: 404, headers, json: { code: "fixture_route_not_found" } });
  });

  await page.goto("/onboarding");
  const heading = page.getByRole("heading", { name: "Verify your sign-in" });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(page.getByLabel("Email address")).toHaveCount(0);
  expect(profileTokens).toEqual([]);
  const code = page.getByLabel("Authenticator code");
  const verify = page.getByRole("button", { name: "Verify code" });
  await expect(verify).toBeDisabled();
  await code.fill("000000");
  await code.press("Enter");
  await expect(page.getByText("Could not verify that code. Try the current code from your app.")).toBeVisible();
  await expect(code).toHaveValue("");
  await code.fill("123456");
  await verify.click();
  await expect(page.getByLabel("Full name")).toHaveValue("Test Account");
  expect(submittedCodes).toEqual(["000000", "123456"]);
  expect(profileTokens).toEqual([`Bearer ${verifiedSession.access_token}`]);
});

test("A lower-assurance session keeps the inbox link for authenticator verification", async ({ page }) => {
  const account = { ...user, factors: [{ id: factorId, factor_type: "totp", status: "verified" }] };
  const requestedPath = "/dashboard/inbox?deal=fixture#thread";
  const privateReads = [];
  await seedSession(page, authSession(account, "aal1"));
  await page.route("**/auth/v1/**", (route) => route.request().method() === "OPTIONS"
    ? route.fulfill({ status: 204, headers })
    : route.fulfill({ headers, json: account }));
  await page.route(/(?:\/rest\/v1\/user_profiles|\/api\/deals)(?:\?|\/|$)/, (route) => {
    privateReads.push(route.request().url());
    return route.fulfill({ status: 403, headers });
  });

  await page.goto(requestedPath);
  await expect(page.getByRole("heading", { name: "Verify your sign-in" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("next")).toBe(requestedPath);
  expect(privateReads).toEqual([]);
});
