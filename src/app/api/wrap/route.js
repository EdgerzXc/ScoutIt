// ═══════════════════════════════════════════════════════════════
// MONTHLY SCOUT WRAP API (WRAP-01 & Section 31.1)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { findProperty } from "@/lib/propertyLookup";
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

    // ── AUTHORISATION (added 2026-08-06, §58 · W9 pre-flight) ──────────────
    // 🔴 This route AUTHENTICATED but never AUTHORISED. `resolveUserId` only
    // proves *someone* is signed in; nothing tied `entityId` to that someone.
    // So any signed-in user could read any entity's wrap by changing a query
    // string:
    //
    //   /api/wrap?entityType=broker&entityId=<any broker>
    //     → that broker's routed-lead volume
    //   /api/wrap?entityType=owner_portfolio&entityId=<any owner>
    //     → that owner's portfolio traffic
    //   /api/wrap?entityType=property&entityId=<any listing>
    //     → a competitor's views, saves and enquiry count
    //
    // A broker's monthly lead count is commercially sensitive performance data
    // about a PERSON, which Standing Rule 9 puts outside anything a tier or a
    // session can buy. W9 is the UI for this endpoint, so it had to be closed
    // before that UI exists rather than after.
    const authorised = await isAuthorisedForWrap(userId, entityType, entityId);
    if (!authorised) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this report" },
        { status: 403 }
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

/**
 * May `userId` read the wrap for this entity?
 *
 * Staff/admin may read any. Otherwise the caller must BE the subject:
 *   owner_portfolio → entityId is a `properties.owner_id`
 *   broker          → entityId is a `deals.broker_id`
 *   property        → entityId is a listing; the caller must own it
 *
 * Deliberately strict. Broker representation is NOT accepted as access to a
 * listing's wrap: a broker seeing traffic on a property they pitched is a
 * product decision nobody has made, and guessing "yes" here would leak a
 * competitor's numbers. If that access is wanted, it should be added
 * knowingly. Erring open is how §47's age gate broke (Rule 6).
 */
async function isAuthorisedForWrap(userId, entityType, entityId) {
  // Staff override first — one lookup answers every entity type.
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("active_roles")
    .eq("id", userId)
    .maybeSingle();

  const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
  if (roles.includes("admin") || roles.includes("staff")) return true;

  // `owner_id` and `broker_id` are TEXT columns holding the user id, so a
  // string comparison is the right one. Positive checks only (Rule 6).
  if (entityType === "owner_portfolio" || entityType === "broker") {
    return String(entityId) === String(userId);
  }

  if (entityType === "property") {
    const { property, error } = await findProperty(supabaseAdmin, entityId, ["id", "owner_id"]);
    // A lookup failure must deny, never allow.
    if (error || !property) return false;
    return String(property.owner_id) === String(userId);
  }

  return false;
}

/**
 * Previous calendar month as `YYYY-MM`.
 *
 * ⚠️ Do not "simplify" this back to `d.setMonth(d.getMonth() - 1)`. That
 * overflows whenever today's day-of-month does not exist in the previous
 * month: on 2026-03-31, `setMonth(1)` produces "Feb 31" which JavaScript
 * normalises to 2026-03-03 — so it returns "2026-03", the CURRENT month, and
 * the wrap silently reports a partial month as if it were complete. Rule 3:
 * a wrong number is worse than a blank, and this one looks perfectly normal.
 *
 * Anchoring to day 1 before stepping back removes the overflow entirely.
 * UTC throughout, to match the `toISOString()` slice.
 */
function getCurrentPeriodMonth() {
  const now = new Date();
  const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  firstOfThisMonth.setUTCMonth(firstOfThisMonth.getUTCMonth() - 1);
  return firstOfThisMonth.toISOString().slice(0, 7);
}
