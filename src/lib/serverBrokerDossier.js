// ═══════════════════════════════════════════════════════════════
// A-023 phase 2 — server-side read of the representation authority.
//
// The pure projection lives in `brokerDossier.js`. This module only fetches,
// and its single rule is that every failure path returns `{ ok: false }`
// rather than an empty list. An empty list is an answer; a failed read is not,
// and the dossier renders them differently on purpose.
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";

// Explicit column list. `select("*")` here would pull whatever a future
// migration adds straight toward a public surface.
const REPRESENTATION_COLUMNS = [
  "id",
  "property_id",
  "broker_id",
  "status",
  "visible_to_public",
  "contactable",
  "account_eligible",
  "inventory_eligible",
  "priority",
  "accepted_at",
  "created_at",
  "starts_at",
  "locked_at",
  "suspended_at",
  "unavailable_at",
  "ended_at",
].join(", ");

const PROPERTY_COLUMNS = "id, slug, canonical_slug, lifecycle_state, pipeline_status";

/**
 * Read a broker's representations and resolve each to a *publicly catalogued*
 * property.
 *
 * A representation only becomes a public card when three independent sources
 * agree: the representation row is eligible, the Supabase property is live, and
 * the property is actually in the public Airtable catalog. Any one of them
 * saying no removes the card.
 *
 * @param authorityId      Auth UUID, or null when the dossier is unlinked.
 * @param publicProperties The Airtable catalog (`bundle.properties`).
 * @returns `{ lookup, propertiesByAuthorityId }`
 */
export async function loadBrokerRepresentationAuthority(authorityId, publicProperties = []) {
  const empty = new Map();
  if (!authorityId) return { lookup: { ok: true, representations: [] }, propertiesByAuthorityId: empty };
  if (!supabaseAdmin) {
    return { lookup: { ok: false, reason: "service_unavailable" }, propertiesByAuthorityId: empty };
  }

  try {
    const { data: representations, error } = await supabaseAdmin
      .from("property_broker_representations")
      .select(REPRESENTATION_COLUMNS)
      .eq("broker_id", authorityId);
    if (error) throw error;

    const rows = representations || [];
    if (rows.length === 0) return { lookup: { ok: true, representations: rows }, propertiesByAuthorityId: empty };

    const propertyIds = [...new Set(rows.map((row) => row.property_id).filter(Boolean))];
    const { data: properties, error: propertyError } = await supabaseAdmin
      .from("properties")
      .select(PROPERTY_COLUMNS)
      .in("id", propertyIds);
    if (propertyError) throw propertyError;

    const catalogBySlug = new Map();
    for (const property of publicProperties || []) {
      if (property?.slug) catalogBySlug.set(property.slug, property);
    }

    const propertiesByAuthorityId = new Map();
    for (const property of properties || []) {
      if (normalizeLifecycleState(property) !== PROPERTY_LIFECYCLE_STATES.LIVE) continue;
      const published = catalogBySlug.get(property.canonical_slug) || catalogBySlug.get(property.slug);
      if (published) propertiesByAuthorityId.set(property.id, published);
    }

    return { lookup: { ok: true, representations: rows }, propertiesByAuthorityId };
  } catch (err) {
    console.error("[brokerDossier] Representation authority read failed:", err?.message || err);
    return { lookup: { ok: false, reason: "authority_unavailable" }, propertiesByAuthorityId: empty };
  }
}
