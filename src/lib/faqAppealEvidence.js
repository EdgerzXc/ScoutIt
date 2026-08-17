import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isFaqAppealActive } from "@/lib/faqAppealGate";

export async function issueFaqBlockEvidence({ userId, propertyId, faqId = null, preflightKey = null, ruleCode, context }) {
  if (!isFaqAppealActive() || !supabaseAdmin || !userId || !propertyId || !ruleCode || !context) return null;
  const { data, error } = await supabaseAdmin.from("faq_block_evidence").insert({
    user_id: userId,
    property_id: propertyId,
    faq_id: faqId,
    preflight_key: preflightKey,
    rule_code: ruleCode,
    block_context: context,
  }).select("id").single();
  if (error || !data?.id) {
    console.warn("[faq-appeal] Could not persist block evidence:", error?.message || "missing receipt");
    return null;
  }
  return data.id;
}