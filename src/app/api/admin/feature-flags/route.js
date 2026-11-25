import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { invalidateFlagsCache } from "@/lib/featureFlags";
import { resetFlagCache } from "@/proxy";
import { MONETIZATION_PHASES, resolveMonetizationPhase } from "@/lib/monetizationGate";

// Default seed definitions for required flags
const DEFAULT_FLAGS = [
  { id: "monetization_enforced", name: "Master Paywall Gate (Production Enforced)", description: "Enforce paid Universe tier (₱2,499/mo), active listing quotas (1, 5, 20, ∞), and paid Connects spend across the platform", is_enabled: false },
  { id: "pre_launch_free_mode", name: "Pre-Launch Free Mode", description: "Unlock all premium features for all visitors for free while seeding", is_enabled: true },
  { id: "global_read_only", name: "Pause public API writes", description: "Pauses public-app API writes such as publishing and deal updates. Authentication, provider callbacks, Calendar sync, and staff flag controls remain available. Direct Supabase writes and scheduled jobs are outside this control.", is_enabled: false },
  { id: "ai_search", name: "AI Search Engine", description: "Enable natural language search via /api/questit", is_enabled: true },
  { id: "deep_intel", name: "Deep Intelligence Studio", description: "Enable access to cap-rate, financial, and noise metrics", is_enabled: true },
];

const NO_STORE = { "Cache-Control": "private, no-store" };
const ALLOWED_FLAG_IDS = new Set([
  "monetization_enforced",
  "pre_launch_free_mode",
  "global_read_only",
  "ai_search",
  "deep_intel",
  "premium_features_unlocked",
  "pre_200_premium_access",
  "pilot_zero_paywall",
  "simple_mode_default",
]);

export async function GET(request) {
  try {
    const gate = await requireAdmin(request, { label: "ADMIN FLAGS", minTier: 1 });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status, headers: NO_STORE });

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500, headers: NO_STORE });
    }

    const { data: dbFlags, error } = await supabaseAdmin
      .from("feature_flags")
      .select("*");

    if (error) {
      console.error("[ADMIN FLAGS] Fetch failed:", error);
      return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500, headers: NO_STORE });
    }

    const dbMap = Object.fromEntries((dbFlags || []).map((f) => [f.id, f]));
    const boolMap = Object.fromEntries((dbFlags || []).map((f) => [f.id, Boolean(f.is_enabled)]));
    const monetizationPhase = resolveMonetizationPhase({ dbFlags: boolMap });

    // Merge defaults with DB flags
    const resultFlags = DEFAULT_FLAGS.map((def) => {
      const existing = dbMap[def.id];
      const fallbackEnabled =
        def.id === "monetization_enforced"
          ? monetizationPhase === MONETIZATION_PHASES.PRODUCTION_ENFORCED
          : def.id === "pre_launch_free_mode"
          ? monetizationPhase === MONETIZATION_PHASES.PILOT_ZERO_PAYWALL
          : def.is_enabled;
      return {
        ...def,
        is_enabled: existing ? !!existing.is_enabled : fallbackEnabled,
        updated_at: existing?.updated_at || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        flags: resultFlags,
        monetizationPhase,
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("[ADMIN FLAGS] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request) {
  try {
    const gate = await requireAdmin(request, { label: "ADMIN FLAGS", minTier: 3 });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status, headers: NO_STORE });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400, headers: NO_STORE });
    }
    const { action, phase, flagId, isEnabled } = body;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500, headers: NO_STORE });
    }

    const nowIso = new Date().toISOString();

    // 1-Click Master Paywall Gate switch (or synchronized toggle of monetization_enforced / pre_launch_free_mode)
    if (
      action === "set_paywall_phase" ||
      flagId === "monetization_enforced" ||
      flagId === "pre_launch_free_mode"
    ) {
      const enforcePaywall =
        action === "set_paywall_phase"
          ? phase === MONETIZATION_PHASES.PRODUCTION_ENFORCED || isEnabled === true
          : flagId === "monetization_enforced"
          ? Boolean(isEnabled)
          : !Boolean(isEnabled);

      const nextPhase = enforcePaywall
        ? MONETIZATION_PHASES.PRODUCTION_ENFORCED
        : MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;

      const rowsToUpsert = [
        {
          id: "monetization_enforced",
          is_enabled: enforcePaywall,
          description:
            "MASTER PAYWALL GATE: Enforce Universe tier subscriptions (₱2,499/mo), active listing quotas (1/5/20/∞), and paid Connects spend.",
          updated_at: nowIso,
        },
        {
          id: "pre_launch_free_mode",
          is_enabled: !enforcePaywall,
          description: "Unlock all premium features while seeding the first 200 listings.",
          updated_at: nowIso,
        },
      ];

      const { data: upsertedRows, error: upsertError } = await supabaseAdmin
        .from("feature_flags")
        .upsert(rowsToUpsert, { onConflict: "id" })
        .select();

      if (upsertError) {
        console.error("[ADMIN FLAGS] Paywall gate upsert failed:", upsertError);
        return NextResponse.json({ error: "Failed to update paywall gate" }, { status: 500, headers: NO_STORE });
      }

      invalidateFlagsCache();
      resetFlagCache();

      const primaryFlag =
        (upsertedRows || []).find((r) => r.id === (flagId || "monetization_enforced")) ||
        rowsToUpsert[0];

      return NextResponse.json(
        {
          success: true,
          flag: primaryFlag,
          flags: upsertedRows || rowsToUpsert,
          monetizationPhase: nextPhase,
        },
        { headers: NO_STORE }
      );
    }

    if (!flagId || typeof flagId !== "string" || !ALLOWED_FLAG_IDS.has(flagId) || typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters: recognized flagId and boolean isEnabled are required" }, { status: 400, headers: NO_STORE });
    }

    const { data, error } = await supabaseAdmin
      .from("feature_flags")
      .upsert(
        { id: flagId, is_enabled: isEnabled, updated_at: nowIso },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[ADMIN FLAGS] Upsert failed:", error);
      return NextResponse.json({ error: "Failed to update feature flag" }, { status: 500, headers: NO_STORE });
    }

    invalidateFlagsCache();
    resetFlagCache();

    return NextResponse.json({ success: true, flag: data }, { headers: NO_STORE });
  } catch (err) {
    console.error("[ADMIN FLAGS] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: NO_STORE });
  }
}
