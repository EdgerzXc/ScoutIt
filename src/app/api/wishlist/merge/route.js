import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { BOARD_SYNC_BATCH_SIZE } from "@/lib/boardSync";
import { looksLikeUuid } from "@/lib/propertyLookup";

const REACTION_TYPES = new Set(["Save", "Inspired Me", "Potential Fit", "Interested"]);
const PROPERTY_FIELDS = "id, canonical_slug";
const LOOKUP_BATCH_SIZE = 50;

async function lookupProperties(column, keys) {
  const matches = new Map();
  for (let start = 0; start < keys.length; start += LOOKUP_BATCH_SIZE) {
    const { data, error } = await supabaseAdmin.from("properties")
      .select(PROPERTY_FIELDS)
      .eq("pipeline_status", "approved")
      .in(column, keys.slice(start, start + LOOKUP_BATCH_SIZE));
    if (error) throw error;
    for (const property of data || []) matches.set(property[column], property);
  }
  return matches;
}

async function resolveProperties(keys) {
  const uuids = keys.filter(looksLikeUuid).map((id) => id.toLowerCase());
  const slugs = keys.filter((key) => !looksLikeUuid(key));
  const [byId, bySlug] = await Promise.all([
    lookupProperties("id", [...new Set(uuids)]),
    lookupProperties("canonical_slug", slugs),
  ]);
  return keys.flatMap((inputId) => {
    const property = looksLikeUuid(inputId) ? byId.get(inputId.toLowerCase()) : bySlug.get(inputId);
    return property ? [{ inputId, propertyId: property.id, slug: property.canonical_slug }] : [];
  });
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Sign in to sync your Board." }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Board sync is unavailable." }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    const items = Array.isArray(body?.items) ? body.items : null;
    const propertyIds = Array.isArray(body?.propertyIds) ? body.propertyIds : null;
    if (!items && !propertyIds) {
      return NextResponse.json({ error: "Invalid Board sync request." }, { status: 400 });
    }
    if (propertyIds?.length > BOARD_SYNC_BATCH_SIZE || items?.length > BOARD_SYNC_BATCH_SIZE) {
      return NextResponse.json({ error: "Too many spaces in one sync request." }, { status: 413 });
    }

    const ids = propertyIds ?? items.map((item) => item?.property_id);
    const reactions = new Map(items?.map((item) => [
      typeof item?.property_id === "string" ? item.property_id.trim() : null,
      REACTION_TYPES.has(item?.reaction_type) ? item.reaction_type : "Save",
    ]));
    const keys = [...new Set(ids.filter((id) => typeof id === "string").map((id) => id.trim()))]
      .filter((id) => /^[A-Za-z0-9_-]{1,256}$/.test(id));
    const confirmedProperties = await resolveProperties(keys);
    const rows = new Map();
    for (const { inputId, propertyId } of confirmedProperties) {
      if (rows.has(propertyId)) continue;
      rows.set(propertyId, {
        user_id: userId,
        property_id: propertyId,
        reaction_type: reactions.get(inputId) || "Save",
      });
    }

    const confirmedPropertyIds = confirmedProperties.map(({ inputId }) => inputId);
    if (rows.size === 0) {
      return NextResponse.json({ merged: 0, alreadyHad: 0, confirmedPropertyIds, confirmedProperties });
    }

    const { data, error } = await supabaseAdmin
      .from("saved_intel")
      .upsert([...rows.values()], { onConflict: "user_id,property_id", ignoreDuplicates: true })
      .select("property_id");

    if (error) {
      console.error("[WISHLIST MERGE] Failed to save spaces:", error.code);
      return NextResponse.json({ error: "Couldn't sync these spaces." }, { status: 500 });
    }

    const merged = data?.length ?? 0;
    return NextResponse.json({ merged, alreadyHad: rows.size - merged, confirmedPropertyIds, confirmedProperties });
  } catch (err) {
    console.error("[WISHLIST MERGE] Error:", err?.name);
    return NextResponse.json({ error: "Couldn't sync these spaces." }, { status: 500 });
  }
}
