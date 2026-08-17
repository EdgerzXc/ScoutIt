import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processPendingScans } from "@/lib/scanWorker";

// B1 — cron/queue entry point for the scan worker, so pending uploads get
// scanned even when no staff member is in the console. Protected by
// CRON_SECRET (same convention as the main app's cron routes).
export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("x-cron-secret") ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const admin = createAdminClient();
    const summary = await processPendingScans(admin);
    return NextResponse.json({ ok: true, ...summary }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
