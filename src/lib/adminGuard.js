// ─────────────────────────────────────────────────────────────────────────
// THE ONE ADMIN GATE
// NEW_IDEAS_2.md §59 · full-system audit, Layer 2
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────
// `requireAdmin` was hand-written, separately, inside five different route
// files: /api/admin/approve, connects-refund, feature-flags, prc, property.
// Five copies of a security check is five chances to omit one — and one WAS
// omitted:
//
//   🔴 /api/admin/osint had NO authentication of any kind, while using the
//      service-role client. `POST { action: "publish_briefing" }` inserted
//      straight into `intel_briefings`, which `lib/cmsCache.js` reads into
//      `/api/cms` and renders on the PUBLIC /intel page — and Supabase
//      briefings take priority over Airtable BY SLUG, so reusing an existing
//      slug overwrites a real article. Unauthenticated content injection and
//      defacement, on a deployed site.
//
//   🟠 /api/admin/generate-seo checked only that SOMEONE was signed in — no
//      admin role, no property ownership — and then wrote to Airtable. Any
//      signed-in user could rewrite any listing's public SEO copy.
//
// The pattern is identical to `lib/auditTrail.js` from the same audit: three
// hand-rolled copies of a thing, all subtly wrong. A security check duplicated
// per call site is not a check, it is a convention — and conventions get
// forgotten in the file nobody reviewed.
//
// ── THE ROLE COLUMN IS NOT THE ROLE ARRAY ────────────────────────────
// `user_profiles` carries BOTH `role` (a single text column) and
// `active_roles` (an array). The existing admin routes check `role === 'admin'`;
// /api/property/verify checks `active_roles.includes('admin' | 'staff')`. Those
// are different questions and can disagree. This helper checks BOTH and is
// explicit that either satisfies staff-level access, so a route cannot pass one
// gate and fail the other. Do not "simplify" it to one column without first
// reconciling the data.
// ─────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** Roles that may act on staff-only surfaces. */
const STAFF_ROLES = ["admin", "staff"];

/**
 * Verify the caller is staff.
 *
 * @param {Request} request
 * @param {object}  [opts]
 * @param {string}  [opts.label] log prefix, e.g. "ADMIN OSINT"
 * @returns {Promise<{user: object, userId: string}|{error: string, status: number}>}
 *
 * Positive checks only — an unknown or missing role denies (Rule 6). A lookup
 * failure denies too: "we could not establish that you are staff" is not
 * "you are staff".
 */
export async function requireAdmin(request, { label = "ADMIN" } = {}) {
  // Parse the scheme properly rather than string-replacing "Bearer ".
  //
  // The five hand-rolled copies all do `authHeader.replace("Bearer ", "")`,
  // which the Headers API defeats: header values are trimmed on the way in, so
  // a header of exactly `Authorization: Bearer` (no token) never matches
  // "Bearer " and yields the literal string "Bearer" as the token. That then
  // gets sent to Supabase as a credential. It is rejected there, so it is not a
  // hole — but "garbage in, rejected two network hops later" is not a gate, and
  // a caught test is cheaper than a trusted accident.
  const raw = (request.headers.get("Authorization") || "").trim();
  const token = /^Bearer\s+(.+)$/i.exec(raw)?.[1]?.trim();
  if (!token) return { error: "Unauthorized: Missing token", status: 401 };

  if (!supabaseAdmin) {
    // No service client means the role cannot be checked. Fail closed — a
    // misconfiguration must never silently disable an admin gate.
    console.error(`[${label}] No service client — cannot verify role. Denying.`);
    return { error: "Service unavailable", status: 503 };
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const authResult = await authClient.auth.getUser(token);
  const user = authResult?.data?.user;
  if (authResult?.error || !user) return { error: "Unauthorized: Invalid session", status: 401 };

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("role, active_roles")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.warn(`[${label}] Role lookup failed for ${user.id} — denying.`);
    return { error: "Unauthorized: Could not verify privileges", status: 403 };
  }

  const roles = Array.isArray(profile.active_roles) ? profile.active_roles : [];
  const isStaff =
    STAFF_ROLES.includes(profile.role) || roles.some((r) => STAFF_ROLES.includes(r));

  if (!isStaff) {
    console.warn(`[${label}] Unauthorized access attempt by user ${user.id}`);
    return { error: "Unauthorized: Admin privileges required", status: 403 };
  }

  return { user, userId: user.id };
}
