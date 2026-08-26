import { chromium } from "playwright";

const baseUrl = process.env.SCOUTIT_AUDIT_BASE_URL || process.env.AUDIT_BASE_URL || process.env.SCOUTIT_E2E_BASE_URL || "http://127.0.0.1:3000";
const routes = [
  ["/property/one-ecom-center?chapter=units", ["Property level", "Available Spaces", "Space 2"]],
  ["/property/the-ridgeline-at-capitol-commons", ["Property level", "Units"]],
  ["/property/the-meridian-hotel-cebu-it-park", ["Property level", "Rooms & Facilities"]],
  ["/property/corner-unit-poblacion-strip", ["Property level", "Areas"]],
  ["/property/the-foundry-warehouse-district-bgc?chapter=units", ["Property level", "Zones", "Zone 04"]],
  ["/property/the-ridgeline-at-capitol-commons/unit/sample-unit-id", ["Child-space level", "Unit dossier", "Premium Penthouse"]],
];
const viewports = [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1280, height: 900 }];

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, baseURL: baseUrl });
    for (const [route, expected] of routes) {
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.locator(".hero-title:visible, .mobile-hero-title:visible").first().waitFor({ state: "visible", timeout: 30_000 });
      await page.waitForTimeout(500);
      const body = (await page.locator("body").textContent()) || "";
      const normalizedBody = body.toLowerCase();
      const missing = expected.filter((label) => !normalizedBody.includes(label.toLowerCase()));
      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      results.push({ viewport: viewport.name, route, status: response?.status(), missing, pageErrors,
        horizontalOverflow: layout.scrollWidth > layout.clientWidth + 1 });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = results.filter((result) => result.status !== 200 || result.missing.length || result.pageErrors.length || result.horizontalOverflow);
console.log(JSON.stringify({ passed: results.length - failures.length, total: results.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
