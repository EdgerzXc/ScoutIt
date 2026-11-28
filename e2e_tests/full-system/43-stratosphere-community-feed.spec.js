import { test, expect } from "@playwright/test";

const firstId = "3d38ad9a-d5eb-4b59-befc-56f19787359c";
const secondId = "91878f88-dc91-406b-a2cc-5f22c7a13136";
const photoId = "0dc651aa-a862-4bd0-a26c-bd5b271feb95";
const videoId = "f1375c54-426a-4f15-834e-f668bc334c20";

const post = {
  id: secondId,
  title: "Evening tour of an office in BGC",
  summary: "A walkthrough of the flexible fit-out on the north side of the district.",
  location: "BGC",
  district: "BGC",
  city: "Taguig",
  signalType: "COMMERCIAL_PROMOTION",
  spaceType: "Office",
  timing: "Friday, 5 PM",
  specs: ["Flexible fit-out"],
  author: { scoutId: "SCOUT-0134", mode: "anonymous", trustTier: "ScoutIt member" },
  liveCommunity: true,
  terminalState: "live",
  actionType: "CONNECT",
  relevantCount: 0,
  freshness: "fresh",
  createdAt: "2026-11-24T08:00:00Z",
  lastConfirmedAt: "2026-11-24T08:00:00Z",
  media: [{ id: photoId, kind: "photo", alt: "Office fit-out" }, { id: videoId, kind: "video" }],
};

test("Stratosphere opens both feeds and finds filtered posts beyond the first server page", async ({ page }, testInfo) => {
  let requestedSecondPage = false;
  let videoRequests = 0;
  await page.addInitScript(() => {
    const session = JSON.stringify({
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: "community-reader", aud: "authenticated", role: "authenticated" },
    });
    localStorage.setItem("sb-placeholder-auth-token", session);
    localStorage.setItem("sb-yyixsuaimdzyiocswcgc-auth-token", session);
  });
  await page.route("**/api/community/signals?*", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get("page") !== "1") return route.fulfill({ json: { ok: true, signals: [] } });
    if (!params.has("cursor")) return route.fulfill({ json: { ok: true, signals: [{ ...post, id: firstId, district: "Makati CBD", title: "Makati fit-out", media: [] }], nextCursor: firstId } });
    requestedSecondPage = params.get("cursor") === firstId;
    return route.fulfill({ json: { ok: true, signals: [post], nextCursor: null } });
  });
  await page.route(`**/api/community/signals/${secondId}/media?asset=${photoId}`, (route) => route.fulfill({ status: 302, headers: { location: "/assets/stratosphere_city.webp" } }));
  await page.route(`**/api/community/signals/${secondId}/media?asset=${videoId}`, (route) => {
    videoRequests += 1;
    return route.fulfill({ json: { error: "Unavailable" }, status: 503 });
  });
  await page.route(`**/api/community/signals/${secondId}/relevant`, (route) => route.fulfill({ json: { ok: true, relevantCount: 1 } }));
  await page.route(`**/api/community/signals/${secondId}/save`, (route) => route.fulfill({ json: { ok: true } }));

  await page.goto("/layer/stratosphere");
  const layerFeeds = page.getByRole("navigation", { name: "Explore Stratosphere feeds" });
  await expect(layerFeeds.getByRole("link", { name: "All signals" })).toBeInViewport();
  await expect(layerFeeds.getByRole("link", { name: "Community posts" })).toBeInViewport();

  await page.goto("/stratosphere?role=all&place=BGC&mode=list");
  const entries = page.getByRole("navigation", { name: "Browse the full feeds" });
  await expect(entries.getByRole("link", { name: "All signals" })).toHaveAttribute("href", /\/stratosphere\/signals\?.*place=BGC/);
  await entries.getByRole("link", { name: "Community posts" }).click();
  await expect(page).toHaveURL(/\/stratosphere\/signals\?.*source=community/);
  await expect(page.getByRole("heading", { name: "Community", exact: true })).toBeVisible();
  const card = page.getByRole("article", { name: /Evening tour of an office/ });
  await expect(card).toBeVisible();
  expect(requestedSecondPage).toBe(true);
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(card.getByText("PROMOTION", { exact: true })).toBeVisible();
  await expect(card.getByText("SCOUT-0134")).toBeVisible();
  await expect(card.getByText(/Friday, 5 PM/)).toBeVisible();
  await expect(card.getByRole("img", { name: "Office fit-out" })).toBeVisible();
  await expect(card.getByRole("button", { name: /relevant/i })).toBeVisible();
  await expect(card.getByRole("button", { name: "Save signal" })).toBeVisible();
  await expect(card.getByRole("button", { name: /^connect$/i })).toBeVisible();
  expect(videoRequests).toBe(0);

  if (process.env.SCOUTIT_CAPTURE_STRATOSPHERE === "1") {
    await page.screenshot({ path: testInfo.outputPath("community-feed.png") });
    await card.screenshot({ path: testInfo.outputPath("community-post.png") });
  }
  await card.getByRole("button", { name: /relevant/i }).click();
  await expect(card.getByRole("button", { name: /1.*relevant/i })).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("button", { name: "Save signal" }).click();
  await expect(card.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("button", { name: /^connect$/i }).click();
  const connect = page.getByRole("dialog", { name: "Connect to Signal" });
  await expect(connect).toBeVisible();
  await connect.getByRole("button", { name: "Close modal" }).click();
  await expect(connect).toBeHidden();
  await card.getByRole("button", { name: "Video", exact: true }).click();
  expect(videoRequests).toBe(0);
  await card.getByRole("button", { name: "Play promotion" }).click();
  await expect(card.getByRole("alert")).toContainText("Video is unavailable");
  expect(videoRequests).toBe(1);

  await page.getByRole("navigation", { name: "Signal feeds" }).getByRole("link", { name: "All signals" }).click();
  await expect(page.getByRole("heading", { name: "Signals", exact: true })).toBeVisible();
  await expect(card).toBeVisible();
  await page.getByRole("link", { name: "Radar", exact: true }).click();
  await expect(page).toHaveURL(/\/stratosphere\?.*place=BGC.*mode=map/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => window.innerWidth));
});
