# ScoutIt Mission Control — Technical Spec (v1)

Status: draft, backing a real in-progress build. Supersedes nothing — it complements the existing
Airtable "Mission Control" interface (`_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/MISSION_CONTROL_SOP.md`),
which stays the founder's content/monetization cockpit. This spec is for the **new, code-owned,
RBAC-hardened staff console** — a separate deployment, separate domain, separate auth, built to
scale past "founder + a spreadsheet" into a real internal tool your team can keep extending.

## 0. What's already true about ScoutIt (read before building anything else)

Found while scoping this, worth knowing going in:

- **Two CMS systems already coexist by design.** Airtable (`PROPERTIES_CMS`, `BROKERS_CMS`,
  `INTEL_CMS`) is the public-content source of truth — the live site only shows rows where
  `Approved_For_ScoutIt` / `Approved_For_Live_Site` is checked. Supabase holds private/dashboard
  state: `properties` (owner submissions and dashboard listings, distinct from the Airtable table
  of the same concept), `user_profiles`, `deals`, `projects`, `saved_intel`, the monetization
  tables (`subscriptions`, `connect_balances`, `connect_transactions`, `bounty_claims`). Mission
  Control has to respect this split rather than pretend it's one database.
- **End-user auth on the public site is still localStorage-based**, not Supabase Auth — `user_id`
  columns are text (`usr-...`), not UUIDs tied to `auth.users`. Staff auth for Mission Control is
  a separate concern and does **not** depend on this changing; Mission Control uses real Supabase
  Auth (magic link) for staff, scoped to its own `admin_users` table.
- **Current Supabase RLS on the app's own tables is a real gap.** `supabase_schema.sql` shipped
  with `USING (true)` on `properties`/`deals`/`projects`/`saved_intel` (anyone with the anon key
  can read/write/delete). A hardening pass exists (`supabase_rls_hardening.sql`) but it assumes
  `auth.uid()` matches `owner_id`, which only works once Supabase Auth is wired for end users too
  — worth confirming that migration actually landed before trusting RLS as a backstop. Until then,
  **Mission Control's service-role mutations are not "extra" security on top of RLS — for some
  tables they're the only real access control that exists.** Treat every server action as if RLS
  isn't there.
- **An audit trigger already exists** (`supabase_audit_logs.sql`): generic `audit_record_changes()`
  trigger on `properties`, `deals`, `user_profiles`, `connect_balances`, writing to `audit_logs`
  (locked to service-role read only). Mission Control adds its own `mission_control_actions` table
  rather than reusing this one, because we need to log *who acted, at what tier, and why*
  (rejection reasons, block reasons) — richer than the generic before/after diff.
- **A Next.js scaffold for Mission Control already exists** at `ScoutIt/mission-control/` — separate
  git repo, separate `package.json`, Supabase magic-link auth wired (`/`, `/auth/callback`,
  `/auth/signout`), a dashboard shell with nav for Overview / CMS / User CRM / Feature Gates /
  Media / Notifications, all currently mocked. This spec formalizes what that scaffold is becoming
  and this build wires the first modules for real.

## 1. Why a separate deployment

- **Blast-radius isolation.** A bug or bad deploy in Mission Control can't take down the public
  site, and vice versa. Different Vercel project, different domain (e.g. `mc.scoutit.ph` or an
  internal subdomain — pick something not indexable, add `noindex` + IP/SSO gate later if needed).
- **Secret isolation.** `SUPABASE_SERVICE_ROLE_KEY` lives only in Mission Control's server
  environment. It is never imported into any client bundle, and the public ScoutIt app doesn't
  need staff-only secrets in its env at all.
- **Independent auth.** Staff sign in as themselves (real email, real Supabase Auth session), not
  as impersonated end users. This is what makes per-staffer audit logging meaningful.
- **Independent release cadence.** You can ship an internal tool feature same-day without touching
  the production site's deploy pipeline or review process.

Data-wise: same Supabase project as ScoutIt (not a separate database). Mission Control reads/writes
the real tables through server-side code using the service-role key, gated by its own `admin_users`
tier check — not a synced copy, not a separate DB. For the Airtable-backed public content
(`PROPERTIES_CMS` etc.), Mission Control talks to the Airtable API directly, same as the main site's
`api/cms` route does for reads.

## 2. RBAC matrix

| Tier | Who | Can do | Cannot do |
|---|---|---|---|
| **Tier 1 — Agent** | Daily execution staff | View queues, approve/reject properties with reason, edit minor profile fields, shadowban/unshadowban a user, view own action history | Hard delete anything, bulk-edit, permanently ban a user, view billing/API keys, view other staff's full audit trail, touch Feature Gates or Staff IAM |
| **Tier 2 — Ops Manager** | Team leads | Everything Tier 1 can, plus: bulk-edit, resolve escalated disputes, permanently ban/archive a user or property (soft delete), view all audit logs, issue refunds up to a configured cap (Finance-adjacent) | Toggle feature gates, view system API keys/secrets, add/remove/promote staff |
| **Tier 3 — Super Admin** | Founders / tech leads | Full read/write, Feature Gates, Global Banners, Staff IAM (invite/tier/revoke), impersonation mode, sees system health (API failures, pending staff approvals) | — |

Notes:
- **Billing/finance is a scoped capability, not a 4th tier.** A "Finance" flag can be granted to a
  Tier 2 Ops Manager (see §5) so refund/dispute handling doesn't require inventing a whole new
  hierarchy rung.
- The UI removes controls a tier can't use — it doesn't just disable them. A Tier 1 Agent should
  never see a grayed-out "Ban Permanently" button; it shouldn't render at all.
- **Bootstrapping the first Tier 3 account is a manual step**: insert directly into `admin_users`
  via SQL Editor once, using the founder's own Supabase Auth user id. Every Tier 3 account after
  that is created through Staff IAM, invited by an existing Tier 3.

## 3. Data model (additive only — nothing existing gets renamed or dropped)

```sql
-- Staff identity + tier. Keyed to real Supabase Auth (auth.users), NOT user_profiles
-- (which is the public site's own separate, localStorage-keyed user system).
create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  tier smallint not null check (tier in (1, 2, 3)),  -- 1 Agent, 2 Ops Manager, 3 Super Admin
  is_finance boolean not null default false,          -- scoped capability, see §2
  active boolean not null default true,               -- flip false to revoke instantly
  invited_by uuid references admin_users(id),
  created_at timestamptz not null default now()
);

-- Every mutating action taken through Mission Control. Immutable, service-role-only.
create table mission_control_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references admin_users(id),
  actor_tier smallint not null,
  action text not null,        -- 'user.block' | 'user.unblock' | 'user.archive' | 'user.edit'
                                -- | 'property.approve' | 'property.reject' | 'feature_gate.toggle' ...
  target_table text not null,
  target_id text not null,
  reason text,                 -- required for reject/ban actions, enforced in the server action
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
alter table mission_control_actions enable row level security;
-- No client-side policies at all: every read/write to these two tables happens
-- server-side with the service-role key. RLS here is a hard stop, not a filter.
create policy "no client access" on admin_users for all using (false);
create policy "no client access" on mission_control_actions for all using (false);

-- Moderation columns, additive, nullable/defaulted so nothing existing breaks:
alter table user_profiles add column if not exists is_shadowbanned boolean not null default false;
alter table user_profiles add column if not exists archived_at timestamptz;
alter table user_profiles add column if not exists moderation_note text;

alter table properties add column if not exists moderation_status text
  not null default 'pending' check (moderation_status in ('pending','approved','rejected','archived'));
alter table properties add column if not exists rejection_reason text;
alter table properties add column if not exists archived_at timestamptz;
```

"Soft delete" here means `archived_at` gets set (and, for properties, `moderation_status =
'archived'`) — nothing is ever hard-`DELETE`d from Mission Control, at any tier. If you truly need
to purge something (e.g. legal request), that stays a manual SQL Editor action outside the tool,
which is itself worth an audit-log entry.

## 4. The abstraction layer (zero direct DB touch)

Every screen calls a **Next.js Server Action**, never the Supabase client directly from a page
component. The pattern for every action:

1. Resolve the caller's session → look up their `admin_users` row (`lib/rbac.js`).
2. Reject if `!active` or tier is insufficient for this action.
3. Perform the mutation using a service-role client (`lib/admin-client.js`) that is only ever
   imported into server-only files (actions, route handlers) — never a client component.
4. Insert one row into `mission_control_actions` describing what happened, in the same
   transaction/request as the mutation.
5. Return a typed result the UI renders; no raw Supabase errors leak to the client.

This is the guardrail that replaces "staff with SQL access." Staff never see a SQL box, a service
key, or a raw table — only dropdowns, toggles, and buttons that map to one of these actions.

## 5. Modules

**A. Action Center (home).** Priority queue, not vanity metrics. Tier 1 sees "N properties
pending review, N users flagged." Tier 3 additionally sees system health (Matterport/API failures,
staff accounts pending approval).

**B. User CRM.** Search/list `user_profiles`. Per-user: edit minor fields (display name, headline,
bio, location — never `connects_balance` or `active_roles` from this screen, those are financial/
identity-sensitive and get their own guarded flow later), shadowban toggle (Tier 1+), archive/soft-
delete (Tier 2+, requires a reason), full unarchive.

**C. Property Review Queue.** v1 scope: the Supabase `properties` table (owner submissions/
dashboard listings awaiting a decision) — approve, reject with a reason (from a fixed checklist,
mirroring the existing Airtable rejection categories so staff don't relearn a taxonomy), archive.
**v1.1 (flagged, not built yet):** a second tab hitting the Airtable `PROPERTIES_CMS` table directly
via the Airtable API to toggle `Approved_For_ScoutIt`, so the Airtable-side gate described in
`MISSION_CONTROL_SOP.md` can eventually be operated from here too instead of the Airtable Interface.
Kept as a separate phase because it's a different backend and a different write path.

**D. Feature Gates / Global Banners (Tier 3 only).** Config-table-backed toggles + a text field for
site-wide banners. No code deploy needed to flip one.

**E. Staff IAM (Tier 3 only).** Invite (creates a Supabase Auth user + `admin_users` row at a chosen
tier), change tier, deactivate (flip `active = false`, doesn't delete the row — audit trail stays
intact).

**F. Audit Log (Tier 2+).** Read-only view over `mission_control_actions`, filterable by actor,
action type, date range.

**G. Billing/Disputes (later phase, Finance-flagged Tier 2 + Tier 3).** Not built in this pass —
flagged in the roadmap below. Needs its own data model once you tell me which payment processor
you're using (PayMongo/Xendit per the ScoutIt backlog notes) — refund caps, dispute states, and
what "resolved" means all depend on that.

## 6. Extensibility — how this stays "your own tool"

No plugin framework, no config-driven module system — for a single internal team that's overhead
you'd maintain forever for a problem you don't have yet. Instead:

- Every module follows the same shape (server action + `mission_control_actions` row + tier check),
  so adding a new one is copy-the-pattern, not learn-a-new-system.
- Ask for new modules/fields/workflows in plain language in a session like this one; the codebase
  is small and conventional enough that changes are additive, same as the "don't rename live
  fields" rule the Airtable SOP already uses.
- If a real config-driven need shows up later (e.g. non-engineers need to define new queue types
  without asking for code changes), that's a good v2 conversation — not a v1 default.

## 7. Rollout phases

1. **Now (this build):** RBAC core (`admin_users`, tier gating, audit table), User CRM (edit,
   shadowban, archive), Property Review Queue (Supabase `properties` only), Audit Log viewer.
2. **Next:** Feature Gates + Global Banners, Staff IAM UI (today, bootstrapping is manual SQL).
3. **Then:** Airtable-backed property gate (`Approved_For_ScoutIt` toggle from Mission Control),
   impersonation mode, system health panel (API failure counters).
4. **Later, needs your input first:** Billing/disputes module (payment processor + refund policy
   TBD), rich RLS hardening pass on the main ScoutIt tables (separate from this tool, but adjacent
   risk worth scheduling).

## 8. Open risks worth flagging back to you

- Confirm whether `supabase_rls_hardening.sql` was actually applied to the live project — if not,
  the public site's own tables are still wide open regardless of what Mission Control does.
- Decide, before v1.1, whether Airtable or Supabase `properties` should be the long-term source of
  truth for property review — right now staff have to know which one they're looking at.
- Pick a real domain/subdomain for the Mission Control deployment and whether it needs to sit
  behind anything beyond Supabase Auth (IP allowlist, SSO) given it's an internal-only tool.
