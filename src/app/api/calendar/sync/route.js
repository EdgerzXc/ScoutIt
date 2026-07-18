import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { pullInbound } from "@/lib/calendar/googleSync";

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

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[calendar/sync] error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
