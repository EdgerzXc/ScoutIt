import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { logActivity, createTask } from "@/lib/crmActivity";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { cancelViewingMeet, rescheduleViewingMeet } from "@/lib/calendar/meetLink";
import { canTransitionWorkflow } from "@/lib/workflowStateMachines";
import { assertSlotBookable } from "@/lib/calendar/availabilityService";
import { SLOT_REJECTION_MESSAGES } from "@/lib/calendar/slots";
import { isValidTimeZone } from "@/lib/calendar/timezone";

export const dynamic = "force-dynamic";

// PATCH /api/viewing-appointments/[id]
//
// Two shapes, deliberately exclusive:
//   { status }                       -> move along the lifecycle
//   { scheduledAt, durationMinutes } -> MOVE the viewing to a new time
//
// Rescheduling is new. `rescheduleViewingMeet` had existed in lib/calendar/
// meetLink.js with ZERO callers — a viewing could only ever be cancelled and
// rebooked, which lost the Meet room and the thread of the original request.
// The new time goes through the SAME availability gate a first booking does.

const statusSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed"]),
  reason: z.string().max(500).optional(),
});

const rescheduleSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  timezone: z.string().min(1).max(64)
    .refine(isValidTimeZone, "Unrecognised timezone")
    .optional(),
});

const APPOINTMENT_COLUMNS =
  "id, host_id, guest_id, deal_id, property_id, scheduled_at, ends_at, duration_minutes, " +
  "status, google_event_id, deals(property_id, status, properties(title, location))";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const payload = await request.json();

    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data: appt, error: fetchError } = await supabaseAdmin
      .from("viewing_appointments")
      .select(APPOINTMENT_COLUMNS)
      .eq("id", id)
      .single();

    if (fetchError || !appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    if (payload && payload.scheduledAt !== undefined) {
      return handleReschedule({ id, appt, payload, userId });
    }
    return handleStatusChange({ id, appt, payload, userId });
  } catch (err) {
    console.error("[APPOINTMENTS API] PATCH error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

/** Move a viewing to a new time, re-checking the host's availability. */
async function handleReschedule({ id, appt, payload, userId }) {
  const parsed = rescheduleSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues?.[0]?.message || "Invalid data format" },
      { status: 400 },
    );
  }
  const { scheduledAt, durationMinutes, timezone } = parsed.data;

  // Either party may propose a new time; the viewing returns to `pending` so
  // the host still has to accept it. Moving a confirmed viewing without
  // re-confirmation would silently change what the host agreed to.
  if (appt.host_id !== userId && appt.guest_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!["pending", "confirmed"].includes(appt.status)) {
    return NextResponse.json(
      { error: `A ${appt.status} viewing cannot be moved. Book a new one instead.` },
      { status: 409 },
    );
  }
  if (appt.deals?.status === "closed") {
    return NextResponse.json(
      { error: "This conversation is closed, so the viewing cannot be moved." },
      { status: 409 },
    );
  }

  // The same gate a first booking passes — with THIS appointment excluded from
  // the busy set, so a viewing is never treated as blocking its own move.
  const slot = await assertSlotBookable(supabaseAdmin, {
    hostId: appt.host_id,
    startsAt: scheduledAt,
    durationMinutes: durationMinutes || appt.duration_minutes,
    excludeAppointmentId: id,
  });

  if (!slot.ok) {
    return NextResponse.json(
      { error: SLOT_REJECTION_MESSAGES[slot.reason] || "That time is not available.", reason: slot.reason },
      { status: 409 },
    );
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("viewing_appointments")
    .update({
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: slot.durationMinutes,
      booked_timezone: timezone || slot.timezone,
      status: "pending",
    })
    .eq("id", id)
    .select("id, scheduled_at, ends_at, duration_minutes, status")
    .single();

  if (updateError) {
    console.error("[APPOINTMENTS API] reschedule failed:", updateError);
    return NextResponse.json({ error: "Failed to move the appointment" }, { status: 500 });
  }

  // Move the Google event rather than tearing it down, so the Meet link both
  // parties already have keeps working. Best-effort: the ScoutIt row is the
  // source of truth and is already correct.
  if (appt.google_event_id) {
    try {
      const moved = await rescheduleViewingMeet(appt.host_id, appt.google_event_id, {
        scheduledAt: updated.scheduled_at,
        durationMinutes: updated.duration_minutes,
      });
      if (!moved) {
        console.error("[APPOINTMENTS API] Google event was not moved; identifiers retained for retry");
      }
    } catch (meetErr) {
      console.error("[APPOINTMENTS API] Meet reschedule failed:", meetErr?.message);
    }
  }

  await logActivity(supabaseAdmin, {
    dealId: appt.deal_id,
    propertyId: appt.deals?.property_id || appt.property_id || null,
    activityType: "viewing_rescheduled",
    actorId: userId,
    metadata: {
      appointmentId: id,
      scheduledAt: updated.scheduled_at,
      endsAt: slot.endsAt,
      durationMinutes: updated.duration_minutes,
      previousScheduledAt: appt.scheduled_at,
    },
  });

  return NextResponse.json({ success: true, appointment: updated });
}

/** Advance the viewing's lifecycle: confirmed / cancelled / completed. */
async function handleStatusChange({ id, appt, payload, userId }) {
  const parsed = statusSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }
  const { status, reason } = parsed.data;

  // Both host and guest can cancel, but only host can confirm or complete.
  if (status === "cancelled") {
    if (appt.host_id !== userId && appt.guest_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (appt.host_id !== userId) {
    return NextResponse.json(
      { error: "Only the host can confirm or complete an appointment" },
      { status: 403 },
    );
  }

  if (!canTransitionWorkflow("viewing", appt.status, status)) {
    return NextResponse.json(
      { error: "Viewing cannot move from " + appt.status + " to " + status },
      { status: 409 },
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("viewing_appointments")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    console.error("[APPOINTMENTS API] Update error:", updateError);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }

  // Tear down the Google event on cancellation (NEW_IDEAS.md §20.1).
  // Without this, a cancelled viewing leaves a live Meet room and a stale
  // entry in the host's calendar — which is exactly how someone ends up
  // sitting alone in an empty call at the original time.
  // Best-effort: the appointment is already cancelled in our DB either way.
  if (status === "cancelled" && appt.google_event_id) {
    try {
      const removed = await cancelViewingMeet(appt.host_id, appt.google_event_id);
      if (removed) {
        await supabaseAdmin
          .from("viewing_appointments")
          .update({ meet_link: null, google_event_id: null })
          .eq("id", id);
      } else {
        // Keep the id: clearing it after a failed Google delete makes the
        // external event impossible to retry or reconcile later.
        console.error("[APPOINTMENTS API] Google event was not removed; identifiers retained for retry");
      }
    } catch (meetErr) {
      console.error("[APPOINTMENTS API] Meet cleanup failed:", meetErr?.message);
    }
  }

  await logActivity(supabaseAdmin, {
    dealId: appt.deal_id,
    propertyId: appt.deals?.property_id || appt.property_id || null,
    activityType: `viewing_${status}`,
    actorId: userId,
    metadata: {
      appointmentId: id,
      scheduledAt: appt.scheduled_at,
      endsAt: appt.ends_at,
      ...(reason ? { reason } : {}),
    },
  });

  // The one auto-created task type: when the host marks a viewing completed,
  // drop a "Follow up" task on their list due in 24 hours.
  if (status === "completed") {
    const propertyTitle = appt.deals?.properties?.title;
    await createTask(supabaseAdmin, {
      ownerUserId: appt.host_id,
      title: propertyTitle ? `Follow up after viewing — ${propertyTitle}` : "Follow up after viewing",
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      dealId: appt.deal_id,
    });
  }

  return NextResponse.json({ success: true, status });
}
