import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("Metropolis Layer 3 Off-Market Vault Contract (A-271)", () => {
  const page = read("src/app/layer/metropolis/page.js");

  it("adds Off-Market tab with lock icon and category selection", () => {
    expect(page).toContain('setCategory("Off-Market")');
    expect(page).toContain("Off-Market");
    expect(page).toContain("offmarket-nav-btn");
  });

  it("fetches /api/off-market with session authorization token", () => {
    expect(page).toContain('fetch("/api/off-market"');
    expect(page).toContain("supabase.auth.getSession()");
    expect(page).toContain("Authorization");
  });

  it("supports State 1: Universe Seeker viewing confidential whisper properties", () => {
    expect(page).toContain("offMarketData.isUniverseSeeker");
    expect(page).toContain("Confidential · Universe");
    expect(page).toContain("Whisper");
  });

  it("supports State 2: Owner viewing their own private cloud assets", () => {
    expect(page).toContain("offMarketData.properties.some((p) => p.isOwner)");
    expect(page).toContain("Private Cloud Storage (Owner View)");
    expect(page).toContain("Owned · Cloud Vault");
  });

  it("supports State 3: Locked Universe Seeker Exclusive Gate Card for standard seekers and logged out users", () => {
    expect(page).toContain("metro-vault-gate");
    expect(page).toContain("Universe Seeker Exclusive · ₱2,499/mo");
    expect(page).toContain("The Confidential Off-Market Vault");
    expect(page).toContain("Unlock Universe Access →");
  });
});
