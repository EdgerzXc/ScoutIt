import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pullInbound } from "@/lib/calendar/googleSync";
import { processCalendarSyncQueue } from "@/lib/calendar/meetLink";

// POST /api/calendar/sync — pull the caller's Google events into ScoutIt for a
// window around now (default −30d … +90d). This is the on-demand "Sync now" /
// backfill; outbound (ScoutIt → Google) happens automatically on event writes.
const DEFAULT_BACK_DAYS = 30;
const DEFAULT_FWD_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // A-361: Drain any queued viewing-appointment calendar retries for this host
    // alongside the manual/periodic sync.
    if (supabaseAdmin) {
      await processCalendarSyncQueue(supabaseAdmin, { hostUserId: userId, limit: 10 }).catch((err) => {
        console.warn("[calendar/sync] retry queue drain warning:", err?.message);
      });
    }

    const now = Date.now();
    const from = new Date(now - DEFAULT_BACK_DAYS * DAY_MS).toISOString();
    const to = new Date(now + DEFAULT_FWD_DAYS * DAY_MS).toISOString();

    const result = await pullInbound(userId, { from, to });

    if (result.skipped === "not_connected") {
      return NextResponse.json({ error: "No Google Calendar connected" }, { status: 409 });
    }
    if (result.skipped === "token_error") {
      return NextResponse.json({ error: "Reconnect Google Calendar" }, { status: 409 });
    }
    if (result.skipped === "no_db") {
      return NextResponse.json({ error: "Calendar database is not configured" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[calendar/sync] error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
