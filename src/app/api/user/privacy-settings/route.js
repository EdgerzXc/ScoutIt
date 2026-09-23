// ═══════════════════════════════════════════════════════════════
// CONSOLIDATED USER PRIVACY SETTINGS API (SET-01)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { normalizePublicRoles } from "@/lib/publicRoles";

/**
 * GET /api/user/privacy-settings
 * Returns the current user's consolidated privacy settings.
 */
export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("is_profile_public, telemetry_opt_out, marketing_opt_out, adult_eligibility_status")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: sanitizeError(error, "Could not load privacy settings.") },
        { status: 500 }
      );
    }

    // ── ANONYMITY SHIELD (W13 · C19 · §46.8) ────────────────────────
    // Lives in `privacy_settings`, a different table from the rest of these
    // flags. It was wired at row creation and had no read path and no write
    // path, so the toggle had nothing to talk to. This is that path.
    //
    // ⚠️ NOT TIER-GATED, and this route must never learn to check a tier.
    // Standing Rule 10: defaults may differ by tier, access never may.
    //
    // A-152: email_alerts rides the same table but lands via its own
    // migration (O-004 item 7). Until that migration is applied the column
    // does not exist — readShield degrades to the honest default instead of
    // 500ing (the A-144/A-148 pattern: never 500 on a missing column).
    const { shield, emailAlertsStored } = await readShield(
      supabaseAdmin,
      userId,
    );

    return NextResponse.json({
      success: true,
      settings: {
        // The column's own default is FALSE and a NULL is never an assertion
        // (Standing Rule 14). Reporting  for an unset flag told a user
        // their profile was public when the database said the opposite — a
        // privacy control failing OPEN (Standing Rule 6).
        isProfilePublic: profile?.is_profile_public === true,
        telemetryOptOut: profile?.telemetry_opt_out ?? false,
        marketingOptOut: profile?.marketing_opt_out ?? false,
        // `?? false` is the honest default here: a missing row means the shield
        // was never switched on, and reporting it as ON would tell someone they
        // are protected when they are not. The failure direction matters more
        // than the tidiness.
        anonymousBrowsing: shield?.anonymous_browsing ?? false,
        anonymousByline: shield?.anonymous_byline ?? false,
        // A-135: which roles show on the public profile. Unset means none —
        // never "all", for the same fail-closed reason as the flags above.
        publicRoles: normalizePublicRoles(shield?.public_roles) ?? [],
        // A-152: unset (or pre-migration) means the effective default — email
        // fallback ON — because that is what the server actually does today.
        // Reporting OFF would promise silence the fallback does not keep.
        emailAlerts: shield?.email_alerts ?? true,
        emailAlertsStored,
        // "unknown" is the honest default, not "declared_adult" (§47).
        // Reporting an attestation the user never made is how a legal-capacity
        // claim gets fabricated by a fallback value.
        adultEligibilityStatus: profile?.adult_eligibility_status || "unknown",
      },
    });
  } catch (err) {
    console.error("[PRIVACY SETTINGS API] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not load privacy settings.") },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/privacy-settings
 * Updates the user's consolidated privacy settings.
 */
export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const updates = {};

    if (typeof body.isProfilePublic === "boolean") {
      updates.is_profile_public = body.isProfilePublic;
    }

    if (typeof body.telemetryOptOut === "boolean") {
      updates.telemetry_opt_out = body.telemetryOptOut;
    }

    if (typeof body.marketingOptOut === "boolean") {
      updates.marketing_opt_out = body.marketingOptOut;
    }

    // Anonymity shield fields live in `privacy_settings`, not `user_profiles`.
    const shieldUpdates = {};
    if (typeof body.anonymousBrowsing === "boolean") {
      shieldUpdates.anonymous_browsing = body.anonymousBrowsing;
    }
    if (typeof body.anonymousByline === "boolean") {
      shieldUpdates.anonymous_byline = body.anonymousByline;
    }
    // A-152: email-fallback preference. A boolean only; anything else is
    // refused whole, never partly applied.
    let emailAlertsRequested;
    if (body.emailAlerts !== undefined) {
      if (typeof body.emailAlerts !== "boolean") {
        return NextResponse.json(
          { error: "emailAlerts must be true or false." },
          { status: 400 },
        );
      }
      emailAlertsRequested = body.emailAlerts;
    }

    // A-135: role visibility moved here from the browser-direct write on
    // /profile, so privacy has one writer. Only an array of allowed role names
    // is accepted; anything else is refused whole, never partly applied.
    if (body.publicRoles !== undefined) {
      const roles = normalizePublicRoles(body.publicRoles);
      if (roles === null) {
        return NextResponse.json(
          { error: "publicRoles must be a list of Seeker, Broker or Provider roles." },
          { status: 400 }
        );
      }
      shieldUpdates.public_roles = roles;
    }

    if (
      Object.keys(updates).length === 0 &&
      Object.keys(shieldUpdates).length === 0 &&
      emailAlertsRequested === undefined
    ) {
      return NextResponse.json(
        { error: "No valid privacy settings provided to update." },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update(updates)
        .eq("id", userId);
      if (error) {
        return NextResponse.json(
          { error: sanitizeError(error, "Could not update privacy settings.") },
          { status: 500 }
        );
      }
    }

    if (Object.keys(shieldUpdates).length > 0) {
      // Upsert, not update: a profile created before the shield existed has no
      // `privacy_settings` row, and an update against a missing row succeeds
      // while changing nothing. The user would see the toggle flip and their
      // setting would not exist — a privacy control that silently does nothing
      // is worse than one that isn't offered.
      const { error } = await supabaseAdmin
        .from("privacy_settings")
        .upsert({ user_id: userId, ...shieldUpdates }, { onConflict: "user_id" });
      if (error) {
        return NextResponse.json(
          { error: sanitizeError(error, "Could not update your anonymity settings.") },
          { status: 500 }
        );
      }
    }

    // A-152: written separately from the shield upsert above. If the
    // email_alerts migration (O-004 item 7) has not been applied, this write
    // 42703s — that must degrade to an honest stored:false, not fail the
    // whole save (the other fields above really did save).
    let emailAlertsStored = true;
    if (emailAlertsRequested !== undefined) {
      const { error } = await supabaseAdmin
        .from("privacy_settings")
        .upsert(
          { user_id: userId, email_alerts: emailAlertsRequested },
          { onConflict: "user_id" },
        );
      if (error && error.code === "42703") {
        emailAlertsStored = false;
      } else if (error) {
        return NextResponse.json(
          { error: sanitizeError(error, "Could not update your notification settings.") },
          { status: 500 }
        );
      }
    }

    // Read the whole set back rather than echoing the request. The client
    // renders what it is told, so it must be told what is actually stored.
    const { data: profileAfter } = await supabaseAdmin
      .from("user_profiles")
      .select("is_profile_public, telemetry_opt_out, marketing_opt_out")
      .eq("id", userId)
      .maybeSingle();
    const { shield: shieldAfter, emailAlertsStored: storedAfter } =
      await readShield(supabaseAdmin, userId);
    // The read-back is the truth about storage whether or not this request
    // touched the preference: a missing column reads stored:false.
    emailAlertsStored = storedAfter;

    return NextResponse.json({
      success: true,
      settings: {
        // Same fail-open as the GET above, in the read-back after a save. A
        // person who has just switched their profile to private must not be
        // told it is public because the column came back null.
        isProfilePublic: profileAfter?.is_profile_public === true,
        telemetryOptOut: profileAfter?.telemetry_opt_out ?? false,
        marketingOptOut: profileAfter?.marketing_opt_out ?? false,
        anonymousBrowsing: shieldAfter?.anonymous_browsing ?? false,
        anonymousByline: shieldAfter?.anonymous_byline ?? false,
        publicRoles: normalizePublicRoles(shieldAfter?.public_roles) ?? [],
        emailAlerts: shieldAfter?.email_alerts ?? true,
        emailAlertsStored,
      },
      message: "Privacy settings updated successfully.",
    });
  } catch (err) {
    console.error("[PRIVACY SETTINGS API] POST failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not update privacy settings.") },
      { status: 500 }
    );
  }
}

/**
 * A-152 — tolerant read of the privacy_settings row. email_alerts lands via
 * its own migration (O-004 item 7); until then selecting it raises 42703
 * (undefined column). That degrades to stored:false with the pre-migration
 * columns, never to a 500. Any other error keeps the historical behavior —
 * a null row — because the callers already fail safe on it.
 */
async function readShield(client, userId) {
  const attempt = await client
    .from("privacy_settings")
    .select("anonymous_browsing, anonymous_byline, public_roles, email_alerts")
    .eq("user_id", userId)
    .maybeSingle();
  if (attempt.error && attempt.error.code === "42703") {
    const fallback = await client
      .from("privacy_settings")
      .select("anonymous_browsing, anonymous_byline, public_roles")
      .eq("user_id", userId)
      .maybeSingle();
    return { shield: fallback.data ?? null, emailAlertsStored: false };
  }
  return { shield: attempt.data ?? null, emailAlertsStored: true };
}
