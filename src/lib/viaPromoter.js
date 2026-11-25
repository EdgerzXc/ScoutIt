import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { VIA_STATUS } from "@/lib/viaRouting";

const VIA_SLUG_RE = /^[a-z0-9][a-z0-9-_]{0,79}$/i;
const PROPERTY_SLUG_RE = /^[a-z0-9][a-z0-9-_]{0,159}$/i;

export async function resolveViaPromoter(propertySlug, contactSlug, client = supabaseAdmin) {
  const invalid = { promoter: null, viaStatus: VIA_STATUS.INVALID };
  if (!client || !contactSlug || !VIA_SLUG_RE.test(contactSlug)) return invalid;
  if (!propertySlug || !PROPERTY_SLUG_RE.test(propertySlug)) return invalid;

  try {
    let { data: property } = await client
      .from("properties")
      .select("id")
      .eq("canonical_slug", propertySlug)
      .maybeSingle();
    if (!property) {
      ({ data: property } = await client
        .from("properties")
        .select("id")
        .eq("slug", propertySlug)
        .maybeSingle());
    }
    if (!property?.id) return invalid;

    const { data: link, error: linkError } = await client
      .from("via_share_links")
      .select("promoter_id, status")
      .eq("property_id", property.id)
      .eq("slug", contactSlug)
      .maybeSingle();
    if (linkError || !link || link.status !== "active" || !link.promoter_id) return invalid;

    const { data: profile } = await client
      .from("user_profiles")
      .select("id, display_name, avatar_url, headline, firm, is_profile_public")
      .eq("id", link.promoter_id)
      .maybeSingle();
    if (!profile) return invalid;

    // Private profiles still route, but their name and photo stay private.
    const promoter = profile.is_profile_public === true
      ? profile
      : { id: profile.id, display_name: null, avatar_url: null, headline: null, firm: null };
    return { promoter, viaStatus: VIA_STATUS.VALID };
  } catch {
    return invalid;
  }
}
