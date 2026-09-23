import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";

const privateHeaders = { "Cache-Control": "private, no-store" };
const roles = new Set(["broker", "owner", "operator"]);
const json = (body, status = 200) => NextResponse.json(body, { status, headers: privateHeaders });

async function accountSession(request, role) {
  const accountId = await resolveUserId(request);
  if (!accountId || !supabaseAdmin || !roles.has(role)) return null;
  const { data: profile, error } = await supabaseAdmin.from("user_profiles")
    .select("role, active_roles").eq("id", accountId).maybeSingle();
  if (error || !profile || !(profile.role === role || profile.active_roles?.includes(role))) return null;
  return accountId;
}

async function entitlementFor(accountId, role) {
  const query = role === "broker"
    ? supabaseAdmin.from("open_gate_entitlements").select("enabled, expires_at").eq("broker_id", accountId)
    : supabaseAdmin.from("open_gate_role_entitlements").select("enabled, expires_at").eq("account_id", accountId).eq("role", role);
  return query.maybeSingle();
}

async function controlledListings(accountId, role) {
  if (role === "broker") {
    const result = await supabaseAdmin.from("property_broker_representations")
      .select("property_id, status, properties(title, slug, lifecycle_state, pipeline_status)").eq("broker_id", accountId).eq("status", "active");
    return { ...result, data: (result.data || []).filter(row => row.properties && normalizeLifecycleState(row.properties) === PROPERTY_LIFECYCLE_STATES.LIVE).map(row => ({
      propertyId: row.property_id, unitId: null, title: row.properties?.title || "Property", slug: row.properties?.slug || null,
    })) };
  }
  if (role === "owner") {
    const result = await supabaseAdmin.from("properties")
      .select("id, title, slug, lifecycle_state, pipeline_status").eq("owner_id", accountId);
    return { ...result, data: (result.data || []).filter(row => normalizeLifecycleState(row) === PROPERTY_LIFECYCLE_STATES.LIVE).map(row => ({ propertyId: row.id, unitId: null, title: row.title || "Property", slug: row.slug || null })) };
  }
  const result = await supabaseAdmin.from("property_units")
    .select("id, property_id, name, properties(title, slug, lifecycle_state, pipeline_status)").eq("operator_id", accountId);
  return { ...result, data: (result.data || []).filter(row => row.properties && normalizeLifecycleState(row.properties) === PROPERTY_LIFECYCLE_STATES.LIVE).map(row => ({
    propertyId: row.property_id, unitId: row.id,
    title: `${row.properties?.title || "Property"} · ${row.name || "Unit"}`,
    slug: row.properties?.slug || null,
  })) };
}

export async function GET(request) {
  const role = new URL(request.url).searchParams.get("role") || "broker";
  const accountId = await accountSession(request, role);
  if (!accountId) return json({ error: "Eligible account sign-in required" }, 403);
  const [entitlementResult, listingsResult, gatesResult] = await Promise.all([
    entitlementFor(accountId, role), controlledListings(accountId, role),
    role === "broker"
      ? supabaseAdmin.from("open_gate_listings").select("property_id, enabled").eq("broker_id", accountId)
      : supabaseAdmin.from("open_gate_role_listings").select("property_id, unit_id, enabled").eq("recipient_id", accountId).eq("role", role),
  ]);
  if (entitlementResult.error || listingsResult.error || gatesResult.error) return json({ error: "Open Gate is not available yet" }, 503);
  const entitlement = entitlementResult.data;
  const eligible = entitlement?.enabled === true && Boolean(entitlement.expires_at)
    && Date.parse(entitlement.expires_at) > Date.now();
  const gates = new Map((gatesResult.data || []).map(row => [`${row.property_id}:${row.unit_id || ""}`, row.enabled === true]));
  return json({
    role, eligible, expiresAt: entitlement?.expires_at || null,
    listings: (listingsResult.data || []).map(row => ({
      id: row.propertyId, unitId: row.unitId, title: row.title, slug: row.slug,
      enabled: eligible && gates.get(`${row.propertyId}:${row.unitId || ""}`) === true,
    })),
  });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const role = body?.role || "broker";
  const accountId = await accountSession(request, role);
  if (!accountId) return json({ error: "Eligible account sign-in required" }, 403);
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : "";
  const unitId = role === "operator" && typeof body?.unitId === "string" ? body.unitId : null;
  const enabled = body?.enabled;
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(propertyId) || (role === "operator" && !uuid.test(unitId || "")) || typeof enabled !== "boolean") {
    return json({ error: "Invalid target or gate choice" }, 400);
  }
  const controlled = await controlledListings(accountId, role);
  if (controlled.error || !(controlled.data || []).some(row => row.propertyId === propertyId && row.unitId === unitId)) {
    return json({ error: "Active control of this target is required" }, 403);
  }
  if (role === "broker" && enabled) {
    const { data: rep, error } = await supabaseAdmin.from("property_broker_representations")
      .select("visible_to_public, contactable, account_eligible, inventory_eligible")
      .eq("property_id", propertyId).eq("broker_id", accountId).maybeSingle();
    if (error || !rep?.visible_to_public || !rep.contactable || !rep.account_eligible || !rep.inventory_eligible) {
      return json({ error: "This representation is not contactable" }, 403);
    }
  }
  if (role === "owner" && enabled) {
    const { data: reps, error } = await supabaseAdmin.from("property_broker_representations")
      .select("id").eq("property_id", propertyId).eq("status", "active")
      .eq("contactable", true).limit(1);
    if (error || reps?.length) return json({ error: "This listing currently routes to a broker" }, 403);
  }
  if (enabled) {
    const { data: entitlement, error } = await entitlementFor(accountId, role);
    if (error || entitlement?.enabled !== true || !entitlement.expires_at || Date.parse(entitlement.expires_at) <= Date.now()) {
      return json({ error: "Enterprise Open Gate access is not active" }, 403);
    }
  }
  const now = new Date().toISOString();
  let error;
  if (role === "broker") {
    ({ error } = await supabaseAdmin.from("open_gate_listings").upsert({
      property_id: propertyId, broker_id: accountId, enabled, updated_at: now,
    }, { onConflict: "property_id,broker_id" }));
  } else {
    let existingQuery = supabaseAdmin.from("open_gate_role_listings").select("property_id")
      .eq("property_id", propertyId).eq("recipient_id", accountId).eq("role", role);
    existingQuery = unitId ? existingQuery.eq("unit_id", unitId) : existingQuery.is("unit_id", null);
    const existing = await existingQuery.maybeSingle();
    if (existing.error) return json({ error: "Gate state unavailable" }, 503);
    if (existing.data) {
      let update = supabaseAdmin.from("open_gate_role_listings").update({ enabled, updated_at: now })
        .eq("property_id", propertyId).eq("recipient_id", accountId).eq("role", role);
      update = unitId ? update.eq("unit_id", unitId) : update.is("unit_id", null);
      ({ error } = await update);
    } else {
      ({ error } = await supabaseAdmin.from("open_gate_role_listings").insert({
        property_id: propertyId, unit_id: unitId, recipient_id: accountId, role, enabled, updated_at: now,
      }));
    }
  }
  if (error) return json({ error: "Could not update this target" }, 503);
  return json({ success: true, enabled });
}
