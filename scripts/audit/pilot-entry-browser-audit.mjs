import { chromium } from "@playwright/test";

const baseUrl = process.env.SCOUTIT_AUDIT_BASE_URL || process.env.AUDIT_BASE_URL || process.env.SCOUTIT_E2E_BASE_URL || "http://127.0.0.1:3000";
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
];
const pricingPaths = [
  "/pricing",
  "/pricing/owner",
  "/pricing/seeker",
  "/pricing/broker",
  "/pricing/creator",
  "/pricing/bundles",
];

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, baseURL: baseUrl });
    const page = await context.newPage();

    const onboardingErrors = [];
    page.on("pageerror", (error) => onboardingErrors.push(error.message));
    const onboardingResponse = await page.goto(`${baseUrl}/onboarding`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.getByText("Invited human-testing pilot", { exact: true }).filter({ visible: true }).waitFor({ timeout: 30_000 });
    const onboardingBody = normalize(await page.locator("body").innerText());
    results.push({
      viewport: viewport.name,
      path: "/onboarding",
      status: onboardingResponse?.status() || 0,
      notice: onboardingBody.includes("testing account is temporary and will be deleted")
        && onboardingBody.includes("external email account remains yours")
        && onboardingBody.includes("payments, subscriptions, upgrades, and connect purchases are not active"),
      disabledPayments: true,
      waitlistControls: true,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1),
      errors: onboardingErrors.length,
    });

    for (const path of pricingPaths) {
      const pageErrors = [];
      const onError = (error) => pageErrors.push(error.message);
      page.on("pageerror", onError);
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.getByText("Invited human-testing pilot", { exact: true }).filter({ visible: true }).waitFor({ timeout: 30_000 });
      const paymentButtons = page.getByRole("button", { name: "Payments unavailable during pilot" });
      const waitlistButtons = page.getByRole("button", { name: "Join the waitlist" });
      const paymentCount = await paymentButtons.count();
      const waitlistCount = await waitlistButtons.count();
      const allPaymentsDisabled = paymentCount === 0 || await paymentButtons.evaluateAll((buttons) => buttons.every((button) => button.disabled));
      const allWaitlistsEnabled = waitlistCount === 0 || await waitlistButtons.evaluateAll((buttons) => buttons.every((button) => !button.disabled));
      const isHub = path === "/pricing";
      results.push({
        viewport: viewport.name,
        path,
        status: response?.status() || 0,
        notice: normalize(await page.locator("body").innerText()).includes("payments, upgrades, subscriptions, and connect purchases are not active"),
        disabledPayments: isHub ? paymentCount === 0 : paymentCount > 0 && paymentCount === waitlistCount && allPaymentsDisabled,
        waitlistControls: isHub ? true : waitlistCount > 0 && allWaitlistsEnabled,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1),
        errors: pageErrors.length,
      });
      page.off("pageerror", onError);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((result) => result.status !== 200 || !result.notice
  || !result.disabledPayments || !result.waitlistControls || result.overflow || result.errors);
console.table(results);
if (failed.length) {
  console.error(JSON.stringify({ failed }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Pilot entry/payment audit passed: ${results.length}/${results.length}`);
}
