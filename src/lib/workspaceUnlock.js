import { isPrcLicenseFormatValid } from "@/lib/onboardingProfile";
import { normalizeDashboardMode } from "@/lib/dashboardModes";

// ── A-137 — workspace lens acquisition gates ────────────────────────────────
//
// The dashboard switcher renders earned lenses only (`user.tags`). These pure
// helpers pin the other half: which lenses exist, which two are self-service,
// and what evidence the other two demand before they may be ADDED. Removing a
// role is always allowed; only adding broker / provider is gated.
//
// A gate the browser evaluates is a suggestion (Standing Rule 5), not a
// boundary. The PRC number itself is recorded server-side through
// /api/broker/credential (service-role write, verification reset forced
// there); this module only decides whether the UI may take the silent path.
// The database remains the authority on what the account holds.

export const LENS_ROLES = Object.freeze(["buyer", "owner", "broker", "provider"]);

// Buyer / owner stay one click — they are the lenses every account starts
// near, and neither carries a third-party credential claim.
export const SELF_SERVICE_ROLES = Object.freeze(["buyer", "owner"]);

// Broker states a PRC license (a claim, not a verification — public proof
// stays a separate staff review). Provider states what it offers. Both must
// be found, not toggled.
export const VERIFIED_ROLES = Object.freeze(["broker", "provider"]);

function isNonEmptyLine(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Whether `role` may be newly added given the evidence the user supplied.
// Returns { ok: true } or { ok: false, reason } where reason names the task
// the user must complete, so the refusal reads as directions, not a wall.
export function canAddRole(role, evidence = {}) {
  if (SELF_SERVICE_ROLES.includes(role)) return { ok: true };

  if (role === "broker") {
    if (isPrcLicenseFormatValid(evidence.prcLicense)) return { ok: true };
    return {
      ok: false,
      reason: "Enter your PRC Real Estate Broker license number to add the broker lens.",
    };
  }

  if (role === "provider") {
    if (isNonEmptyLine(evidence.services)) return { ok: true };
    return {
      ok: false,
      reason: "Describe your Services Offered line to add the provider lens.",
    };
  }

  return { ok: false, reason: `"${role}" is not a workspace lens that can be added.` };
}

// The lenses an account has not earned yet, in lens order. Non-lens tags
// (staff previews, operator) are neither earned lenses nor missing ones.
// Tags are normalized first, so a legacy `seeker` counts as the buyer lens.
export function missingLenses(tags) {
  const held = new Set(
    (Array.isArray(tags) ? tags : []).map(normalizeDashboardMode).filter(Boolean),
  );
  return LENS_ROLES.filter((lens) => !held.has(lens));
}
