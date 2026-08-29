import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { bookViewing } from "@/lib/viewings/bookingService";
import { isValidTimeZone } from "@/lib/calendar/timezone";



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
        id, deal_id, host_id, guest_id, property_id, scheduled_at, ends_at,
        duration_minutes, booked_timezone, status, notes, created_at, meet_link
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
        // A viewing is a range now, so every consumer can lay it out on a
        // calendar instead of guessing at a length.
        endsAt: appt.ends_at,
        durationMinutes: appt.duration_minutes,
        bookedTimezone: appt.booked_timezone,
        status: appt.status,
        notes: appt.notes,
        isHost,
        contactName: isAccepted ? otherName : "🔒 Hidden (Accept deal to view)",
        dealStatus: deal?.status,
        // Safe to expose: this query already scopes to appointments where the
        // caller is host or guest, so they're a party to the meeting. A Meet
        // room for your own viewing isn't a contact detail.
        meetLink: appt.meet_link || null,
      };
    });

    return NextResponse.json({ appointments: result });
  } catch (err) {
    console.error("[APPOINTMENTS API] GET error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

const postSchema = z.object({
  dealId: z.string().uuid(),
  // Was a bare z.string(): any text at all passed validation and went straight
  // into a timestamptz insert.
  scheduledAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  timezone: z.string().min(1).max(64)
    .refine(isValidTimeZone, "Unrecognised timezone")
    .optional(),
  notes: z.string().max(2000).optional(),
});

// All booking rules live in lib/viewings/bookingService.js, shared with
// POST /api/deals/[id]/schedule. This route no longer decides who may book,
// whether the deal is still open, or whether the time is available — it could
// previously answer all three differently from the other endpoint.
export async function POST(request) {
  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message || "Invalid data format" },
        { status: 400 },
      );
    }
    const { dealId, scheduledAt, durationMinutes, timezone, notes } = parsed.data;

    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const result = await bookViewing(supabaseAdmin, {
      dealId,
      requesterId: userId,
      scheduledAt,
      durationMinutes,
      timezone,
      notes: notes || "",
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, reason: result.reason || null },
        { status: result.status },
      );
    }

    return NextResponse.json({ success: true, appointment: result.appointment });
  } catch (err) {
    console.error("[APPOINTMENTS API] POST error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
