import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { withCronEventLog } from "@/lib/cronEventLog";
import { getPreviousPeriodMonth } from "@/lib/monthlyScoutWrap";

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 200;
const PROPERTY_SCAN_LIMIT = 2000;

export async function handleMonthlyRollover(request) {
  const authFailure = authorizeCronRequest(request);
  if (authFailure) return authFailure;

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Monthly rollover service is unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const periodMonth = getPreviousPeriodMonth();

    // 1. Authoritatively sweep and reset Connects token balances for stale user wallets
    let rolledOverCount = 0;
    const { data: sweepResult, error: sweepError } = await supabaseAdmin.rpc(
      "sweep_monthly_token_rollover",
      { p_month: currentMonth }
    );

    if (sweepError) {
      console.warn("[monthly rollover] Wallet token sweep warning:", sweepError.message);
    } else if (Array.isArray(sweepResult) && sweepResult[0]?.rolled_over_count != null) {
      rolledOverCount = sweepResult[0].rolled_over_count;
    }

    // 2. Pre-generate Monthly Scout Wraps for active owners with listings (GAP-79)
    let wrapsGenerated = 0;
    const failedWraps = [];

    let propQuery = supabaseAdmin
      .from("properties")
      .select("owner_id, pipeline_status")
      .not("owner_id", "is", null);
    if (typeof propQuery.in === "function") {
      propQuery = propQuery.in("pipeline_status", ["approved", "live", "pending"]);
    }
    const { data: activeOwners } = await propQuery.limit(PROPERTY_SCAN_LIMIT);

    const uniqueOwnerIds = Array.from(
      new Set((activeOwners || []).map((o) => o.owner_id).filter(Boolean))
    ).slice(0, BATCH_LIMIT);

    for (const ownerId of uniqueOwnerIds) {
      const { error: rpcErr } = await supabaseAdmin.rpc("generate_monthly_scout_wrap", {
        p_entity_type: "owner_portfolio",
        p_entity_id: ownerId,
        p_period_month: periodMonth,
      });

      if (rpcErr) {
        failedWraps.push({ type: "owner_portfolio", id: ownerId, error: rpcErr.message });
      } else {
        wrapsGenerated += 1;
      }
    }

    // 3. Pre-generate Monthly Scout Wraps for brokers (including multi-role brokers)
    const brokerBase = supabaseAdmin
      .from("user_profiles")
      .select("id");
    const brokerFiltered = typeof brokerBase.or === "function"
      ? brokerBase.or("role.eq.broker,active_roles.cs.{broker}")
      : brokerBase.eq("role", "broker");
    const { data: brokers } = await brokerFiltered.limit(BATCH_LIMIT);

    for (const broker of brokers || []) {
      const { error: rpcErr } = await supabaseAdmin.rpc("generate_monthly_scout_wrap", {
        p_entity_type: "broker",
        p_entity_id: broker.id,
        p_period_month: periodMonth,
      });

      if (rpcErr) {
        failedWraps.push({ type: "broker", id: broker.id, error: rpcErr.message });
      } else {
        wrapsGenerated += 1;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        currentMonth,
        periodMonth,
        rolledOverWallets: rolledOverCount,
        wrapsGenerated,
        failedWrapsCount: failedWraps.length,
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[monthly rollover] cron failed:", sanitizeError(error));
    return NextResponse.json(
      { error: "Monthly rollover execution failed" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

export const GET = withCronEventLog("monthly-rollover", handleMonthlyRollover);
