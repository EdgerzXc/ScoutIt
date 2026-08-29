// ═══════════════════════════════════════════════════════════════
// A-023 phase 5 — server-side read of the broker metric snapshot.
//
// Same rule as the other authority readers: every failure path returns
// `{ ok: false }` rather than an empty or zeroed snapshot. A missing snapshot
// and an unreadable one are different answers and the dossier renders them
// differently (Rule 14).
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const SNAPSHOT_COLUMNS = [
  "broker_id",
  "completed_transactions",
  "response_rate_numerator",
  "response_rate_denominator",
  "median_response_minutes",
  "response_sample",
  "last_transaction_at",
  "calculated_at",
  "policy_version",
  "source",
].join(", ");

function projectSnapshot(row) {
  if (!row) return null;
  return {
    brokerId: row.broker_id,
    completedTransactions: Number(row.completed_transactions || 0),
    responseRateNumerator: Number(row.response_rate_numerator || 0),
    responseRateDenominator: Number(row.response_rate_denominator || 0),
    medianResponseMinutes:
      row.median_response_minutes === null || row.median_response_minutes === undefined
        ? null
        : Number(row.median_response_minutes),
    responseSample: Number(row.response_sample || 0),
    lastTransactionAt: row.last_transaction_at || null,
    calculatedAt: row.calculated_at || null,
    policyVersion: row.policy_version || null,
    // Carried through so the UI can say plainly that a figure is demo
    // scaffolding rather than earned platform activity.
    isExampleSeed: row.source === "example_seed",
  };
}

export async function loadBrokerMetricSnapshot(authorityId) {
  if (!authorityId) return { ok: true, snapshot: null };
  if (!supabaseAdmin) return { ok: false, reason: "service_unavailable" };

  try {
    const { data, error } = await supabaseAdmin
      .from("broker_metric_snapshots")
      .select(SNAPSHOT_COLUMNS)
      .eq("broker_id", authorityId)
      .maybeSingle();

    if (error) return { ok: false, reason: "authority_unavailable" };
    return { ok: true, snapshot: projectSnapshot(data) };
  } catch {
    return { ok: false, reason: "authority_unavailable" };
  }
}
