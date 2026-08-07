import { NextResponse } from "next/server";
import { trackAnalyticsEvent } from "@/lib/monthlyScoutWrap";
import { findProperty } from "@/lib/propertyLookup";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { createHash } from "node:crypto";

// ═══════════════════════════════════════════════════════════════════════
// ANALYTICS INTAKE — GIVEN A CALLER 2026-08-06 (§59 · W18.2)
// ═══════════════════════════════════════════════════════════════════════
//
// This endpoint was complete, correct and **had zero callers**. Nothing in the
// app had ever POSTed to it, so `analytics_events` held 0 rows — and it is the
// table the Monthly Scout Wrap (W9) reads. A read side built on a write side
// that did not exist: ship W9 first and it would have reported zero forever.
// Standing Rule 21.
//
// Three things had to be fixed before a caller could work:
//
// 1. 🔴 `telemetry_opt_out` WAS NEVER ENFORCED. `user_profiles.telemetry_opt_out`
//    is written by /api/user/privacy-settings and rendered as a real toggle in
//    PrivacyShieldPanel — and **nothing read it**. Wiring analytics without
//    honouring it would have started collecting from users who had switched it
//    off, which is worse than never having collected at all. Enforced HERE,
//    server-side, because a gate the client evaluates is a suggestion (Rule 5).
//
// 2. `property_id` is a **uuid FK to `properties(id)`**, but public property
//    pages render from AIRTABLE and only ever hold a **slug**. Passing that slug
//    straight through would fail the uuid cast on every single event — silently,
//    since `trackAnalyticsEvent` returns false and logs. The slug is resolved to
//    the real Supabase id here via `findProperty`, the same helper that fixed
//    the identical bug in /api/property/verify (§55).
//
// 3. The wrap RPC exact-matches `'property_view'` and `'property_save'`. Any
//    other spelling records an event that no report will ever count — Rule 4,
//    where a filter fails by showing nothing. The allow-list below makes a typo
//    a 400 instead of a silent zero.

/** Event types the Monthly Scout Wrap actually counts. Keep in sync with the RPC. */
const ALLOWED_EVENTS = new Set([
  "property_view",
  "property_save",
  "chapter_view",
  "contact_intent",
]);

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventType, propertyId, propertySlug, chapterId, dwellSeconds, metadata } = body;

    if (!eventType || !ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json(
        { error: "Missing or unrecognised eventType" },
        { status: 400 }
      );
    }

    // Anonymous events are expected and fine — most viewers are not signed in.
    // A user id is only used to honour their opt-out and to attribute the event.
    const userId = await resolveUserId(request);

    if (userId && supabaseAdmin) {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("telemetry_opt_out")
        .eq("id", userId)
        .maybeSingle();

      // Positive check on the opt-out, and a lookup failure records nothing.
      // "We could not read your preference" is not consent (Rules 6 & 14).
      if (profile?.telemetry_opt_out === true || !profile) {
        return NextResponse.json({ success: true, recorded: false, reason: "opted_out" });
      }
    }

    // Resolve a slug to the real uuid. `property_id` FKs to properties(id), so
    // an unresolvable reference must be dropped rather than sent — it would
    // violate the constraint and fail the whole insert.
    let resolvedPropertyId = propertyId || null;
    if (!resolvedPropertyId && propertySlug && supabaseAdmin) {
      const { property } = await findProperty(supabaseAdmin, propertySlug, ["id"]);
      resolvedPropertyId = property?.id || null;
    }

    // Privacy-safe viewer key: salted hash of IP + user-agent, re-salted each
    // month so a viewer cannot be followed across months. Never stores the IP.
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("cf-connecting-ip") ||
      "anon_ip";
    const ua = request.headers.get("user-agent") || "anon_ua";
    const monthSalt = new Date().toISOString().substring(0, 7);
    const viewerKey = createHash("sha256")
      .update(`${ip}:${ua}:${monthSalt}`)
      .digest("hex")
      .substring(0, 24);

    const success = await trackAnalyticsEvent({
      eventType,
      propertyId: resolvedPropertyId,
      viewerKey,
      userId: userId || null,
      chapterId,
      dwellSeconds: Number(dwellSeconds) || 0,
      metadata,
    });

    return NextResponse.json({ success, recorded: success });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
