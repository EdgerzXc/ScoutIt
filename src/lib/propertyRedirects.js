import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getHistoricalPropertyRedirect(slug) {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized || !supabaseAdmin) return null;

  // 1. Check primary property_slug_history table
  const { data: historyMatch, error: historyErr } = await supabaseAdmin
    .from("property_slug_history")
    .select("canonical_slug")
    .eq("old_slug", normalized)
    .maybeSingle();

  if (!historyErr && historyMatch?.canonical_slug) {
    return historyMatch.canonical_slug;
  }

  // 2. Fallback check for property_slug_redirects view/table
  const { data: legacyMatch, error: legacyErr } = await supabaseAdmin
    .from("property_slug_redirects")
    .select("current_slug")
    .eq("old_slug", normalized)
    .maybeSingle();

  if (!legacyErr && legacyMatch?.current_slug) {
    return legacyMatch.current_slug;
  }

  return null;
}
