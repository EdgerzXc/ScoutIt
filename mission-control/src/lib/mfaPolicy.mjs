/**
 * Pure policy rules for Staff MFA & AAL2 Verification (A-263).
 * Zero I/O, no server-only imports, 100% testable.
 */

export const MFA_TIERS = Object.freeze({
  AGENT: 1,
  OPS_MANAGER: 2,
  SUPER_ADMIN: 3,
});

/**
 * Determines whether a given staff tier requires AAL2 (MFA) session assurance.
 * Tier 2 (Ops Manager) and Tier 3 (Super Admin) require AAL2.
 *
 * @param {number} tier
 * @returns {boolean}
 */
export function requiresAal2(tier) {
  return typeof tier === "number" && tier >= MFA_TIERS.OPS_MANAGER;
}

/**
 * Checks if an assurance level string satisfies AAL2.
 * @param {string|null} currentLevel
 * @returns {boolean}
 */
export function isSessionAal2(currentLevel) {
  return currentLevel === "aal2";
}

/**
 * Evaluates the full MFA posture for a staff member.
 *
 * @param {object} params
 * @param {number} params.tier - Staff tier (1, 2, 3)
 * @param {string} [params.currentLevel="aal1"] - "aal1" | "aal2"
 * @param {string} [params.nextLevel="aal1"] - "aal1" | "aal2"
 * @returns {{ mfaRequired: boolean, enrolledMfa: boolean, allowAccess: boolean, reason?: string }}
 */
export function evaluateMfaStatus({ tier, currentLevel = "aal1", nextLevel = "aal1" }) {
  const needsAal2 = requiresAal2(tier);
  const isAal2 = isSessionAal2(currentLevel);
  const enrolled = nextLevel === "aal2" || isAal2;

  if (!needsAal2) {
    return {
      mfaRequired: false,
      enrolledMfa: enrolled,
      allowAccess: true,
    };
  }

  if (isAal2) {
    return {
      mfaRequired: false,
      enrolledMfa: true,
      allowAccess: true,
    };
  }

  // Tier requires AAL2 but current session is only AAL1
  return {
    mfaRequired: true,
    enrolledMfa: enrolled,
    allowAccess: false,
    reason: enrolled
      ? "MFA_CHALLENGE_REQUIRED: Your account has MFA enabled. Enter your 6-digit TOTP code to step up to AAL2."
      : "MFA_ENROLLMENT_REQUIRED: Tier 2+ staff must configure TOTP multi-factor authentication before accessing Mission Control.",
  };
}
