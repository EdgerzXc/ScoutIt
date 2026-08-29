import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { sanitizeError } from "@/lib/sanitizeError";

// ═══════════════════════════════════════════════════════════════
// BROKER METRIC RECOMPUTE — A-023 phase 5's missing caller
//
// `recompute_broker_metric_snapshot` shipped with nothing invoking it, which
// made it a plan rather than a feature (Rule 13): a broker's ScoutIt Record
// would freeze at whatever it was when someone last ran the function by hand,
// and the first real transaction handshake would change nothing on the page.
//
// Daily is the right cadence. A-023 targets "seconds to roughly one minute"
// freshness for a broker watching their own dashboard, but that is the job of
// event-driven invalidation on the write path, not of a sweep. This sweep is
// the reconciliation half: it catches drift, backfills brokers who have never
// been computed, and guarantees that a snapshot is never older than a day.
//
// Example-seeded brokers are skipped by the SQL function itself, not here, so
// there is exactly one place that decision lives.
// ═══════════════════════════════════════════════════════════════

const BATCH_LIMIT = 500;

export async function GET(request) {
  const authFailure = authorizeCronRequest(request);
  if (authFailure) return authFailure;

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Metric recompute is unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const { data: brokers, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("role", "broker")
      .is("archived_at", null)
      .limit(BATCH_LIMIT);

    if (error) {
      return NextResponse.json(
        { error: "Broker roster is unavailable" },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    let recomputed = 0;
    const failures = [];

    // Sequential on purpose. This runs once a day over a small roster, and a
    // burst of parallel RPCs against the deal tables buys nothing but lock
    // contention with live traffic.
    for (const broker of brokers || []) {
      const { error: rpcError } = await supabaseAdmin.rpc(
        "recompute_broker_metric_snapshot",
        { p_broker_id: broker.id },
      );
      if (rpcError) {
        // One broker's failure must not abandon the rest of the roster.
        failures.push(broker.id);
        continue;
      }
      recomputed += 1;
    }

    if (failures.length) {
      console.error(
        "[broker metrics] recompute failed for %d broker(s)",
        failures.length,
      );
    }

    // Reported honestly: a sweep with failures is not a clean sweep.
    return NextResponse.json(
      {
        ok: failures.length === 0,
        scanned: (brokers || []).length,
        recomputed,
        failed: failures.length,
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[broker metrics] recompute sweep failed:", sanitizeError(error));
    return NextResponse.json(
      { error: "Metric recompute failed" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
