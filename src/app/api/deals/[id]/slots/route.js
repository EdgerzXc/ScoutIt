import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { getBookableSlots, loadAvailabilityPolicy } from "@/lib/calendar/availabilityService";
import { addDaysToDateKey, getZonedDateKey, isValidDateKey } from "@/lib/calendar/timezone";
import {
  isBookableDealStatus,
  resolveViewingHostId,
} from "@/lib/viewings/bookingService";

export const dynamic = "force-dynamic";

// GET /api/deals/[id]/slots?from=yyyy-mm-dd&to=yyyy-mm-dd&duration=60
//
// The times a guest may actually book on this deal's host. This is what the
// booking picker renders, and POST /api/viewing-appointments re-derives the
// same list before it writes, so the two can never disagree.
//
// Deliberately returns FREE time only. The host's existing appointments are
// not disclosed — a buyer needs to know when someone is available, not what
// else is on their calendar.

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 31;

export async function GET(request, { params }) {
  try {
    const { id: dealId } = await params;
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, status, buyer_id, broker_id, properties(id, owner_id)")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const isBuyer = deal.buyer_id === userId;
    const isBroker = deal.broker_id === userId;
    const isOwner = deal.properties?.owner_id === userId;
    if (!isBuyer && !isBroker && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isBookableDealStatus(deal.status)) {
      return NextResponse.json(
        { error: "This conversation is no longer open for new viewings." },
        { status: 409 },
      );
    }

    // The picker and writer share the exact same host-resolution helper.
    const hostId = resolveViewingHostId({ deal, isBuyer, isBroker });

    if (!hostId || hostId === userId) {
      return NextResponse.json({ slots: [], timezone: null, reason: "no_host" });
    }

    const policy = await loadAvailabilityPolicy(supabaseAdmin, hostId);

    const { searchParams } = new URL(request.url);
    const todayKey = getZonedDateKey(new Date(), policy.timezone);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const durationRaw = searchParams.get("duration");

    if (fromParam && (!DATE_KEY.test(fromParam) || !isValidDateKey(fromParam))) {
      return NextResponse.json({ error: "Invalid from date" }, { status: 400 });
    }
    if (toParam && (!DATE_KEY.test(toParam) || !isValidDateKey(toParam))) {
      return NextResponse.json({ error: "Invalid to date" }, { status: 400 });
    }
    const durationParam = durationRaw === null ? null : Number(durationRaw);
    if (
      durationRaw !== null &&
      (!Number.isInteger(durationParam) || durationParam < 5 || durationParam > 480)
    ) {
      return NextResponse.json(
        { error: "Duration must be a whole number from 5 to 480 minutes" },
        { status: 400 },
      );
    }

    const fromDateKey = fromParam || todayKey;
    const requestedTo = toParam || addDaysToDateKey(fromDateKey, 13);
    if (requestedTo < fromDateKey) {
      return NextResponse.json({ error: "The to date must not be before from" }, { status: 400 });
    }
    // Cap the window so one request cannot ask the engine to walk a year.
    const maxTo = addDaysToDateKey(fromDateKey, MAX_RANGE_DAYS - 1);
    const toDateKey = requestedTo > maxTo ? maxTo : requestedTo;
    const effectiveDuration = durationParam ?? policy.defaultDurationMinutes;

    const { slots, timezone } = await getBookableSlots(supabaseAdmin, {
      hostId,
      fromDateKey,
      toDateKey,
      durationMinutes: effectiveDuration,
      policy,
    });

    return NextResponse.json({
      slots,
      timezone,
      durationMinutes: effectiveDuration,
      from: fromDateKey,
      to: toDateKey,
    });
  } catch (error) {
    console.error("[DEAL SLOTS API] GET error:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
