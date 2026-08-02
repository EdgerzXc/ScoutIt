import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { canReadOffMarket } from "@/lib/serverEntitlements";
import { isOffMarket } from "@/lib/propertyLifecycle";
import { sanitizeError } from "@/lib/sanitizeError";

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server configuration unavailable" }, { status: 500 });

    const slug = new URL(request.url).searchParams.get("slug");
    let query = supabaseAdmin
      .from("properties")
      .select("id, owner_id, slug, canonical_slug, title, location, type, space_category, lifecycle_state, pipeline_status, quietly_open_to_offers, withdrawn_at, last_verified_date")
      .in("lifecycle_state", ["off_market"])
      .order("withdrawn_at", { ascending: false });

    if (slug) query = query.eq("canonical_slug", slug);
    const { data: rows, error } = await query;
    if (error) return NextResponse.json({ error: "Unable to read off-market inventory" }, { status: 500 });

    const visible = [];
    for (const row of rows || []) {
      const entitlement = await canReadOffMarket({
        supabaseAdmin,
        userId,
        propertyOwnerId: row.owner_id,
      });
      if (!entitlement.allowed || !isOffMarket(row)) continue;

      visible.push({
        id: row.id,
        slug: row.canonical_slug || row.slug,
        title: row.title,
        location: row.location,
        type: row.type,
        spaceCategory: row.space_category,
        quietlyOpenToOffers: row.quietly_open_to_offers === true,
        withdrawnAt: row.withdrawn_at,
        lastVerifiedDate: row.last_verified_date || null,
        contactAvailable: row.quietly_open_to_offers === true,
      });
    }

    if (slug && visible.length === 0) {
      return NextResponse.json({ error: "Off-market property not found or not entitled" }, { status: 404 });
    }
    return NextResponse.json({ properties: visible });
  } catch (error) {
    console.error("[OFF-MARKET API] Error:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
