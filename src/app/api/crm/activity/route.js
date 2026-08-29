import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isKnownActivityType } from "@/lib/crm/activityRegistry";

export const dynamic = "force-dynamic";

// Read side of the CRM Timeline (crm_activity_log). Three shapes:
//   ?dealId=      -> one deal's timeline (caller must be a party to it)
//   ?propertyId=  -> one property's timeline (caller must own it)
//   (neither)     -> merged feed across every deal the caller is party to
//                    and every property they own, newest first.
// Writes never happen here — lifecycle routes insert rows via lib/crmActivity.js.
//
// The merged feed used to run two separate 50-row queries and slice the
// combined result to 50, so a user with busy properties could have their deal
// activity pushed out entirely and never see it, on any page. It is now ONE
// ordered query with a keyset cursor, so "load more" reaches everything.

const ACTIVITY_FIELDS = "id, deal_id, property_id, activity_type, actor_id, metadata, created_at";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapRow(row, propertyTitleById = {}) {
  return {
    id: row.id,
    dealId: row.deal_id,
    propertyId: row.property_id,
    propertyTitle: row.property_id ? propertyTitleById[row.property_id] || null : null,
    activityType: row.activity_type,
    // Flags a row written with a type the registry does not know, so a broken
    // writer surfaces instead of rendering as a raw snake_case string forever.
    isKnownType: isKnownActivityType(row.activity_type),
    actorId: row.actor_id,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

/**
 * Keyset cursor. created_at alone is not a total order — two rows written in
 * the same transaction share it — so the id breaks the tie and the cursor
 * carries both. An offset would skip or repeat rows as new activity arrives.
 */
function encodeCursor(row) {
  return Buffer.from(`${row.created_at}|${row.id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor) {
  try {
    const [createdAt, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
    if (!createdAt || !id) return null;
    if (Number.isNaN(new Date(createdAt).getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

function applyCursor(query, cursor) {
  if (!cursor) return query;
  // (created_at < X) OR (created_at = X AND id < Y)
  return query.or(
    `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
  );
}

function ordered(query, limit) {
  return query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1); // one extra row tells us whether another page exists
}

function page(rows, limit, propertyTitleById = {}) {
  const hasMore = rows.length > limit;
  const visible = hasMore ? rows.slice(0, limit) : rows;
  return {
    activity: visible.map((r) => mapRow(r, propertyTitleById)),
    nextCursor: hasMore && visible.length > 0 ? encodeCursor(visible[visible.length - 1]) : null,
    hasMore,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");
    const propertyId = searchParams.get("propertyId");
    const cursor = searchParams.get("cursor") ? decodeCursor(searchParams.get("cursor")) : null;
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const limitRaw = searchParams.get("limit");
    const requestedLimit = limitRaw === null ? DEFAULT_LIMIT : Number(limitRaw);
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return NextResponse.json({ error: "Limit must be a positive whole number" }, { status: 400 });
    }
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    if ((dealId && !UUID_RE.test(dealId)) || (propertyId && !UUID_RE.test(propertyId))) {
      return NextResponse.json({ error: "Invalid record id" }, { status: 400 });
    }

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

      const { data: rows, error } = await ordered(
        applyCursor(
          supabaseAdmin.from("crm_activity_log").select(ACTIVITY_FIELDS).eq("deal_id", dealId),
          cursor,
        ),
        limit,
      );
      if (error) {
        console.error("[CRM ACTIVITY API] deal fetch error:", error);
        return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
      }
      return NextResponse.json(page(rows || [], limit));
    }

    if (propertyId) {
      const { data: property, error: propError } = await supabaseAdmin
        .from("properties")
        .select("owner_id, title")
        .eq("id", propertyId)
        .single();
      if (propError || !property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
      if (property.owner_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const { data: rows, error } = await ordered(
        applyCursor(
          supabaseAdmin.from("crm_activity_log").select(ACTIVITY_FIELDS).eq("property_id", propertyId),
          cursor,
        ),
        limit,
      );
      if (error) {
        console.error("[CRM ACTIVITY API] property fetch error:", error);
        return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
      }
      return NextResponse.json(page(rows || [], limit, { [propertyId]: property.title }));
    }

    // Merged feed. Party membership is resolved server-side, same three angles
    // as GET /api/deals.
    const [asBuyer, asBroker, ownedProps] = await Promise.all([
      supabaseAdmin.from("deals").select("id").eq("buyer_id", userId),
      supabaseAdmin.from("deals").select("id").eq("broker_id", userId),
      supabaseAdmin.from("properties").select("id, title").eq("owner_id", userId),
    ]);
    if (asBuyer.error || asBroker.error || ownedProps.error) {
      console.error(
        "[CRM ACTIVITY API] scope lookup error:",
        asBuyer.error || asBroker.error || ownedProps.error,
      );
      return NextResponse.json({ error: "Failed to load timeline scope" }, { status: 500 });
    }

    const propertyIds = (ownedProps.data || []).map((p) => p.id);
    const propertyTitleById = Object.fromEntries((ownedProps.data || []).map((p) => [p.id, p.title]));
    const asOwner = propertyIds.length > 0
      ? await supabaseAdmin.from("deals").select("id").in("property_id", propertyIds)
      : { data: [], error: null };
    if (asOwner.error) {
      console.error("[CRM ACTIVITY API] owner deal lookup error:", asOwner.error);
      return NextResponse.json({ error: "Failed to load timeline scope" }, { status: 500 });
    }
    const dealIds = [...new Set([
      ...(asBuyer.data || []),
      ...(asBroker.data || []),
      ...(asOwner.data || []),
    ].map((d) => d.id))];

    if (dealIds.length === 0 && propertyIds.length === 0) {
      return NextResponse.json({ activity: [], nextCursor: null, hasMore: false });
    }

    // ONE query over the union of both scopes. The two .or() calls AND together
    // in PostgREST — (scope) AND (cursor) — which is exactly the pagination
    // predicate we want.
    const scopeClauses = [];
    if (dealIds.length > 0) scopeClauses.push(`deal_id.in.(${dealIds.join(",")})`);
    if (propertyIds.length > 0) scopeClauses.push(`property_id.in.(${propertyIds.join(",")})`);

    const { data: rows, error } = await ordered(
      applyCursor(
        supabaseAdmin.from("crm_activity_log").select(ACTIVITY_FIELDS).or(scopeClauses.join(",")),
        cursor,
      ),
      limit,
    );

    if (error) {
      console.error("[CRM ACTIVITY API] merged fetch error:", error);
      return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
    }

    const result = page(rows || [], limit, propertyTitleById);

    // Fill titles for rows whose property the caller does not own (they reach
    // the feed through the deal side).
    const missing = [...new Set(
      result.activity.filter((r) => r.propertyId && !r.propertyTitle).map((r) => r.propertyId),
    )];
    if (missing.length > 0) {
      const { data: extra } = await supabaseAdmin
        .from("properties").select("id, title").in("id", missing);
      const extraTitles = Object.fromEntries((extra || []).map((p) => [p.id, p.title]));
      result.activity = result.activity.map((r) => (
        r.propertyId && !r.propertyTitle
          ? { ...r, propertyTitle: extraTitles[r.propertyId] || null }
          : r
      ));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[CRM ACTIVITY API] GET error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
