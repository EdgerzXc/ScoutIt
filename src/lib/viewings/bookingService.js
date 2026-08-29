// The single booking path for a property viewing.
//
// There used to be two: POST /api/viewing-appointments and
// POST /api/deals/[id]/schedule. They wrote the same table with DIFFERENT
// rules — one blocked closed deals and allowed only the buyer, the other
// allowed any party and never checked the deal was still open, and neither
// validated the requested time against the host's availability at all. The
// looser endpoint was a way around the stricter one's guardrails.
//
// Both routes now call bookViewing(). One rule set, one place to change it.

import { assertSlotBookable } from "@/lib/calendar/availabilityService";
import { SLOT_REJECTION_MESSAGES } from "@/lib/calendar/slots";
import { createViewingMeet } from "@/lib/calendar/meetLink";
import { cancelViewingMeet } from "@/lib/calendar/meetLink";
import { isValidTimeZone } from "@/lib/calendar/timezone";
import { logActivity } from "@/lib/crmActivity";

/** Statuses in which a deal can still accept a new viewing. */
const BOOKABLE_DEAL_STATUSES = new Set([
  "connected", "pitching", "pending", "invited", "accepted", "active",
]);

export function isBookableDealStatus(status) {
  return BOOKABLE_DEAL_STATUSES.has(status);
}

/**
 * @typedef {{ok:true, appointment:object, meetLink:string|null,
 *             requesterRole:"buyer"|"broker"|"owner"}} BookingSuccess
 * @typedef {{ok:false, status:number, error:string, reason?:string}} BookingFailure
 */

/**
 * Create a viewing appointment.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} serviceClient service-role client
 * @param {object}  args
 * @param {string}  args.dealId
 * @param {string}  args.requesterId  the authenticated caller
 * @param {string}  args.scheduledAt  ISO instant
 * @param {number}  [args.durationMinutes] falls back to the host's default
 * @param {string}  [args.notes]
 * @param {string}  [args.timezone]   the zone the guest saw, for display only
 * @param {number}  [args.now]        injected clock, for tests
 * @returns {Promise<BookingSuccess|BookingFailure>}
 */
export async function bookViewing(serviceClient, {
  dealId,
  requesterId,
  scheduledAt,
  durationMinutes,
  notes = "",
  timezone = null,
  now = Date.now(),
}) {
  const { data: deal, error: dealError } = await serviceClient
    .from("deals")
    .select("id, status, buyer_id, broker_id, property_id, properties(id, owner_id, title, location)")
    .eq("id", dealId)
    .single();

  if (dealError || !deal) {
    return { ok: false, status: 404, error: "Deal not found" };
  }

  const isBuyer = deal.buyer_id === requesterId;
  const isBroker = deal.broker_id === requesterId;
  const isOwner = deal.properties?.owner_id === requesterId;

  if (!isBuyer && !isBroker && !isOwner) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  if (timezone && !isValidTimeZone(timezone)) {
    return { ok: false, status: 400, error: "Unrecognised timezone", reason: "invalid_timezone" };
  }

  // The stricter of the two old rules wins. A closed, declined, or expired
  // conversation cannot gain new viewings from EITHER entry point now.
  if (!isBookableDealStatus(deal.status)) {
    return {
      ok: false,
      status: 409,
      error: "This conversation is no longer open, so a viewing cannot be scheduled.",
    };
  }

  const hostId = resolveViewingHostId({ deal, isBuyer, isBroker });
  if (!hostId) {
    return { ok: false, status: 400, error: "Could not determine who would host this viewing" };
  }
  if (hostId === requesterId) {
    return { ok: false, status: 400, error: "You cannot book a viewing with yourself" };
  }

  // THE GATE. Re-derives the host's offered slots from the database and checks
  // this exact instant against them, so a hand-built request cannot book 3am,
  // a closed day, or a slot someone else already holds.
  let slot;
  try {
    slot = await assertSlotBookable(serviceClient, {
      hostId,
      startsAt: scheduledAt,
      durationMinutes,
      now,
    });
  } catch (availabilityError) {
    console.error("[bookViewing] availability verification failed:", availabilityError?.message);
    return {
      ok: false,
      status: 503,
      error: "Availability could not be verified. Please try again.",
      reason: "availability_unavailable",
    };
  }

  if (!slot.ok) {
    return {
      ok: false,
      status: 409,
      reason: slot.reason,
      error: SLOT_REJECTION_MESSAGES[slot.reason] || "That time is not available.",
    };
  }

  const { data: inserted, error: insertError } = await serviceClient
    .from("viewing_appointments")
    .insert([{
      deal_id: dealId,
      host_id: hostId,
      guest_id: requesterId,
      property_id: deal.properties?.id || deal.property_id,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: slot.durationMinutes,
      booked_timezone: timezone || slot.timezone,
      notes: notes || "",
      status: "pending",
    }])
    .select("id, deal_id, host_id, guest_id, property_id, scheduled_at, ends_at, duration_minutes, status, notes, created_at")
    .single();

  if (insertError) {
    console.error("[bookViewing] insert failed:", insertError);
    if (insertError.code === "23P01" || insertError.code === "23505") {
      return {
        ok: false,
        status: 409,
        error: "That time was just taken. Please choose another.",
        reason: "not_available",
      };
    }
    return { ok: false, status: 500, error: "Failed to save the appointment" };
  }

  // Google Meet room, minted on the HOST's calendar — they own the meeting.
  // Strictly best-effort and after the insert: most hosts have not connected
  // Google, and a booking must never fail because a video link could not be
  // created. A null meet_link is a perfectly valid appointment.
  //
  // The duration is passed explicitly. It used to default to 45 minutes inside
  // meetLink, so the host's Google calendar showed a 45-minute block for what
  // the app treated as a 60-minute viewing.
  let meetLink = null;
  try {
    const meet = await createViewingMeet(hostId, {
      propertyTitle: deal.properties?.title,
      location: deal.properties?.location,
      scheduledAt: inserted.scheduled_at,
      durationMinutes: slot.durationMinutes,
      notes,
    });
    if (meet.meetLink || meet.googleEventId) {
      const { error: meetStoreError } = await serviceClient
        .from("viewing_appointments")
        .update({ meet_link: meet.meetLink, google_event_id: meet.googleEventId })
        .eq("id", inserted.id);
      if (meetStoreError) {
        console.error("[bookViewing] failed to store Meet identifiers:", meetStoreError);
        // Do not leave an untracked Google event behind if ScoutIt could not
        // persist the id needed to update or cancel it later.
        if (meet.googleEventId) await cancelViewingMeet(hostId, meet.googleEventId);
      } else {
        meetLink = meet.meetLink;
      }
    }
  } catch (meetErr) {
    console.error("[bookViewing] Meet generation failed:", meetErr?.message);
  }

  await logActivity(serviceClient, {
    dealId,
    propertyId: deal.properties?.id || deal.property_id || null,
    activityType: "viewing_scheduled",
    actorId: requesterId,
    metadata: {
      appointmentId: inserted.id,
      scheduledAt: inserted.scheduled_at,
      endsAt: slot.endsAt,
      durationMinutes: slot.durationMinutes,
    },
  });

  return {
    ok: true,
    appointment: { ...inserted, meet_link: meetLink },
    meetLink,
    // Callers that write into the deal conversation need the requester's role;
    // deriving it twice is how the two endpoints drifted apart last time.
    requesterRole: isBuyer ? "buyer" : isBroker ? "broker" : "owner",
    timezone: slot.timezone,
  };
}

/**
 * Who hosts the viewing.
 *
 * The requester is always the guest; the counterparty who controls access to
 * the property is the host. A broker representing the property outranks the
 * owner, because the broker is the one who actually opens the door.
 */
export function resolveViewingHostId({ deal, isBuyer, isBroker }) {
  if (isBuyer) return deal.broker_id || deal.properties?.owner_id || null;
  if (isBroker) return deal.properties?.owner_id || deal.buyer_id || null;
  // Owner requesting: the broker if there is one, otherwise the buyer.
  return deal.broker_id || deal.buyer_id || null;
}

export const __testables = {
  resolveHostId: resolveViewingHostId,
  BOOKABLE_DEAL_STATUSES,
};
