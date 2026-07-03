# Staff Permissions, Enterprise Accounts, Self-Serve Analytics, Notifications & Mission Control Foundation

> **Approved plan, not yet built.** Copied into the repo from
> `C:\Users\jerze\.claude\plans\replicated-yawning-wirth.md` on 2026-07-03 specifically so it
> doesn't get "lost" outside the repo the way the Master Build Spec once did (it was Desktop-only
> and a repo-only search missed it). This is the canonical copy going forward — if the two ever
> diverge, this one wins. See `SESSION_HANDOFF_2026-07-03.md §4` for the conversation this came
> from.

## Context

The owner wants a Monday.com-style permission system. This turned out to be **two related but
distinct features**, clarified over several rounds of conversation:

1. **Mission Control** — ScoutIt's own internal staff tool. Standalone Next.js app, separate
   Vercel deployment, Supabase magic-link auth — tightly locked down since it's admin tooling,
   deliberately isolated from the public site's attack surface.
2. **Enterprise accounts** — an external, paying **client** feature. A company (e.g. "Megaworld,"
   "SM Group") gets its own account with a super-admin, who can invite named humans under that
   company and grant each of them scoped access to exactly what they need — broker connections,
   co-working operator relationships, their own properties, mass company-wide updates to their
   brokers. This lives on the **main ScoutIt site** (it's a customer-facing feature), not on the
   separate Mission Control deployment.

Both share the same underlying *concept* — a permission-scoped dashboard — but are different
populations (internal employees vs. paying external companies) on different deployments, so they
get separate tables, not a shared one. The mechanism underneath both is unified, though: see
"Access control model" below.

Two smaller, independent asks came out of the same conversation: self-serve analytics for
Universe-tier owners/brokers on their own properties, and in-app notifications (stale listings,
plus notifying any broker attached to a property when it changes) — both buildable now, without
waiting on either Mission Control or Enterprise accounts.

## Access control model: RBAC + resource-scoped grants (not full ABAC)

Considered and rejected full ABAC (attribute-based rules evaluated dynamically across arbitrary
user/resource/environment attributes) — it needs a real policy engine and every rule combination
has to be reasoned about and tested, which is a lot of surface area for a system that's supposed
to get a single, careful security pass, not accumulate complexity piecemeal. What both Mission
Control and Enterprise actually need — "grant this person access to these specific things" — is
RBAC (what actions can you perform) plus **resource-scoped grants** (on which specific objects),
which is auditable in plain SQL and doesn't need a rules engine.

**Concrete mechanism:** extend the already-spec'd `permission_grants` table (§3.1) with one
additive, nullable pair: `scope_type` (e.g. `'property'`, `'broker'`, null = global) and
`scope_id`. A global grant (today's Mission Control use case: "this staffer has
`intelligence.edit`") has `scope_type/scope_id` null. A scoped grant (Enterprise use case: "this
sub-user has `broker_contact.access` for property X only") sets both. Same table, same shape, one
small additive change — not a redesign.

## Scope: six tracks total, two buildable now, sequencing below

1. **Notifications persistence** (incl. broker-on-change notifications) — buildable now.
2. **Self-serve analytics panel** — buildable now, **on hold pending real instrumentation** (see
   Track 2 — this was reconsidered from an earlier "ship now with a placeholder" draft).
3. **Mission Control foundation** — architecture confirmed, first-slice recommendation given,
   not built in this pass.
4. **Enterprise accounts** — richly specified this conversation, but **explicitly parked** behind
   the RLS security reset (owner's explicit call — see Track 4).
5. **Unit promotion tools** — research-informed, no field list decided.
6. **Google Sign-In / registration** — real blocker identified (below), deferred to near-launch.

## Sequencing (and why)

**Notifications (incl. broker alerts) → real analytics instrumentation → analytics panel →
(separate future session) Mission Control first slice → (separate future session, blocked on RLS
reset) Enterprise accounts → (separate future session) Unit promotion tools.**

Notifications first — smallest complete, demoable unit, one migration, one already-real trigger
field, an extension not a rewrite of the existing bell dropdown. Analytics moved behind real
instrumentation work per the owner's explicit call (§ Track 2) — no point building the panel
before the numbers it shows are real. Mission Control and Enterprise both stay documented
architecture only: Mission Control because every prior session concluded it needs its own
dedicated session, and Enterprise because it's explicitly blocked on the RLS reset, which is
itself deliberately deferred while feature velocity is the priority (owner's explicit call this
conversation: "let it be a problem for later"). Google Sign-In stays deferred to near-launch —
blocked on a real-world prerequisite (below), not an engineering decision.

## Track 1 — Notifications persistence (incl. broker-on-change alerts)

**New table `user_notifications`** (Supabase): `id uuid PK`, `user_id text` (matches
`user_profiles.id`'s actual type), `title text`, `desc text`, `icon text`,
`read boolean default false`, `property_id uuid references properties.id`,
`notification_type text` (e.g. `'stale_listing'`, `'listing_published'`, `'property_changed'`),
`notify_channels text[] default '{in_app}'` (additive hook for email later — see below),
`created_at timestamptz default now()`.

**Staleness trigger:** `Last_Verified_Date` (already real, documented on `PROPERTIES_CMS`). New
scheduled route `/api/cron/check-stale-listings` (Vercel Cron — new small infrastructure, nothing
existing to reuse) runs daily, flags properties past a threshold (**owner needs to confirm the
actual number — not decided yet**, don't hardcode a guess as final), inserts one row per target,
with a dedupe check so the same staleness event doesn't re-notify daily.

**Broker-on-change alerts (new this conversation, confirmed in scope for everyone, not
Enterprise-gated):** when a property changes, notify not just the owner but any broker(s)
currently attached to it via the existing broker-property relationship (the handshake/invite
system already tracked in `deals`/`PROPERTY_BROKERS`). Applies to solo brokers and solo owners
equally — explicitly not gated behind Enterprise accounts. Implementation: on a property update
that matters (owner needs to define which field changes qualify — don't notify on every keystroke
autosave), look up attached brokers for that property and insert a `user_notifications` row for
each, `notification_type: 'property_changed'`.

**Targeting for the stale-listing check (documented stopgap, unchanged):** a hardcoded
super-admin config value (no `admin_users` table exists yet) + the property's `owner_id`. Revisit
once Mission Control's real permission system exists.

**Surfacing — extend, don't replace:** the existing bell dropdown
(`src/app/dashboard/page.js` ~L255-294) and `DashboardContext.js`'s `notifications` state stay the
UI. Add a hydration step in `handleUserLogin()` (fetch + merge into the existing `{id, title,
desc, icon, read}` shape), and extend `markNotificationsRead()`/`clearAllNotifications()` with a
corresponding Supabase write so state actually persists. Recommend routing the existing
client-triggered notifications through the same table in the same migration for consistency.

**Email — deferred, now with the real reason documented:** the owner wants **Google Sign-In as
ScoutIt's actual login/registration method** (not just Gmail-sending for notifications) — a
bigger ask than originally scoped. It's blocked on a genuinely mundane real-world prerequisite:
**Google Cloud requires a billing method (a debit card) to enable OAuth, which the owner doesn't
currently have.** Deferred to near-launch, when that's resolved. This directly explains the
already-known "real signup is broken" gap too — Google Sign-In is the owner's intended long-term
fix for that, not just a nice-to-have. The `notify_channels` column above is the hook so adding
real email later doesn't require redesigning the notifications table.

## Track 2 — Self-serve analytics panel (ON HOLD pending real instrumentation)

**Locked decision (revised this conversation):** do **not** ship the panel with a partial-real +
"coming soon" section. Wait until real instrumentation exists for all of it. Concretely, before
building `AnalyticsPanel.js` itself:
1. Wire `src/app/api/inquiries/route.js` for real (it's a literal stub today — `console.log`s the
   payload and never persists it; the intended Supabase insert is already commented out in the
   code, nearly the whole fix).
2. Add a small `property_pageviews` table + a fire-and-forget increment call from the property
   detail page (nothing tracks views anywhere today).
3. Only then build the panel itself, showing Saves (`saved_intel`, real today) + Deal Activity
   (`deals` by status, real today) + real Views + real Inquiries — all real, nothing placeholder.

**Where it lives (unchanged):** new `AnalyticsPanel.js` in `src/components/dashboard/`, a popover
mirroring `ConnectsBreakdown.js` exactly, rendered from `OwnerMode.js`/`BrokerMode.js`.

**Gating:** new `FEATURE_MIN_TIER` entry `analytics: "universe"`. Confirmed this conversation:
"Enterprise" is genuinely **not** the same as the Universe tier — it's the separate Enterprise
accounts feature (Track 4), which is its own thing on its own track, not a pricing tier. Gate
analytics at `universe` for individual owners/brokers; Enterprise accounts get their own access
model (Track 4), not this tier gate.

## Track 3 — Mission Control foundation (architecture only, not built now)

Unchanged from prior planning: standalone Next.js app, separate Vercel deployment, Supabase
magic-link auth, `admin_users`/`permission_grants`(+ the new `scope_type`/`scope_id` columns
above)/`system_audit_logs`. Confirmed bug to remember: `src/app/api/admin/approve/route.js`
checks a `user_profiles.role` column that doesn't exist (`active_roles text[]` is the real
column) — always 403s, not an active incident today, do not patch in place, repoint/delete once
`admin_users` exists. Don't confuse the spec's `system_audit_logs` with the already-existing,
differently-purposed `audit_logs` table (`USING (false)` RLS, blocks all reads). Recommended first
slice whenever this gets picked up: app skeleton + magic-link auth + the three tables + one page
(Team & Access) — nothing else yet.

## Track 4 — Enterprise accounts (richly specified, explicitly parked on the RLS reset)

**Confirmed this conversation:** lives on the **main ScoutIt site** (not Mission Control), as a
new dashboard mode alongside Owner/Broker/Operator — same `DashboardContext`/mode-switcher pattern
already used for the Operator hat.

**Shape:**
- New `organizations` table — the company identity itself (`id`, `name`, `super_admin_user_id`,
  subscription/tier info). This resolves the previously-open question from
  `SCOUTIT_MASTER_BUILD_SPEC.md §9.4` ("does a Corporation identity need its own account separate
  from the human who signs it up?") — **yes**, confirmed by this conversation's detail (a company
  super-admin invites and manages named humans underneath it, so the company needs to be its own
  row, not implicitly "whoever signed up first").
- New `organization_members` table — which humans belong to which organization, their role within
  it, and their `permission_grants` rows (using the same extended grant mechanism as Mission
  Control — see "Access control model" above), scoped to exactly what they need: broker
  connections, co-working operator relationships, their own properties, mass company-wide updates
  to their brokers.
- Access granularity example: the super-admin at Megaworld invites a named employee and grants
  them `broker_contact.access` scoped (`scope_type: 'property', scope_id: X`) to only the
  properties that employee should touch — not blanket access to the whole company's portfolio
  unless explicitly granted that way.

**Explicitly parked, owner's call this conversation:** "let it be a problem for later... right
now we're ramping up features, locking us down will be a problem." Enterprise accounts' entire
security promise ("each company only sees its own data") depends on RLS actually working, which
it doesn't today (the `dev_all_*` policies flagged in the vulnerability audit make every table's
narrower policy moot). Do not start building `organizations`/`organization_members` before the
RLS reset happens — this is a hard dependency, not a soft one, given what this feature does.

## Track 5 — Unit promotion tools (flagged, not decided)

Unchanged: extends the Unit Master Page's existing "The Differentiator" chapter, not a new
surface. PH coworking-market research (informing, not deciding): flexible pricing model framing,
location/transit/lifestyle-radius framing, infrastructure (internet speed, quiet zones),
community/events programming, design/wellness amenities. No field list, no schema — owner's call.

## Track 6 — Google Sign-In / registration (deferred to near-launch)

Owner wants Google Sign-In as ScoutIt's actual login/registration method. Blocked on Google Cloud
requiring a billing method (debit card) the owner doesn't currently have — a real-world
prerequisite, not an engineering one. This is also the owner's intended fix for the already-known
"real signup is broken" gap (no email provider configured on the Supabase project) — don't treat
these as two separate problems; Google Sign-In is meant to resolve both. Revisit near launch.

## Infrastructure not yet built: Airtable schema + Supabase Storage

**Track 1 (Notifications) — no new Airtable field required.** Open, undecided: should a
"flagged stale" state also be visible/settable inside Airtable itself (a `Needs_Update_Flagged`
checkbox) for staff who work there day-to-day? Not decided — flag for the owner.

**Track 2 (Analytics) — no new Airtable field needed.** Source data is Supabase-only and
client-private by design; don't mirror it into the public Airtable CMS.

**Track 3 (Mission Control) — inherits two pre-existing, already-known gaps:**
`BADGE_DEFINITIONS` Airtable table (§5.1, still doesn't exist) and the Field Visibility labeling
batch (`FIELD_VISIBILITY_MAP.md §6`, "Batch 0," still pending). No new Airtable schema needed for
Mission Control's own tables (Supabase-only by design).

**Track 4 (Enterprise accounts) — no new Airtable field needed.** `organizations`/
`organization_members`/scoped `permission_grants` are all private Supabase data, same reasoning
as Mission Control — never belongs in the public CMS.

**Track 5 (Unit promotion tools) — real schema work, blocked on the field-list decision, not
infrastructure design.** Inherits the still-unresolved tension already flagged in
`DATA_DICTIONARY.md §3.2`: new unit-level facts go into the `Units_JSON` blob (code-only, no
Airtable change, matching how `operator_id` was added) or onto the separate, still-unwired `UNITS`
linked-record table (real Airtable columns). Whoever picks this up needs to resolve it.

**Supabase Storage.** Existing `property_photos` bucket (tier-gated 1/5 per unit) covers
everything already built. Open question for Track 5: should promo media (event/amenity photos)
count against that existing cap, or use a separate bucket (e.g. `unit_promo_media`)? Not decided —
depends on the undecided field list.

## Verification plan (once Tracks 1-2 are actually built)

1. Real throwaway owner account: trigger a stale-listing check manually, confirm exactly one
   `user_notifications` row per target recipient, confirm dedupe.
2. Real throwaway owner + broker accounts: change a property, confirm the attached broker gets a
   `property_changed` notification, confirm an unattached broker does NOT.
3. Confirm the bell dropdown shows persisted notifications after a fresh login (not just
   in-session), and mark-read/clear-all persist across a second login.
4. Once analytics instrumentation is real: confirm views/inquiries/saves/deal-status are all
   real numbers scoped ONLY to the logged-in user's own properties (no cross-user leakage),
   confirm below-`universe`-tier accounts see the locked/blur state.

## Critical files

- `src/context/DashboardContext.js` (notifications state + `handleUserLogin`)
- `src/app/dashboard/page.js` (bell dropdown UI, ~L255-294)
- `src/lib/entitlements.js` (`FEATURE_MIN_TIER`, `canSee`)
- `src/components/dashboard/ConnectsBreakdown.js` (popover pattern to mirror)
- `src/app/api/inquiries/route.js` (stubbed — must be wired for real before Track 2 starts)
- `src/app/api/admin/approve/route.js` (confirmed broken — do not patch, documented for later)
- `_SCOUTIT_BRAIN/SCOUTIT_MASTER_BUILD_SPEC.md §3` (Mission Control spec) and `§9.4` (the
  Corporation-identity question this plan now resolves)
