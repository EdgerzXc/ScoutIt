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

/**
 * Record a historical slug redirect in Supabase.
 * Maps an old or drifted slug to the canonical public slug.
 */
export async function recordHistoricalSlug({
  propertyId,
  oldSlug,
  canonicalSlug,
  staffId = null,
  reason = "Automated slug migration",
} = {}) {
  const normalizedOld = String(oldSlug || "").trim().toLowerCase();
  const normalizedCanonical = String(canonicalSlug || "").trim().toLowerCase();
  if (!supabaseAdmin || !propertyId || !normalizedOld || !normalizedCanonical) return null;
  if (normalizedOld === normalizedCanonical) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from("property_slug_history")
      .insert({
        property_id: String(propertyId),
        old_slug: normalizedOld,
        canonical_slug: normalizedCanonical,
        replaced_by_staff_id: staffId,
        reason,
      });

    if (error) {
      console.warn("[propertyRedirects] failed to record slug history:", error.message || error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("[propertyRedirects] error inserting slug history:", err?.message || err);
    return null;
  }
}

