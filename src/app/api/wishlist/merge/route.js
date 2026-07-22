import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";

// Merge a device's local "Board" (localStorage `scoutit_reactions`) into the
// signed-in user's account-level saved list (`saved_intel`).
//
// Idempotent by construction: only property_ids the account does NOT already
// have are inserted, so tapping the button twice (or on two devices) never
// creates duplicates — important because `saved_intel` has no
// unique(user_id, property_id) constraint. Identity comes ONLY from the
// verified session token (resolveUserId), never from the request body, so a
// client can only ever merge into its own account.
export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const rawIds = Array.isArray(body?.propertyIds) ? body.propertyIds : [];

    // Normalize: strings only, trimmed, de-duped, capped to a sane batch size.
    const localIds = [...new Set(
      rawIds
        .filter((id) => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    )].slice(0, 500);

    if (localIds.length === 0) {
      return NextResponse.json({ merged: 0, alreadyHad: 0, total: 0 });
    }

    // What does the account already have? Service role here, so scope by
    // user_id explicitly (the RLS policy would do the same for a client).
    const { data: existingRows, error: fetchError } = await supabaseAdmin
      .from("saved_intel")
      .select("property_id")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("[WISHLIST MERGE] Failed to read existing saves:", fetchError);
      return NextResponse.json({ error: "Failed to read account saves" }, { status: 500 });
    }

    const existingIds = new Set((existingRows || []).map((r) => r.property_id));
    const missing = localIds.filter((id) => !existingIds.has(id));

    if (missing.length === 0) {
      return NextResponse.json({
        merged: 0,
        alreadyHad: localIds.length,
        total: existingIds.size,
      });
    }

    const rowsToInsert = missing.map((property_id) => ({ user_id: userId, property_id }));
    const { error: insertError } = await supabaseAdmin
      .from("saved_intel")
      .insert(rowsToInsert);

    if (insertError) {
      console.error("[WISHLIST MERGE] Failed to insert saves:", insertError);
      return NextResponse.json({ error: "Failed to save to account" }, { status: 500 });
    }

    return NextResponse.json({
      merged: missing.length,
      alreadyHad: localIds.length - missing.length,
      total: existingIds.size + missing.length,
    });
  } catch (err) {
    console.error("[WISHLIST MERGE] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
