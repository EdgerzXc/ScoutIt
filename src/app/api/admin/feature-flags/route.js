import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";

// Default seed definitions for required flags
const DEFAULT_FLAGS = [
  { id: "global_read_only", name: "Emergency Read-Only Mode", description: "Freeze all database writes site-wide while leaving public viewing active", is_enabled: false },
  { id: "pre_launch_free_mode", name: "Pre-Launch Free Mode", description: "Unlock all premium features for all visitors for free while seeding", is_enabled: true },
  { id: "ai_search", name: "AI Search Engine", description: "Enable natural language search via /api/questit", is_enabled: true },
  { id: "deep_intel", name: "Deep Intelligence Studio", description: "Enable access to cap-rate, financial, and noise metrics", is_enabled: true },
];

export async function GET(request) {
  try {
    const gate = await requireAdmin(request, { label: "ADMIN FLAGS" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    const { data: dbFlags, error } = await supabaseAdmin
      .from("feature_flags")
      .select("*");

    if (error) {
      console.error("[ADMIN FLAGS] Fetch failed:", error);
      return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 });
    }

    const dbMap = Object.fromEntries((dbFlags || []).map((f) => [f.id, f]));
    
    // Merge defaults with DB flags
    const resultFlags = DEFAULT_FLAGS.map((def) => {
      const existing = dbMap[def.id];
      return {
        ...def,
        is_enabled: existing ? !!existing.is_enabled : def.is_enabled,
        updated_at: existing?.updated_at || null,
      };
    });

    return NextResponse.json({ success: true, flags: resultFlags });
  } catch (err) {
    console.error("[ADMIN FLAGS] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const gate = await requireAdmin(request, { label: "ADMIN FLAGS" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = await request.json();
    const { flagId, isEnabled } = body;

    if (!flagId || typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters: flagId and isEnabled are required" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("feature_flags")
      .upsert(
        { id: flagId, is_enabled: isEnabled, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[ADMIN FLAGS] Upsert failed:", error);
      return NextResponse.json({ error: "Failed to update feature flag" }, { status: 500 });
    }

    return NextResponse.json({ success: true, flag: data });
  } catch (err) {
    console.error("[ADMIN FLAGS] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
