import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { syncPropertyUnitsToAirtable } from "@/lib/unitsSync";
import { notifyAttachedBrokers } from "@/lib/notifications";

// Owner accepts an operator's handshake request and picks which specific
// units to hand over. Per SCOUTIT_MASTER_BUILD_SPEC.md §9.2/locked decision
// #6: one Connect was already spent when the operator opened the request
// (see /api/deals/initiate); accepting and selecting N units here charges
// nothing further. The first selected unit updates the original deal row
// (unit_id + status: 'accepted'); each additional unit clones a sibling deal
// row (same buyer_id/property, no new Connect spend).

const bodySchema = z.object({
  dealId: z.string(),
  // Required (min 1) only for "accept" — checked below, since "decline" sends none.
  unitIds: z.array(z.string()).max(200).optional().default([]),
  action: z.enum(["accept", "decline"]).default("accept"),
});

// Lists pending operator-initiated delegation requests for one property —
// deals with unit_id still null and status 'connected' (the ask hasn't been
// accepted/declined yet). Owner-only.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    if (!propertyId) {
      return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data: property, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("id, owner_id")
      .eq("id", propertyId)
      .single();
    if (propErr || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (property.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    }

    const { data: deals, error: dealsErr } = await supabaseAdmin
      .from("deals")
      .select("id, buyer_id, pitch_message, created_at")
      .eq("property_id", propertyId)
      .is("unit_id", null)
      .eq("status", "connected")
      .order("created_at", { ascending: false });
    if (dealsErr) {
      return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
    }

    const operatorIds = [...new Set((deals || []).map((d) => d.buyer_id))];
    let names = {};
    if (operatorIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name")
        .in("id", operatorIds);
      for (const p of profiles || []) names[p.id] = p.display_name;
    }

    return NextResponse.json({
      requests: (deals || []).map((d) => ({
        dealId: d.id,
        operatorId: d.buyer_id,
        operatorDisplayName: names[d.buyer_id] || "An operator",
        message: d.pitch_message,
        createdAt: d.created_at,
      })),
    });
  } catch (err) {
    console.error("[DELEGATE API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }
    const userId = user.id;

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { dealId, unitIds, action } = parsed.data;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data: deal, error: dealErr } = await supabaseAdmin
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();
    if (dealErr || !deal) {
      return NextResponse.json({ error: "Delegation request not found" }, { status: 404 });
    }
    if (deal.unit_id) {
      return NextResponse.json({ error: "This request has already been resolved" }, { status: 409 });
    }

    const { data: property, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("id, owner_id, slug, pipeline_status, title, location, type, space_category, details")
      .eq("id", deal.property_id)
      .single();
    if (propErr || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (property.owner_id !== userId) {
      return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    }

    if (action === "decline") {
      await supabaseAdmin.from("deals").update({ status: "declined" }).eq("id", dealId);
      return NextResponse.json({ success: true, status: "declined" });
    }

    if (unitIds.length === 0) {
      return NextResponse.json({ error: "Select at least one unit to delegate" }, { status: 400 });
    }

    // Confirm every selected unit belongs to this property and isn't already delegated.
    const { data: units, error: unitsErr } = await supabaseAdmin
      .from("property_units")
      .select("id, property_id, operator_id")
      .in("id", unitIds);
    if (unitsErr) {
      return NextResponse.json({ error: "Failed to load selected units" }, { status: 500 });
    }
    const foundIds = new Set(units.map((u) => u.id));
    const missing = unitIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json({ error: "One or more selected units were not found" }, { status: 400 });
    }
    if (units.some((u) => u.property_id !== property.id)) {
      return NextResponse.json({ error: "Selected units must belong to the same property as the request" }, { status: 400 });
    }
    if (units.some((u) => u.operator_id)) {
      return NextResponse.json({ error: "One or more selected units are already delegated" }, { status: 409 });
    }

    // Stamp operator_id on every selected unit.
    const { error: stampErr } = await supabaseAdmin
      .from("property_units")
      .update({ operator_id: deal.buyer_id, updated_at: new Date().toISOString() })
      .in("id", unitIds);
    if (stampErr) {
      console.error("[DELEGATE API] Failed to stamp operator_id:", stampErr);
      return NextResponse.json({ error: "Failed to delegate units" }, { status: 500 });
    }

    // First unit resolves the original deal row; extras clone sibling rows
    // (one deal = one unit, per locked decision #6 — no additional Connect charge).
    const [firstUnitId, ...restUnitIds] = unitIds;
    const { error: updateDealErr } = await supabaseAdmin
      .from("deals")
      .update({ unit_id: firstUnitId, status: "accepted" })
      .eq("id", dealId);
    if (updateDealErr) {
      console.error("[DELEGATE API] Failed to update original deal:", updateDealErr);
      return NextResponse.json({ error: "Failed to finalize delegation" }, { status: 500 });
    }

    if (restUnitIds.length > 0) {
      const clones = restUnitIds.map((unitId) => ({
        property_id: property.id,
        buyer_id: deal.buyer_id,
        unit_id: unitId,
        status: "accepted",
        pitch_message: deal.pitch_message,
      }));
      const { error: cloneErr } = await supabaseAdmin.from("deals").insert(clones);
      if (cloneErr) {
        console.error("[DELEGATE API] Failed to clone sibling deals:", cloneErr);
        return NextResponse.json({ error: "Units delegated, but some deal records failed to save" }, { status: 500 });
      }
    }

    let warning = null;
    try {
      await syncPropertyUnitsToAirtable(supabaseAdmin, property);
    } catch (airtableErr) {
      console.error("[DELEGATE API] Airtable sync failed:", airtableErr);
      warning = "Units delegated, but Airtable sync failed: " + airtableErr.message;
    }

    if (property.pipeline_status === 'approved') {
      await notifyAttachedBrokers(supabaseAdmin, {
        propertyId: property.id,
        title: "Units delegated to an operator",
        desc: `${unitIds.length} unit(s) in "${property.title}" are now operated by a co-working operator.`,
        icon: "🏢",
        notificationType: "property_changed",
        excludeUserId: userId,
      });
    }

    return NextResponse.json({ success: true, status: "accepted", delegatedUnitIds: unitIds, ...(warning ? { warning } : {}) });
  } catch (err) {
    console.error("[DELEGATE API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
