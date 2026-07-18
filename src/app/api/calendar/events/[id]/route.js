import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { updateEventSchema, serializeEvent, toEventRow } from "@/lib/calendar/eventSchema";

// Ownership is enforced by scoping every write to owner_user_id = caller, so a
// user can never touch another user's event even by guessing an id.

// PATCH /api/calendar/events/[id] — edit an event the caller owns.
export async function PATCH(request, { params }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const parsed = updateEventSchema.safeParse(await request.json());
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid event data";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const updates = toEventRow(parsed.data);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // If only one of the two times changes, re-check the invariant against the
    // stored counterpart so a valid row can't be edited into an invalid one.
    if (updates.starts_at !== undefined || updates.ends_at !== undefined) {
      const { data: current } = await supabaseAdmin
        .from("calendar_events")
        .select("starts_at, ends_at")
        .eq("id", id)
        .eq("owner_user_id", userId)
        .eq("is_deleted", false)
        .single();
      if (current) {
        const start = new Date(updates.starts_at ?? current.starts_at).getTime();
        const end = new Date(updates.ends_at ?? current.ends_at).getTime();
        if (end < start) {
          return NextResponse.json(
            { error: "End time cannot be before start time" },
            { status: 400 }
          );
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .update(updates)
      .eq("id", id)
      .eq("owner_user_id", userId)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error || !data) {
      if (error) console.error("[CALENDAR EVENTS] PATCH error:", error);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event: serializeEvent(data) });
  } catch (err) {
    console.error("[CALENDAR EVENTS] PATCH exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/calendar/events/[id] — soft-delete (tombstone). Kept so external
// sync (Phase 3+) can propagate the deletion instead of the event reappearing.
export async function DELETE(request, { params }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .update({ is_deleted: true, status: "cancelled" })
      .eq("id", id)
      .eq("owner_user_id", userId)
      .eq("is_deleted", false)
      .select("id")
      .single();

    if (error || !data) {
      if (error) console.error("[CALENDAR EVENTS] DELETE error:", error);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CALENDAR EVENTS] DELETE exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
