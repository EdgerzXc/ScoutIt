/**
 * Server-side ScoutIt VIA Contact Attribution and Priority Routing Service (A-186)
 *
 * Interacts with Supabase private tables to resolve share links, manage visitor
 * attributions (30-day window, first-touch lock), and persist immutable routing decisions.
 *
 * Implements defensive fallback: If tables are not yet migrated, degrades gracefully
 * to standard algorithmic ranking without throwing or breaking user requests.
 */

import { ROUTING_REASONS, VIA_STATUS, VIA_ATTRIBUTION_WINDOW_MS } from "@/lib/viaRouting";

/**
 * Resolves or creates a VIA attribution record for a given property and visitor.
 *
 * @param {Object} supabaseAdmin - Supabase service-role client
 * @param {Object} params
 * @param {string} params.propertyId - UUID of the property in Supabase
 * @param {string} params.promoterSlug - Public slug of the promoter (e.g. 'mariana-juan')
 * @param {string} params.visitorId - Unique anonymous visitor or session token
 * @param {string|null} [params.userId] - Authenticated user ID if signed in
 * @returns {Promise<Object>} Attribution result object
 */
export async function resolveServerViaAttribution(supabaseAdmin, {
  propertyId,
  promoterSlug,
  visitorId,
  userId = null,
} = {}) {
  if (!supabaseAdmin || !propertyId || !promoterSlug || !visitorId) {
    return { ok: false, reason: "missing_parameters", viaStatus: VIA_STATUS.INVALID, attribution: null };
  }

  try {
    // 1. Look up active share link for this property and promoter slug
    const { data: shareLink, error: linkError } = await supabaseAdmin
      .from("via_share_links")
      .select("id, property_id, promoter_id, promoter_type, representation_id, slug, status")
      .eq("property_id", propertyId)
      .eq("slug", promoterSlug)
      .maybeSingle();

    if (linkError) {
      console.warn("[serverViaRouting] Share link lookup skipped or unmigrated:", linkError.message);
      return { ok: false, reason: "database_unavailable", viaStatus: VIA_STATUS.INVALID, attribution: null };
    }

    if (!shareLink || shareLink.status !== "active") {
      return {
        ok: false,
        reason: shareLink ? "share_link_disabled" : "share_link_not_found",
        viaStatus: VIA_STATUS.INVALID,
        viaAttribution: null,
      };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + VIA_ATTRIBUTION_WINDOW_MS);

    // 2. Check existing attribution for (property_id, visitor_id)
    // Section 15: First Valid Attribution Rule (do not silently overwrite)
    const { data: existingAttribution, error: attrError } = await supabaseAdmin
      .from("via_attributions")
      .select("id, property_id, promoter_id, promoter_type, share_link_id, visitor_id, expires_at, status")
      .eq("property_id", propertyId)
      .eq("visitor_id", visitorId)
      .maybeSingle();

    if (!attrError && existingAttribution) {
      const isExpired = new Date(existingAttribution.expires_at).getTime() <= now.getTime();
      if (!isExpired && existingAttribution.status === "active") {
        return {
          ok: true,
          reason: "existing_attribution_retained",
          viaStatus: VIA_STATUS.VALID,
          viaAttribution: existingAttribution,
          shareLink,
        };
      }
    }

    // 3. Create or refresh attribution
    const { data: newAttribution, error: insertError } = await supabaseAdmin
      .from("via_attributions")
      .upsert(
        {
          property_id: propertyId,
          promoter_id: shareLink.promoter_id,
          promoter_type: shareLink.promoter_type,
          share_link_id: shareLink.id,
          visitor_id: visitorId,
          user_id: userId || null,
          first_seen_at: now.toISOString(),
          last_seen_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: "active",
        },
        { onConflict: "property_id, visitor_id" }
      )
      .select()
      .maybeSingle();

    if (insertError) {
      console.warn("[serverViaRouting] Attribution upsert skipped:", insertError.message);
      return {
        ok: true,
        reason: "memory_fallback",
        viaStatus: VIA_STATUS.VALID,
        viaAttribution: {
          promoter_id: shareLink.promoter_id,
          promoter_type: shareLink.promoter_type,
          expires_at: expiresAt.toISOString(),
          status: "active",
        },
        shareLink,
      };
    }

    return {
      ok: true,
      reason: "attribution_created",
      viaStatus: VIA_STATUS.VALID,
      viaAttribution: newAttribution,
      shareLink,
    };
  } catch (err) {
    console.error("[serverViaRouting] Error resolving attribution:", err);
    return { ok: false, reason: "internal_error", viaStatus: VIA_STATUS.INVALID, viaAttribution: null };
  }
}

/**
 * Records an immutable routing decision in Supabase for auditability & AI explainability.
 *
 * @param {Object} supabaseAdmin - Supabase service-role client
 * @param {Object} params
 * @param {string} params.propertyId - UUID of property
 * @param {string} params.visitorId - Unique visitor identifier
 * @param {string} params.selectedRecipientId - Final contact receiving priority
 * @param {string} params.selectedRecipientType - 'owner' | 'broker'
 * @param {string} params.routingReason - One of ROUTING_REASONS enum
 * @param {string|null} [params.attributionId] - Foreign key to via_attributions if applicable
 * @param {Array} [params.rankingSnapshot] - Snapshot of eligible contacts and scores at decision time
 * @returns {Promise<Object>} { ok: boolean, id?: string }
 */
export async function recordRoutingDecision(supabaseAdmin, {
  propertyId,
  visitorId,
  selectedRecipientId,
  selectedRecipientType = "broker",
  routingReason = ROUTING_REASONS.SCOUTIT_RANKING,
  attributionId = null,
  rankingSnapshot = [],
} = {}) {
  if (!supabaseAdmin || !propertyId || !selectedRecipientId) {
    return { ok: false, reason: "missing_parameters" };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("via_routing_decisions")
      .insert({
        property_id: propertyId,
        visitor_id: visitorId || "anonymous",
        selected_recipient_id: selectedRecipientId,
        selected_recipient_type: selectedRecipientType,
        routing_reason: routingReason,
        attribution_id: attributionId || null,
        ranking_snapshot: Array.isArray(rankingSnapshot) ? rankingSnapshot : [],
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.warn("[serverViaRouting] Decision logging skipped or unmigrated:", error.message);
      return { ok: true, mocked: true };
    }

    return { ok: true, decisionId: data?.id };
  } catch (err) {
    console.error("[serverViaRouting] Decision logging error:", err);
    return { ok: false, reason: "internal_error" };
  }
}
