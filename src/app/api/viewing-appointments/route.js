import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { logActivity } from "@/lib/crmActivity";
import { resolveUserId } from "@/lib/serverAuth";



export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request);

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // host_id/guest_id are uuid columns — a non-uuid dev-mock id (e.g.
    // master-dev) can never be a party, and passing it into the .or() filter
    // is a Postgres type error that 500s the whole request.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(userId)) {
      return NextResponse.json({ appointments: [] });
    }

    // Fetch where user is host or guest
    const { data: appointments, error } = await supabaseAdmin
      .from("viewing_appointments")
      .select(`
        id, deal_id, host_id, guest_id, property_id, scheduled_at, status, notes, created_at
      `)
      .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[APPOINTMENTS API] Fetch error:", error);
      return NextResponse.json({ error: "Failed to load appointments" }, { status: 500 });
    }

    const appts = appointments || [];
    
    // Manual join for deals and properties
    const dealIds = [...new Set(appts.map(a => a.deal_id).filter(Boolean))];
    const propertyIds = [...new Set(appts.map(a => a.property_id).filter(Boolean))];

    let dealsMap = {};
    if (dealIds.length > 0) {
      const { data: deals } = await supabaseAdmin.from("deals").select("id, status").in("id", dealIds);
      dealsMap = Object.fromEntries((deals || []).map(d => [d.id, d]));
    }

    let propsMap = {};
    if (propertyIds.length > 0) {
      const { data: props } = await supabaseAdmin.from("properties").select("id, title, slug").in("id", propertyIds);
      propsMap = Object.fromEntries((props || []).map(p => [p.id, p]));
    }

    // Get profiles for contact info
    const otherPartyIds = new Set();
    for (const appt of appts) {
      if (appt.host_id !== userId) otherPartyIds.add(appt.host_id);
      if (appt.guest_id !== userId) otherPartyIds.add(appt.guest_id);
    }

    let namesById = {};
    if (otherPartyIds.size > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name")
        .in("id", [...otherPartyIds]);
      namesById = Object.fromEntries((profiles || []).map((p) => [p.id, p.display_name]));
    }

    const result = appts.map(appt => {
      const isHost = appt.host_id === userId;
      const otherId = isHost ? appt.guest_id : appt.host_id;
      
      const deal = dealsMap[appt.deal_id];
      const property = propsMap[appt.property_id];

      // Mask contact info if deal is not accepted
      const isAccepted = deal?.status === "accepted";
      const otherName = namesById[otherId] || "Unknown User";
      
      return {
        id: appt.id,
        dealId: appt.deal_id,
        propertyId: appt.property_id,
        propertyTitle: property?.title || "Unknown Property",
        scheduledAt: appt.scheduled_at,
        status: appt.status,
        notes: appt.notes,
        isHost,
        contactName: isAccepted ? otherName : "🔒 Hidden (Accept deal to view)",
        dealStatus: deal?.status
      };
    });

    return NextResponse.json({ appointments: result });
  } catch (err) {
    console.error("[APPOINTMENTS API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

const postSchema = z.object({
  dealId: z.string(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
  });

export async function POST(request) {
  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { dealId, scheduledAt, notes  } = parsed.data;
    const userId = await resolveUserId(request);
    
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify deal access and determine host
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("buyer_id, broker_id, properties(id, owner_id)")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const isBuyer = deal.buyer_id === userId;
    const isBroker = deal.broker_id === userId;
    const isOwner = deal.properties?.owner_id === userId;

    if (!isBuyer && !isBroker && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine host vs guest.
    // Usually, the person requesting (creating) is the guest, and the other party is the host.
    let hostId = null;
    if (isBuyer) hostId = deal.broker_id || deal.properties.owner_id;
    else if (isBroker) hostId = deal.properties.owner_id; // assuming broker books with owner
    else if (isOwner) hostId = deal.broker_id || deal.buyer_id;

    if (!hostId) return NextResponse.json({ error: "Could not determine host" }, { status: 400 });

    const newAppt = {
      deal_id: dealId,
      host_id: hostId,
      guest_id: userId,
      property_id: deal.properties.id,
      scheduled_at: scheduledAt,
      status: "pending",
      notes: notes || ""
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("viewing_appointments")
      .insert(newAppt)
      .select()
      .single();

    if (insertError) {
      console.error("[APPOINTMENTS API] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      dealId,
      propertyId: deal.properties?.id || null,
      activityType: "viewing_scheduled",
      actorId: userId,
      metadata: { scheduledAt, appointmentId: inserted.id },
    });

    return NextResponse.json({ success: true, appointment: inserted });
  } catch (err) {
    console.error("[APPOINTMENTS API] POST error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
