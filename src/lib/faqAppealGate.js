// ═══════════════════════════════════════════════════════════════
// ScoutIt FAQ Appeal Feature Gate
//
// Governs runtime activation of the privacy-safe FAQ block appeal path.
// Server-only, opt-in default-false gate.
// ═══════════════════════════════════════════════════════════════

/**
 * Returns true only if the FAQ block appeal feature is explicitly enabled.
 */
export function isFaqAppealActive() {
  return process.env.FAQ_APPEAL_ACTIVE === "true";
}
