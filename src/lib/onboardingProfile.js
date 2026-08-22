import { profileIsEligible } from "@/lib/adultEligibility";
import { hasCurrentTermsAcceptance } from "@/lib/legalAcceptance";
import { normalizeDashboardMode, normalizeDashboardModes } from "@/lib/dashboardModes";

export const SIGNUP_PRIMARY_MODES = Object.freeze(["buyer", "owner", "broker"]);

export function normalizeSignupPrimaryMode(value) {
  const mode = normalizeDashboardMode(value);
  return SIGNUP_PRIMARY_MODES.includes(mode) ? mode : "";
}

export function onboardingPrimaryMode(profile) {
  return normalizeSignupPrimaryMode(profile?.primary_mode || profile?.role);
}

export function onboardingActiveModes(profile) {
  const primaryMode = onboardingPrimaryMode(profile);
  return normalizeDashboardModes(profile?.active_roles, primaryMode)
    .filter((mode) => SIGNUP_PRIMARY_MODES.includes(mode));
}

export function isOnboardingComplete(profile) {
  if (!profile?.onboarding_completed_at) return false;
  if (!normalizeSignupPrimaryMode(profile.primary_mode)) return false;
  // A published version change re-opens onboarding rather than letting the
  // account keep browsing under terms it never saw.
  if (!hasCurrentTermsAcceptance(profile)) return false;
  return profileIsEligible(profile);
}

export function sanitizeLocationFocus(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, 160);
  return normalized || null;
}

export function isPrcLicenseFormatValid(value) {
  return typeof value === "string" && /\d{5,}/.test(value.trim());
}
