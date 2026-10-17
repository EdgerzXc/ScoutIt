import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to raise a Data Quest" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { propertyId, questScope } = body || {};

    if (!propertyId || !questScope) {
      return NextResponse.json(
        { error: "Missing required fields: propertyId and questScope are required" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const { data: bounty, error: insertError } = await supabaseAdmin
      .from("bounty_claims")
      .insert({
        target_field: questScope,
        property_id: propertyId,
        initiator_id: userId,
        status: "open",
        payout_connects: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[QUESTIT BOUNTY API] Failed to create bounty claim:", insertError);
      return NextResponse.json(
        { error: "Failed to create bounty claim" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bounty,
      message: `Data Quest raised for ${questScope} — Free to post`,
    });
  } catch (err) {
    console.error("[QUESTIT BOUNTY API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
