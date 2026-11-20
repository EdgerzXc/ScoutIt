import { expect, test } from "@playwright/test";

const dealId = "10000000-0000-4000-8000-000000000061";
const dealTitle = "Support Fixture Tower";
const message = "An attachment did not upload.";
const user = {
  id: "10000000-0000-4000-8000-000000000062",
  email: "support-fixture@example.test",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  factors: [],
};

test("staff support preserves a failed draft and confirms only a saved private ticket", async ({ page, baseURL }) => {
  test.skip(!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname), "Uses a local account fixture");
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encode = (part) => Buffer.from(JSON.stringify(part)).toString("base64url");
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: expires, aal: "aal1" })}.fixture`;
  await page.addInitScript((session) => {
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (this === localStorage && /^sb-.+-auth-token$/.test(key)) {
        this.setItem(key, JSON.stringify(session));
        Storage.prototype.getItem = getItem;
      }
      return getItem.call(this, key);
    };
  }, { access_token: token, refresh_token: "fixture-refresh", expires_at: expires, expires_in: 3600, token_type: "bearer", user });

  const authHeaders = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
  await page.route("**/auth/v1/**", (route) => route.request().method() === "OPTIONS"
    ? route.fulfill({ status: 204, headers: authHeaders })
    : route.fulfill({ headers: authHeaders, json: user }));
  await page.route("**/rest/v1/**", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: authHeaders });
    const profile = {
      id: user.id, full_name: "Fixture Participant", primary_mode: "buyer", active_roles: ["buyer"],
      onboarding_completed_at: "2026-11-20T00:00:00Z", adult_eligibility_status: "declared_adult",
      terms_accepted_at: "2026-11-20T00:00:00Z", terms_version: "pilot-2026-11-09",
    };
    return route.fulfill({ headers: authHeaders, json: url.pathname.endsWith("/user_profiles") ? profile : [] });
  });
  await page.route("**/api/deals", (route) => route.fulfill({
    json: { deals: [{ id: dealId, propertyTitle: dealTitle, status: "accepted", myRole: "buyer", otherParty: "Fixture Broker" }] },
  }));
  let roomWrites = 0;
  await page.route(`**/api/deals/${dealId}/messages**`, (route) => {
    if (route.request().method() === "POST") roomWrites += 1;
    return route.fulfill({ json: { messages: [] } });
  });
  await page.route("**/api/viewing-appointments**", (route) => route.fulfill({ json: { appointments: [] } }));
  await page.route("**/api/cms**", (route) => route.fulfill({ json: { properties: [], brokers: [], intel: [] } }));
  const submissions = [];
  await page.route(`**/api/deals/${dealId}/support`, (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`);
    const body = route.request().postDataJSON();
    submissions.push(body);
    if (submissions.length === 1) return route.fulfill({ status: 503, json: { error: "Please try again." } });
    return route.fulfill({ status: 200, json: { ticketId: body.requestId } });
  });

  await page.goto("/dashboard/inbox");
  await page.getByRole("heading", { name: dealTitle }).click();
  const trigger = page.getByRole("button", { name: "Staff support" });
  await expect(trigger).toBeVisible({ timeout: 25_000 });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Staff support" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeInViewport();
  await dialog.getByLabel("Category").selectOption("glitch");
  await dialog.getByLabel("Describe the issue").fill(message);
  await dialog.getByRole("button", { name: "Send request" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Please try again.");
  await expect(dialog.getByLabel("Describe the issue")).toHaveValue(message);
  await expect(dialog.getByText("Support request saved")).toHaveCount(0);

  await dialog.getByRole("button", { name: "Send request" }).click();
  await expect(dialog.getByRole("status")).toContainText("Support request saved");
  await expect(dialog.getByRole("status")).toContainText(submissions[0].requestId);
  expect(submissions).toEqual([
    { requestId: submissions[0].requestId, category: "glitch", message },
    { requestId: submissions[0].requestId, category: "glitch", message },
  ]);
  expect(roomWrites).toBe(0);
  await expect(dialog.getByRole("button", { name: "Done" })).toBeFocused();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
