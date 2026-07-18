import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { createEventSchema, serializeEvent, toEventRow } from "@/lib/calendar/eventSchema";

// GET /api/calendar/events?from=<ISO>&to=<ISO>
// Returns the caller's own (non-deleted) events overlapping the [from, to]
// window. Overlap (not containment) so multi-day events show on every day they
// touch. owner_user_id is TEXT, so dev-mock ids need no UUID guard here.
export async function GET(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json({ error: "Missing from/to range" }, { status: 400 });
    }

    // Overlap test: event starts before window end AND ends after window start.
    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .select("*")
      .eq("owner_user_id", userId)
      .eq("is_deleted", false)
      .lte("starts_at", to)
      .gte("ends_at", from)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("[CALENDAR EVENTS] GET error:", error);
      return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
    }

    return NextResponse.json({ events: (data || []).map(serializeEvent) });
  } catch (err) {
    console.error("[CALENDAR EVENTS] GET exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/calendar/events — create an event owned by the caller.
export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = createEventSchema.safeParse(await request.json());
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid event data";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const row = { ...toEventRow(parsed.data), owner_user_id: userId, source: "scoutit" };

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[CALENDAR EVENTS] POST error:", error);
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    return NextResponse.json({ event: serializeEvent(data) }, { status: 201 });
  } catch (err) {
    console.error("[CALENDAR EVENTS] POST exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
