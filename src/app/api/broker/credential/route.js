import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { writeAuditLog } from "@/lib/auditTrail";

// ── U-025 — a broker states their own credential; only staff verifies it ────
//
// WHY THIS ROUTE EXISTS
// ---------------------
// `BrokerMode.handleUpdateLicense` used to write `prc_license`, `prc_expiry`,
// `dhsud_number`, `prc_verified` and `prc_verified_at` straight to
// `user_profiles` from the browser. U-022 revoked table-level UPDATE and
// re-granted ten columns; none of these five is among them, so since
// 2026-09-04 every licence save has failed with `42501` and rendered
// "Failed to update license". Proven read-only against the live database with
// `has_column_privilege('authenticated', …)` → false for all five.
//
// The grant is correct and must not be widened. `prc_verified` is the whole
// RA 9646 credential claim: if a browser can write it, the badge means
// nothing (Standing Rule 5). What the browser legitimately needs is the
// ability to STATE a number, which is what this route does on its behalf.
//
// THE INVARIANT, ENFORCED SERVER-SIDE AND NOT NEGOTIABLE
// -----------------------------------------------------
// Changing any credential field resets verification. The client does not send
// `prc_verified` and cannot influence it — it is written as `false` here, by
// this route, every time. That is the same rule the old client applied to
// itself, moved somewhere a caller cannot skip it. Staff re-verify through
// `/api/admin/prc`, which is the only writer of `prc_verified = true`.
//
// SCOPE: three columns, the caller's own row, nothing else. Do not grow this
// into a profile endpoint — see /api/profile/me/role for why that boundary is
// kept narrow.

const FIELD_COLUMN = Object.freeze({
  prcLicense: "prc_license",
  prcExpiry: "prc_expiry",
  dhsudNumber: "dhsud_number",
});

const MAX_CREDENTIAL_LENGTH = 64;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// A credential is a short identifier or nothing. "" and "   " mean the broker
// cleared the field, and both must land as NULL rather than as an empty string
// that `.not("prc_license", "is", null)` would then hand to the staff queue as
// a submission nobody made.
function normalizeCredential(value) {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false };
  const trimmed = value.trim();
  if (trimmed === "") return { ok: true, value: null };
  if (trimmed.length > MAX_CREDENTIAL_LENGTH) return { ok: false };
  return { ok: true, value: trimmed };
}

// `prc_expiry` is a DATE column. An unparseable string reaches Postgres as a
// 22007 and surfaces to the broker as a generic failure, so it is rejected
// here with a message that names the field.
function normalizeExpiry(value) {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false };
  const trimmed = value.trim();
  if (trimmed === "") return { ok: true, value: null };
  if (!ISO_DATE.test(trimmed)) return { ok: false };
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return { ok: false };
  return { ok: true, value: trimmed };
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));

    const updates = {};
    for (const [field, column] of Object.entries(FIELD_COLUMN)) {
      if (!(field in body)) continue;
      const result =
        field === "prcExpiry" ? normalizeExpiry(body[field]) : normalizeCredential(body[field]);
      if (!result.ok) {
        return NextResponse.json(
          {
            error:
              field === "prcExpiry"
                ? "Expiry must be a date in YYYY-MM-DD form, or empty to clear it."
                : `${field} must be text of ${MAX_CREDENTIAL_LENGTH} characters or fewer, or empty to clear it.`,
          },
          { status: 400 }
        );
      }
      updates[column] = result.value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No credential field provided to update." },
        { status: 400 }
      );
    }

    // Server-forced, never client-supplied. Reaching this line means a
    // credential field changed, and a changed credential is an unverified one.
    updates.prc_verified = false;
    updates.prc_verified_at = null;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      console.error("[BROKER CREDENTIAL] Update failed:", error);
      return NextResponse.json(
        { error: sanitizeError(error, "Could not update your credential.") },
        { status: 500 }
      );
    }

    // Read back rather than echo. The client renders what it is told, so it
    // must be told what is stored — the same reason /api/user/privacy-settings
    // re-reads instead of returning the request body.
    const { data: after, error: readError } = await supabaseAdmin
      .from("user_profiles")
      .select("prc_license, prc_expiry, dhsud_number, prc_verified, prc_verified_at")
      .eq("id", userId)
      .maybeSingle();

    if (readError) {
      return NextResponse.json(
        { error: sanitizeError(readError, "Saved, but could not read the credential back.") },
        { status: 500 }
      );
    }

    await writeAuditLog(supabaseAdmin, {
      action: "BROKER_CREDENTIAL_UPDATED",
      tableName: "user_profiles",
      recordId: userId,
      userId,
      metadata: { fields: Object.keys(updates).filter((k) => k !== "updated_at") },
    });

    return NextResponse.json({
      success: true,
      credential: {
        prcLicense: after?.prc_license ?? null,
        prcExpiry: after?.prc_expiry ?? null,
        dhsudNumber: after?.dhsud_number ?? null,
        prcVerified: after?.prc_verified === true,
        prcVerifiedAt: after?.prc_verified_at ?? null,
      },
      message: "Credential updated — pending staff re-verification.",
    });
  } catch (err) {
    console.error("[BROKER CREDENTIAL] POST failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not update your credential.") },
      { status: 500 }
    );
  }
}
