import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BADGE_DEFINITIONS } from "@/lib/BadgeEngine";

// Public: returns badge definitions merged with real claimed counts from user_badges.
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data: rows, error } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id");

    if (error) {
      console.error("[BADGES API] Failed to fetch claim counts:", error);
      return NextResponse.json({ error: "Failed to load badge counts" }, { status: 500 });
    }

    const claimedCounts = {};
    for (const row of rows || []) {
      claimedCounts[row.badge_id] = (claimedCounts[row.badge_id] || 0) + 1;
    }

    // Only the PIONEER_* cohorts are live-claimable through /api/badges/claim; FOUNDING_SEEKER
    // and ALPHA_CARTOGRAPHER are historical/pre-launch cohorts with no real claim records, so
    // their hardcoded claimed/status stand as the historical record.
    const definitions = Object.values(BADGE_DEFINITIONS).map((def) => {
      if (!def.id.startsWith("PIONEER_")) return def;
      const claimed = claimedCounts[def.id] || 0;
      return {
        ...def,
        claimed,
        status: claimed >= def.max_slots ? "SOLD_OUT" : "ACTIVE",
      };
    });

    return NextResponse.json({ definitions });
  } catch (err) {
    console.error("[BADGES API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
