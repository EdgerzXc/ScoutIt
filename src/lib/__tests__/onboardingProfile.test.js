import { describe, expect, it } from "vitest";
import {
  isOnboardingComplete,
  isPrcLicenseFormatValid,
  normalizeSignupPrimaryMode,
  onboardingActiveModes,
  onboardingPrimaryMode,
  sanitizeLocationFocus,
} from "@/lib/onboardingProfile";
import { CURRENT_TERMS_VERSION } from "@/lib/legalVersions";

const completeProfile = {
  primary_mode: "buyer",
  active_roles: ["seeker"],
  onboarding_completed_at: "2026-08-09T00:00:00.000Z",
  adult_eligibility_status: "declared_adult",
  created_at: "2026-08-09T00:00:00.000Z",
  terms_accepted_at: "2026-08-21T00:00:00.000Z",
  terms_version: CURRENT_TERMS_VERSION,
};

describe("onboarding profile contract", () => {
  it("treats buyer and seeker as one signup role", () => {
    expect(normalizeSignupPrimaryMode("buyer")).toBe("buyer");
    expect(normalizeSignupPrimaryMode("seeker")).toBe("buyer");
    expect(onboardingPrimaryMode({ role: "seeker" })).toBe("buyer");
    expect(onboardingActiveModes({ active_roles: ["seeker", "buyer", "owner"] }))
      .toEqual(["buyer", "owner"]);
  });

  it("does not accept provider or operator as initial signup roles", () => {
    expect(normalizeSignupPrimaryMode("provider")).toBe("");
    expect(normalizeSignupPrimaryMode("operator")).toBe("");
  });

  it("requires the explicit completion marker, a signup role, and adult eligibility", () => {
    expect(isOnboardingComplete(completeProfile)).toBe(true);
    expect(isOnboardingComplete({ ...completeProfile, onboarding_completed_at: null })).toBe(false);
    expect(isOnboardingComplete({ ...completeProfile, primary_mode: "provider" })).toBe(false);
    expect(isOnboardingComplete({ ...completeProfile, adult_eligibility_status: "underage" })).toBe(false);
  });

  it("re-opens onboarding when the published terms version has moved on", () => {
    expect(isOnboardingComplete({ ...completeProfile, terms_version: "pilot-2026-01-01" })).toBe(false);
  });

  it("does not read a missing acceptance as consent", () => {
    expect(isOnboardingComplete({ ...completeProfile, terms_version: null, terms_accepted_at: null })).toBe(false);
    expect(isOnboardingComplete({ ...completeProfile, terms_accepted_at: null })).toBe(false);
  });

  it("keeps the fixed-cutoff grandfathering behavior for migrated accounts", () => {
    expect(isOnboardingComplete({
      ...completeProfile,
      adult_eligibility_status: "unknown",
      created_at: "2026-08-05T23:59:59.000Z",
    })).toBe(true);
    expect(isOnboardingComplete({
      ...completeProfile,
      adult_eligibility_status: "unknown",
      created_at: "2026-08-06T00:00:00.000Z",
    })).toBe(false);
  });

  it("normalizes private location text and validates broker license format", () => {
    expect(sanitizeLocationFocus("  BGC,   Makati  ")).toBe("BGC, Makati");
    expect(sanitizeLocationFocus("   ")).toBeNull();
    expect(sanitizeLocationFocus("x".repeat(200))).toHaveLength(160);
    expect(isPrcLicenseFormatValid("PRC-REB-12345")).toBe(true);
    expect(isPrcLicenseFormatValid("PRC-1234")).toBe(false);
  });
});
