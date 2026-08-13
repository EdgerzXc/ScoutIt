import { test, expect } from "@playwright/test";
import { gotoAndSettle, trackErrors } from "./helpers";

const VIEWPORTS = [
  { name: "compact phone", width: 320, height: 720 },
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
];

for (const viewport of VIEWPORTS) {
  test(`Manifesto remains readable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = trackErrors(page);
    const response = await gotoAndSettle(page, "/about");

    expect(response.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name: /understand space/i })).toBeVisible();
    await expect(page.getByText(/payments are not active/i).first()).toBeVisible();

    const chapterLink = page.locator(".chapter-rail a").first();
    await expect(chapterLink).toHaveCSS("min-height", "52px");
    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect((await chapterLink.boundingBox())?.height || 0).toBeGreaterThanOrEqual(44);
    expect(errors).toEqual([]);
  });
}

test("Manifesto diagrams explain state changes without changing routes", async ({ page }) => {
  await gotoAndSettle(page, "/about");

  await page.getByRole("button", { name: /05 mantle system disclosure/i }).click();
  await expect(page.locator("#layer-detail")).toContainText("architecture, data philosophy");
  await expect(page.getByRole("button", { name: /05 mantle system disclosure/i })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /publish bridge/i }).click();
  await expect(page.locator(".workflow-detail")).toContainText("Airtable computes the first public slug");

  await page.getByRole("button", { name: "Owner", exact: true }).click();
  await expect(page.locator(".role-detail")).toContainText("Publish with authority");
  await expect(page.getByRole("button", { name: "Owner", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("Manifesto deep links expose a keyboard focus target", async ({ page }) => {
  await gotoAndSettle(page, "/about#trust");
  await expect(page.locator("#trust")).toBeFocused();
  await expect(page.getByRole("heading", { name: /trust comes from boundaries/i })).toBeVisible();
});

test("Manifesto honors reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoAndSettle(page, "/about");

  const motion = await page.locator(".manifesto-primary").first().evaluate((node) => {
    const style = getComputedStyle(node);
    return { transitionDuration: style.transitionDuration, transform: style.transform };
  });
  expect(motion.transitionDuration).toBe("0s");
  expect(motion.transform).toBe("none");
});


test("Manifesto keeps its complete reading path without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto("http://localhost:3000/about", { waitUntil: "domcontentloaded" });

  expect(response.status()).toBeLessThan(400);
  for (const heading of [
    /a listing tells you/i,
    /one platform/i,
    /one record/i,
    /trust comes from boundaries/i,
    /system changes/i,
    /what is true/i,
  ]) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /take the full descent/i })).toBeVisible();
  await context.close();
});

test("Manifesto controls work from the keyboard", async ({ page }) => {
  await gotoAndSettle(page, "/about#model");
  const mantle = page.getByRole("button", { name: /05 mantle system disclosure/i });
  await mantle.focus();
  await page.keyboard.press("Enter");
  await expect(mantle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#layer-detail")).toContainText("architecture, data philosophy");

  const disclosure = page.getByText("Owner authority", { exact: true });
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure.locator(".." )).toHaveAttribute("open", "");
});

test("Manifesto uses a solid fallback when reduced transparency is requested", async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
  });
  await gotoAndSettle(page, "/about");

  await expect(page.locator(".chapter-rail")).toHaveCSS("backdrop-filter", "none");
  await expect(page.locator(".status-card")).toHaveCSS("backdrop-filter", "none");
});

test("Manifesto stays inside its pilot performance budget", async ({ page }) => {
  await gotoAndSettle(page, "/about");
  const budget = await page.evaluate(() => ({
    domNodes: document.querySelectorAll("*").length,
    heavyweightMedia: document.querySelectorAll("img, video, canvas, iframe").length,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  expect(budget.domNodes).toBeLessThanOrEqual(400);
  expect(budget.heavyweightMedia).toBe(0);
  expect(budget.horizontalOverflow).toBeLessThanOrEqual(1);
});
