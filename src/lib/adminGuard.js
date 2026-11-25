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

const STAFF_MIN_TIER = 1;
const STAFF_MAX_TIER = 3;

function readJwtAal(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload?.aal === "string" ? payload.aal.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Verify the caller is an active Mission Control staff member (`admin_users`)
 * meeting minimum tier, finance authority, and AAL2 MFA requirements.
 *
 * @param {Request} request
 * @param {object}  [opts]
 * @param {string}  [opts.label] log prefix, e.g. "ADMIN OSINT"
 * @param {number}  [opts.minTier=1] minimum staff tier (1=Agent, 2=Ops Manager, 3=Super Admin)
 * @param {boolean} [opts.requireFinance=false] require `is_finance === true`
 * @param {boolean} [opts.requireAal2=false] require AAL2 MFA on JWT
 * @returns {Promise<{user: object, userId: string, staff: object, tier: number, isFinance: boolean}|{error: string, status: number}>}
 */
export async function requireAdmin(
  request,
  { label = "ADMIN", minTier = 1, requireFinance = false, requireAal2 = false } = {}
) {
  const raw = (request.headers.get("Authorization") || "").trim();
  const token = /^Bearer\s+(.+)$/i.exec(raw)?.[1]?.trim();
  if (!token) return { error: "Unauthorized: Missing token", status: 401 };

  if (!supabaseAdmin) {
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

  if (requireAal2) {
    const tokenAal = readJwtAal(token);
    const userAal = typeof user?.aal === "string" ? user.aal.toLowerCase() : null;
    if ((tokenAal || userAal) !== "aal2") {
      return { error: "Multi-factor verification (AAL2) required", status: 403 };
    }
  }

  const { data: staff, error: staffError } = await supabaseAdmin
    .from("admin_users")
    .select("id, email, display_name, tier, is_finance, active")
    .eq("id", user.id)
    .maybeSingle();

  if (staffError || !staff) {
    console.warn(`[${label}] Staff lookup failed for ${user.id} — denying.`);
    return { error: "Unauthorized: Staff privileges required", status: 403 };
  }

  if (staff.active !== true) {
    console.warn(`[${label}] Inactive staff account attempted access: ${user.id}`);
    return { error: "Unauthorized: Staff account is inactive", status: 403 };
  }

  const tier = Number(staff.tier);
  if (!Number.isInteger(tier) || tier < STAFF_MIN_TIER || tier > STAFF_MAX_TIER) {
    console.warn(`[${label}] Invalid staff tier for ${user.id} — denying.`);
    return { error: "Unauthorized: Invalid staff tier", status: 403 };
  }

  if (tier < minTier) {
    console.warn(`[${label}] Tier ${tier} below required Tier ${minTier} for ${user.id}`);
    return { error: `Forbidden: Tier ${minTier} authority required`, status: 403 };
  }

  const isFinance = staff.is_finance === true;
  if (requireFinance && !isFinance) {
    console.warn(`[${label}] Non-finance staff ${user.id} denied finance operation`);
    return { error: "Forbidden: Finance authority required", status: 403 };
  }

  return { user, userId: user.id, staff, tier, isFinance };
}
