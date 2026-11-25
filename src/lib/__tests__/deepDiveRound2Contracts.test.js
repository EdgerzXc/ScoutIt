import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("A-350 round 2 — deep-dive regression contracts", () => {
  it("via GET never fabricates a promoter persona from the raw slug", () => {
    const src = read("src/app/api/property/[id]/via/route.js");
    expect(src).not.toMatch(/activePromoterSlug\.replace\(/);
    expect(src).toContain("is_profile_public === true");
  });

  it("public-roles validates userId as a UUID and rate limits", () => {
    const src = read("src/app/api/profile/public-roles/route.js");
    expect(src).toContain("UUID_RE.test(userId)");
    expect(src).toContain("createRateLimiter");
  });

  it("broker roster validates the property slug format", () => {
    const src = read("src/app/api/property/[id]/brokers/route.js");
    expect(src).toContain("Invalid property slug");
  });

  it("invite route escapes LIKE wildcards and parses Bearer by regex", () => {
    const src = read("src/app/api/dashboard/invite/route.js");
    expect(src).toContain("replace(/[\\\\%_]/g");
    expect(src).not.toContain('replace("Bearer "');
  });

  it("onboarding parses Bearer by regex", () => {
    const src = read("src/app/api/auth/complete-onboarding/route.js");
    expect(src).not.toContain('replace("Bearer "');
  });

  it("badge claim fallback rolls back an over-cap insert", () => {
    const src = read("src/app/api/badges/claim/route.js");
    expect(src).toContain("afterCount");
    expect(src).toContain(".delete()");
  });

  it("Mission Control askBrain requires MFA step-up and bounds the question", () => {
    const src = read("mission-control/src/app/dashboard/brain/actions.js");
    expect(src).toContain("staff.mfaRequired");
    expect(src).toContain("question.length > 2000");
  });
});
