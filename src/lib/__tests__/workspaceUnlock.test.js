import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  LENS_ROLES,
  SELF_SERVICE_ROLES,
  VERIFIED_ROLES,
  canAddRole,
  missingLenses,
} from "@/lib/workspaceUnlock";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

// ── A-137 — the switcher shows earned lenses only; broker / provider unlock
// through verification, not a one-click toggle ──────────────────────────────
//
// These pin the pure gate logic that Settings and the dashboard switcher share:
// which lenses exist, which are self-service, and what each verified lens
// demands before it may be added. A gate the UI evaluates is a suggestion
// (Standing Rule 5) — the PRC number itself is still recorded server-side via
// /api/broker/credential — but the UI must refuse the silent path, and that
// refusal is what these tests pin.

describe("A-137 workspace unlock gates", () => {
  it("names exactly the four self-unlockable lenses", () => {
    expect([...LENS_ROLES].sort()).toEqual(["broker", "buyer", "owner", "provider"]);
    expect([...SELF_SERVICE_ROLES].sort()).toEqual(["buyer", "owner"]);
    expect([...VERIFIED_ROLES].sort()).toEqual(["broker", "provider"]);
  });

  it("lets buyer and owner through with no evidence", () => {
    expect(canAddRole("buyer", {})).toEqual({ ok: true });
    expect(canAddRole("owner", {})).toEqual({ ok: true });
  });

  it("refuses broker without a valid-format PRC license number", () => {
    expect(canAddRole("broker", {}).ok).toBe(false);
    expect(canAddRole("broker", { prcLicense: "PRC-1234" }).ok).toBe(false);
    expect(canAddRole("broker", { prcLicense: "PRC-REB-12345" })).toEqual({ ok: true });
  });

  it("says which field is missing, so the refusal names the task", () => {
    expect(canAddRole("broker", {}).reason).toMatch(/PRC/i);
    expect(canAddRole("provider", {}).reason).toMatch(/service/i);
  });

  it("refuses provider without a services line", () => {
    expect(canAddRole("provider", {}).ok).toBe(false);
    expect(canAddRole("provider", { services: "   " }).ok).toBe(false);
    expect(canAddRole("provider", { services: "Drone photography" })).toEqual({ ok: true });
  });

  it("refuses a role outside the lens set rather than passing it through", () => {
    expect(canAddRole("admin", {}).ok).toBe(false);
    expect(canAddRole("staff", {}).ok).toBe(false);
  });

  it("reports which lenses an account has not earned yet", () => {
    expect(missingLenses(["buyer", "owner"])).toEqual(["broker", "provider"]);
    expect(missingLenses(["buyer", "owner", "broker", "provider"])).toEqual([]);
    expect(missingLenses([])).toEqual(["buyer", "owner", "broker", "provider"]);
  });

  it("ignores non-lens tags when computing what is missing", () => {
    expect(missingLenses(["buyer", "mc_staff", "operator"])).toEqual([
      "owner",
      "broker",
      "provider",
    ]);
  });

  it("counts a legacy seeker tag as the buyer lens", () => {
    expect(missingLenses(["seeker", "owner"])).toEqual(["broker", "provider"]);
  });
});

describe("A-137 · the screens stay wired to the gate module", () => {
  const settings = strip(read("src/app/settings/page.js"));
  const dashboard = strip(read("src/app/dashboard/page.js"));

  it("Settings refuses a gated add through canAddRole, not a local copy", () => {
    expect(settings).toContain('from "@/lib/workspaceUnlock"');
    expect(settings).toContain("canAddRole(role, evidence)");
    expect(settings).toContain("initialTags");
  });

  it("Settings states the broker claim through the credential route, never a direct write", () => {
    expect(settings).toContain('fetch("/api/broker/credential"');
    expect(settings).not.toMatch(/\.from\(\s*["']user_profiles["']\s*\)[\s\S]{0,400}prc_license/);
  });

  it("Settings no longer invites one-click self-unlock of every lens", () => {
    expect(settings).not.toContain("Each tag unlocks a dedicated workspace");
    expect(settings).toContain("Need another lens?");
  });

  it("the dashboard switcher renders earned tags plus one quiet unlock door", () => {
    expect(dashboard).toContain("missingLenses(user.tags)");
    expect(dashboard).toContain("Unlock more workspaces");
    expect(dashboard).toContain("/settings#account");
  });
});
