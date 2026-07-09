import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Read side of the CRM Timeline (crm_activity_log). Three shapes:
//   ?dealId=      -> one deal's timeline (caller must be a party to it)
//   ?propertyId=  -> one property's timeline (caller must own it)
//   (neither)     -> merged feed across every deal the caller is party to
//                    and every property they own, newest first.
// Writes never happen here -- lifecycle routes (initiate, status change,
// notes, viewings) insert rows via lib/crmActivity.js.

async function resolveUserId(request, mockOwnerId) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;
  if (token && token.trim() !== "") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (!error && user) return user.id;
  }
  // Dev-only fallback -- rejected in production, where identity must come
  // from a verified session token (same gate as /api/dashboard/publish).
  if (process.env.NODE_ENV !== "production" && mockOwnerId) return mockOwnerId;
  return null;
}

const ACTIVITY_FIELDS = "id, deal_id, property_id, activity_type, actor_id, metadata, created_at";

function mapRow(row, propertyTitleById = {}) {
  return {
    id: row.id,
    dealId: row.deal_id,
    propertyId: row.property_id,
    propertyTitle: row.property_id ? propertyTitleById[row.property_id] || null : null,
    activityType: row.activity_type,
    actorId: row.actor_id,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");
    const propertyId = searchParams.get("propertyId");
    const userId = await resolveUserId(request, searchParams.get("mockOwnerId"));
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });

    if (dealId) {
      const { data: deal, error: dealError } = await supabaseAdmin
        .from("deals")
        .select("buyer_id, broker_id, properties(owner_id)")
        .eq("id", dealId)
        .single();
      if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      const isParty =
        deal.buyer_id === userId ||
        deal.broker_id === userId ||
        deal.properties?.owner_id === userId;
      if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const { data: rows, error } = await supabaseAdmin
        .from("crm_activity_log")
        .select(ACTIVITY_FIELDS)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("[CRM ACTIVITY API] deal fetch error:", error);
        return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
      }
      return NextResponse.json({ activity: (rows || []).map((r) => mapRow(r)) });
    }

    if (propertyId) {
      const { data: property, error: propError } = await supabaseAdmin
        .from("properties")
        .select("owner_id, title")
        .eq("id", propertyId)
        .single();
      if (propError || !property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
      if (property.owner_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const { data: rows, error } = await supabaseAdmin
        .from("crm_activity_log")
        .select(ACTIVITY_FIELDS)
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("[CRM ACTIVITY API] property fetch error:", error);
        return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
      }
      const titles = { [propertyId]: property.title };
      return NextResponse.json({ activity: (rows || []).map((r) => mapRow(r, titles)) });
    }

    // Merged feed: everything on the user's deals + everything on their
    // properties. Party membership is resolved server-side, same three
    // angles as GET /api/deals.
    const [asBuyer, asBroker, ownedProps] = await Promise.all([
      supabaseAdmin.from("deals").select("id").eq("buyer_id", userId),
      supabaseAdmin.from("deals").select("id").eq("broker_id", userId),
      supabaseAdmin.from("properties").select("id, title").eq("owner_id", userId),
    ]);
    const dealIds = [...new Set([...(asBuyer.data || []), ...(asBroker.data || [])].map((d) => d.id))];
    const propertyIds = (ownedProps.data || []).map((p) => p.id);
    const propertyTitleById = Object.fromEntries((ownedProps.data || []).map((p) => [p.id, p.title]));

    if (dealIds.length === 0 && propertyIds.length === 0) {
      return NextResponse.json({ activity: [] });
    }

    const queries = [];
    if (dealIds.length > 0) {
      queries.push(
        supabaseAdmin.from("crm_activity_log").select(ACTIVITY_FIELDS)
          .in("deal_id", dealIds).order("created_at", { ascending: false }).limit(50)
      );
    }
    if (propertyIds.length > 0) {
      queries.push(
        supabaseAdmin.from("crm_activity_log").select(ACTIVITY_FIELDS)
          .in("property_id", propertyIds).order("created_at", { ascending: false }).limit(50)
      );
    }
    const results = await Promise.all(queries);
    const failed = results.find((r) => r.error);
    if (failed) {
      console.error("[CRM ACTIVITY API] merged fetch error:", failed.error);
      return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
    }

    const byId = new Map();
    for (const r of results.flatMap((res) => res.data || [])) byId.set(r.id, r);
    const merged = [...byId.values()]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50);

    // Fill titles for deal-only rows whose property isn't owned by the caller.
    const missingPropIds = [...new Set(merged.map((r) => r.property_id).filter((id) => id && !propertyTitleById[id]))];
    if (missingPropIds.length > 0) {
      const { data: extraProps } = await supabaseAdmin.from("properties").select("id, title").in("id", missingPropIds);
      for (const p of extraProps || []) propertyTitleById[p.id] = p.title;
    }

    return NextResponse.json({ activity: merged.map((r) => mapRow(r, propertyTitleById)) });
  } catch (err) {
    console.error("[CRM ACTIVITY API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
