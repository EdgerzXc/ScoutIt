import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ---------------------------------------------------------------------------
// PROPERTY REACTIONS -- U-010, then A-142
//
// -- WHAT WAS WRONG (U-010) --------------------------------------------------
// This route accepted an unauthenticated POST and wrote a row into Airtable
// with no authentication, no rate limit, no allowlist on reaction_type, and no
// length caps on any field. It also wrapped everything in `catch {}` and
// returned { ok: true } unconditionally, so a total write failure looked
// exactly like a success.
//
// -- WHAT WAS STILL WRONG (A-142, was O-010) ----------------------------------
// The Airtable table it wrote to never existed (checked 2026-09-11), so every
// reaction ever tapped went nowhere. Owner decision: keep reactions for listing
// metrics, keep them anonymous. They now land in Supabase `property_reactions`
// — a visitor's tap is a submission, and Airtable is the public read-only
// content store (AGENTS.md §2).
//
// -- WHAT IT DOES NOW ---------------------------------------------------------
// Meters first, validates second, writes third, and tells the truth about the
// outcome. ANONYMOUS: the row carries the listing, the reaction, city,
// category and a timestamp — never a user id, IP or device key. The IP is used
// only by the in-memory rate limiter and is never stored.
// ---------------------------------------------------------------------------

// A reaction is a fixed vocabulary, not free text. Anything outside this set is
// a client bug or an abuse attempt; both deserve a 400 rather than a row.
//
// These strings are the KEYS OF REACTION_SHAPES in
// src/components/ui/ReactionButtons.js, plus the "Save" that
// src/components/layout/BottomNav.js sends. The database CHECK constraint in
// 20260911000005_property_reactions.sql holds the same four.
// reactionsApi.test.js reads all three and fails if they drift.
export const REACTION_TYPES = Object.freeze([
  "Save",
  "Inspired Me",
  "Potential Fit",
  "Interested",
]);

const MAX_LABEL_LENGTH = 120;
// Airtable record ids are rec + 14 chars, but this route also accepts internal
// slugs, so the rule is "plausible identifier" rather than a strict rec-id
// match: bounded length, and no characters that belong in a formula or a URL.
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

const RATE_LIMIT_PER_MINUTE = 30;
const checkReactionRate = createRateLimiter({
  limit: RATE_LIMIT_PER_MINUTE,
  windowMs: 60_000,
  maxKeys: 20_000,
});

/**
 * @returns {string|null} an error message, or null when the field is acceptable
 */
function validateLabel(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return `${field} must be a string`;
  if (value.length > MAX_LABEL_LENGTH) return `${field} is too long`;
  return null;
}

export async function POST(request) {
  // Meter before parsing so a flood costs as little as possible.
  const rate = checkReactionRate(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many reactions" },
      {
        status: 429,
        headers: {
          "Cache-Control": "private, no-store",
          "Retry-After": String(rate.retryAfterSeconds),
        },
      }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { property_id, reaction_type, city, category } = body || {};

  if (typeof property_id !== "string" || !SAFE_ID.test(property_id)) {
    return NextResponse.json({ ok: false, error: "Invalid property_id" }, { status: 400 });
  }

  if (typeof reaction_type !== "string" || !REACTION_TYPES.includes(reaction_type)) {
    return NextResponse.json(
      { ok: false, error: "Unknown reaction_type", allowed: REACTION_TYPES },
      { status: 400 }
    );
  }

  const labelError = validateLabel(city, "city") || validateLabel(category, "category");
  if (labelError) {
    return NextResponse.json({ ok: false, error: labelError }, { status: 400 });
  }

  // No service client is a deployment state, not a caller error, and it is not
  // a success either. Say so plainly.
  if (!supabaseAdmin) {
    return NextResponse.json(
      { ok: false, error: "Reactions are not configured" },
      { status: 503 }
    );
  }

  try {
    // Exactly these four fields. Adding an identity field here breaks the
    // anonymity promise; reactionsApi.test.js pins the payload shape.
    const { error } = await supabaseAdmin.from("property_reactions").insert({
      property_ref: property_id,
      reaction_type,
      city: typeof city === "string" ? city : "",
      category: typeof category === "string" ? category : "",
    });

    if (error) {
      // Deliberately does not forward the database message. It can carry table
      // and column names, and this endpoint is public.
      console.error("Reactions write failed:", error.code);
      return NextResponse.json(
        { ok: false, error: "Could not record reaction" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reactions write threw:", error?.message);
    return NextResponse.json(
      { ok: false, error: "Could not record reaction" },
      { status: 502 }
    );
  }
}
