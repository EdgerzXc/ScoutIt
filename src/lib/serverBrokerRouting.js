import { buildLeadRouting } from "@/lib/brokerRepresentation";

export async function getPropertyLeadRecipients(supabaseAdmin, propertyId, preferredBrokerId = null) {
  if (!supabaseAdmin) return { ok: false, reason: "service_unavailable", recipients: [], roster: [] };

  const { data, error } = await supabaseAdmin.rpc("get_property_lead_recipients", {
    p_property_id: propertyId,
    p_preferred_broker_id: preferredBrokerId || null,
  });
  if (error) {
    console.error("[brokerRouting] Recipient resolution failed:", error);
    return { ok: false, reason: "routing_unavailable", recipients: [], roster: [], error };
  }

  const recipients = (data || []).map((row) => ({
    recipientId: row.recipient_id,
    recipientType: row.recipient_type,
    representationId: row.representation_id || null,
    sortRank: row.sort_rank || null,
  }));
  if (preferredBrokerId && recipients.length === 0) {
    return { ok: false, reason: "broker_not_contactable", recipients, roster: [] };
  }
  return {
    ok: true,
    routedToRoster: recipients.some((recipient) => recipient.recipientType === "broker"),
    recipients,
    roster: recipients.filter((recipient) => recipient.recipientType === "broker"),
  };
}

export function formatRoutingMetadata(routing) {
  return {
    recipient_ids: (routing.recipients || []).map((recipient) => recipient.recipientId),
    recipient_types: (routing.recipients || []).map((recipient) => recipient.recipientType),
    routed_to_roster: Boolean(routing.routedToRoster),
  };
}

export function resolveMockRouting(representations, propertyOwnerId, preferredBrokerId = null) {
  return buildLeadRouting({ representations, propertyOwnerId, preferredBrokerId });
}
