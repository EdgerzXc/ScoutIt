import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// A-138 — My Profile shows how others see you, read from the account. It used
// to copy the browser's `scoutit_user` into the account on every visit, which
// reverted Settings edits, blanked fields, and let an editable copy re-add a
// gated role. Each decision in the A-138 log is pinned here.

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const exists = (path) => existsSync(resolve(process.cwd(), path));
const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("A-138 · My Profile reads the account and writes nothing", () => {
  const page = strip(read("src/app/profile/page.js"));

  it("never reads or syncs the browser copy", () => {
    expect(page).not.toMatch(/localStorage|scoutit_user|upsertProfile/);
    expect(page).toContain("await getUser()");
    expect(page).toContain("loadOwnProfile(user.id)");
  });

  it("the browser-copy sync no longer exists anywhere", () => {
    const client = strip(read("src/lib/profileClient.js"));
    expect(client).not.toContain("upsertProfile");
    expect(client).not.toContain("PROFILE_SYNC_COLUMNS");
  });

  it("reads the account with named columns, never select *", () => {
    const client = strip(read("src/lib/profileClient.js"));
    const start = client.indexOf("export async function loadOwnProfile");
    const body = client.slice(start, client.indexOf("export async function", start + 10));
    expect(start).toBeGreaterThan(-1);
    expect(body).toContain(".select(OWN_PROFILE_COLUMNS)");
    expect(body).not.toMatch(/\.select\(\s*['"]\*['"]\s*\)/);
    // The list itself sits just above the function.
    const list = client.slice(client.indexOf("const OWN_PROFILE_COLUMNS"), start);
    expect(list).toContain("display_name");
    expect(list).not.toContain("*");
  });

  it("shows no private dashboard panels", () => {
    expect(page).not.toMatch(/SeekerPanel|OwnerPanel/);
    expect(exists("src/components/profile/panels/SeekerPanel.js")).toBe(false);
    expect(exists("src/components/profile/panels/OwnerPanel.js")).toBe(false);
  });

  it("links to the public page by id, and only when the profile is public", () => {
    expect(page).toContain("encodeURIComponent(profile.id)");
    expect(page).not.toContain("encodeURIComponent(profile.display_name");
    expect(page).toMatch(/profile\.is_profile_public === true \?/);
  });
});

describe("A-138 · the summary card says one thing once", () => {
  const card = strip(read("src/components/profile/ProfileBaseLayer.js"));

  it("carries no second Connects number", () => {
    expect(card).not.toContain("connects_balance");
  });

  it("has one link to Settings", () => {
    expect(card.split('href="/settings"').length - 1).toBe(1);
  });

  it("checks no column that does not exist", () => {
    expect(card).not.toContain("is_verified");
  });
});
