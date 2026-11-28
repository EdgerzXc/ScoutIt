import { test, expect } from "@playwright/test";

test.describe("Mobile Stratosphere", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "Mobile Chrome", "Mobile-only workspace layout");
    await page.addInitScript(() => {
      const session = JSON.stringify({
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        token_type: "bearer",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: "scout-account", aud: "authenticated", role: "authenticated" },
      });
      localStorage.setItem("sb-placeholder-auth-token", session);
      localStorage.setItem("sb-yyixsuaimdzyiocswcgc-auth-token", session);
    });
    await page.route("**/api/community/me", (route) => route.fulfill({
      json: { ok: true, role: "buyer", primaryMode: "buyer", activeRoles: ["buyer", "owner", "photographer"] },
    }));
    await page.route("**/api/community/signals?*", (route) => route.fulfill({ json: { ok: true, signals: [] } }));
  });

  test("320px separates map and list and keeps filters and browser history connected", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/stratosphere");
    const switcher = page.getByRole("group", { name: "Signal view" });
    const list = switcher.getByRole("button", { name: /^list$/i });
    const map = switcher.getByRole("button", { name: /^map$/i });
    const search = page.getByRole("textbox", { name: "Search signals" });
    const market = page.getByRole("group", { name: "Market intent" });
    const filters = page.getByRole("button", { name: /^Filters/ });
    const dialog = page.getByRole("dialog", { name: "Signal filters" });

    await expect(list).toHaveAttribute("aria-pressed", "true");
    await expect(market.getByRole("button", { name: /^spaces/i })).toHaveAttribute("aria-pressed", "true");
    await expect(market.getByRole("button")).toHaveCount(4);
    for (const tab of await market.getByRole("button").all()) {
      const box = await tab.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(await tab.evaluate((button) => button.scrollWidth)).toBeLessThanOrEqual(Math.ceil(box.width));
    }
    await expect.poll(async () => (await page.locator(".st-dossier-scroll .sdc-title").first().boundingBox())?.y)
      .toBeLessThan(616);
    if (process.env.SCOUTIT_CAPTURE_STRATOSPHERE === "1") {
      await page.screenshot({ path: testInfo.outputPath("list-320.png") });
    }

    await filters.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Role lens" })).toHaveValue("buyer");
    await dialog.getByRole("combobox", { name: "Role lens" }).selectOption("owner");
    await dialog.getByRole("combobox", { name: "District", exact: true }).selectOption("BGC");
    await dialog.getByRole("combobox", { name: "Updates", exact: true }).selectOption("all-trends");
    await dialog.getByRole("combobox", { name: "Space type", exact: true }).selectOption("Office");
    if (process.env.SCOUTIT_CAPTURE_STRATOSPHERE === "1") {
      await page.screenshot({ path: testInfo.outputPath("filters-320.png") });
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(filters).toBeFocused();
    await expect(market.getByRole("button", { name: /^demand/i })).toHaveAttribute("aria-pressed", "true");
    await search.pressSequentially("office");
    await expect(search).toHaveValue("office");

    await map.click();
    await expect(page).toHaveURL(/mode=map/);
    const mapPane = page.getByRole("region", { name: /Metro Manila Spatial Signal Radar/ });
    await expect(mapPane).toBeVisible();
    await expect(market).toBeHidden();
    await expect(search).toHaveValue("office");
    await filters.click();
    await expect(dialog.getByRole("combobox", { name: "District", exact: true })).toHaveValue("BGC");
    await expect(dialog.getByRole("combobox", { name: "Updates", exact: true })).toHaveValue("all-trends");
    await expect(dialog.getByRole("combobox", { name: "Space type", exact: true })).toHaveValue("Office");
    await expect(dialog.getByRole("combobox", { name: "Market intent" })).toHaveValue("demand");
    await dialog.getByRole("button", { name: /^done$/i }).click();
    const legend = mapPane.getByRole("button", { name: /expand.*color signal map/i });
    await legend.scrollIntoViewIfNeeded();
    const mapBox = await mapPane.boundingBox();
    const legendBox = await legend.boundingBox();
    expect(legendBox.y + legendBox.height).toBeLessThanOrEqual(mapBox.y + mapBox.height);
    await legend.click();
    await expect(mapPane.getByRole("complementary", { name: /radar color signal map/i })).toBeVisible();
    await mapPane.getByRole("button", { name: /collapse color signal map/i }).click();
    if (process.env.SCOUTIT_CAPTURE_STRATOSPHERE === "1") {
      await page.screenshot({ path: testInfo.outputPath("map-320.png") });
    }

    await expect(page.getByRole("link", { name: "Browse matching signals" })).toHaveAttribute("href", /\/stratosphere\/signals\?.*place=BGC/);
    await list.click();
    await expect(list).toHaveAttribute("aria-pressed", "true");
    await page.goBack();
    await expect(map).toHaveAttribute("aria-pressed", "true");
    await page.goForward();
    await expect(list).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => switcher.evaluate((element) => getComputedStyle(element, "::after").transitionDuration)).toBe("0.18s");
    await page.evaluate(() => document.documentElement.classList.add("lite-mode"));
    await expect.poll(() => switcher.evaluate((element) => getComputedStyle(element, "::after").transitionDuration)).toBe("0s");
    await page.evaluate(() => document.documentElement.classList.remove("lite-mode"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => switcher.evaluate((element) => getComputedStyle(element, "::after").transitionDuration)).toBe("0s");
    await filters.click();
    await dialog.getByRole("button", { name: /^reset$/i }).click();
    await dialog.getByRole("button", { name: /^done$/i }).click();
    await expect(search).toHaveValue("");
    await expect(market.getByRole("button", { name: /^all/i })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  });

  test("390px retains the article return, Mine, Saved, and Post paths", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/stratosphere");
    const views = page.getByRole("group", { name: "Explore Stratosphere" });

    await views.getByRole("button", { name: "Articles" }).click();
    const tracks = page.getByRole("tablist", { name: "Filter intelligence track" });
    await expect(tracks.getByRole("tab")).toHaveCount(3);
    await tracks.getByRole("tab", { name: /^Buildings/ }).click();
    const result = page.locator(".sw-article").first();
    const title = await result.getByRole("heading").innerText();
    const search = page.getByRole("textbox", { name: "Search articles" });
    await search.fill(title.split(" ")[0]);
    await result.getByRole("link", { name: "Read article" }).click();
    await page.getByRole("link", { name: /Back to Stratosphere/ }).click();
    await expect(views.getByRole("button", { name: "Articles" })).toHaveAttribute("aria-pressed", "true");
    await expect(tracks.getByRole("tab", { name: /^Buildings/ })).toHaveAttribute("aria-selected", "true");
    await expect(search).toHaveValue(title.split(" ")[0]);
    await expect(page.locator(".sw-article.is-returned")).toBeVisible();

    await views.getByRole("button", { name: "Mine" }).click();
    await expect(page.getByRole("region", { name: "My Signals" })).toBeVisible();
    await views.getByRole("button", { name: "Saved" }).click();
    await expect(page.getByRole("region", { name: "Saved Signals" })).toBeVisible();
    await page.goBack();
    await expect(views.getByRole("button", { name: "Mine" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Post a signal", exact: true }).first().click();
    const composer = page.getByRole("dialog", { name: "Post a community signal" });
    await expect(composer).toBeVisible();
    await composer.getByRole("button", { name: "Close composer" }).click();
    await expect(composer).toBeHidden();

    await page.goto("/stratosphere?view=radar&mode=list&role=all&stage=all-buildings");
    const signal = page.locator(".st-dossier-scroll .sdc-card").filter({ has: page.getByRole("button", { name: "READ UPDATE" }) }).first();
    const signalTitle = await signal.getByRole("heading").innerText();
    const signalSearch = page.getByRole("textbox", { name: "Search signals" });
    await signalSearch.fill(signalTitle.split(" ")[0]);
    await signal.getByRole("button", { name: "READ UPDATE" }).click();
    await page.getByRole("link", { name: /Back to Stratosphere/ }).click();
    await expect(views.getByRole("button", { name: "Signals" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /^list$/i })).toHaveAttribute("aria-pressed", "true");
    await expect(signalSearch).toHaveValue(signalTitle.split(" ")[0]);
    await expect(page.locator(".st-dossier-scroll .sdc-card.active").getByRole("heading")).toHaveText(signalTitle);
  });
});
