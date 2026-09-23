import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A-146 batch 5: deep links, null guards, copy honesty, motion leftovers.
// Source-pinned (JSX-in-.js can't render under this config) — same convention
// as a096InterfaceContracts.

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("A-146 — deep links survive the auth bounce", () => {
  it("login stub preserves ?next= into onboarding", () => {
    const src = read("src/app/login/page.js");
    expect(src).toContain("searchParams");
    expect(src).toContain("normalizePrivateReturnPath");
    expect(src).toContain("/onboarding?next=");
  });

  it("settings bounces carry next=/settings", () => {
    const src = read("src/app/settings/page.js");
    expect(src).toContain('router.replace("/onboarding?next=%2Fsettings")');
  });

  it("settings hydrates normalized roles with a deterministic primary", () => {
    const src = read("src/app/settings/page.js");
    expect(src).toContain("normalizeDashboardModes(profile.active_roles");
    expect(src).toContain("pickPrimaryRole(nextTags,");
  });
});

describe("A-146 — unknown measurements say so", () => {
  it("owner cards state the absence instead of rendering null%", () => {
    const src = read("src/components/dashboard/cards/OwnerListingCard.js");
    // The ring (and its title) renders only inside the finite guard; the
    // else branch states the absence.
    expect(src).toContain("Number.isFinite(completeness) ? (");
    expect(src).toContain("COMPLETENESS_UNKNOWN_LABEL");
  });
});

describe("A-146 — every surface offers a door", () => {
  it("locked badge cards link out to contact", () => {
    const src = read("src/app/badges/page.js");
    expect(src).toContain('href="/contact"');
  });

  it("off-market disabled contact names its condition", () => {
    const src = read("src/app/off-market/page.js");
    expect(src).toContain("Quietly open to offers");
  });

  it("the resend button explains its own disabled state", () => {
    const src = read("src/app/onboarding/page.js");
    expect(src).toContain("Waiting on the bot check above");
  });
});

describe("A-146 — stale claims are corrected, dead UI removed", () => {
  it("UnitInquiryModal no longer calls its sibling a mock", () => {
    expect(read("src/components/property/UnitInquiryModal.js")).not.toContain("UI mock");
  });

  it("the unit page carries no unreachable share modal", () => {
    const src = read("src/components/property/UnitMasterPage.js");
    expect(src).not.toContain("ShareModal");
    expect(src).not.toContain("buildShareText");
    expect(src).not.toContain("shareTextOpen");
  });
});

describe("A-146 — motion honors Lite everywhere", () => {
  it("ScoutEarth gates drift, descent and autorotate on Lite", () => {
    const src = read("src/components/orbit/ScoutEarth.js");
    const gates = (src.match(/isLiteMode\(\)/g) || []).length;
    expect(gates).toBeGreaterThanOrEqual(3);
  });

  it("the comparison modal defers to the OS setting and Lite", () => {
    const src = read("src/components/property/ComparisonMatrix.js");
    expect(src).toContain("MotionConfig");
    expect(src).toContain('isLiteMode() ? "always" : "user"');
  });

  it("the guide scrolls use the shared helper, not a lite-only ternary", () => {
    const src = read("src/components/ui/FloatingToolbox.js");
    expect(src).toContain("motionSafeScrollBehavior()");
    expect(src).not.toContain('behavior: lite ? "auto" : "smooth"');
  });
});
