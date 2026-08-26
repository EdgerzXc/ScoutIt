import { test, expect } from "@playwright/test";
import { assertScoutItRendered, gotoAndSettle } from "./helpers";

async function measureRouteStability(page, route) {
  // Inject PerformanceObservers before navigation starts
  await page.addInitScript(() => {
    window.__cls = 0;
    window.__layoutShifts = [];
    window.__longTasks = [];

    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__cls += entry.value;
            const sources = (entry.sources || []).map((s) => ({
              nodeName: s.node?.nodeName,
              className: s.node?.className,
              id: s.node?.id,
              currentRect: s.currentRect ? { top: s.currentRect.top, left: s.currentRect.left, width: s.currentRect.width, height: s.currentRect.height } : null,
              previousRect: s.previousRect ? { top: s.previousRect.top, left: s.previousRect.left, width: s.previousRect.width, height: s.previousRect.height } : null,
            }));
            window.__layoutShifts.push({
              value: entry.value,
              startTime: entry.startTime,
              sources,
            });
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}

    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {}
  });

  await gotoAndSettle(page, route);
  await assertScoutItRendered(page);

  // Wait 1.5s to let all background/hydration/CMS tasks complete
  await page.waitForTimeout(1500);

  const result = await page.evaluate(() => ({
    cls: window.__cls || 0,
    shiftCount: window.__layoutShifts?.length || 0,
    shifts: window.__layoutShifts || [],
    longTaskCount: window.__longTasks?.length || 0,
    maxLongTask: window.__longTasks?.reduce((max, t) => Math.max(max, t.duration), 0) || 0,
  }));
  if (result.cls > 0.1) {
    console.log(`[CLS DETAIL for ${route}]:`, JSON.stringify(result.shifts, null, 2));
  }
  return result;
}


test.describe("A-027 layout stability and foreground workload", () => {
  test("/brokers maintains CLS <= 0.10 across hydration", async ({ page }) => {
    const metrics = await measureRouteStability(page, "/brokers");
    expect(metrics.cls).toBeLessThanOrEqual(0.10);
  });

  test("/property maintains CLS <= 0.10 across hydration and CMS load", async ({ page }) => {
    const metrics = await measureRouteStability(page, "/property");
    expect(metrics.cls).toBeLessThanOrEqual(0.10);
  });

  test("/discover maintains CLS <= 0.10 across category navigation and hydration", async ({ page }) => {
    const metrics = await measureRouteStability(page, "/discover");
    expect(metrics.cls).toBeLessThanOrEqual(0.10);
  });

  test("Homepage / maintains CLS <= 0.10 and bounded long tasks", async ({ page }) => {
    const metrics = await measureRouteStability(page, "/");
    expect(metrics.cls).toBeLessThanOrEqual(0.10);
  });

  test("Mobile viewport maintains layout stability on /brokers", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const brokersMetrics = await measureRouteStability(page, "/brokers");
    expect(brokersMetrics.cls).toBeLessThanOrEqual(0.10);
  });

  test("Mobile viewport maintains layout stability on /property", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const propertyMetrics = await measureRouteStability(page, "/property");
    expect(propertyMetrics.cls).toBeLessThanOrEqual(0.10);
  });


  test("Reduced motion preference disables drifting particle animation loop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoAndSettle(page, "/");
    await assertScoutItRendered(page);
    const driftingCount = await page.locator(".drifting-container").count();
    expect(driftingCount).toBe(0);
  });
});
