import { test, expect } from "@playwright/test";

const ownSignal = {
  id: "live-own-1",
  title: "Looking for a workshop near BGC",
  summary: "Space for a small fabrication team.",
  signalType: "LOOKING_FOR",
  category: "Commercial",
  spaceType: "Commercial",
  location: "BGC · Taguig",
  district: "BGC",
  city: "Taguig",
  coords: null,
  freshness: "fresh",
  relevantCount: 0,
  savedCount: 0,
  specs: [],
  requirements: {},
  matchingSpaces: [],
  actionType: "CONNECT",
  glyphType: "volume",
  glyphData: {},
  author: { scoutId: "SCOUT-0042", mode: "anonymous", trustTier: "SCOUTIT MEMBER" },
  isSample: false,
  liveCommunity: true,
  isMine: true,
};

test.describe("A-145 community author closes a live signal", () => {
  for (const width of [1280, 390]) {
    test(`${width}px closure waits for confirmation and server success`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      await page.addInitScript(() => {
        const tokenPayload = JSON.stringify({
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          token_type: "bearer",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: { id: "owner-account", aud: "authenticated", role: "authenticated" },
        });
        localStorage.setItem("sb-placeholder-auth-token", tokenPayload);
        localStorage.setItem("sb-yyixsuaimdzyiocswcgc-auth-token", tokenPayload);
      });
      const otherSignal = {
        ...ownSignal,
        id: "live-other-1",
        title: "Another member needs retail space",
        author: { ...ownSignal.author, scoutId: "SCOUT-0088" },
        isMine: false,
      };
      let closeRequests = 0;
      let closeAuthorization = null;
      await page.route(/\/api\/community\/signals\?limit=60$/, (route) =>
        route.fulfill({ json: { ok: true, signals: [ownSignal, otherSignal] } })
      );
      await page.route("**/api/community/signals/live-own-1/close", (route) => {
        closeRequests += 1;
        closeAuthorization = route.request().headers().authorization;
        return route.fulfill(closeRequests === 1
          ? { status: 503, json: { ok: false, error: "Temporary failure" } }
          : { json: { ok: true, status: "closed" } });
      });

      await page.goto("/stratosphere?view=radar", { waitUntil: "load" });
      const ownCard = page.locator(".sdc-card").filter({ hasText: ownSignal.title });
      const otherCard = page.locator(".sdc-card").filter({ hasText: otherSignal.title });
      await expect(ownCard).toBeVisible();
      await expect(otherCard).toBeVisible();

      // The dossier has a dark default and re-inks with the opt-in lens.
      const darkCard = await ownCard.evaluate((card) => getComputedStyle(card).backgroundColor);
      const darkType = await ownCard.locator(".sdc-type-pill").evaluate((pill) => getComputedStyle(pill).color);
      expect(darkCard).toContain("18, 18, 18");
      expect(darkType).toBe("rgb(232, 174, 60)");
      if (width > 640) {
        const darkGlyph = await ownCard.locator(".sg-glyph").evaluate((glyph) => getComputedStyle(glyph).backgroundColor);
        expect(darkGlyph).toContain("18, 18, 18");
      }
      if (process.env.SCOUTIT_CAPTURE_STRATOSPHERE === "1") {
        await ownCard.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath("dark-card.png") });
      }
      await page.evaluate(() => document.body.classList.add("light-mode"));
      await expect.poll(() => ownCard.evaluate((card) => getComputedStyle(card).backgroundColor))
        .toContain("242, 242, 244");
      await expect.poll(() => ownCard.locator(".sdc-type-pill").evaluate((pill) => getComputedStyle(pill).color))
        .toBe("rgb(58, 58, 65)");
      if (width > 640) {
        await expect.poll(() => ownCard.locator(".sg-glyph").evaluate((glyph) => getComputedStyle(glyph).backgroundColor))
          .toContain("242, 242, 244");
      }
      if (process.env.SCOUTIT_CAPTURE_STRATOSPHERE === "1") {
        await page.screenshot({ path: testInfo.outputPath("lens-card.png") });
      }
      await page.evaluate(() => document.body.classList.remove("light-mode"));

      await otherCard.getByRole("button", { name: "Expand dossier details" }).click();
      await expect(otherCard.getByRole("button", { name: "CLOSE MY SIGNAL" })).toHaveCount(0);

      await ownCard.getByRole("button", { name: "Expand dossier details" }).click();
      await ownCard.getByRole("button", { name: "CLOSE MY SIGNAL" }).click();
      await expect(ownCard.getByText("Existing conversations remain open.", { exact: false })).toBeVisible();
      expect(closeRequests).toBe(0);

      await ownCard.getByRole("button", { name: "CLOSE SIGNAL", exact: true }).click();
      await expect(ownCard.getByRole("alert")).toContainText("Could not confirm closure");
      await expect(ownCard).toBeVisible();
      expect(closeRequests).toBe(1);

      await ownCard.getByRole("button", { name: "CLOSE SIGNAL", exact: true }).click();
      await expect(ownCard).toHaveCount(0);
      await expect(otherCard).toBeVisible();
      expect(closeRequests).toBe(2);
      expect(closeAuthorization).toBe("Bearer test-access-token");
    });
  }
});
