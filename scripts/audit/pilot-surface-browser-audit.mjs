import { chromium } from "@playwright/test";

const baseUrl = process.env.SCOUTIT_AUDIT_BASE_URL || "http://127.0.0.1:3000";
const sampleSlugs = [
  "corner-unit-poblacion-strip",
  "cyber-sigma-tower-3",
  "one-ecom-center",
  "sea-breeze-loft-boracay-station-2",
  "the-foundry-warehouse-district-bgc",
  "the-meridian-hotel-cebu-it-park",
  "the-ridgeline-at-capitol-commons",
];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
];

const normalize = (value) => String(value || "")
  .replace(/\u00a0/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    for (const path of ["/property", "/discover", ...sampleSlugs.map((slug) => `/property/${slug}`)]) {
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.getByText(/sample data/i).filter({ visible: true }).first().waitFor({ state: "visible", timeout: 30_000 });
      const body = normalize(await page.locator("body").innerText());
      const badgeCount = await page.getByText(/sample data\s*[—-]\s*for human testing/i).filter({ visible: true }).count();
      const sampleLinkCount = path === "/property"
        ? await page.locator(sampleSlugs.map((slug) => `a[href="/property/${slug}"]`).join(",")).count()
        : 0;
      const discoverCardCount = path === "/discover"
        ? await page.locator(".spotlightCard").count()
        : 0;
      const isDetail = path.startsWith("/property/");
      const robots = await page.locator('meta[name="robots"]').getAttribute("content").catch(() => null);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

      results.push({
        viewport: viewport.name,
        path,
        status: response?.status() || 0,
        badges: badgeCount,
        sampleLinks: sampleLinkCount,
        discoverCards: discoverCardCount,
        noindex: !isDetail || normalize(robots).includes("noindex"),
        overflow,
        pageErrors,
        pilotDisclosure: path !== "/property" && path !== "/discover"
          ? body.includes("sample data — for human testing") || body.includes("sample data - for human testing")
          : path === "/discover"
            ? discoverCardCount > 0 && badgeCount >= discoverCardCount
            : sampleLinkCount > 0 && badgeCount >= sampleLinkCount,
      });
    }

    await page.goto(`${baseUrl}/about`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.getByText(/human-testing pilot/i).filter({ visible: true }).first().waitFor({ state: "visible", timeout: 30_000 });
    const about = normalize(await page.locator("body").innerText());
    results.push({
      viewport: viewport.name,
      path: "/about",
      status: 200,
      badges: 0,
      noindex: true,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1),
      pageErrors: [],
      pilotDisclosure: about.includes("human-testing pilot")
        && about.includes("payments are not active")
        && about.includes("no active payments"),
    });

    await context.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((result) => (
  result.status !== 200
  || result.badges < (result.path === "/property" ? result.sampleLinks : result.path === "/discover" ? result.discoverCards : result.path === "/about" ? 0 : 1)
  || !result.noindex
  || result.overflow
  || result.pageErrors.length
  || !result.pilotDisclosure
));

console.table(results.map(({ pageErrors, ...result }) => ({
  ...result,
  errors: pageErrors.length,
})));

if (failed.length) {
  console.error(JSON.stringify({ failed }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Pilot surface audit passed: ${results.length}/${results.length}`);
}
