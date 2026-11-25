import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

const NO_STORE = { "Cache-Control": "private, no-store" };
const checkBriefingLogRate = createRateLimiter({
  limit: 30,
  windowMs: 60_000,
  maxKeys: 10_000,
});

// ─────────────────────────────────────────────────────────────────────────
// BROKER BRIEFING LOG  (NEW_IDEAS.md §5)
//
//   POST /api/broker/briefing-log { propertyId }
//
// Records that a broker generated a field briefing. Two reasons this exists:
//   1. Owners can see which advisors are actively working their listing —
//      real activity, not a vanity metric.
//   2. If a client later disputes what they were shown, there's a timestamp.
//
// PRIVACY: rows are readable only by the broker who created them (RLS policy
// "Brokers read own briefing logs"). An owner-facing aggregate view would
// need its own endpoint and its own decision about what to expose — that is
// deliberately NOT built here.
//
// Best-effort by design: the client fires this and ignores the result. A
// logging failure must never block a broker standing in a lobby.
// ─────────────────────────────────────────────────────────────────────────

const schema = z.object({
  propertyId: z.string().min(1).max(200),
});

export async function POST(req) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Server error: missing service role configuration" }, { status: 500 });
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Sign in to continue." }, { status: 401, headers: NO_STORE });
    }

    const rate = checkBriefingLogRate(`${clientIp(req)}:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many briefing log requests. Please try again shortly." },
        { status: 429, headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role, active_roles")
      .eq("id", userId)
      .maybeSingle();
    const heldRoles = new Set(
      [profile?.role, ...(Array.isArray(profile?.active_roles) ? profile.active_roles : [])]
        .filter(Boolean)
        .map((r) => String(r).toLowerCase())
    );
    if (!["broker", "salesperson", "admin", "staff"].some((r) => heldRoles.has(r))) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Broker or salesperson role required." },
        { status: 403, headers: NO_STORE }
      );
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400, headers: NO_STORE });
    }

    // Collapse repeat generations within the hour into one row. A broker
    // reopening the sheet three times while walking a unit is one briefing,
    // not three, and the log is meant to be readable.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("broker_briefing_logs")
      .select("id")
      .eq("broker_user_id", userId)
      .eq("property_id", parsed.data.propertyId)
      .gte("generated_at", hourAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      return NextResponse.json({ success: true, deduped: true }, { status: 200 });
    }

    const { error } = await supabaseAdmin.from("broker_briefing_logs").insert({
      broker_user_id: userId,
      property_id: parsed.data.propertyId,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, deduped: false }, { status: 201 });
  } catch (error) {
    console.error("[api/broker/briefing-log] failed:", error);
    return NextResponse.json(
      { success: false, message: sanitizeError(error, "Couldn't record the briefing.") },
      { status: 500 },
    );
  }
}
