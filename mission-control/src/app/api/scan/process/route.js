import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { processPendingScans } from "@/lib/scanWorker";

function timingSafeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// B1 — cron/queue entry point for the scan worker, so pending uploads get
// scanned even when no staff member is in the console. Protected by
// CRON_SECRET (same convention as the main app's cron routes).
// Supports both POST and GET (Vercel Cron triggers GET by default).
export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  const rawAuth = request.headers.get("authorization") || "";
  const bearerToken = /^Bearer\s+(.+)$/i.exec(rawAuth)?.[1]?.trim();
  const provided =
    request.headers.get("x-cron-secret") ||
    bearerToken ||
    "";
  if (!secret || !timingSafeCompare(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const admin = createAdminClient();
    const summary = await processPendingScans(admin);
    return NextResponse.json({ ok: true, ...summary }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[MC SCAN PROCESS] Failed:", err);
    return NextResponse.json({ ok: false, error: "Scan processing failed" }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}

export async function GET(request) {
  return POST(request);
}
