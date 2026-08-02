import { NextResponse } from "next/server";
import { trackAnalyticsEvent } from "@/lib/monthlyScoutWrap";
import { sanitizeError } from "@/lib/sanitizeError";
import { createHash } from "node:crypto";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventType, propertyId, chapterId, dwellSeconds, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 });
    }

    // Generate privacy-safe viewer key (salted hash of IP + user-agent per month)
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "anon_ip";
    const ua = request.headers.get("user-agent") || "anon_ua";
    const monthSalt = new Date().toISOString().substring(0, 7);
    const viewerKey = createHash("sha256").update(`${ip}:${ua}:${monthSalt}`).digest("hex").substring(0, 24);

    const success = await trackAnalyticsEvent({
      eventType,
      propertyId,
      viewerKey,
      chapterId,
      dwellSeconds: Number(dwellSeconds) || 0,
      metadata
    });

    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
