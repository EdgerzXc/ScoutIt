import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BADGE_DEFINITIONS } from "@/lib/BadgeEngine";

export async function POST(request) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const userId = user.id;

    const { badgeId } = await request.json();

    if (!badgeId) {
      return NextResponse.json({ error: "Missing badgeId" }, { status: 400 });
    }

    const badgeDef = BADGE_DEFINITIONS[badgeId];
    if (!badgeDef) {
      return NextResponse.json({ error: "Unknown badge" }, { status: 400 });
    }
    if (!badgeId.startsWith("PIONEER_")) {
      return NextResponse.json({ error: "This badge cannot be self-claimed" }, { status: 403 });
    }

    // Enforce real scarcity server-side — count actual claims, not the hardcoded display number.
    const { count: claimedCount, error: countError } = await supabaseAdmin
      .from("user_badges")
      .select("id", { count: "exact", head: true })
      .eq("badge_id", badgeId);

    if (countError) {
      console.error("[CLAIM API] Failed to count existing claims:", countError);
      return NextResponse.json({ error: "Failed to verify badge availability" }, { status: 500 });
    }
    if ((claimedCount || 0) >= badgeDef.max_slots) {
      return NextResponse.json({ error: "This cohort is sold out" }, { status: 409 });
    }

    // Insert the claim — unique(user_id, badge_id) rejects a duplicate claim at the DB level.
    const { data: newBadge, error: insertError } = await supabaseAdmin
      .from("user_badges")
      .insert({ user_id: userId, badge_id: badgeId, granted_by: "self_claim" })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Badge already claimed" }, { status: 400 });
      }
      console.error("[CLAIM API] Failed to insert badge claim:", insertError);
      return NextResponse.json({ error: "Failed to mint badge" }, { status: 500 });
    }

    const { data: allBadges } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", userId);

    return NextResponse.json({ success: true, badge: newBadge, badges: allBadges || [] });

  } catch (err) {
    console.error("[CLAIM API] Error during badge claim process:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
