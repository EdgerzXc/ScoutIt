import { expect, test } from "@playwright/test";

test("Settings displays the authenticator QR as an image and supports manual setup", async ({ page, baseURL }) => {
  test.skip(!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname), "Uses local mocked auth endpoints");

  const user = { id: "10000000-0000-4000-8000-000000000001", email: "settings@example.com", aud: "authenticated", app_metadata: {}, user_metadata: {}, factors: [] };
  const factorId = "10000000-0000-4000-8000-000000000002";
  const setupKey = "JBSWY3DPEHPK3PXP";
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const jwtHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const jwtPayload = Buffer.from(JSON.stringify({ sub: user.id, exp: expiry, aal: "aal1" })).toString("base64url");
  const session = { access_token: `${jwtHeader}.${jwtPayload}.fixture`, refresh_token: "fixture-refresh", expires_at: expiry, expires_in: 3600, token_type: "bearer", user };

  await page.addInitScript((value) => {
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (this === localStorage && /^sb-.+-auth-token$/.test(key)) {
        this.setItem(key, JSON.stringify(value));
        Storage.prototype.getItem = getItem;
      }
      return getItem.call(this, key);
    };
  }, session);
  const headers = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-expose-headers": "x-supabase-api-version",
    "x-supabase-api-version": "2024-01-01",
  };
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
