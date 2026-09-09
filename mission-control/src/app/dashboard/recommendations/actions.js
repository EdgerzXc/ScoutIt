"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import {
  DECISION_EVENTS,
  MODERATION_DECISIONS,
  evaluateDecision,
  moderationPatch,
} from "@/lib/recommendationModerationPolicy.mjs";

// ═══════════════════════════════════════════════════════════════
// A-038 — the staff half of the client feedback loop.
//
// The main site can now take a recommendation from a client who completed a
// two-sided handshake, and it always lands `pending`. Nothing could move it
// out of `pending` except hand-editing Supabase, which is exactly the operator
// workaround this task exists to replace.
//
// Two rules are enforced here and not left to a careful moderator:
//
//   1. Consent gates approval. Evaluated from the row as it is at decision
//      time, re-read inside the action rather than trusted from the page that
//      rendered the button — a client may revoke between render and click.
//   2. Rejection retains the row. There is no delete in this file. The consent
//      record and the audit trail are the reason the row exists at all.
// ═══════════════════════════════════════════════════════════════

/** Append the immutable social-proof audit row for a moderation decision. */
async function recordSocialProofEvent(admin, { recommendationId, staff, decision, note }) {
  const { error } = await admin.from("broker_social_proof_audit_events").insert({
    recommendation_id: recommendationId,
    actor_user_id: staff.id,
    event_type: DECISION_EVENTS[decision],
    event_payload: { note: note || "", actor_email: staff.email, actor_tier: staff.tier },
  });

  // Unlike the client's own submission, a moderation decision must not be
  // recorded silently. The audit IS the accountability for publishing another
  // person's words, so a failure to write it fails the decision.
  if (error) {
    throw new Error(`The moderation decision could not be audited: ${error.message}`);
  }
}

/**
 * Approve or reject one client recommendation. Ops Manager (Tier 2)+.
 *
 * Publishing a named person's statement about a licensed professional is not
 * an Agent-tier action, and neither is refusing one.
 *
 * @param {FormData} formData
 */
export async function decideRecommendation(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const recommendationId = formData.get("recommendationId")?.toString().trim();
  const decision = formData.get("decision")?.toString().trim();
  const note = formData.get("note")?.toString().trim() || "";

  if (!recommendationId) throw new Error("A recommendation is required.");
  if (decision !== MODERATION_DECISIONS.APPROVE && decision !== MODERATION_DECISIONS.REJECT) {
    throw new Error("Unknown moderation decision.");
  }
  // A refusal is a permanent decision about someone's words. It carries a
  // reason or it does not happen.
  if (decision === MODERATION_DECISIONS.REJECT && !note) {
    throw new Error("A rejection requires a reason.");
  }

  const admin = createAdminClient();

  // Re-read at decision time. The page may have rendered before a withdrawal.
  const { data: row, error: readError } = await admin
    .from("broker_recommendations")
    .select(
      "id, broker_id, moderation_state, consent_granted, withdrawn_at, disputed_at, redacted_at, qualifying_handshake_id",
    )
    .eq("id", recommendationId)
    .single();

  if (readError || !row) throw new Error("That recommendation could not be read.");

  const verdict = evaluateDecision(row, decision);
  if (!verdict.allowed) throw new Error(verdict.reason);

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("broker_recommendations")
    .update(moderationPatch({ decision, staffId: staff.id, note, now }))
    .eq("id", recommendationId)
    // Optimistic guard: if the state moved since the read, this updates nothing
    // and the decision is reported as lost rather than overwriting a race.
    .eq("moderation_state", row.moderation_state);

  if (updateError) throw new Error(`Could not record the decision: ${updateError.message}`);

  await recordSocialProofEvent(admin, { recommendationId, staff, decision, note });

  await logActionStrict({
    staff,
    action: `recommendation.${decision}`,
    targetTable: "broker_recommendations",
    targetId: recommendationId,
    reason: note || null,
    metadata: {
      broker_id: row.broker_id,
      verified_connection: Boolean(row.qualifying_handshake_id),
      previous_state: row.moderation_state,
    },
  });

  revalidatePath("/dashboard/recommendations");
}
