import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { resolveViaEligibility } from "@/lib/serverViaEligibility";

export const dynamic = "force-dynamic";

const PUBLIC_RESPONSE = Object.freeze({
  eligible: false,
  promoterType: null,
  promoterSlug: null,
  displayName: null,
});

// Property identifiers are slugs or UUIDs. Anything else cannot match and must
// never reach a PostgREST filter string.
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

/**
 * A-193: tells the Share modal whether the caller may promote this property with a
 * verified VIA priority link. Anonymous and unrelated callers always get the same
 * quiet "not eligible" answer — the modal then offers the public canonical link.
 */
export async function GET(request, { params }) {
  try {
    const { id: slug } = await params;
    if (!slug || !SAFE_ID.test(slug)) {
      return NextResponse.json(PUBLIC_RESPONSE, { headers: { "Cache-Control": "no-store" } });
    }

    const userId = await resolveUserId(request);
    if (!userId || !supabaseAdmin) {
      return NextResponse.json(PUBLIC_RESPONSE, { headers: { "Cache-Control": "no-store" } });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const filter = `canonical_slug.eq.${slug},slug.eq.${slug}${isUuid ? `,id.eq.${slug}` : ""}`;
    const { data: property } = await supabaseAdmin
      .from("properties")
      .select("id")
      .or(filter)
      .maybeSingle();

    if (!property?.id) {
      return NextResponse.json(PUBLIC_RESPONSE, { headers: { "Cache-Control": "no-store" } });
    }

    const result = await resolveViaEligibility(supabaseAdmin, {
      propertyId: property.id,
      userId,
    });

    return NextResponse.json(
      {
        eligible: result.eligible,
        promoterType: result.promoterType,
        promoterSlug: result.promoterSlug,
        displayName: result.displayName,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[VIA eligibility GET] Exception:", err);
    // Sharing must never break: fall back to the public canonical link.
    return NextResponse.json(PUBLIC_RESPONSE, { headers: { "Cache-Control": "no-store" } });
  }
}
