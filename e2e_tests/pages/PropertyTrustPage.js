import { expect } from "@playwright/test";

export class PropertyTrustPage {
  constructor(page) {
    this.page = page;
  }

  async open(slug) {
    const response = await this.page.goto(`/property/${slug}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(this.page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20000 });
  }

  async expectClassifiedSpatialMedia() {
    const vaultTab = this.page.getByRole("tab", { name: "The Vault" }).first();
    await expect(vaultTab).toBeVisible({ timeout: 20000 });
    await vaultTab.click();
    await expect.poll(async () => {
      const statusCount = await this.page.getByRole("status").filter({ hasText: /spatial media|checking spatial/i }).count();
      const mediaCount = await this.page.locator(".vault-item").count();
      return statusCount + mediaCount;
    }, { timeout: 20000 }).toBeGreaterThan(0);

    const sources = await this.page.locator(".vault-item iframe").evaluateAll((frames) =>
      frames.map((frame) => frame.getAttribute("src") || ""),
    );
    for (const source of sources) {
      expect(source).not.toContain("images.unsplash.com");
      expect(source).not.toContain("YWayaXpaJyH");
      expect(source).not.toContain("b86b7928-f130-40a5-8cac-8095f30eed54");
    }
  }

  async openRoster(slug) {
    const response = await this.page.goto(`/property/${slug}/brokers`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(this.page.getByRole("heading", { name: "Authorized Broker Roster" })).toBeVisible({ timeout: 20000 });
  }

  async expectHonestRosterState() {
    await expect.poll(async () => {
      const honestStatus = await this.page.getByRole("status").filter({
        hasText: /No active broker representation|Representation details unavailable/,
      }).count();
      const roster = await this.page.getByText("AUTHORIZED ROSTER", { exact: true }).count();
      return honestStatus + roster;
    }, { timeout: 20000 }).toBeGreaterThan(0);
  }
}
