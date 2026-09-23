import path from "node:path";
import { test, expect } from "@playwright/test";
import { gotoAndSettle, trackErrors } from "./helpers";

const axePath = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");
const VIEWPORTS = [
  { name: "compact phone", width: 320, height: 720 },
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
];

for (const route of ["/layer/core", "/about-you"]) {
  for (const viewport of VIEWPORTS) {
    test(`${route} remains readable at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors = trackErrors(page);
      const response = await gotoAndSettle(page, route);

      expect(response.status()).toBeLessThan(400);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("button", { name: /seeker/i }).first()).toBeVisible();
      const geometry = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
      expect(errors).toEqual([]);
    });
  }
}

test("Core previews a role and hands it to About You without granting permissions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoAndSettle(page, "/layer/core");

  const owner = page.getByRole("button", { name: /owner owner or developer/i });
  await owner.click();
  await expect(owner).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".core-role-preview")).toContainText("durable public record");
  await expect(page.getByRole("link", { name: /see your complete path/i })).toHaveAttribute("href", "/about-you#owner");
  await expect(page.getByText(/permissions come from verified server records/i).first()).toBeVisible();
});

test("About You provides stable role links and accessible diagram-list parity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoAndSettle(page, "/about-you#broker");

  await expect(page.getByRole("button", { name: /broker licensed broker/i })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".about-role-intro")).toContainText("visible and accountable");
  await expect(page.locator(".core-schematic button")).toHaveCount(4);
  for (const label of ["Identify", "Verify scope", "Represent", "Respond"]) {
    await expect(page.getByRole("button", { name: new RegExp(label, "i") })).toBeVisible();
  }

  const represent = page.getByRole("button", { name: /03 represent/i });
  await represent.focus();
  await page.keyboard.press("Enter");
  await expect(represent).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".step-detail")).toContainText("owner–broker authority workflow");
  await expect(page.getByRole("heading", { name: "Represent", exact: true })).toBeFocused();
});

test("browser-local fake identity cannot personalize Core or About You", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("scoutit_user", JSON.stringify({ name: "Forged Owner", primaryMode: "owner" }));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });

  await gotoAndSettle(page, "/layer/core");
  await expect(page.getByText("Forged Owner")).toHaveCount(0);
  await expect(page.getByText(/no account connected/i)).toBeVisible();

  await gotoAndSettle(page, "/about-you");
  await expect(page.getByText("Forged Owner")).toHaveCount(0);
  await expect(page.getByText(/explore first. connect when needed/i)).toBeVisible();
});

test("Core and About You honor reduced motion and transparency", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "prefers-reduced-transparency", value: "reduce" },
    ],
  });

  await gotoAndSettle(page, "/layer/core");
  await expect(page.locator(".core-gateway-bg canvas")).toHaveCount(0);
  await expect(page.locator(".core-role-shell")).toHaveCSS("backdrop-filter", "none");

  await gotoAndSettle(page, "/about-you");
  await expect(page.locator(".about-core-bg")).toHaveCSS("display", "none");
  await expect(page.locator(".identity-card")).toHaveCSS("backdrop-filter", "none");
});

test("Core and About You stay inside their pilot performance budgets", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [route, ceiling] of [["/layer/core", 350], ["/about-you", 400]]) {
    await gotoAndSettle(page, route);
    const budget = await page.evaluate(() => ({
      domNodes: document.querySelectorAll("*").length,
      heavyweightMedia: document.querySelectorAll("img, video, canvas, iframe").length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    expect(budget.domNodes).toBeLessThanOrEqual(ceiling);
    expect(budget.heavyweightMedia).toBe(0);
    expect(budget.overflow).toBeLessThanOrEqual(1);
  }
});

test("Core and About You have no serious semantic or dark-contrast blocker", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("scoutit_display_mode", "dark");
    localStorage.setItem("scoutit-display-mode", "dark");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const route of ["/layer/core", "/about-you#owner"]) {
    await gotoAndSettle(page, route);
    await expect(page.getByRole("main")).toHaveCount(1);
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "rule", values: ["color-contrast", "heading-order", "landmark-one-main", "landmark-main-is-top-level", "aria-command-name", "button-name"] },
      });
      return result.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) }));
    });
    expect(violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  }
});
