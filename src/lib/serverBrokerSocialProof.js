// ═══════════════════════════════════════════════════════════════
// A-023 phase 4 — server-side read of the recommendation and contribution
// authorities.
//
// Same single rule as `serverBrokerDossier.js`: every failure path returns
// `{ ok: false }` rather than an empty list. An empty list is an answer; a
// failed read is not, and the dossier renders them differently on purpose
// (Rule 3, Rule 14).
//
// These tables were applied when W-003 was cleared on 2026-08-27 and are live;
// the comment here previously said they did not exist yet. The fail-closed
// rule still matters and is not a legacy of that: a missing relation, a
// missing column, or any other failed read is not "this broker has no
// recommendations". That distinction is what kept a dark section honest when
// the read named a column the live table lacked (A-065).
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isSatisfactionSignalReady } from "@/lib/brokerRecommendationEligibility";

// Explicit column lists. `select("*")` on a table holding consent records and
// private evidence would pull whatever a future migration adds straight toward
// a public surface. `evidence_url` and the submitting client's identity are
// deliberately absent: A-023 keeps proof private, and not selecting it is a
// stronger guarantee than selecting it and remembering to strip it later.
//
// `satisfaction_level` is deliberately NOT in this list either.
//
// It is added only when the live table actually has the column. A-038's
// migration is owner-gated under W-003, and naming a column that does not
// exist makes PostgREST reject the whole select — which the fail-closed rule
// then correctly reports as "could not be loaded". That is the right handling
// of a failed read and the wrong thing to be reading: it took the entire
// recommendations section dark on every dossier, including the three entries
// that were already published.
const RECOMMENDATION_BASE_COLUMNS = [
  "id",
  "broker_id",
  "author_display_name",
  "attribution_mode",
  "relationship_type",
  "body",
  "moderation_state",
  "consent_granted",
  "withdrawn_at",
  "disputed_at",
  "qualifying_handshake_id",
  "submitted_at",
];

async function recommendationColumns() {
  const columns = [...RECOMMENDATION_BASE_COLUMNS];
  if (await isSatisfactionSignalReady(supabaseAdmin)) {
    columns.splice(5, 0, "satisfaction_level");
  }
  return columns.join(", ");
}

const CONTRIBUTION_COLUMNS = [
  "id",
  "broker_id",
  "kind",
  "title",
  "artifact_path",
  "status",
  "published_at",
].join(", ");

/**
 * Confirm which `qualifying_handshake_id` values name a handshake that exists.
 *
 * A-023 says a qualifying two-sided handshake is the ONLY thing that earns
 * "Verified ScoutIt connection", but the column carrying that claim has **no
 * foreign key**, so any uuid in it currently earns the badge. Two seeded rows
 * were found on 2026-08-31 publicly claiming a verified connection through
 * `11111111-…` and `22222222-…`, which resolve to nothing.
 *
 * So the id is treated as a claim and resolved against the authority, exactly
 * as the submission route already treats it on the way in. A row whose
 * handshake cannot be confirmed keeps its words and loses only the badge it
 * could not substantiate.
 *
 * A failed lookup returns null, and the caller then fails the whole read
 * rather than silently downgrading every entry to unverified — quietly
 * stripping badges during a database blip would be its own dishonesty.
 */
async function confirmHandshakes(rows) {
  const claimed = [
    ...new Set(rows.map((row) => row?.qualifying_handshake_id).filter(Boolean)),
  ];
  if (!claimed.length) return new Set();

  const { data, error } = await supabaseAdmin
    .from("deal_handshakes")
    .select("id")
    .in("id", claimed);

  if (error) return null;
  return new Set((data || []).map((row) => row.id));
}

export async function loadBrokerRecommendationAuthority(authorityId) {
  if (!authorityId) return { ok: true, recommendations: [] };
  if (!supabaseAdmin) return { ok: false, reason: "service_unavailable" };

  try {
    const { data, error } = await supabaseAdmin
      .from("broker_recommendations")
      .select(await recommendationColumns())
      .eq("broker_id", authorityId);

    if (error) return { ok: false, reason: "authority_unavailable" };

    const rows = data || [];
    const confirmed = await confirmHandshakes(rows);
    if (confirmed === null) return { ok: false, reason: "authority_unavailable" };

    // The projection reads `qualifying_handshake_id` to decide the label, so
    // clearing an unconfirmable one here is what removes the unearned badge —
    // without touching the stored row, which is evidence and not ours to edit
    // from a read path.
    const recommendations = rows.map((row) =>
      row.qualifying_handshake_id && !confirmed.has(row.qualifying_handshake_id)
        ? { ...row, qualifying_handshake_id: null }
        : row,
    );

    return { ok: true, recommendations };
  } catch {
    return { ok: false, reason: "authority_unavailable" };
  }
}

export async function loadBrokerContributionAuthority(authorityId) {
  if (!authorityId) return { ok: true, contributions: [] };
  if (!supabaseAdmin) return { ok: false, reason: "service_unavailable" };

  try {
    const { data, error } = await supabaseAdmin
      .from("broker_contributions")
      .select(CONTRIBUTION_COLUMNS)
      .eq("broker_id", authorityId);

    if (error) return { ok: false, reason: "authority_unavailable" };
    return { ok: true, contributions: data || [] };
  } catch {
    return { ok: false, reason: "authority_unavailable" };
  }
}
