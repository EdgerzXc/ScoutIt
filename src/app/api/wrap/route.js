// ═══════════════════════════════════════════════════════════════
// MONTHLY SCOUT WRAP API (WRAP-01 & Section 31.1)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";

const VALID_TYPES = new Set(["property", "owner_portfolio", "broker"]);

/**
 * GET /api/wrap?entityType=property&entityId=...&periodMonth=2026-07
 * Returns the cached or generated Monthly Scout Wrap for the specified entity and period.
 */
export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to view Monthly Scout Wrap" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const periodMonth = searchParams.get("periodMonth") || getCurrentPeriodMonth();

    if (!entityType || !VALID_TYPES.has(entityType)) {
      return NextResponse.json(
        { error: "Missing or invalid entityType (must be property, owner_portfolio, or broker)" },
        { status: 400 }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { error: "Missing required entityId parameter" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    // 1. Fetch cached wrap
    const { data: cached } = await supabaseAdmin
      .from("monthly_scout_wraps")
      .select("report_data, generated_at")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("period_month", periodMonth)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({
        success: true,
        periodMonth,
        data: cached.report_data,
        generatedAt: cached.generated_at,
        source: "cache",
      });
    }

    // 2. Generate on-the-fly via RPC if not yet cached
    const { data: generated, error: rpcErr } = await supabaseAdmin.rpc(
      "generate_monthly_scout_wrap",
      {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_period_month: periodMonth,
      }
    );

    if (rpcErr) {
      console.error("[WRAP API] RPC generation failed:", rpcErr);
      return NextResponse.json(
        { error: sanitizeError(rpcErr, "Could not generate Monthly Scout Wrap.") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      periodMonth,
      data: generated,
      generatedAt: new Date().toISOString(),
      source: "generated",
    });
  } catch (err) {
    console.error("[WRAP API] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not load Monthly Scout Wrap.") },
      { status: 500 }
    );
  }
}

function getCurrentPeriodMonth() {
  const d = new Date();
  // Default to previous month YYYY-MM
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}
