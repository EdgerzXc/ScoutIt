import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rateLimit";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { clientIp } from "@/lib/clientIp";

// ---------------------------------------------------------------------------
// PROPERTY REACTIONS -- U-010
//
// -- WHAT WAS WRONG ---------------------------------------------------------
// This route accepted an unauthenticated POST and wrote a row into Airtable
// with no authentication, no rate limit, no allowlist on reaction_type, and no
// length caps on any field. Anyone could loop it and fill a record-capped,
// billed production base before a single pilot user existed.
//
// It also wrapped everything in `catch {}` and returned { ok: true }
// unconditionally, so a total write failure looked exactly like a success. That
// is the worse half of the bug: the endpoint could have been failing, or being
// abused, for weeks without producing a single visible signal.
//
// -- WHAT IT DOES NOW -------------------------------------------------------
// Meters first, validates second, writes third, and tells the truth about the
// outcome. Anonymous reactions stay anonymous -- no account is required, which
// is the point of the feature -- but "anonymous" is not the same as
// "unbounded", and this route previously confused the two.
// ---------------------------------------------------------------------------

// A reaction is a fixed vocabulary, not free text. Anything outside this set is
// a client bug or an abuse attempt; both deserve a 400 rather than a row.
//
// These strings are the KEYS OF REACTION_SHAPES in
// src/components/ui/ReactionButtons.js, plus the "Save" that
// src/components/layout/BottomNav.js sends. They are human-readable labels
// rather than slugs because that is what the product already stores in Airtable
// and in localStorage -- normalising them here would orphan every existing row.
// reactionsApi.test.js reads both components and fails if this list drifts.
export const REACTION_TYPES = Object.freeze([
  "Save",
  "Inspired Me",
  "Potential Fit",
  "Interested",
]);

const MAX_ID_LENGTH = 64;
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

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const reactionsTableId = process.env.AIRTABLE_REACTIONS_TABLE_ID;

  // An unconfigured reactions table is a deployment state, not a caller error,
  // and it is not a success either. Say so plainly.
  if (!apiKey || !baseId || !reactionsTableId) {
    return NextResponse.json(
      { ok: false, error: "Reactions are not configured" },
      { status: 503 }
    );
  }

  try {
    const res = await fetchWithRetry(
      `https://api.airtable.com/v0/${baseId}/${reactionsTableId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            property_id,
            reaction_type,
            city: typeof city === "string" ? city : "",
            category: typeof category === "string" ? category : "",
            timestamp: new Date().toISOString(),
          },
        }),
      },
      { circuit: "airtable-reactions" }
    );

    if (!res.ok) {
      // Deliberately does not forward the upstream body. Airtable error text can
      // carry base and field identifiers, and this endpoint is public.
      console.error("Reactions write failed:", res.status);
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
