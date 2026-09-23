import { NextResponse } from "next/server";
import { trackAnalyticsEvent } from "@/lib/monthlyScoutWrap";
import { findProperty } from "@/lib/propertyLookup";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { createHash } from "node:crypto";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { detectContactLeak } from "@/lib/contactLeakFilter";

// ── WRITE CEILING (A-012) ────────────────────────────────────────────────────
// Anonymous events are expected here — most viewers are not signed in — but
// "anonymous" is not the same as "unbounded". This is a public write path with
// no Turnstile in front of it.
//
// The limit is high on purpose: a real reader scrolling one property page emits
// several chapter and dwell events in quick succession, and metering honest
// telemetry into silence would corrupt the data this route exists to collect.
const ANALYTICS_LIMIT_PER_MINUTE = 120;
const checkAnalyticsRate = createRateLimiter({
  limit: ANALYTICS_LIMIT_PER_MINUTE,
  windowMs: 60_000,
  maxKeys: 20_000,
});

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
]);

// A-146: metadata is caller-supplied free shape landing in a stored JSONB
// column. chapter_view/contact_intent were removed from the allow-list in the
// same change (zero callers — PropertyViewTracker sends only property_view —
// so they were write-only rows no report counts). What remains is scrubbed:
// primitives only, bounded length, and any key carrying contact details or a
// URL is dropped rather than stored.
const URL_LIKE = /https?:\/\/|www\.|[?&][^\s=]+=|%3f|%26/i;
const CONTACT_LIKE = /@|(?:\+?\d[\s().-]*){7,}/;
const SAFE_META_KEY = /^[A-Za-z0-9_-]{1,64}$/;

export function sanitizeServerMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!SAFE_META_KEY.test(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) {
      clean[key] = value;
      continue;
    }
    if (typeof value === "boolean") {
      clean[key] = value;
      continue;
    }
    if (typeof value !== "string" || value.length === 0 || value.length > 200) continue;
    if (URL_LIKE.test(value) || CONTACT_LIKE.test(value)) continue;
    if (!detectContactLeak(value).clean) continue;
    clean[key] = value;
  }
  return clean;
}

export async function POST(request) {
  const rate = checkAnalyticsRate(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many analytics events" },
      {
        status: 429,
        headers: {
          "Cache-Control": "private, no-store",
          "Retry-After": String(rate.retryAfterSeconds),
        },
      }
    );
  }

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
      metadata: sanitizeServerMetadata(metadata),
    });

    return NextResponse.json({ success, recorded: success });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
