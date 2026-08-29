// ═══════════════════════════════════════════════════════════════
// A-023 phase 4 — server-side read of the recommendation and contribution
// authorities.
//
// Same single rule as `serverBrokerDossier.js`: every failure path returns
// `{ ok: false }` rather than an empty list. An empty list is an answer; a
// failed read is not, and the dossier renders them differently on purpose
// (Rule 3, Rule 14).
//
// These tables are created by A-023's prepared migration and do not exist
// until W-003 is applied. A missing relation is a failed read, not "this
// broker has no recommendations" — the fail-closed path is what makes that
// distinction hold before the migration lands.
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Explicit column lists. `select("*")` on a table holding consent records and
// private evidence would pull whatever a future migration adds straight toward
// a public surface.
const RECOMMENDATION_COLUMNS = [
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
].join(", ");

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
 * `evidence_url` and the submitting client's identity are deliberately absent
 * from `RECOMMENDATION_COLUMNS`. A-023 keeps proof private: it is moderation
 * evidence, never public presentation. Not selecting it is a stronger
 * guarantee than selecting it and remembering to strip it later.
 */
export async function loadBrokerRecommendationAuthority(authorityId) {
  if (!authorityId) return { ok: true, recommendations: [] };
  if (!supabaseAdmin) return { ok: false, reason: "service_unavailable" };

  try {
    const { data, error } = await supabaseAdmin
      .from("broker_recommendations")
      .select(RECOMMENDATION_COLUMNS)
      .eq("broker_id", authorityId);

    if (error) return { ok: false, reason: "authority_unavailable" };
    return { ok: true, recommendations: data || [] };
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
