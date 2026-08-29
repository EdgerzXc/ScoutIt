// ═══════════════════════════════════════════════════════════════
// A-023 gap G4 — server-side read of the Career History authority.
//
// Deliberately a separate module from `serverBrokerMetrics.js`. The two
// templates do not share a reader, a query, or a return shape, so there is no
// place where one could accidentally be substituted for the other.
//
// Same fail-closed rule as every other authority reader: a failed read is
// `{ ok: false }`, never an empty list.
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CLAIM_COLUMNS = [
  "id",
  "metric_key",
  "value_numeric",
  "value_text",
  "unit",
  "currency",
  "coverage_start",
  "coverage_end",
  "source_note",
  "attested_at",
  "verification_state",
  "reviewed_at",
  "publish_state",
  "withdrawn_at",
].join(", ");

const project = (row) => ({
  id: row.id,
  metricKey: row.metric_key,
  valueNumeric: row.value_numeric === null || row.value_numeric === undefined
    ? null
    : Number(row.value_numeric),
  valueText: row.value_text || "",
  unit: row.unit || "",
  currency: row.currency || "",
  coverageStart: row.coverage_start || null,
  coverageEnd: row.coverage_end || null,
  sourceNote: row.source_note || "",
  attestedAt: row.attested_at || null,
  verificationState: row.verification_state || "broker_declared",
  reviewedAt: row.reviewed_at || null,
  publishState: row.publish_state || "draft",
  withdrawnAt: row.withdrawn_at || null,
});

export async function loadBrokerCareerClaims(authorityId) {
  if (!authorityId) return { ok: true, claims: [] };
  if (!supabaseAdmin) return { ok: false, reason: "service_unavailable" };

  try {
    const { data, error } = await supabaseAdmin
      .from("broker_career_claims")
      .select(CLAIM_COLUMNS)
      .eq("broker_id", authorityId);

    if (error) return { ok: false, reason: "authority_unavailable" };
    return { ok: true, claims: (data || []).map(project) };
  } catch {
    return { ok: false, reason: "authority_unavailable" };
  }
}
