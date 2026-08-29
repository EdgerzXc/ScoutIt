import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { bookViewing } from "@/lib/viewings/bookingService";
import { isValidTimeZone } from "@/lib/calendar/timezone";

export const dynamic = "force-dynamic";

// POST /api/deals/[id]/schedule — request a live viewing from inside the chat.
//
// The booking RULES no longer live here. They live in lib/viewings/
// bookingService.js, which POST /api/viewing-appointments also calls. Two
// endpoints wrote this table with different rules before, so the looser one was
// a way around the stricter one's guardrails; now both share one gate, and that
// gate validates the requested time against the host's real availability.
//
// What stays here is this endpoint's own concern: announcing the request in the
// deal conversation.

const postSchema = z.object({
  // Was an unvalidated `scheduled_at` string that went straight into a
  // timestamptz insert.
  scheduled_at: z.string().datetime({ offset: true }),
  duration_minutes: z.number().int().min(5).max(480).optional(),
  timezone: z.string().min(1).max(64)
    .refine(isValidTimeZone, "Unrecognised timezone")
    .optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message || "Invalid data format" },
        { status: 400 },
      );
    }
    const { scheduled_at: scheduledAt, duration_minutes: durationMinutes, timezone, notes } = parsed.data;

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

    // Announce it in the conversation. Best-effort: the appointment is already
    // real, and a failed system message must not undo a successful booking.
    //
    // The chat inactivity timer needs no write-back — `deals` has no updated_at
    // column, and "most recent conversation" is derived from
    // deal_messages.created_at, so inserting this message IS the reset.
    // pending_clock_reset_at is deliberately untouched: it drives the sweep for
    // unanswered requests, and scheduling is not an answer.
    const when = new Date(result.appointment.scheduled_at).toLocaleString("en-PH", {
      timeZone: timezone || result.timezone,
      dateStyle: "medium",
      timeStyle: "short",
    });
    const { error: messageError } = await supabaseAdmin.from("deal_messages").insert([{
      deal_id: dealId,
      sender_id: userId,
      sender_role: result.requesterRole,
      body: `[SYSTEM] A live viewing has been requested for: ${when}`,
    }]);
    if (messageError) {
      console.error("[SCHEDULE API] system message insert failed:", messageError);
    }

    return NextResponse.json({ success: true, appointment: result.appointment });
  } catch (error) {
    console.error("[SCHEDULE API] POST error:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
