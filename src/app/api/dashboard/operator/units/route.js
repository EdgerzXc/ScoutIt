import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sanitizeObject } from "@/lib/sanitize";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { syncPropertyUnitsToAirtable } from "@/lib/unitsSync";

// Operator's restricted view/edit surface (SCOUTIT_MASTER_BUILD_SPEC.md §9.2):
// operators can rename, re-photo, and set availability on units delegated to
// them — never size/floor/features, never units belonging to someone else.
// Unlike /api/dashboard/units, this route never inserts or deletes rows —
// operators can't add/remove units, only edit fields on ones already
// delegated to them.

async function resolveUserId(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);
  return !error && user ? user.id : null;
}

function toClientUnit(row) {
  return {
    id: row.id,
    name: row.name || "",
    size: row.size_sqm ?? "",
    floor: row.floor || "",
    features: row.features || [],
    photos: row.photos || [],
    image: row.image || (row.photos && row.photos.find(Boolean)) || "",
    price: row.price || "",
    operatorId: row.operator_id || null,
    availabilityStatus: row.availability_status || null,
  };
}

// Lists every unit delegated to the caller, grouped by building.
export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data: units, error } = await supabaseAdmin
      .from("property_units")
      .select("*, properties(id, title, slug)")
      .eq("operator_id", userId)
      .order("property_id", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[OPERATOR UNITS API] GET error:", error);
      return NextResponse.json({ error: "Failed to load delegated units" }, { status: 500 });
    }

    const byProperty = new Map();
    for (const row of units) {
      const prop = row.properties;
      if (!prop) continue; // orphaned row safety — should not happen in practice
      if (!byProperty.has(prop.id)) {
        byProperty.set(prop.id, { propertyId: prop.id, propertyTitle: prop.title, propertySlug: prop.slug, units: [] });
      }
      byProperty.get(prop.id).units.push(toClientUnit(row));
    }

    return NextResponse.json({ buildings: [...byProperty.values()] });
  } catch (err) {
    console.error("[OPERATOR UNITS API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

const unitSchema = z.object({
  id: z.string(),
  name: z.string().max(200).optional().default(""),
  photos: z.array(z.string().max(2000)).optional().default([]),
  image: z.string().max(2000).optional().default(""),
  availabilityStatus: z.enum(["available", "occupied", "coming_soon"]).optional(),
});

const bodySchema = z.object({
  propertyId: z.string(),
  units: z.array(unitSchema).max(500),
});

// Saves operator-editable fields for units already delegated to the caller.
// Any unit in the payload not actually owned (operator_id) by the caller in
// this property is silently skipped, not trusted from the client.
export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { propertyId, units: incomingRaw } = parsed.data;
    const incoming = sanitizeObject(incomingRaw);

    const { data: property, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("id, slug, pipeline_status, title, location, type, space_category, details")
      .eq("id", propertyId)
      .single();
    if (propErr || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const { data: ownedUnits, error: ownedErr } = await supabaseAdmin
      .from("property_units")
      .select("id")
      .eq("property_id", propertyId)
      .eq("operator_id", userId);
    if (ownedErr) {
      return NextResponse.json({ error: "Failed to verify delegated units" }, { status: 500 });
    }
    const ownedIds = new Set(ownedUnits.map((u) => u.id));

    const toUpdate = incoming.filter((u) => ownedIds.has(u.id));
    const errors = [];
    
    if (toUpdate.length > 0) {
      // Execute all updates concurrently to avoid N+1 waterfall latency
      // This prevents the PostgREST heterogeneous key bulk upsert bug while
      // still dramatically improving performance over sequential await.
      const updatePromises = toUpdate.map(u => {
        const patch = {
          name: u.name || "",
          photos: u.photos || [],
          image: u.image || (u.photos || []).find(Boolean) || "",
          updated_at: new Date().toISOString(),
        };
        if (u.availabilityStatus) patch.availability_status = u.availabilityStatus;
        return supabaseAdmin.from("property_units").update(patch).eq("id", u.id);
      });

      const results = await Promise.all(updatePromises);
      for (const res of results) {
        if (res.error) errors.push(res.error);
      }
    }
    
    if (errors.length > 0) {
      console.error("[OPERATOR UNITS API] Write errors:", errors);
      return NextResponse.json({ error: "Failed to save one or more units" }, { status: 500 });
    }

    const { data: finalUnits, error: finalErr } = await supabaseAdmin
      .from("property_units")
      .select("*")
      .eq("property_id", propertyId)
      .eq("operator_id", userId);
    if (finalErr) {
      return NextResponse.json({ error: "Saved, but failed to reload units" }, { status: 500 });
    }

    let warning = null;
    try {
      await syncPropertyUnitsToAirtable(supabaseAdmin, property);
    } catch (airtableErr) {
      console.error("[OPERATOR UNITS API] Airtable sync failed:", airtableErr);
      warning = "Units saved, but Airtable sync failed: " + airtableErr.message;
    }

    return NextResponse.json({
      success: true,
      units: finalUnits.map(toClientUnit),
      ...(warning ? { warning } : {}),
    });
  } catch (err) {
    console.error("[OPERATOR UNITS API] POST error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
