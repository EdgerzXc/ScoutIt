import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isGlobalReadOnly } from "@/lib/featureFlags";
import { createRateLimiter } from "@/lib/rateLimit";
import { sanitizeError } from "@/lib/sanitizeError";
import { validateRecommendationSubmission } from "@/lib/brokerRecommendationSubmission";
import { resolveBrokerAuthorityId } from "@/lib/brokerDossier";
import {
  isSatisfactionSignalReady,
  resolveQualifyingHandshakeId,
} from "@/lib/brokerRecommendationEligibility";

// ═══════════════════════════════════════════════════════════════
// CLIENT RECOMMENDATION SUBMISSION — A-023 audit gap G1
//
// The dossier could read recommendations and nothing could write one, so the
// section was guaranteed to stay empty (Rule 21).
//
// Three things are decided HERE and never by the client:
//
//  1. Who the author is — from the session, never from the body.
//  2. Whether a qualifying handshake exists — looked up server-side. The
//     client cannot hand us `qualifyingHandshakeId`; the submission validator
//     rejects that key outright. This is what "Verified ScoutIt connection"
//     means and it must not be claimable.
//  3. Moderation state — always 'pending'. Nothing a client sends can publish.
//
// A submitter must already have a deal with the broker. Without that check any
// account could write about any broker, which is a spam and defamation surface
// rather than a recommendation system.
// ═══════════════════════════════════════════════════════════════

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
const json = (body, status = 200) =>
  NextResponse.json(body, { status, headers: PRIVATE_HEADERS });

// Deliberately tight. A person recommends a handful of advisors in a lifetime,
// not five an hour.
const checkSubmissionRate = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

export async function POST(request) {
  try {
    if (await isGlobalReadOnly()) {
      return json({ error: "System writes are temporarily frozen" }, 423);
    }

    const userId = await resolveUserId(request);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    if (!checkSubmissionRate(userId).allowed) {
      return json({ error: "Too many recommendations submitted. Try again later." }, 429);
    }

    if (!supabaseAdmin) return json({ error: "Recommendations are unavailable" }, 503);

    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "Invalid request body" }, 400);

    // Fail closed before reading the person's words. The satisfaction column
    // is owner-gated under W-003; accepting a submission the database will
    // then refuse loses what the client wrote, which is the whole content.
    if (!(await isSatisfactionSignalReady(supabaseAdmin))) {
      return json(
        { error: "Client feedback is not open yet. Nothing was saved." },
        503,
      );
    }

    const validated = validateRecommendationSubmission(body);
    if (!validated.ok) {
      return json({ error: "Invalid recommendation", fields: validated.errors }, 422);
    }

    const brokerId = resolveBrokerAuthorityId(validated.value.brokerId);
    if (!brokerId) return json({ error: "Unknown advisor" }, 404);

    // A broker cannot recommend themselves. The schema enforces this too; the
    // route answers honestly rather than surfacing a constraint violation.
    if (brokerId === resolveBrokerAuthorityId(userId)) {
      return json({ error: "You cannot recommend yourself" }, 403);
    }

    // The relationship gate starts with a real deal, then tightens to the
    // completed two-sided transaction handshake. A pending inquiry or a
    // one-sided signature is not enough to create permanent public feedback.
    //
    // The rule itself lives in brokerRecommendationEligibility so the
    // invitation panel offers the prompt on exactly the same terms this route
    // accepts it on. Two copies of this question drift; one cannot.
    const eligibility = await resolveQualifyingHandshakeId(supabaseAdmin, { userId, brokerId });

    if (!eligibility.ok) {
      return eligibility.stage === "deals"
        ? json({ error: "Could not verify your connection" }, 503)
        : json({ error: "Could not verify your completed connection" }, 503);
    }

    if (!eligibility.hasDeal) {
      return json(
        { error: "Only a client who has worked with this advisor through ScoutIt can recommend them" },
        403,
      );
    }

    // Verification is resolved from the authority, never accepted from input.
    const qualifyingHandshakeId = eligibility.handshakeId;
    if (!qualifyingHandshakeId) {
      return json(
        { error: "You can share feedback after both parties complete the two-sided ScoutIt handshake" },
        403,
      );
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("broker_recommendations")
      .insert({
        broker_id: brokerId,
        author_user_id: userId,
        author_display_name: validated.value.authorDisplayName,
        attribution_mode: validated.value.attributionMode,
        relationship_type: validated.value.relationshipType,
        satisfaction_level: validated.value.satisfactionLevel,
        body: validated.value.body,
        consent_granted: true,
        consent_recorded_at: new Date().toISOString(),
        // Always pending. A client cannot publish their own words.
        moderation_state: "pending",
        qualifying_handshake_id: qualifyingHandshakeId,
      })
      .select("id, moderation_state")
      .single();

    if (insertError) {
      // The unique index on (broker, author, handshake) is the duplicate guard.
      if (/duplicate key/i.test(insertError.message || "")) {
        return json({ error: "You have already recommended this advisor" }, 409);
      }
      console.error("[broker recommendations] insert failed:", sanitizeError(insertError));
      return json({ error: "Could not save your recommendation" }, 503);
    }

    // Audit is best-effort and must never fail the submission the client
    // already completed; a lost audit row is recoverable, a lost consent
    // record is not.
    await supabaseAdmin
      .from("broker_social_proof_audit_events")
      .insert({
        recommendation_id: inserted.id,
        actor_user_id: userId,
        event_type: "recommendation_submitted",
        event_payload: {
          attribution_mode: validated.value.attributionMode,
          satisfaction_level: validated.value.satisfactionLevel,
          verified_connection: true,
        },
      })
      .then(null, () => null);

    return json(
      {
        id: inserted.id,
        state: inserted.moderation_state,
        verifiedConnection: true,
        message: "Thank you. Your recommendation is with ScoutIt for review before it appears.",
      },
      201,
    );
  } catch (error) {
    console.error("[broker recommendations] submission failed:", sanitizeError(error));
    return json({ error: "Could not save your recommendation" }, 500);
  }
}
