/**
 * THE CROSS-APP DECISION
 *
 * Settled 2026-08-30, while fixing the OSINT Control Center. Written here
 * rather than in a document because a rule nothing enforces is a preference:
 * `test/cross-app-boundary.test.mjs` fails the build if Mission Control grows a
 * new HTTP call to the main site.
 *
 * ── THE RULE ────────────────────────────────────────────────────────────────
 *
 *   Mission Control does NOT call the main site's HTTP API.
 *   It reaches the same Supabase and the same Airtable directly, under its own
 *   RBAC and its own audit trail.
 *
 * ── WHY, AND WHAT WAS REJECTED ──────────────────────────────────────────────
 *
 * The OSINT Control Center called `${NEXT_PUBLIC_MAIN_SITE_URL}/api/admin/osint`
 * with no Authorization header, and that variable was set in neither app. The
 * URL therefore resolved to Mission Control's own origin, where the route does
 * not exist. The page had never worked once. Two ways to "fix" it were
 * available and both were rejected:
 *
 * 1. **Forward the staff member's Supabase token.** The main site's
 *    `requireAdmin` answers a different question from Mission Control's RBAC.
 *    It asks whether `user_profiles.role` / `active_roles` says "admin" or
 *    "staff". Mission Control's staff live in `admin_users` with a tier, keyed
 *    by the same auth user. A Super Admin here is not necessarily staff there.
 *    Bridging them means either duplicating staff identity into a second table
 *    or teaching one gate about the other — and `adminGuard.js` already carries
 *    a warning about exactly this kind of divergence between `role` and
 *    `active_roles`. Adding a third reading of "is this person staff" would
 *    make the drift worse, in the security check.
 *
 * 2. **A shared service secret between the two deployments.** A single
 *    long-lived credential that grants the whole `/api/admin/*` surface, held
 *    in two Vercel projects, with no per-actor identity behind it. The main
 *    site could then only trust Mission Control's assertion about who acted, so
 *    the audit trail would degrade from "this named staff member did it" to
 *    "the console says someone did it".
 *
 * Both options add a trust boundary to cross a gap that does not need to exist.
 * Mission Control already holds the service-role key and already talks to
 * Supabase and Airtable directly for the CMS, disputes, coordinates, media and
 * verification. OSINT was the only surface that went the long way round, and
 * it was the only one that had never worked.
 *
 * ── WHAT THIS MEANS FOR THE NEXT CAPABILITY ─────────────────────────────────
 *
 * When a new staff capability needs something the main site can do:
 *
 *   - **The data lives in Supabase or Airtable** — reach it directly, with
 *     `assertTier` first and `logAction` after. This is the overwhelmingly
 *     common case, and it is the whole of OSINT.
 *   - **The effect is on shared infrastructure** — act on the infrastructure,
 *     not on the app in front of it. A-060 does this: the public catalogue
 *     cache is a Redis key, so Mission Control deletes the key rather than
 *     asking the main site to.
 *   - **The effect genuinely only exists inside the main site's process** —
 *     the one real example is Next's in-memory/ISR state, which no other
 *     deployment can touch. Nothing needs it today. If something ever does,
 *     that is when a signed service call gets designed, for that one narrow
 *     effect, with the actor carried in the payload and recorded on both sides.
 *     It is not a reason to open a general admin channel now.
 *
 * The 60-second in-process CMS copy is the standing illustration: it is
 * unreachable from here and deliberately not chased, because it expires on its
 * own.
 */

/** Hosts Mission Control is allowed to call. Everything else is a boundary crossing. */
export const ALLOWED_EXTERNAL_HOSTS = Object.freeze([
  "api.airtable.com",
  "generativelanguage.googleapis.com",
  "www.virustotal.com",
  "unpkg.com",
  "basemaps.cartocdn.com",
  "images.unsplash.com",
  "api.mapbox.com",
]);

/**
 * Hosts that ARE the main site. A `fetch` to one of these from Mission Control
 * is the boundary this decision closes.
 */
export const MAIN_SITE_HOSTS = Object.freeze([
  "scoutit.space",
  "www.scoutit.space",
  "scout-it.vercel.app",
  "scoutit.vercel.app",
]);

/**
 * The environment variable that used to point at the main site. It is named
 * here so the test can assert nothing reads it again — reintroducing it is how
 * the long way round comes back.
 */
export const RETIRED_ENV_VARS = Object.freeze(["NEXT_PUBLIC_MAIN_SITE_URL"]);
