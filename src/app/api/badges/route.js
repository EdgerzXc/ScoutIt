import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BADGE_DEFINITIONS } from "@/lib/BadgeEngine";

// Bounded in-memory cache for high-concurrency server protection
let cachedDefinitions = null;
let cachedAt = 0;
const CACHE_TTL_MS = 15_000; // 15 seconds

/**
 * Invalidate the in-memory cache so subsequent reads see fresh claims immediately.
 */
export function invalidateBadgesCache() {
  cachedDefinitions = null;
  cachedAt = 0;
}

// Public: returns badge definitions merged with real claimed counts from user_badges and database catalog.
export async function GET() {
  try {
    const now = Date.now();
    if (cachedDefinitions && now - cachedAt < CACHE_TTL_MS) {
      return NextResponse.json(
        { definitions: cachedDefinitions },
        {
          headers: {
            "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
            "X-Cache": "HIT",
          },
        }
      );
    }

    if (!supabaseAdmin) {
      // Graceful fallback to static code catalog if database is temporarily unavailable
      return NextResponse.json(
        { definitions: Object.values(BADGE_DEFINITIONS) },
        {
          headers: {
            "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
            "X-Cache": "FALLBACK",
          },
        }
      );
    }

    // 1. Fetch real claimed counts from user_badges
    const { data: rows, error: countErr } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id");

    if (countErr) {
      console.error("[BADGES API] Failed to fetch claim counts:", countErr);
      if (cachedDefinitions) {
        // Return stale cache if DB count fails, preventing public site 500 error
        return NextResponse.json(
          { definitions: cachedDefinitions },
          { headers: { "X-Cache": "STALE-ERROR-FALLBACK" } }
        );
      }
      return NextResponse.json({ definitions: Object.values(BADGE_DEFINITIONS) }, { status: 200 });
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

    // Compute status and caps
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

    cachedDefinitions = definitions;
    cachedAt = Date.now();

    return NextResponse.json(
      { definitions },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
          "X-Cache": "MISS",
        },
      }
    );
  } catch (err) {
    console.error("[BADGES API] Error:", err);
    return NextResponse.json(
      { definitions: Object.values(BADGE_DEFINITIONS) },
      { status: 200 }
    );
  }
}
