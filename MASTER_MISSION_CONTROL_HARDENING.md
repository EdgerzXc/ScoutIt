# Master Mission Control — Hardening & Deployment Plan

_Last updated: 2026-07-22. Owner: Jerzel. Companion to `mission-control/MISSION_CONTROL_SPEC.md`._

This is the plan for turning the existing `mission-control/` app into ScoutIt's hardened, staff-only
control room — the "second wall" that protects the platform even if the public site is attacked.
Plain language first; technical detail at the bottom.

---

## What this is, in one paragraph

Master Mission Control is the private cockpit **you and your staff** use to run ScoutIt itself —
approve/reject properties, manage users, ban bad actors, flip features on and off, see the audit
trail of who did what. It is deliberately a **separate app on a separate address** from the public
site, so that (a) a hack or a bad deploy on the public site can't reach the control room, and (b)
the most powerful keys live only here, never in the public app. The good news: this already exists
as a solid skeleton. This plan is about locking it down to bank-vault standards before real staff
use it.

---

## What already exists (don't rebuild this)

The `mission-control/` folder is already a real, well-built app:
- **Separate everything** — its own code repo, its own Vercel deployment, its own login. Good.
- **Real staff login** — staff sign in as themselves via a secure email link (not the fake browser
  login the public site uses).
- **Three permission levels** — Agent (day-to-day), Ops Manager (team lead), Super Admin (you).
  Lower levels literally can't see the dangerous buttons.
- **Every action is logged** — who did it, what tier they were, and why. Can't be edited after.
- **Safe-by-design mutations** — staff never touch the database directly; every action goes through
  a checked, logged function. No "staff member with a SQL console" risk.

In short: the *architecture* is right. What it needs is the *outer defenses*.

---

## The hardening plan (recommended order)

### Layer 1 — Put a locked gate in front of the whole thing 🔴 top priority
**Plain version:** Today, if someone finds the web address, they at least reach the login page. A
login page on the open internet is one leaked password away from trouble. We want them to not even
reach the door.
**Do:** Put the entire deployment behind a network gate — Vercel Access, an IP allowlist (your
office/home/VPN), or company SSO — *before* the app's own login. Use a non-obvious address and mark
it "do not index" so Google never lists it.
**Why this is the "second wall" you described:** an attacker has to get through the network gate
*and* a real staff login *and* the permission checks. Three walls, not one.

### Layer 2 — Give it its own bouncer (rate limiting / WAF)
**Plain version:** The public site has a shield that slows down floods of requests. The control room
currently inherits none of it.
**Do:** Put Cloudflare (or equivalent) in front for rate limiting + a basic web firewall.

### Layer 3 — Keep the master key in one place only
**Plain version:** There's a "master key" to the database (the service-role key). It should exist
*only* in the control room's server settings, never in the public app, never in anything a browser
downloads.
**Do:** Verify in the live Vercel settings (not just the local `.env` file) that this key lives only
in Mission Control's environment. This is a 5-minute check with big consequences.

### Layer 4 — Get alerted when something serious happens
**Plain version:** The app already writes down every important action. Now make it *tell you* when a
sensitive one happens — a ban, a permission change, a feature flip.
**Do:** Wire alerts (email/Slack) on high-impact audit events. Optionally make the log tamper-proof.

### Layer 5 — Anti-scraping is a shared job
**Plain version:** Protecting your data from bulk-copying isn't only a control-room task; it's also
about the public site's doors.
**Do:** (already done) removed bulk file listing; (next) add the bot-check (Turnstile) to the
public content endpoint, and per-visitor limits on it.

---

## My recommendation on access model (you asked me to advise)

**Go internal-only and hard-gated (Layer 1 above), not "public address with a login."**

The trade-off in plain terms: hard-gating means you and staff connect through a gate (a VPN, an
approved network, or an SSO sign-in) *before* you even see the app. That's a little less convenient.
But this is a tool that can move money, ban users, and change the live site — for something that
powerful, that small friction is exactly the protection you want. A plain login page on a public
address is the softer target you're specifically trying to avoid.

---

## What is NOT built yet (from the existing spec's own roadmap)

- Billing/disputes module (needs your payment processor decision — PayMongo/Xendit)
- The Airtable-side property approval toggle operated from Mission Control
- Media processing + notifications screens (nav exists, screens are stubs)
- Wiring the public site to actually read the new badges table

---

## Technical appendix (for engineers)

**Current state (verified):** separate git repo + Vercel project (`mission-control/.vercel`),
Supabase magic-link auth, `admin_users` tier table (1/2/3), server-action-only mutations via
`lib/supabase/admin.js` (service role) gated by `lib/rbac.js` (`getCurrentStaff` / `assertTier` /
`logAction`), immutable `mission_control_actions` log. Middleware redirects unauthenticated users to
`/`. Migrations `0001`–`0003` applied to the shared Supabase project.

**Gaps to close:**
1. No network-layer gate — add Vercel Access / IP allowlist / SSO in front of the deployment;
   set a non-indexable subdomain (e.g. `mc.scoutit.ph`) with `X-Robots-Tag: noindex`.
2. No app-level rate limiting/WAF — front with Cloudflare; mirror the main app's Upstash pattern
   (`src/middleware.js`) for `/dashboard` + server actions if staying Vercel-native.
3. Confirm `SUPABASE_SERVICE_ROLE_KEY` is scoped to MC's Vercel env only (audit main app env too).
4. No test suite / CI in `mission-control/` — add Vitest + a GitHub Actions workflow.
5. Alerting on `mission_control_actions` for `*.ban`, `feature_gate.toggle`, `staff.*` events;
   consider append-only hardening (e.g., a Postgres rule or periodic hash-chain) for tamper-evidence.
6. Bootstrap note: first Tier-3 is a manual SQL insert (see `0001_mission_control_rbac.sql`).
