import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// A-135 — one account page: the plan comes from the account, privacy has one
// home, and nothing on screen claims a price that does not exist yet.

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("A-135 · your plan comes from the account", () => {
  const panel = strip(read("src/components/profile/PlanPanel.js"));

  it("reads the plan route, never the browser's stored tier", () => {
    expect(panel).toContain('fetch("/api/user/plan"');
    expect(panel).not.toMatch(/localStorage|getCurrentTier|scoutit_user/);
  });

  it("shows the plan name only — no price (owner, 2026-09-11)", () => {
    expect(panel).not.toMatch(/₱|PHP|\/mo|per month|price/i);
    expect(panel).toContain('href="/pricing"');
  });

  it("offers no payment action while payments are off", () => {
    expect(panel).not.toMatch(/Upgrade|Subscribe|Change plan|Cancel/);
    expect(panel).toMatch(/Payments aren&apos;t switched on during the pilot/);
  });

  it("the route never uses the free-mode access tier as the plan", () => {
    const route = strip(read("src/app/api/user/plan/route.js"));
    expect(route).not.toContain("resolveServerTier");
    expect(route).toContain('.select("subscription_tier")');
  });

  it("Settings renders the plan between Privacy and Security", () => {
    const settings = read("src/app/settings/page.js");
    expect(settings).toContain('import PlanPanel from "@/components/profile/PlanPanel"');
    const privacy = settings.indexOf('id="privacy"');
    const plan = settings.indexOf('id="plan"');
    const security = settings.indexOf('id="security"');
    expect(plan).toBeGreaterThan(privacy);
    expect(security).toBeGreaterThan(plan);
    expect(settings.indexOf("<PlanPanel", plan)).toBeGreaterThan(plan);
  });
});

describe("A-135 · privacy has one home", () => {
  it("My Profile links to Settings instead of carrying a second privacy control", () => {
    const profile = strip(read("src/app/profile/page.js"));
    expect(profile).not.toContain("PrivacyControls");
    expect(profile).toContain('href="/settings#privacy"');
    expect(existsSync(resolve(process.cwd(), "src/components/profile/PrivacyControls.js"))).toBe(false);
  });

  it("the Settings panel sets role visibility through the privacy route only", () => {
    const shield = strip(read("src/components/profile/PrivacyShieldPanel.js"));
    expect(shield).toContain('update("publicRoles"');
    expect(shield).toContain("PUBLIC_ROLE_CHOICES");
    expect(shield).not.toMatch(/\.from\(\s*["']privacy_settings["']\s*\)/);
    const settings = read("src/app/settings/page.js");
    expect(settings).toContain("activeRoles={tags}");
  });

  it("no browser code writes privacy_settings directly any more", () => {
    const client = strip(read("src/lib/profileClient.js"));
    expect(client).not.toContain("export async function updatePrivacySettings");
  });
});
