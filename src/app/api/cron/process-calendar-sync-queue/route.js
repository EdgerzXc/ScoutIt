import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { processCalendarSyncQueue } from "@/lib/calendar/meetLink";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const denied = authorizeCronRequest(request);
  if (denied) return denied;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role unavailable" }, { status: 503 });
  }

  try {
    const summary = await processCalendarSyncQueue(supabaseAdmin, { limit: 25 });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[cron/process-calendar-sync-queue] error:", err);
    return NextResponse.json({ error: "Failed to process calendar sync queue" }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
