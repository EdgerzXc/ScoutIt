import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sanitizeObject } from "@/lib/sanitize";
import { syncPropertyUnitsToAirtable } from "@/lib/unitsSync";
import { notifyAttachedBrokers } from "@/lib/notifications";

// Matches a real Postgres uuid (property_units.id). Client-side temp ids from
// InventoryGridManager's newId() (Date.now().toString(36) + random) never match
// this shape, so it's a safe way to tell "existing row" from "not saved yet".
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const unitSchema = z.object({
  id: z.string().max(64),
  name: z.string().max(200).optional().default(""),
  size: z.union([z.string(), z.number()]).optional(),
  floor: z.union([z.string(), z.number()]).optional(),
  features: z.array(z.string().max(100)).optional().default([]),
  photos: z.array(z.string().max(2000)).optional().default([]),
  image: z.string().max(2000).optional().default(""),
  price: z.union([z.string(), z.number()]).optional(),
});

const bodySchema = z.object({
  propertyId: z.string(),
  units: z.array(unitSchema).max(500),
  mockOwnerId: z.string().optional(),
});

function authClientFor() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(supabaseUrl, supabaseAnonKey);
}

function serviceClientFor() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Ownership is verified in application code below — RLS on property_units
  // is currently a dev_all_* passthrough (see VULNERABILITY_AUDIT_2026-06-26.md),
  // so the service client is required, not just convenient.
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

async function resolveUserId(request, mockOwnerId) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;

  if (token && token.trim() !== "") {
    const { data: { user }, error } = await authClientFor().auth.getUser(token);
    if (!error && user) return user.id;
  }
  if (mockOwnerId === "master-dev") return "master-dev";
  return null;
}

// Shape a DB row the way the dashboard client (InventoryGridManager) expects.
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
    operatorDisplayName: row.operator_display_name || null,
    availabilityStatus: row.availability_status || null,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const mockOwnerId = searchParams.get("mockOwnerId");
    if (!propertyId) {
      return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
    }

    const userId = await resolveUserId(request, mockOwnerId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }

    const serviceClient = serviceClientFor();
    const { data: property, error: propErr } = await serviceClient
      .from("properties")
      .select("id, owner_id")
      .eq("id", propertyId)
      .single();

    if (propErr || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (property.owner_id !== userId) {
      return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    }

    const { data: units, error: unitsErr } = await serviceClient
      .from("property_units")
      .select("*")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true });

    if (unitsErr) {
      console.error("[UNITS API] Failed to fetch units:", unitsErr);
      return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
    }

    const displayNames = await resolveOperatorDisplayNames(serviceClient, units);
    return NextResponse.json({
      units: units.map((u) => toClientUnit({ ...u, operator_display_name: displayNames[u.operator_id] })),
    });
  } catch (err) {
    console.error("[UNITS API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

async function resolveOperatorDisplayNames(serviceClient, units) {
  const operatorIds = [...new Set(units.map((u) => u.operator_id).filter(Boolean))];
  if (operatorIds.length === 0) return {};
  const { data: profiles } = await serviceClient
    .from("user_profiles")
    .select("id, display_name")
    .in("id", operatorIds);
  const map = {};
  for (const p of profiles || []) map[p.id] = p.display_name;
  return map;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { propertyId, units: incomingRaw, mockOwnerId } = parsed.data;
    const incoming = sanitizeObject(incomingRaw);

    const userId = await resolveUserId(request, mockOwnerId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }

    const serviceClient = serviceClientFor();
    const { data: property, error: propErr } = await serviceClient
      .from("properties")
      .select("id, owner_id, slug, pipeline_status, title, location, type, space_category, details")
      .eq("id", propertyId)
      .single();

    if (propErr || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (property.owner_id !== userId) {
      return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    }

    const { data: existingUnits, error: existingErr } = await serviceClient
      .from("property_units")
      .select("*")
      .eq("property_id", propertyId);

    if (existingErr) {
      console.error("[UNITS API] Failed to fetch existing units:", existingErr);
      return NextResponse.json({ error: "Failed to load existing units" }, { status: 500 });
    }

    // Delegated units (operator_id set) are pinned: this general owner route
    // never edits or deletes them by omission, regardless of what the client
    // sends. Only /api/dashboard/units/delegate can set/clear operator_id.
    const delegatedExisting = existingUnits.filter((u) => u.operator_id);
    const delegatedIds = new Set(delegatedExisting.map((u) => u.id));
    const ownerManagedExisting = existingUnits.filter((u) => !u.operator_id);
    const ownerManagedIds = new Set(ownerManagedExisting.map((u) => u.id));

    const incomingOwnerManaged = incoming.filter((u) => !delegatedIds.has(u.id));

    const toUpdate = incomingOwnerManaged.filter((u) => UUID_RE.test(u.id) && ownerManagedIds.has(u.id));
    const toInsert = incomingOwnerManaged.filter((u) => !(UUID_RE.test(u.id) && ownerManagedIds.has(u.id)));
    const incomingIds = new Set(incomingOwnerManaged.map((u) => u.id));
    const toDelete = ownerManagedExisting.filter((u) => !incomingIds.has(u.id));

    const errors = [];

    for (const [index, u] of toUpdate.entries()) {
      const { error } = await serviceClient
        .from("property_units")
        .update({
          name: u.name || "",
          size_sqm: u.size === "" || u.size === undefined ? null : Number(u.size) || null,
          floor: u.floor != null ? String(u.floor) : "",
          features: u.features || [],
          photos: u.photos || [],
          image: u.image || (u.photos || []).find(Boolean) || "",
          price: u.price != null ? String(u.price) : "",
          sort_order: index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", u.id)
        .eq("property_id", propertyId);
      if (error) errors.push(error);
    }

    const insertedIdByTempId = {};
    if (toInsert.length > 0) {
      const insertPayload = toInsert.map((u, i) => ({
        property_id: propertyId,
        name: u.name || "",
        size_sqm: u.size === "" || u.size === undefined ? null : Number(u.size) || null,
        floor: u.floor != null ? String(u.floor) : "",
        features: u.features || [],
        photos: u.photos || [],
        image: u.image || (u.photos || []).find(Boolean) || "",
        price: u.price != null ? String(u.price) : "",
        sort_order: toUpdate.length + i,
      }));
      const { data: inserted, error } = await serviceClient
        .from("property_units")
        .insert(insertPayload)
        .select();
      if (error) {
        errors.push(error);
      } else {
        inserted.forEach((row, i) => {
          insertedIdByTempId[toInsert[i].id] = row.id;
        });
      }
    }

    if (toDelete.length > 0) {
      const { error } = await serviceClient
        .from("property_units")
        .delete()
        .in("id", toDelete.map((u) => u.id));
      if (error) errors.push(error);
    }

    if (errors.length > 0) {
      console.error("[UNITS API] Write errors:", errors);
      return NextResponse.json({ error: "Failed to save one or more units" }, { status: 500 });
    }

    // Re-fetch the final, authoritative set (owner-managed + untouched delegated).
    const { data: finalUnits, error: finalErr } = await serviceClient
      .from("property_units")
      .select("*")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true });

    if (finalErr) {
      return NextResponse.json({ error: "Saved, but failed to reload units" }, { status: 500 });
    }

    const displayNames = await resolveOperatorDisplayNames(serviceClient, finalUnits);
    const clientUnits = finalUnits.map((u) => toClientUnit({ ...u, operator_display_name: displayNames[u.operator_id] }));

    let warning = null;
    try {
      await syncPropertyUnitsToAirtable(serviceClient, property);
    } catch (airtableErr) {
      console.error("[UNITS API] Airtable sync failed:", airtableErr);
      warning = "Units saved, but Airtable sync failed: " + airtableErr.message;
    }

    // Broker-on-change alert — only for structural inventory changes (units
    // added/removed), not every field edit on an existing unit (Track 1,
    // PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md).
    if (property.pipeline_status === 'approved' && (toInsert.length > 0 || toDelete.length > 0)) {
      await notifyAttachedBrokers(serviceClient, {
        propertyId: propertyId,
        title: "Unit inventory changed",
        desc: `"${property.title}" had units added or removed.`,
        icon: "🏢",
        notificationType: "property_changed",
        excludeUserId: userId,
      });
    }

    // Map any client temp ids back so the caller can reconcile local state.
    return NextResponse.json({
      success: true,
      units: clientUnits,
      insertedIdByTempId,
      ...(warning ? { warning } : {}),
    });
  } catch (err) {
    console.error("[UNITS API] POST error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
