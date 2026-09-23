/**
 * A-130 Open Gate authority. Staff-confirmed Enterprise access is separate
 * from the display tier. Every lookup fails closed until its migration exists.
 */
export async function isOpenGateAvailable(admin, propertyId, recipientId, role = "broker", unitId = null) {
  if (!admin || !propertyId || !recipientId) return false;
  try {
    const broker = role === "broker";
    if (!broker && !["owner", "operator"].includes(role)) return false;
    if (role === "operator" && !unitId) return false;
    if (role !== "operator" && unitId) return false;
    const entitlementQuery = broker
      ? admin.from("open_gate_entitlements").select("enabled, expires_at").eq("broker_id", recipientId)
      : admin.from("open_gate_role_entitlements").select("enabled, expires_at").eq("account_id", recipientId).eq("role", role);
    let listingQuery = broker
      ? admin.from("open_gate_listings").select("enabled").eq("property_id", propertyId).eq("broker_id", recipientId)
      : admin.from("open_gate_role_listings").select("enabled").eq("property_id", propertyId).eq("recipient_id", recipientId).eq("role", role);
    if (role === "owner") listingQuery = listingQuery.is("unit_id", null);
    if (role === "operator") listingQuery = listingQuery.eq("unit_id", unitId);
    const [entitlementResult, listingResult] = await Promise.all([
      entitlementQuery.maybeSingle(), listingQuery.maybeSingle(),
    ]);
    if (entitlementResult.error || listingResult.error) return false;
    const entitlement = entitlementResult.data;
    if (entitlement?.enabled !== true || listingResult.data?.enabled !== true) return false;
    if (!entitlement.expires_at || Date.parse(entitlement.expires_at) <= Date.now()) return false;
    if (role === "owner") {
      const { data: property, error } = await admin.from("properties")
        .select("owner_id").eq("id", propertyId).maybeSingle();
      return !error && property?.owner_id === recipientId;
    }
    if (role === "operator") {
      const { data: unit, error } = await admin.from("property_units")
        .select("operator_id, property_id").eq("id", unitId).maybeSingle();
      return !error && unit?.operator_id === recipientId && unit?.property_id === propertyId;
    }
    return true;
  } catch {
    return false;
  }
}

export function freeInboundRecipient(recipientIds, preferredBrokerId, unitId, role) {
  return role === "buyer" && !unitId && Boolean(preferredBrokerId)
    && Array.isArray(recipientIds) && recipientIds.length === 1
    && recipientIds[0] === preferredBrokerId;
}

export function freeInboundTarget(recipientIds, targetId, unitId, senderRole) {
  return senderRole === "buyer" && Boolean(targetId)
    && Array.isArray(recipientIds) && recipientIds.length === 1
    && recipientIds[0] === targetId;
}

export function openGateContactRevealed(deal) {
  return deal?.open_gate_inbound === true
    && ["accepted", "active", "connected"].includes(deal.status);
}
