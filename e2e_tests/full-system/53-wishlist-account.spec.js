import { expect, test } from "@playwright/test";

const user = {
  id: "10000000-0000-4000-8000-000000000001",
  email: "board@example.com",
  aud: "authenticated",
  app_metadata: {},
  user_metadata: {},
  factors: [],
};
const propertyId = "10000000-0000-4000-8000-000000000002";
const signal = { id: "10000000-0000-4000-8000-000000000003", title: "Office search", city: "Taguig" };
const slug = "board-fixture-tower";
const title = "Board Fixture Tower";

test.beforeEach(({ baseURL }) => {
  test.skip(!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname), "Uses a local account fixture");
});

async function seedBoard(page, { spaces = [], signals = [] } = {}) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: expires, aal: "aal1" })}.fixture`;
  const session = {
    access_token: token,
    refresh_token: "fixture-refresh",
    expires_at: expires,
    expires_in: 3600,
    token_type: "bearer",
    user,
  };
  await page.addInitScript(({ value, deviceSpaces, deviceSignals }) => {
    const key = "board-fixture-seeded";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    localStorage.setItem("scoutit_reactions", JSON.stringify(deviceSpaces));
    localStorage.setItem("scoutit_saved_signals", JSON.stringify(deviceSignals));
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (storageKey) {
      if (this === localStorage && /^sb-.+-auth-token$/.test(storageKey)) {
        this.setItem(storageKey, JSON.stringify(value));
        Storage.prototype.getItem = getItem;
      }
      return getItem.call(this, storageKey);
    };
  }, { value: session, deviceSpaces: spaces, deviceSignals: signals });
  const authHeaders = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
  await page.route("**/auth/v1/**", (route) => route.request().method() === "OPTIONS"
    ? route.fulfill({ status: 204, headers: authHeaders })
    : route.fulfill({ headers: authHeaders, json: user }));
  await page.route("**/api/cms", (route) => route.fulfill({
    json: { properties: [{ id: "recFixtureTower", slug, title }] },
  }));
  return (request) => expect(request.headers().authorization).toBe(`Bearer ${token}`);
}

test("account space and signal removal preserve both copies when the server rejects deletion", async ({ page }) => {
  const checkToken = await seedBoard(page, {
    spaces: [{ property_id: "recFixtureTower", property_title: title, reaction_type: "Save", timestamp: 42 }],
    signals: [signal],
  });
  let savedSpace = true;
  let savedSignal = true;
  let spaceDeletes = 0;
  let signalDeletes = 0;
  await page.route("**/api/wishlist/saved", (route) => {
    const request = route.request();
    checkToken(request);
    if (request.method() === "DELETE") {
      expect(request.postDataJSON()).toEqual({ propertyId });
      if (++spaceDeletes === 1) return route.fulfill({ status: 503, json: { error: "Unavailable" } });
      savedSpace = false;
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({
      json: { items: savedSpace ? [{ account_property_id: propertyId, property_id: slug, reaction_type: "Save" }] : [] },
    });
  });
  await page.route("**/api/community/signals?saved=1", (route) => {
    checkToken(route.request());
    return route.fulfill({ json: { ok: true, signals: savedSignal ? [signal] : [] } });
  });
  await page.route(`**/api/community/signals/${signal.id}/save`, (route) => {
    expect(route.request().method()).toBe("DELETE");
    checkToken(route.request());
    if (++signalDeletes === 1) return route.fulfill({ status: 500, json: { ok: false } });
    savedSignal = false;
    return route.fulfill({ json: { ok: true, saved: false } });
  });

  await page.goto("/wishlist");
  const removeSpace = page.getByRole("button", { name: `Remove ${title} from board` });
  const removeSignal = page.getByRole("button", { name: `Remove signal ${signal.title} from board` });
  const failure = page.getByRole("status").filter({ hasText: "Couldn't remove this save. Try again." });
  await expect(page.getByRole("link", { name: title })).toHaveAttribute("href", `/property/${slug}`);
  await expect(removeSpace).toHaveCount(1);
  await removeSpace.click();
  await expect(failure).toBeVisible();
  await expect(removeSpace).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("scoutit_reactions")))).toHaveLength(1);
  await removeSpace.click();
  await expect(removeSpace).toHaveCount(0);
  await expect(failure).toHaveCount(0);

  await removeSignal.click();
  await expect(failure).toBeVisible();
  await expect(removeSignal).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("scoutit_saved_signals")))).toHaveLength(1);
  await removeSignal.click();
  await expect(removeSignal).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("tab", { name: "CLOUD ACCOUNT (0)" })).toBeVisible();
  await expect(removeSpace).toHaveCount(0);
  await expect(removeSignal).toHaveCount(0);
  expect([spaceDeletes, signalDeletes]).toEqual([2, 2]);
});

test("Board reports a partial sync and retains unconfirmed saves on this device", async ({ page }) => {
  const checkToken = await seedBoard(page, {
    spaces: [
      { property_id: "recFixtureTower", property_title: title, reaction_type: "Interested", timestamp: 42 },
      { property_id: "missing-fixture-space", property_title: "Unlinked space", reaction_type: "Save", timestamp: 42 },
    ],
    signals: [signal],
  });
  await page.route("**/api/wishlist/saved", (route) => route.fulfill({ json: { items: [] } }));
  await page.route("**/api/community/signals?saved=1", (route) => route.fulfill({ json: { ok: true, signals: [] } }));
  await page.route("**/api/wishlist/merge", (route) => {
    checkToken(route.request());
    expect(route.request().postDataJSON()).toEqual({
      items: [
        { property_id: slug, reaction_type: "Interested" },
        { property_id: "missing-fixture-space", reaction_type: "Save" },
      ],
    });
    return route.fulfill({
      json: { confirmedProperties: [{ inputId: slug, propertyId, slug }] },
    });
  });
  await page.route(`**/api/community/signals/${signal.id}/save`, (route) => {
    checkToken(route.request());
    return route.fulfill({ status: 429, json: { ok: false } });
  });

  await page.goto("/wishlist");
  await page.getByRole("button", { name: "Sync 3 to Account", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "1 item synced to your account. 2 still on this device." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sync 2 to Account", exact: true })).toBeEnabled();
  await page.getByRole("tab", { name: "CLOUD ACCOUNT (1)" }).click();
  await expect(page.getByRole("link", { name: title })).toHaveAttribute("href", `/property/${slug}`);
  await expect(page.getByText("Unlinked space")).toHaveCount(0);
  await page.getByRole("tab", { name: "THIS DEVICE (3)" }).click();
  await expect(page.getByText("Unlinked space")).toBeVisible();
  await expect(page.getByRole("button", { name: `Remove signal ${signal.title} from board` })).toBeVisible();
});
