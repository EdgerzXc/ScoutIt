export async function isRoutedDealRecipient(supabaseAdmin, dealId, userId) {
  if (!supabaseAdmin || !dealId || !userId) return false;
  try {
    const tableRef = supabaseAdmin.from("deal_routing_recipients");
    if (!tableRef || typeof tableRef.select !== "function") return false;
    const { data, error } = await tableRef
      .select("deal_id")
      .eq("deal_id", dealId)
      .eq("recipient_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[dealParty] Routed recipient lookup failed:", error);
      return false;
    }
    return Boolean(data);
  } catch {
    return false;
  }
}
