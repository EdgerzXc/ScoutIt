// ─────────────────────────────────────────────────────────────────────────
// WHAT A VERIFICATION DECISION IN THIS CONSOLE ACTUALLY DOES
// A-070 · full-stack gap audit 2026-09-01
//
// `verification_requests` is written and read only inside Mission Control.
// Approving a request sets `status='approved'` and writes an audit row, and
// that is the end of it. It does not set `user_profiles.prc_verified`, does
// not touch `broker_profiles`, and causes no badge to appear anywhere.
//
// The action's own comment was candid that downstream sync is "a deliberate
// follow-up so this action can never half-fail across two systems". That
// judgement is sound and is deliberately NOT overturned here: adding a second
// writer of `prc_verified` is the defect A-070's acceptance test names, not
// the fix for it.
//
// What was never sound is the promise on the button. There are two competing
// PRC surfaces — `/api/admin/prc` on the main site actually sets the flag —
// and staff are pointed at the one with no effect, behind a control labelled
// "Verify" with a shield icon. A staff member who approved a PRC licence here
// would reasonably believe the badge was live. It is not.
//
// So the console now says what it does. Reconciling the two writers — the
// other half of A-070 — needs an owner decision about which surface is
// authoritative, and is tracked in WAITING.
// ─────────────────────────────────────────────────────────────────────────

/** The route that actually writes the PRC flag today. */
export const DOWNSTREAM_BADGE_WRITER = "/api/admin/prc";

/** Stated on the queue, above the decision controls. */
export const DECISION_EFFECT_NOTICE =
  "A decision here is recorded and audited, and does not change the subject's public profile. " +
  "It does not set `prc_verified`, does not touch broker metrics, and does not make any badge " +
  `appear. The PRC badge is still written only by ${DOWNSTREAM_BADGE_WRITER} on the main site. ` +
  "Reconciling the two is an open decision — until then, treat this queue as the record of the " +
  "review, not as the act of verifying.";

/** Labels the control by what it does, not by what it appears to promise. */
export function decisionButtonLabel(decision) {
  return decision === "rejected" ? "Record rejection" : "Record approval";
}

/**
 * Guard against copy drifting back into a claim this action cannot keep.
 * Used by the test; exported so the rule lives beside the copy it governs.
 */
export function describesEffect(copy) {
  const overclaims = [
    /\bmarks?\b[^.]*\bverified\b/i,
    /\bverifies\b/i,
    /\blights?\b[^.]*\bbadge\b/i,
    /\bgrants?\b[^.]*\bbadge\b/i,
  ];
  return !overclaims.some((pattern) => pattern.test(copy));
}
