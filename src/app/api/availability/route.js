import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { normalizeAvailability } from "@/lib/calendar/slots";
import { isValidTimeZone } from "@/lib/calendar/timezone";

export const dynamic = "force-dynamic";

// user_availability.user_id is a uuid column. A dev-mock id (e.g. "master-dev")
// is not a uuid, and passing one into the filter is a Postgres type error that
// 500s the request rather than returning "no availability".
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A host's own booking policy: weekly hours, date overrides, and the booking
// rules the slot engine reads (duration, interval, buffers, notice, daily cap).
//
// This route is SELF-SCOPED. It used to accept ?userId= for any user and
// return that host's confirmed and pending appointment times, which let any
// signed-in account enumerate a stranger's schedule. Buyers now read bookable
// SLOTS from /api/deals/[id]/slots, which reveals when someone is free without
// revealing what they are doing.

const timeString = z.string().regex(/^\d{1,2}:\d{2}$/, "Use HH:mm");

const dayWindow = z.object({
  active: z.boolean().optional(),
  start: timeString.optional(),
  end: timeString.optional(),
  windows: z.array(z.object({ start: timeString, end: timeString })).max(6).optional(),
});

const postSchema = z
  .object({
    weekly_schedule: z.record(z.string(), dayWindow).optional(),
    date_overrides: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), dayWindow).optional(),
    timezone: z.string().min(1).max(64).optional(),
    default_duration_minutes: z.number().int().min(5).max(480).optional(),
    slot_interval_minutes: z.number().int().min(5).max(240).optional(),
    buffer_before_minutes: z.number().int().min(0).max(240).optional(),
    buffer_after_minutes: z.number().int().min(0).max(240).optional(),
    minimum_notice_minutes: z.number().int().min(0).max(43200).optional(),
    max_bookings_per_day: z.number().int().min(1).max(50).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to save" });

const STORED_COLUMNS =
  "weekly_schedule, date_overrides, timezone, default_duration_minutes, " +
  "slot_interval_minutes, buffer_before_minutes, buffer_after_minutes, " +
  "minimum_notice_minutes, max_bookings_per_day, updated_at";

/** The defaults an unconfigured host is answered with, in stored-column shape. */
function defaultConfigPayload() {
  const policy = normalizeAvailability({});
  return {
    weekly_schedule: policy.weeklySchedule,
    date_overrides: policy.dateOverrides,
    timezone: policy.timezone,
    default_duration_minutes: policy.defaultDurationMinutes,
    slot_interval_minutes: policy.slotIntervalMinutes,
    buffer_before_minutes: policy.bufferBeforeMinutes,
    buffer_after_minutes: policy.bufferAfterMinutes,
    minimum_notice_minutes: policy.minimumNoticeMinutes,
    max_bookings_per_day: policy.maxBookingsPerDay,
  };
}

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const requested = searchParams.get("userId");
    // Reading someone else's hours is not a thing this route does any more.
    if (requested && requested !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!UUID_RE.test(userId)) {
      // Dev-mock session: no stored row is possible, so answer with defaults.
      return NextResponse.json({ config: defaultConfigPayload(), isConfigured: false });
    }

    const { data, error } = await supabaseAdmin
      .from("user_availability")
      .select(STORED_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("[AVAILABILITY API] GET error:", error);
      return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
    }

    // A host who has never opened this screen has no row. Returning the
    // documented defaults beats returning an empty object the UI has to guess at.
    const policy = normalizeAvailability(data || {});

    return NextResponse.json({
      config: {
        weekly_schedule: policy.weeklySchedule,
        date_overrides: policy.dateOverrides,
        timezone: policy.timezone,
        default_duration_minutes: policy.defaultDurationMinutes,
        slot_interval_minutes: policy.slotIntervalMinutes,
        buffer_before_minutes: policy.bufferBeforeMinutes,
        buffer_after_minutes: policy.bufferAfterMinutes,
        minimum_notice_minutes: policy.minimumNoticeMinutes,
        max_bookings_per_day: policy.maxBookingsPerDay,
      },
      isConfigured: Boolean(data),
    });
  } catch (error) {
    console.error("[AVAILABILITY API] GET error:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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
    const input = parsed.data;

    if (input.timezone !== undefined && !isValidTimeZone(input.timezone)) {
      return NextResponse.json({ error: "Unrecognised timezone" }, { status: 400 });
    }

    if (!UUID_RE.test(userId)) {
      return NextResponse.json({ error: "Availability needs a real signed-in account" }, { status: 400 });
    }

    // PARTIAL UPDATE, on purpose.
    //
    // This route previously upserted `date_overrides: date_overrides || {}` and
    // `timezone: timezone || 'Asia/Manila'`. The availability screen only ever
    // sends weekly_schedule, so every save silently erased the host's date
    // overrides and reset their timezone. Read-modify-write fixes that: a field
    // that was not sent is a field that does not change.
    const { data: existing, error: readError } = await supabaseAdmin
      .from("user_availability")
      .select(STORED_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();

    if (readError && readError.code !== "PGRST116") {
      console.error("[AVAILABILITY API] read-before-write failed:", readError);
      return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
    }

    const merged = { ...(existing || {}) };
    delete merged.updated_at; // maintained by the touch_updated_at trigger
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) merged[key] = value;
    }

    const { data, error } = await supabaseAdmin
      .from("user_availability")
      .upsert({ user_id: userId, ...merged }, { onConflict: "user_id" })
      .select(STORED_COLUMNS)
      .single();

    if (error) {
      console.error("[AVAILABILITY API] POST error:", error);
      return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
    }

    return NextResponse.json({ success: true, availability: data });
  } catch (error) {
    console.error("[AVAILABILITY API] POST error:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
