import { chromium } from "playwright";

const baseURL = process.env.SCOUTIT_AUDIT_URL || "http://localhost:3000";
const samples = Number(process.env.SCOUTIT_AUDIT_SAMPLES || 5);
const results = [];
const warmDisabled = process.env.SCOUTIT_WARM_DISABLED === "1";
const settleMs = Number(process.env.SCOUTIT_SETTLE_MS || 5000);

for (let index = 0; index < samples; index += 1) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const internalFailures = [];
  page.on("requestfailed", (request) => {
    if (request.url().startsWith(baseURL) && !request.url().includes("/_vercel/")) internalFailures.push(request.url());
  });
  if (warmDisabled) {
    await context.addInitScript(() => {
      sessionStorage.setItem("scoutit_public_warm_v1", JSON.stringify({
        version: 1, expiresAt: Date.now() + 60 * 60 * 1000,
      }));
    });
  }
  const startedAt = performance.now();
  await page.goto(`${baseURL}/descent`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(settleMs);
  const entry = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("largest-contentful-paint");
    return {
      responseEnd: navigation?.responseEnd ?? null,
      loadEventEnd: navigation?.loadEventEnd ?? null,
      lcp: paints.at(-1)?.startTime ?? null,
    };
  });
  const transitionStartedAt = performance.now();
  await page.locator('a[href="/about"]').filter({ visible: true }).first().click();
  await page.waitForURL("**/about", { waitUntil: "domcontentloaded" });
  await page.locator("main").first().waitFor({ state: "visible" });
  const transitionMs = performance.now() - transitionStartedAt;
  results.push({
    sample: index + 1,
    entry,
    transitionMs: Math.round(transitionMs),
    totalMs: Math.round(performance.now() - startedAt),
    internalFailedRequests: internalFailures,
  });
  await browser.close();
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

console.log(JSON.stringify({
  baseURL,
  warmDisabled,
  settleMs,
  totalInternalFailedRequests: results.reduce((sum, result) => sum + result.internalFailedRequests.length, 0),
  samples: results,
  medianTransitionMs: median(results.map((result) => result.transitionMs)),
  medianResponseEndMs: median(results.map((result) => result.entry.responseEnd)),
  medianLoadEventEndMs: median(results.map((result) => result.entry.loadEventEnd)),
  medianLcpMs: median(results.map((result) => result.entry.lcp)),
}, null, 2));
