/**
 * Server-side VIA promoter eligibility (A-193).
 *
 * Resolves what the signed-in caller is allowed to promote on one property and, when
 * eligible, returns (creating once if needed) the verified VIA share link slug.
 *
 * Invariants:
 *  - Eligibility comes only from relationship rows for THIS property, never from input.
 *  - A link that staff disabled or revoked is never silently re-activated.
 *  - Missing/unmigrated tables degrade to "not eligible" (public canonical link),
 *    never to an error that blocks sharing.
 */

import {
  classifyPromoterRelationship,
  buildPromoterSlug,
  disambiguatePromoterSlug,
} from "@/lib/viaEligibility";

const NOT_ELIGIBLE = (reason) => ({
  eligible: false,
  promoterType: null,
  promoterSlug: null,
  displayName: null,
  reason,
});

async function safeRows(query) {
  try {
    const { data, error } = await query;
    if (error) return { rows: [], error };
    return { rows: Array.isArray(data) ? data : data ? [data] : [], error: null };
  } catch (error) {
    return { rows: [], error };
  }
}

/**
 * @param {Object} supabaseAdmin service-role client
 * @param {Object} params
 * @param {string} params.propertyId property UUID
 * @param {string|null} params.userId verified caller id
 */
export async function resolveViaEligibility(supabaseAdmin, { propertyId, userId } = {}) {
  if (!supabaseAdmin || !propertyId || !userId) return NOT_ELIGIBLE("missing_parameters");

  const { rows: propRows } = await safeRows(
    supabaseAdmin.from("properties").select("id, owner_id").eq("id", propertyId).maybeSingle()
  );
  const property = propRows[0] || null;
  if (!property) return NOT_ELIGIBLE("property_not_found");

  const [rep, units, listings] = await Promise.all([
    safeRows(
      supabaseAdmin
        .from("property_broker_representations")
        .select("broker_id, status")
        .eq("property_id", propertyId)
        .eq("broker_id", String(userId))
        .maybeSingle()
    ),
    safeRows(
      supabaseAdmin
        .from("property_units")
        .select("id, operator_id")
        .eq("property_id", propertyId)
        .eq("operator_id", String(userId))
    ),
    safeRows(
      supabaseAdmin
        .from("open_gate_role_listings")
        .select("recipient_id, role, enabled, unit_id")
        .eq("property_id", propertyId)
        .eq("recipient_id", String(userId))
        .eq("role", "operator")
        .eq("enabled", true)
    ),
  ]);

  const relationship = classifyPromoterRelationship({
    userId,
    property,
    representation: rep.rows[0] || null,
    operatorUnits: units.rows,
    roleListings: listings.rows,
  });

  if (!relationship.eligible) return NOT_ELIGIBLE("no_property_relationship");

  const { rows: profileRows } = await safeRows(
    supabaseAdmin
      .from("user_profiles")
      .select("id, display_name")
      .eq("id", String(userId))
      .maybeSingle()
  );
  const displayName = profileRows[0]?.display_name || null;

  // Reuse the promoter's existing link for this property if there is one.
  const existing = await safeRows(
    supabaseAdmin
      .from("via_share_links")
      .select("id, slug, status, promoter_type")
      .eq("property_id", propertyId)
      .eq("promoter_id", String(userId))
  );
  if (existing.error) return NOT_ELIGIBLE("database_unavailable");

  const live = existing.rows.find((l) => l.status === "active");
  if (live) {
    return {
      eligible: true,
      promoterType: relationship.promoterType,
      promoterSlug: live.slug,
      displayName,
      reason: "existing_link",
    };
  }
  if (existing.rows.length > 0) return NOT_ELIGIBLE("link_disabled_by_staff");

  // First time this promoter shares this property: mint exactly one link.
  const baseSlug = buildPromoterSlug(displayName, userId, relationship.promoterType);
  const attempts = [baseSlug, disambiguatePromoterSlug(baseSlug, userId)];

  for (const slug of attempts) {
    const { data, error } = await supabaseAdmin
      .from("via_share_links")
      .insert({
        property_id: propertyId,
        promoter_id: String(userId),
        promoter_type: relationship.promoterType,
        slug,
        status: "active",
      })
      .select("slug")
      .maybeSingle();

    if (!error) {
      return {
        eligible: true,
        promoterType: relationship.promoterType,
        promoterSlug: data?.slug || slug,
        displayName,
        reason: "link_created",
      };
    }
    // 23505 = slug already held by someone else on this property → try the suffixed form.
    if (error.code !== "23505") return NOT_ELIGIBLE("database_unavailable");
  }

  return NOT_ELIGIBLE("slug_unavailable");
}
