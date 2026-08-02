import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getHistoricalPropertyRedirect(slug) {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized || !supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("property_slug_redirects")
    .select("current_slug")
    .eq("old_slug", normalized)
    .maybeSingle();

  if (error || !data?.current_slug) return null;
  return data.current_slug;
}
