import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { logActivity, createTask } from "@/lib/crmActivity";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { cancelViewingMeet, rescheduleViewingMeet, enqueueCalendarSyncRetry } from "@/lib/calendar/meetLink";
import { canTransitionWorkflow } from "@/lib/workflowStateMachines";
import { assertSlotBookable } from "@/lib/calendar/availabilityService";
import { SLOT_REJECTION_MESSAGES } from "@/lib/calendar/slots";
import { isValidTimeZone } from "@/lib/calendar/timezone";
import { notifyUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const version = z.string().datetime({ offset: true });
const statusSchema = z.object({
  expectedUpdatedAt: version,
  status: z.enum(["confirmed", "cancelled", "completed"]),
  reason: z.string().max(500).optional(),
}).strict();

const rescheduleSchema = z.object({
  expectedUpdatedAt: version,
  scheduledAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  timezone: z.string().min(1).max(64)
    .refine(isValidTimeZone, "Unrecognised timezone")
    .optional(),
}).strict();

const APPOINTMENT_COLUMNS =
  "id, host_id, guest_id, deal_id, property_id, scheduled_at, ends_at, duration_minutes, " +
  "status, updated_at, google_event_id, deals(property_id, status, properties(title, location))";
const UPDATED_COLUMNS = "id, scheduled_at, ends_at, duration_minutes, status, updated_at";

function viewingChanged() {
  return NextResponse.json(
    { code: "VIEWING_CHANGED", error: "This viewing changed. Review the latest details and try again." },
    { status: 409 },
  );
}

function updateViewing(id, appt, changes) {
  return supabaseAdmin.from("viewing_appointments")
    .update(changes)
    .eq("id", id)
    .eq("status", appt.status)
    .eq("updated_at", appt.updated_at)
    .select(UPDATED_COLUMNS)
    .maybeSingle();
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid appointment ID" }, { status: 400 });
    }
    const payload = await request.json().catch(() => null);
    const reschedule = payload?.scheduledAt !== undefined;
    const parsed = (reschedule ? rescheduleSchema : statusSchema).safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid viewing update. Refresh the viewing and try again." }, { status: 400 });
    }

    const { data: appt, error: fetchError } = await supabaseAdmin
      .from("viewing_appointments")
      .select(APPOINTMENT_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    if (appt.host_id !== userId && appt.guest_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (parsed.data.expectedUpdatedAt !== appt.updated_at) return viewingChanged();

    const handleUpdate = reschedule ? handleReschedule : handleStatusChange;
    return await handleUpdate({ id, appt, payload: parsed.data, userId });
  } catch (err) {
    console.error("[APPOINTMENTS API] PATCH error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

/** Move a viewing to a new time, re-checking the host's availability. */
async function handleReschedule({ id, appt, payload, userId }) {
  const { scheduledAt, durationMinutes, timezone } = payload;

  // Either party may propose a new time; the viewing returns to `pending` so
  // the host still has to accept it. Moving a confirmed viewing without
  // re-confirmation would silently change what the host agreed to.
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

  const { data: updated, error: updateError } = await updateViewing(id, appt, {
    scheduled_at: new Date(scheduledAt).toISOString(),
    duration_minutes: slot.durationMinutes,
    booked_timezone: timezone || slot.timezone,
    status: "pending",
  });

  if (updateError?.code === "23P01") {
    return NextResponse.json(
      { error: "That time was just taken. Please choose another.", reason: "not_available" },
      { status: 409 },
    );
  }
  if (updateError) {
    console.error("[APPOINTMENTS API] reschedule failed:", updateError);
    return NextResponse.json({ error: "Failed to move the appointment" }, { status: 500 });
  }
  if (!updated) return viewingChanged();

  let calendarSync = null;
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
        const queued = await enqueueCalendarSyncRetry(supabaseAdmin, {
          appointmentId: id,
          hostUserId: appt.host_id,
          googleEventId: appt.google_event_id,
          operation: "reschedule",
          payload: {
            scheduledAt: updated.scheduled_at,
            durationMinutes: updated.duration_minutes,
          },
          errorReason: "google_event_not_moved",
        });
        calendarSync = queued ? "pending" : "failed";
      }
    } catch (meetErr) {
      console.error("[APPOINTMENTS API] Meet reschedule failed:", meetErr?.message);
      const queued = await enqueueCalendarSyncRetry(supabaseAdmin, {
        appointmentId: id,
        hostUserId: appt.host_id,
        googleEventId: appt.google_event_id,
        operation: "reschedule",
        payload: {
          scheduledAt: updated.scheduled_at,
          durationMinutes: updated.duration_minutes,
        },
        errorReason: "reschedule_exception",
      });
      calendarSync = queued ? "pending" : "failed";
    }
  }

  // A-146: isolated — the reschedule stands; timeline and follow-up gaps
  // must be findable, not fatal.
  try {
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
  } catch (activityError) {
    console.warn("[APPOINTMENTS API] Timeline entry not recorded for", id, activityError?.message);
  }

  // GAP-21: Notify counterparty of rescheduled viewing
  const counterpartyId = userId === appt.host_id ? appt.guest_id : appt.host_id;
  if (counterpartyId) {
    await notifyUser(supabaseAdmin, {
      userId: counterpartyId,
      title: "Viewing rescheduled",
      desc: `A viewing has been rescheduled for ${new Date(scheduledAt).toLocaleDateString()}.`,
      propertyId: appt.deals?.property_id || appt.property_id || null,
      notificationType: "viewing_rescheduled",
    });
  }

  return NextResponse.json({ success: true, appointment: updated, calendarSync });
}

/** Advance the viewing's lifecycle: confirmed / cancelled / completed. */
async function handleStatusChange({ id, appt, payload, userId }) {
  const { status, reason } = payload;

  // Both host and guest can cancel, but only host can confirm or complete.
  if (status !== "cancelled" && appt.host_id !== userId) {
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

  const { data: updated, error: updateError } = await updateViewing(id, appt, {
    status,
    ...(status === "cancelled" ? { meet_link: null } : {}),
  });

  if (updateError) {
    console.error("[APPOINTMENTS API] Update error:", updateError);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
  if (!updated) return viewingChanged();

  let appointment = updated;
  let calendarSync = null;
  // Tear down the Google event on cancellation (NEW_IDEAS.md §20.1).
  // Without this, a cancelled viewing leaves a live Meet room and a stale
  // entry in the host's calendar — which is exactly how someone ends up
  // sitting alone in an empty call at the original time.
  // Best-effort: the appointment is already cancelled in our DB either way.
  if (status === "cancelled" && appt.google_event_id) {
    try {
      const removed = await cancelViewingMeet(appt.host_id, appt.google_event_id);
      if (removed) {
        const { data: cleaned, error: cleanupError } = await updateViewing(id, updated, {
          meet_link: null,
          google_event_id: null,
        });
        if (cleanupError) throw cleanupError;
        if (cleaned) appointment = cleaned;
      } else {
        // Keep the id: clearing it after a failed Google delete makes the
        // external event impossible to retry or reconcile later.
        console.error("[APPOINTMENTS API] Google event was not removed; identifiers retained for retry");
        const queued = await enqueueCalendarSyncRetry(supabaseAdmin, {
          appointmentId: id,
          hostUserId: appt.host_id,
          googleEventId: appt.google_event_id,
          operation: "cancel",
          errorReason: "google_event_not_removed",
        });
        calendarSync = queued ? "pending" : "failed";
      }
    } catch (meetErr) {
      console.error("[APPOINTMENTS API] Meet cleanup failed:", meetErr?.message);
      const queued = await enqueueCalendarSyncRetry(supabaseAdmin, {
        appointmentId: id,
        hostUserId: appt.host_id,
        googleEventId: appt.google_event_id,
        operation: "cancel",
        errorReason: "cancel_exception",
      });
      calendarSync = queued ? "pending" : "failed";
    }
  }

  try {
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
  } catch (activityError) {
    console.warn("[APPOINTMENTS API] Timeline entry not recorded for", id, activityError?.message);
  }

  // The one auto-created task type: when the host marks a viewing completed,
  // drop a "Follow up" task on their list due in 24 hours. A-146: isolated
  // like the timeline write above.
  if (status === "completed") {
    const propertyTitle = appt.deals?.properties?.title;
    try {
      await createTask(supabaseAdmin, {
        ownerUserId: appt.host_id,
        title: propertyTitle ? `Follow up after viewing — ${propertyTitle}` : "Follow up after viewing",
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        dealId: appt.deal_id,
      });
    } catch (taskError) {
      console.warn("[APPOINTMENTS API] Follow-up task not created for", id, taskError?.message);
    }
  }

  // GAP-21: Notify counterparty of viewing status updates
  const counterpartyId = userId === appt.host_id ? appt.guest_id : appt.host_id;
  if (counterpartyId) {
    const title =
      status === "confirmed"
        ? "Viewing confirmed"
        : status === "cancelled"
          ? "Viewing cancelled"
          : "Viewing completed";
    const desc =
      status === "confirmed"
        ? `Your viewing for ${new Date(appt.scheduled_at).toLocaleDateString()} has been confirmed.`
        : status === "cancelled"
          ? `The viewing for ${new Date(appt.scheduled_at).toLocaleDateString()} was cancelled.`
          : `The viewing for ${new Date(appt.scheduled_at).toLocaleDateString()} has been marked completed.`;
    await notifyUser(supabaseAdmin, {
      userId: counterpartyId,
      title,
      desc,
      propertyId: appt.deals?.property_id || appt.property_id || null,
      notificationType: `viewing_${status}`,
    });
  }

  return NextResponse.json({ success: true, status, appointment, calendarSync });
}
