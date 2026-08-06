// ═══════════════════════════════════════════════════════════════
// PROPERTY CLAIM & LISTER RELATIONSHIP DECLARATION (OWN-01)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";

const VALID_RELATIONSHIPS = new Set([
  "direct_owner",
  "authorized_manager",
  "authorized_broker",
]);

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to submit a property claim" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { propertyId, claimedRelationship } = body;

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid propertyId" },
        { status: 400 }
      );
    }

    if (!claimedRelationship || !VALID_RELATIONSHIPS.has(claimedRelationship)) {
      return NextResponse.json(
        { error: "Invalid claimedRelationship. Must be direct_owner, authorized_manager, or authorized_broker" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    // Check for duplicate active claim by the same user
    const { data: existing } = await supabaseAdmin
      .from("property_claims")
      .select("id, status")
      .eq("property_id", propertyId)
      .eq("claimant_user_id", userId)
      .not("status", "in", '("rejected","withdrawn","closed")')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "You already have an active claim for this property",
          claimId: existing.id,
          status: existing.status,
        },
        { status: 409 }
      );
    }

    // Insert claim
    const { data: claim, error: insertErr } = await supabaseAdmin
      .from("property_claims")
      .insert({
        property_id: propertyId,
        claimant_user_id: userId,
        claimed_relationship: claimedRelationship,
        status: "submitted",
        declaration_version: "v1",
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: sanitizeError(insertErr, "Could not submit property claim.") },
        { status: 500 }
      );
    }

    // Log claim event
    await supabaseAdmin.from("property_claim_events").insert({
      claim_id: claim.id,
      actor_id: userId,
      event_type: "CLAIM_SUBMITTED",
      payload: { relationship: claimedRelationship },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      status: claim.status,
      message: "Property claim submitted for verification.",
    });
  } catch (err) {
    console.error("[PROPERTY CLAIM] Failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not submit property claim.") },
      { status: 500 }
    );
  }
}
