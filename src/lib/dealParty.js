export async function isRoutedDealRecipient(supabaseAdmin, dealId, userId) {
  if (!supabaseAdmin || !dealId || !userId) return false;
  const { data, error } = await supabaseAdmin
    .from("deal_routing_recipients")
    .select("deal_id")
    .eq("deal_id", dealId)
    .eq("recipient_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[dealParty] Routed recipient lookup failed:", error);
    return false;
  }
  return Boolean(data);
}
