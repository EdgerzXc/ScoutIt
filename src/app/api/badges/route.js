import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BADGE_DEFINITIONS } from "@/lib/BadgeEngine";

// Public: returns badge definitions merged with real claimed counts from user_badges and database catalog.
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // 1. Fetch real claimed counts from user_badges
    const { data: rows, error: countErr } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id");

    if (countErr) {
      console.error("[BADGES API] Failed to fetch claim counts:", countErr);
      return NextResponse.json({ error: "Failed to load badge counts" }, { status: 500 });
    }

    const claimedCounts = {};
    for (const row of rows || []) {
      claimedCounts[row.badge_id] = (claimedCounts[row.badge_id] || 0) + 1;
    }

    // 2. Query dynamic badge_definitions if table exists, fallback to code catalog
    let dbDefinitions = [];
    try {
      const { data: dbRows, error: dbErr } = await supabaseAdmin
        .from("badge_definitions")
        .select("id, name, description, rarity, category, max_slots, color, perks, is_active")
        .eq("is_active", true);
      if (!dbErr && Array.isArray(dbRows) && dbRows.length > 0) {
        dbDefinitions = dbRows;
      }
    } catch {
      // Table not yet migrated in this environment — code catalog serves as source of truth
    }

    // Merge database definitions with code definitions
    const mergedMap = new Map();
    for (const def of Object.values(BADGE_DEFINITIONS)) {
      mergedMap.set(def.id, { ...def });
    }
    for (const dbDef of dbDefinitions) {
      const existing = mergedMap.get(dbDef.id) || {};
      mergedMap.set(dbDef.id, {
        ...existing,
        ...dbDef,
        perks: dbDef.perks || existing.perks || {},
      });
    }

    // Only the PIONEER_* cohorts are live-claimable through /api/badges/claim; FOUNDING_SEEKER
    // and ALPHA_CARTOGRAPHER are historical/pre-launch cohorts unless database records exist.
    const definitions = Array.from(mergedMap.values()).map((def) => {
      const isPioneer = def.id.startsWith("PIONEER_");
      const realClaimed = claimedCounts[def.id] || (isPioneer ? 0 : def.claimed || 0);
      const maxSlots = def.max_slots || null;
      const isSoldOut = maxSlots != null && realClaimed >= maxSlots;

      return {
        ...def,
        claimed: realClaimed,
        max_slots: maxSlots,
        status: isSoldOut ? "SOLD_OUT" : "ACTIVE",
      };
    });

    return NextResponse.json({ definitions });
  } catch (err) {
    console.error("[BADGES API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
