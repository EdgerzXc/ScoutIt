// Server-side availability loading — the one place that turns a host id into
// "here is their policy and here is every minute they are already busy".
//
// Both booking endpoints and the slots endpoint go through this, so a slot
// offered to a buyer and a slot accepted by the server are computed from
// identical inputs by construction. The pure decision logic lives in
// ./slots.js; this file only does I/O.

import {
  AVAILABILITY_DEFAULTS,
  buildBusyIntervals,
  computeSlots,
  normalizeAvailability,
  normalizeDurationMinutes,
  validateSlot,
} from "./slots";
import { addDaysToDateKey, getZonedDateKey } from "./timezone";

/**
 * Load a host's booking policy. A host who has never opened the availability
 * screen has no row; they get the documented defaults rather than an error, so
 * the first buyer to reach them still sees sensible hours.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} serviceClient
 * @param {string} hostId
 */
export async function loadAvailabilityPolicy(serviceClient, hostId) {
  const { data, error } = await serviceClient
    .from("user_availability")
    .select(
      "weekly_schedule, date_overrides, timezone, default_duration_minutes, " +
      "slot_interval_minutes, buffer_before_minutes, buffer_after_minutes, " +
      "minimum_notice_minutes, max_bookings_per_day",
    )
    .eq("user_id", hostId)
    .maybeSingle();

  // PGRST116 is "no rows", which is a normal state, not a failure.
  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to load availability: ${error.message}`);
  }

  return normalizeAvailability(data || {});
}

/**
 * Every busy interval on a host's calendar in a window.
 *
 * Reads BOTH viewing_appointments and calendar_events. Only counting viewings
 * (the old behavior) let a synced Google event be double-booked over.
 *
 * @param {object} args
 * @param {string} args.hostId
 * @param {string} args.fromIso inclusive
 * @param {string} args.toIso   exclusive
 * @param {string} [args.excludeAppointmentId] ignore one row, for rescheduling
 */
export async function loadBusyIntervals(serviceClient, {
  hostId,
  fromIso,
  toIso,
  excludeAppointmentId = null,
  defaultDurationMinutes = AVAILABILITY_DEFAULTS.defaultDurationMinutes,
}) {
  const state = await loadBusyState(serviceClient, {
    hostId,
    fromIso,
    toIso,
    excludeAppointmentId,
    defaultDurationMinutes,
  });
  return state.busy;
}

async function loadBusyState(serviceClient, {
  hostId,
  fromIso,
  toIso,
  excludeAppointmentId = null,
  defaultDurationMinutes = AVAILABILITY_DEFAULTS.defaultDurationMinutes,
}) {
  let appointmentQuery = serviceClient
    .from("viewing_appointments")
    .select("id, scheduled_at, duration_minutes, status")
    .eq("host_id", hostId)
    .in("status", ["pending", "confirmed"])
    // A viewing that STARTS before the window can still overlap into it, so the
    // lower bound is pulled back by the longest bookable viewing.
    .gte("scheduled_at", shiftIso(fromIso, -8 * 60))
    .lt("scheduled_at", toIso);

  if (excludeAppointmentId) {
    appointmentQuery = appointmentQuery.neq("id", excludeAppointmentId);
  }

  const [appointments, events] = await Promise.all([
    appointmentQuery,
    serviceClient
      .from("calendar_events")
      .select("starts_at, ends_at, status, is_deleted")
      .eq("owner_user_id", hostId)
      .eq("is_deleted", false)
      .gte("ends_at", fromIso)
      .lt("starts_at", toIso),
  ]);

  if (appointments.error) {
    throw new Error(`Failed to load viewings: ${appointments.error.message}`);
  }
  // Busy-source reads fail closed. Returning free time after one source failed
  // is indistinguishable from availability and can create a double-booking.
  if (events.error) {
    throw new Error(`Failed to load calendar events: ${events.error.message}`);
  }

  return {
    busy: buildBusyIntervals({
      appointments: appointments.data || [],
      events: events.data || [],
      defaultDurationMinutes,
    }),
    bookingStarts: (appointments.data || []).map((row) => row.scheduled_at),
  };
}

function shiftIso(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

/**
 * The bookable slots a host is offering across a date range.
 *
 * @returns {{policy:object, slots:{startsAt:string,endsAt:string}[], timezone:string}}
 */
export async function getBookableSlots(serviceClient, {
  hostId,
  fromDateKey,
  toDateKey,
  durationMinutes,
  now = Date.now(),
  // Callers that already needed the timezone to pick the range pass their
  // policy back in, so the row is read once per request rather than twice.
  policy: preloadedPolicy = null,
}) {
  const policy = preloadedPolicy || await loadAvailabilityPolicy(serviceClient, hostId);

  // Widen the busy window by a day on each side: a host-local day does not line
  // up with a UTC day, and a booking just outside the range can still buffer
  // into it.
  const state = await loadBusyState(serviceClient, {
    hostId,
    fromIso: dayKeyToIsoBound(addDaysToDateKey(fromDateKey, -1)),
    toIso: dayKeyToIsoBound(addDaysToDateKey(toDateKey, 2)),
    defaultDurationMinutes: policy.defaultDurationMinutes,
  });

  const slots = computeSlots({
    fromDateKey,
    toDateKey,
    availability: policy,
    busy: state.busy,
    bookingStarts: state.bookingStarts,
    durationMinutes,
    now,
  });

  return { policy, slots, timezone: policy.timezone };
}

function dayKeyToIsoBound(dateKey) {
  return `${dateKey}T00:00:00.000Z`;
}

/**
 * The gate every booking write must pass.
 *
 * Re-derives the host's slots from the database and checks the requested
 * instant against them. Nothing the client sent is trusted: not the duration,
 * not the timezone, not a slot token.
 *
 * @returns {{ok:true, endsAt:string, durationMinutes:number, timezone:string}
 *          |{ok:false, reason:string}}
 */
export async function assertSlotBookable(serviceClient, {
  hostId,
  startsAt,
  durationMinutes,
  excludeAppointmentId = null,
  now = Date.now(),
}) {
  const startMs = new Date(startsAt).getTime();
  if (!Number.isFinite(startMs)) return { ok: false, reason: "invalid_time" };

  const policy = await loadAvailabilityPolicy(serviceClient, hostId);
  const duration = normalizeDurationMinutes(durationMinutes, policy.defaultDurationMinutes);
  const dateKey = getZonedDateKey(new Date(startMs), policy.timezone);

  const state = await loadBusyState(serviceClient, {
    hostId,
    fromIso: dayKeyToIsoBound(addDaysToDateKey(dateKey, -1)),
    toIso: dayKeyToIsoBound(addDaysToDateKey(dateKey, 2)),
    excludeAppointmentId,
    defaultDurationMinutes: policy.defaultDurationMinutes,
  });

  const result = validateSlot({
    startsAt: new Date(startMs).toISOString(),
    availability: policy,
    busy: state.busy,
    bookingStarts: state.bookingStarts,
    durationMinutes: duration,
    now,
  });

  if (!result.ok) return result;
  return {
    ok: true,
    endsAt: result.endsAt,
    durationMinutes: duration,
    timezone: policy.timezone,
  };
}
