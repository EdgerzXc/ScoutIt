# ScoutIt Mission Control

Internal staff console — separate deployment from the public ScoutIt site, same Supabase project.
Full architecture/rationale: see [`MISSION_CONTROL_SPEC.md`](./MISSION_CONTROL_SPEC.md).

## What's live in this build

- **Staff auth** — Supabase magic-link sign-in (`/`, `/auth/callback`, `/auth/signout`), separate
  identity system from the public site's own (localStorage-based) end-user accounts.
- **RBAC core** — `admin_users` table (Tier 1 Agent / Tier 2 Ops Manager / Tier 3 Super Admin),
  resolved server-side in `src/lib/rbac.js`. The sidebar nav and every Server Action check tier
  before doing anything.
- **User CRM** (`/dashboard/crm`) — search `user_profiles`, edit minor fields, shadowban/unshadowban
  (Tier 1+), archive/unarchive — soft delete only, never a hard `DELETE` (Tier 2+).
- **Property Review Queue** (`/dashboard/cms`) — approve / reject-with-reason / archive against the
  Supabase `properties` table (owner submissions). Does **not** yet touch the Airtable
  `PROPERTIES_CMS` gate (`Approved_For_ScoutIt`) — that's still the existing Airtable Interface
  described in `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/MISSION_CONTROL_SOP.md`. See spec §5 for
  the plan to bring that in too.
- **Audit Log** (`/dashboard/audit`, Tier 2+) — every mutation above writes an immutable row to
  `mission_control_actions` in the same request; this page just reads it back.
- **Feature Gates & Global Banner** (`/dashboard/features`, Tier 3) — toggle switches backed by
  `feature_gates` (public-readable so the live site can gate on them), plus a single-active-banner
  flow backed by `site_banners`.
- **Staff IAM** (`/dashboard/staff`, Tier 3) — invite staff (real Supabase Auth invite email + an
  `admin_users` row at the chosen tier), change anyone else's tier, deactivate/reactivate. You
  can't change your own tier or deactivate yourself from here — ask another Super Admin, so one
  person can't accidentally lock themselves out.
- **Badges** (`/dashboard/badges`) — a dynamic `badge_definitions` catalog (Tier 3 creates/retires
  badge types), award/revoke to a real Supabase Auth end user by email (Tier 1+ award, Tier 2+
  revoke). Seeded from the 10 badges already hardcoded in the main app's `src/lib/badges.js` and
  `src/lib/BadgeEngine.js`. **Important:** the public site doesn't read from this table yet —
  see the banner on the page itself and spec §5 before assuming a new badge is live.
- **Bulk property import** (`/dashboard/cms/import`, Tier 1+) — upload a CSV, each row lands in the
  Review Queue as pending. Required columns: `title`, `type`, `location`; optional: `price`,
  `description`, `media_link`, `owner_id`.
- **Metrics** (`/dashboard/metrics`, Tier 2+) — supply (properties by status/category, completeness,
  pending queue age), demand/monetization (roles, subscriptions, connects), ops health (rejection
  reasons, staff activity volume). Computed live, capped at 5,000 rows per query for now.
- **System Operations** (`/dashboard/operations`, Tier 3) — fixed, checksum-locked database
  operations with schema/backfill preview, current backup evidence, privacy checks, and immutable
  intent/completion/failure events. There is no SQL editor or caller-provided query path.

Not built yet (scaffolded nav links only): Media processing, Notifications, Billing/Disputes,
Airtable-side property gate, and wiring the public site to actually read `badge_definitions`.
See spec §7 for phasing.

## Setup

1. `npm install`
2. `.env.local` needs (already present in this checkout, shared with the main ScoutIt project):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   Fixed database operations additionally require server-only SUPABASE_ACCESS_TOKEN in the
   Mission Control deployment. It must never be added to the public ScoutIt Vercel project.
   The service role key must never be exposed to the client — see `src/lib/supabase/admin.js`.
   Optionally set `NEXT_PUBLIC_APP_URL` (e.g. `https://mc.scoutit.ph`) so staff invite emails link
   back to the right `/auth/callback` — without it, Supabase falls back to your project's
   configured Site URL.
3. Apply, in order, against the **same** Supabase project the main ScoutIt app uses (not a
   separate database) via `supabase db push` or the SQL Editor:
   - `supabase/migrations/0001_mission_control_rbac.sql`
   - `supabase/migrations/0002_feature_gates_and_banners.sql`
   - `supabase/migrations/0003_badge_definitions.sql`
4. Bootstrap the first Tier 3 account — sign in once via the magic link (this creates your
   `auth.users` row even before you have `admin_users` access), then run the `insert into
   admin_users (...)` statement at the bottom of `0001_mission_control_rbac.sql` with your own
   auth user id. Every account after that can be invited through Staff IAM instead.
5. `npm run dev`

## Conventions for adding new modules

Every module follows the same shape — copy an existing one (`dashboard/crm` is the clearest
example) rather than inventing a new pattern:

1. A Server Component page that reads with the service-role client (`lib/supabase/admin.js`).
2. A `"use server"` `actions.js` file: resolve `getCurrentStaff()`, `assertTier(...)`, do the
   mutation, `logAction(...)`, `revalidatePath(...)`.
3. Nothing mutates through the browser Supabase client (`lib/supabase.js`) — that client is for
   reading the staff member's own auth session only.
4. Destructive actions (archive/reject/ban) require a `reason` and are gated at Tier 2+; routine
   moderation (shadowban, edits, approve) is Tier 1+.
