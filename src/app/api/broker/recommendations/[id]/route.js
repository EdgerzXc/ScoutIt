import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { requireAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isGlobalReadOnly } from "@/lib/featureFlags";
import { sanitizeError } from "@/lib/sanitizeError";

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATION MODERATION AND WITHDRAWAL — A-023 audit gap G1
//
// Two different actors, two different verbs, deliberately not one endpoint
// with a role switch:
//
//   PATCH  — STAFF ONLY. approve or reject. This is the publish decision.
//   DELETE — AUTHOR ONLY. withdraw, which revokes consent.
//
// Withdrawal is not deletion. The row is retained with `withdrawn_at` set so
// the audit trail and the consent record survive; the public projection
// already refuses to publish a withdrawn row. Destroying the record would
// destroy the evidence that consent was ever given and then revoked, which is
// the one thing that cannot be reconstructed.
// ═══════════════════════════════════════════════════════════════

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
const json = (body, status = 200) =>
  NextResponse.json(body, { status, headers: PRIVATE_HEADERS });

const MODERATION_ACTIONS = {
  approve: { state: "approved", event: "recommendation_approved" },
  reject: { state: "rejected", event: "recommendation_rejected" },
};

export async function PATCH(request, { params }) {
  try {
    if (await isGlobalReadOnly()) {
      return json({ error: "System writes are temporarily frozen" }, 423);
    }

    // Publishing someone else's words about a third party is a staff decision.
    const admin = await requireAdmin(request, { label: "RECOMMENDATION_MODERATION" });
    if (admin.error) return json({ error: admin.error }, admin.status);

    const { id } = await params;
    if (!id) return json({ error: "Recommendation not found" }, 404);
    if (!supabaseAdmin) return json({ error: "Moderation is unavailable" }, 503);

    const body = await request.json().catch(() => null);
    const action = MODERATION_ACTIONS[body?.action];
    if (!action) {
      return json({ error: "Action must be approve or reject" }, 422);
    }

    // A withdrawn recommendation cannot be approved back into publication:
    // consent was revoked, and a moderator does not outrank that.
    const { data: updated, error } = await supabaseAdmin
      .from("broker_recommendations")
      .update({
        moderation_state: action.state,
        moderated_by: admin.userId,
        moderated_at: new Date().toISOString(),
        moderation_note: String(body?.note || "").slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("withdrawn_at", null)
      .select("id, moderation_state")
      .maybeSingle();

    if (error) {
      console.error("[recommendation moderation] failed:", sanitizeError(error));
      return json({ error: "Moderation failed" }, 503);
    }
    if (!updated) {
      return json({ error: "Recommendation not found, or its consent was withdrawn" }, 404);
    }

    await supabaseAdmin
      .from("broker_social_proof_audit_events")
      .insert({
        recommendation_id: updated.id,
        actor_user_id: admin.userId,
        event_type: action.event,
        event_payload: { note: String(body?.note || "").slice(0, 500) },
      })
      .then(null, () => null);

    return json({ id: updated.id, state: updated.moderation_state });
  } catch (error) {
    console.error("[recommendation moderation] failed:", sanitizeError(error));
    return json({ error: "Moderation failed" }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    if (await isGlobalReadOnly()) {
      return json({ error: "System writes are temporarily frozen" }, 423);
    }

    const userId = await resolveUserId(request);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const { id } = await params;
    if (!id) return json({ error: "Recommendation not found" }, 404);
    if (!supabaseAdmin) return json({ error: "Withdrawal is unavailable" }, 503);

    const body = await request.json().catch(() => ({}));

    // Scoped by author in the UPDATE itself, so a mismatched id cannot
    // withdraw someone else's recommendation even if it is guessed.
    const { data: withdrawn, error } = await supabaseAdmin
      .from("broker_recommendations")
      .update({
        withdrawn_at: new Date().toISOString(),
        withdrawal_reason: String(body?.reason || "").slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("author_user_id", userId)
      .is("withdrawn_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[recommendation withdrawal] failed:", sanitizeError(error));
      return json({ error: "Withdrawal failed" }, 503);
    }
    if (!withdrawn) {
      return json({ error: "Recommendation not found, or already withdrawn" }, 404);
    }

    await supabaseAdmin
      .from("broker_social_proof_audit_events")
      .insert({
        recommendation_id: withdrawn.id,
        actor_user_id: userId,
        event_type: "recommendation_withdrawn",
        event_payload: { reason: String(body?.reason || "").slice(0, 500) },
      })
      .then(null, () => null);

    return json({
      id: withdrawn.id,
      withdrawn: true,
      message: "Your recommendation has been withdrawn and is no longer published.",
    });
  } catch (error) {
    console.error("[recommendation withdrawal] failed:", sanitizeError(error));
    return json({ error: "Withdrawal failed" }, 500);
  }
}
