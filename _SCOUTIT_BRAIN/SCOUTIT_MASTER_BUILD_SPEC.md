# ScoutIt — Master Build Spec (Post-Reset Priority Queue)

> Consolidated from a planning session on 2026-07-01. This is the single file to read
> before writing any code for the items below. It replaces the following individual
> files, which can be archived: `CANONICAL_ENTITY_MODEL.md`,
> `MISSION_CONTROL_DASHBOARD_SPEC.md`, `BACKEND_SECURITY_AND_INGESTION_SPEC.md`,
> `BADGE_ACHIEVEMENT_ENGINE_SPEC.md`, `HEATMAP_SCHEMA_PROPOSAL.md`,
> `AFFORDABILITY_CALCULATOR_SPEC.md`.
>
> **Copied into the repo 2026-07-02** from `C:\Users\jerze\OneDrive\Desktop\SCOUTIT_MASTER_BUILD_SPEC.md`
> (original location, dated 2026-07-01) — it was cited constantly across other docs by section
> number but lived outside the repo, so a repo-only search couldn't find it. This is now the
> canonical copy; keep it in sync with the Desktop original if that one changes, or treat this
> copy as canonical going forward per `_SCOUTIT_BRAIN`'s own "running code + this folder win" rule.

---

## 0. Instructions for Claude Code — read this part first

1. **Section 1 below lists open questions.** For any task that touches a section
   referenced in that list, **stop and ask Jerzel to confirm the answer before writing
   code for that specific part.** Do not guess, do not pick a "reasonable default" on
   these specific items — they were deliberately left open pending his input, not
   overlooked.
2. Everything **not** listed in Section 1 has already been decided and can be built
   directly as written.
3. Confirmed live Airtable base ID: `appWFRqR0wy6hSR6h`. Confirmed live Mission Control
   Airtable Interface ID (being phased out in favor of the custom dashboard in §3):
   `pbdyvI1PCjfhxUH5V`.
4. Golden rule, restated because it governs every table decision below: **Airtable =
   what ScoutIt offers & shows (the public menu/definitions). Supabase = what a specific
   user has or did (accounts, balances, badges earned, submissions).** Never mix them.

---

## 1. OPEN QUESTIONS — confirm with Jerzel before building these parts

| # | Question | Blocks |
|---|---|---|
| 1 | Is `AccessibilityScore` a genuinely new field, or the same thing as the already-live `ConvenienceScore`? If the same, don't duplicate — just confirm/re-gate the existing field. If different, what's the actual distinction? | §6 Heatmap schema |
| 2 | Final data provider for Air Pollution Index and Heat Island Index — no source was ever named for these two (unlike flood/landslide → NOAH PH/HazardHunterPH, and traffic → Google Maps/Mapbox/TomTom, which are already decided). | §6 Heatmap schema |
| 3 | What number scale does the already-live `FloodRiskScore` actually use (0–10? 0–100? something else)? New heatmap fields should match it, not invent a second scale. | §6 Heatmap schema |
| 4 | The Gemini "Master Bible" separately proposed `Foot Traffic density` and `Infrastructure Redundancy mapping` fields — these look like they overlap with the Mobility fields in §6. Merge into the existing field list, or are these genuinely distinct and both needed? | §6 Heatmap schema |
| 5 | Real current interest rate figures (Pag-IBIG, major banks) for the `CONFIG_MORTGAGE_DEFAULTS` table — this is data entry, not a code decision, but the calculator can't launch with placeholder numbers. | §7 Affordability calculator |
| 6 | Does `src/app/api/cms/route.js` already filter out staff-only fields (`AI_Draft_Notes`, `Broker_Input_Notes`, `PriceRange_Internal`, `StructuralNotes`, `Review_Notes`, `Verification_Status`, `Pipeline_Status`) before serving the public site, or does this need to be added? Check the actual file — don't assume either way. | Public API safety, all sections |
| 7 | Co-owner is set to full permission parity with Owner by default in §3 (including `monetization.edit` and `team_access.manage`) since nothing was specified otherwise. Confirm this is actually wanted, or flag anything Co-owner should NOT have. | §3 Mission Control roles |

---

## 2. Canonical Entity Model

**Root entity: Space, not Property.** Property is one manifestation of Space (a condo
unit, office floor, restaurant shell, event venue are all instances of Space). This is
why one chapter-registry system can serve six very different category types. Only
Commercial + Residential ship first; other categories release one at a time without
requiring a schema rewrite.

**Six canonical root entities** — before adding any new feature, ask which of these it
belongs to:

| Root | Definition | Examples |
|---|---|---|
| **Space** | The persistent physical entity | condo unit, office floor, restaurant shell, event venue |
| **Identity** | Actors, permission-differentiated | owner, broker, seeker, photographer, researcher |
| **Listings** | Temporal commercial offers on a Space (Listing ≠ Space) | for sale, for lease, short stay, event booking |
| **Intelligence** | Derived knowledge — the primary data moat | heatmaps, market intel, AI scores, trends |
| **Trust** | Reputation/verification — the second moat | badges, disputes, ownership verification, Scout Rating |
| **Economy** | Value movement | subscriptions, Connects, bounties, QuestIt rewards |

**Ownership graph** (solves multi-owner/strata complexity): a Space's owner is an
Ownership Entity, not necessarily an individual —
`Individual / Corporation / Guild / Clan / Association`. One owner can hold multiple
Spaces; one Space can have multiple brokers, but brokers are capped on active listings.
Strata/multi-party ownership becomes a Guild/Clan/Association identity rather than
attaching N individual owners to one record. Reused across ScoutIt and QuestIt (same
Guild/Clan primitive).

**Primary moat: Data** (confirmed 2026-06-30), varying by user type — network effects,
trust infrastructure, and brand are downstream reinforcements of the data moat, not
alternatives to it. Features that grow the structured dataset should be prioritized over
pure growth/UX features when the two compete for build time.

**Three usage modes** worth designing for: Utility (rent/buy/lease), Intelligence
(research/compare/analyze), and Memory (revisiting old places, "dream scrolling" —
largely unexploited by competitors, possible retention lever).

---

## 3. Mission Control Dashboard (custom build, NOT Airtable Interface)

**Platform decision:** standalone Next.js app, separate Vercel deployment from the
public site. Auth: **Supabase magic link (passwordless email)** — no Google OAuth, no
passwords. This supersedes the earlier Airtable-Interface version of Mission Control
(`pbdyvI1PCjfhxUH5V`) — do not build that version.

### 3.1 Access model — role defaults + dynamic per-user grants

**`admin_users`** (Supabase): `email`, `name`, `base_role` (owner/co_owner/researcher/
supervisor), `active` (boolean — flip false to instantly revoke, no deletion needed).

**`permission_grants`** (Supabase): `admin_user_email`, `permission_key`, `granted_by`,
`granted_at`, `expires_at` (nullable — null = doesn't expire until manually removed),
`note`.

**Effective permissions = role defaults + any active (non-expired) grants.** Every
Owner/Co-owner can hand a specific team member one extra permission beyond their role's
default, at any time, without code changes. Server-side enforcement only — UI hiding a
nav item is convenience, never the security boundary.

### 3.2 Permission keys and default role mapping

| Permission key | Unlocks | Owner | Co-owner | Researcher | Supervisor |
|---|---|:---:|:---:|:---:|:---:|
| `overview.view` | Master Overview KPIs | ✅ | ✅ | ✅ | ✅ |
| `approval_queue.view` | See pending submissions + `AI_Draft_Notes`/`Broker_Input_Notes` | ✅ | ✅ | ✅ | ✅ |
| `approval_queue.publish` | Flip `Approved_For_ScoutIt`/`Approved_For_Live_Site`/`Published` | ✅ | ✅ | ❌ | ❌ |
| `intelligence.edit` | Category facts, verification research, heatmap/score data | ✅ | ✅ | ✅ | ❌ |
| `trust.badge_override` | `Verified` checkboxes, `License_Verified`, `Verification_Status`, `Price_Verified_By` | ✅ | ✅ | ❌ | ✅ |
| `disputes.mediate` | `PROPERTY_BROKERS` — resolve `Status` conflicts, review `Authority_Source` | ✅ | ✅ | ❌ | ✅ |
| `content.edit` | `L1_BOARD`, `L2_CATEGORIES`, `L3_COLLECTIONS`, `L6_ABOUT`, `HOMEPAGE_CMS` | ✅ | ✅ | ❌ | ❌ |
| `monetization.view` / `.edit` | Tiers, feature gates, Connect costs/packs, bounty definitions | ✅ | ✅ | ❌ | ❌ |
| `team_access.manage` | Grant/revoke permissions, change roles, deactivate accounts | ✅ | ✅ | ❌ | ❌ |
| `badges.manage` | Create/edit badge definitions (§5) | ✅ | ✅ | ❌ | ❌ |

*(Co-owner parity — see Open Question #7.)*

### 3.3 Pages

| Page | Reads/writes | Gated by |
|---|---|---|
| Overview | `PROPERTIES_CMS`, `L1_BOARD`, `BROKERS_CMS`, `BOUNTIES` (counts) | `overview.view` |
| Approval Queue | `PROPERTIES_CMS`, `INTEL_CMS`, `BROKERS_CMS`, `SERVICE_PROVIDERS` | `approval_queue.view` / `.publish` |
| Trust & Badges | Verification fields across `BROKERS_CMS`/`SERVICE_PROVIDERS`/`PROPERTIES_CMS` | `trust.badge_override` |
| **Disputes** (new — Supervisor's home base) | `PROPERTY_BROKERS` (`Status`, `Authority_Source`, `Role`, `Initiated_By`) — resolves broker-vs-broker slot conflicts and broker-vs-owner authority disputes; schema already notes "owner sovereignty as default" | `disputes.mediate` |
| Content | `L1_BOARD`, `L2_CATEGORIES`, `L3_COLLECTIONS`, `L6_ABOUT`, `HOMEPAGE_CMS` | `content.edit` |
| Monetization | `Subscription Tiers`, `FEATURE_GATES`, `CONNECT_COSTS`, `CONNECT_PACKS`, `BOUNTIES` | `monetization.view`/`.edit` |
| Badges | `BADGE_DEFINITIONS` (§5) | `badges.manage` |
| Team & Access | `admin_users`, `permission_grants` | `team_access.manage` |
| Economy | Supabase `connect_balances`, `bounty_claims` — **not buildable until §3.5 tables exist** | — |

### 3.4 Badge classification rule (fact vs. judgment)

Every badge is either **Bucket A (countable fact — safe to fully automate)**, e.g. a
broker closure-count milestone, or **Bucket B (a claim with trust/legal weight — must
stay human-gated even if a cron job does the underlying math)**, e.g. `Verified`
checkboxes or a "Spatial Arbitrage Opportunity" style badge (auto-calculate the delta,
but land it in the Approval Queue for a human to approve — never auto-apply a badge that
functions as investment advice, which conflicts with "Intelligence First. Transactions
Never."). **The test:** *"Is this counting something that already happened, or is it
telling someone what to think/do?"* Counting → Bucket A. Advising → Bucket B.

### 3.5 Admin safety mechanisms

- **`system_audit_logs`** (Supabase): `admin_email`, `action`, `payload` (JSON),
  `created_at`. Every write from any Mission Control page logs here. **Postgres trigger
  blocks UPDATE/DELETE** — append-only.
- **Circuit breaker:** unusually high burst of approvals/deletions in a short window
  freezes the session, requires re-auth. Threshold must be a config value, not hard-coded
  (a legitimate backlog catch-up shouldn't self-lock).
- **Refutation loop:** owner disputing an admin's data calibration submits supporting
  documents via a "Refute Calibration" action → creates a Disputes row for Supervisor
  review, rather than being able to silently overwrite verified data themselves.

### 3.6 Not yet built (dependencies)

`owner_accounts`, `subscriptions`, `connect_balances`, `bounty_claims` (Supabase
user-layer tables named in `AIRTABLE_IMPLEMENTATION_PLAN.md`, never built), plus new
tables from this doc: `admin_users`, `permission_grants`, `system_audit_logs`,
`BADGE_DEFINITIONS` (Airtable), `user_badges`. Make.com sync scenarios also unbuilt.

---

## 4. Backend Security & Ingestion

### 4.1 Security hardening — do this early, before feature work

1. **Zero-trust identity** — never trust a `userId` in a request body; derive identity
   via `supabase.auth.getUser(jwt)` server-side, always.
2. **Service-role isolation** — `src/lib/supabaseAdmin.js`, a dedicated client using
   `SUPABASE_SERVICE_ROLE_KEY`, used only in trusted server routes. Never expose to the
   client bundle.
3. **Atomic Connects transactions** — balance check → ledger insert → deduction as one
   indivisible Postgres RPC (`spend_connects`), not three separate queries (prevents a
   race condition draining more Connects than a user has).
4. **Sequential publish lock** — `/api/dashboard/publish` marks Supabase `approved` only
   *after* Airtable confirms a successful write. Never mark something published on your
   side that isn't actually live.

### 4.2 Connects economy — bucket model

Three buckets per user: **Granted** (resets monthly, no rollover), **Purchased** (never
expires), **Earned** (never expires). Spend order: Granted → Purchased → Earned.
Non-refundable on send — matches the already-live `PROPERTY_BROKERS.
Handshake_Connect_Spent` behavior ("spent on send, no refund on decline").

### 4.3 Bulk ingestion — PapaParse Blueprint pattern

For bulk unit/CSV uploads: parse locally in-browser via PapaParse → send only the header
row + top 3 data rows to the AI to generate a column-mapping "Blueprint" JSON → execute
that blueprint against all remaining rows in local JavaScript, no further AI calls. Keeps
token cost flat regardless of file size.

### 4.4 Sanitization rule — confirmed real bug, not theoretical

**Never import `isomorphic-dompurify` or `jsdom` in any API route** — causes
`ERR_REQUIRE_ESM` crashes under Next 16 + Turbopack serverless, silently 500ing the
route (already happened once, documented in `WEBSITE_ARCHITECTURE.md` §7D, broke unit
saves). Use the existing dependency-free `src/lib/sanitize.js`
(`stripAllTags`/`sanitizeObject`) — it already exists and already works.

### 4.5 Suggested order

Security core (§4.1) → database integrity (`spend_connects` RPC + `system_audit_logs`
from §3.5) → sanitization audit across all POST/PUT routes → publish lock sequencing fix
if needed → bulk ingestion (lower priority, build when unit-heavy commercial listings
actually need it). Mission Control dashboard pages can build in parallel, but §4.1–4.2
should land before real user data flows through the system.

---

## 5. Badge & Achievement Engine

### 5.1 `BADGE_DEFINITIONS` (Airtable — the menu)

`Badge_Name` (primary) · `Badge_Icon` (attachment) · `Description` · `Applies_To`
(single select: Broker/Researcher/Photographer/Event Planner/Seeker/Owner/All) ·
`Objective_Type` (single select: Closures_Count/Bounties_Completed/Tenure_Days/
Inquiry_Count/Listings_Published/Manual_Only) · `Objective_Threshold` (number) ·
`Max_Recipients` (number, blank = unlimited) · `Auto_Grant` (checkbox — the Bucket A/B
switch from §3.4) · `Perk_Description` · `Notification_Copy` · `Start_Date`/`End_Date`
(optional) · `Is_Active`.

### 5.2 `user_badges` (Supabase — who actually has it)

`user_email` · `badge_id` · `earned_at` · `granted_by` (`"system"` or an admin email) ·
`progress_snapshot` (JSON, e.g. `{"closures": 5}`).

> **Built 2026-07-02** as `public.user_badges` — used `user_id` (text, FK to
> `user_profiles.id`) instead of the `user_email` written above, to match the `user_id`
> convention every other live Supabase table already uses (`connect_balances`, `deals`,
> etc.). A real `user_email` join key would have been the odd one out. This is the one
> deliberate deviation from this section's literal text.

### 5.3 The automatic-checking job (Make.com, scheduled)

Per active badge: find qualifying users not already holding it → check `Max_Recipients`
cap (skip/auto-close if full) → check `Auto_Grant`: **checked** = insert into
`user_badges` immediately + notify; **unchecked** = create an Approval Queue row instead,
human approves, *then* `user_badges` row is created. `Manual_Only` badges skip the
automatic check entirely — hand-awarded from a user's profile in Mission Control.

### 5.4 Notifications — **deferred, not launch-blocking**

No email service exists yet (confirmed 2026-07-01) and none is needed yet — no real
users to notify at prototype stage. **Build §5.1–5.3 and the Badges dashboard page now if
desired; skip notification delivery until closer to real launch.** When it's time,
Resend is the likely pick (small addition, pairs naturally with Next.js + Supabase).
`Notification_Copy` per badge already supports tone variation (e.g. *"A new Bounty
Hunter badge just opened. 47 spots left. Begin the Hunt →"* for limited badges vs. a
quieter note for personal achievements) — this field can sit unused until the delivery
channel exists.

### 5.5 Dashboard page

New "Badges" page in Mission Control (§3.3), gated by `badges.manage`. Form mirrors
`BADGE_DEFINITIONS` 1:1. List view shows live grant counts ("34/100 granted") and an
Active/Paused toggle per badge.

---

## 6. Spatial Intelligence (Heatmap) Schema — see Open Questions #1–4

### 6.1 Already live (do not duplicate)

`FloodRiskScore`, `ConvenienceScore`, `CommuteBGC`/`CommuteMakati`/`CommuteOrtigas`,
`Region`, `Source_Citations` (reuse for heatmap data provenance), `Last_Verified_Date`
(reuse for heatmap freshness).

### 6.2 Proposed new fields — Environmental

`LandslideRiskScore` (number, NOAH PH/HazardHunterPH, Solar+) ·
`AirPollutionIndex` (number, provider TBD — Q2) ·
`HeatIslandIndex` (number, provider TBD — Q2)

### 6.3 Proposed new fields — Mobility

`TrafficCongestionScore` (number, Google Maps/Mapbox/TomTom, Solar+) ·
`CommuteBurdenScore` (number, computed aggregate of existing Commute* fields, Solar+) ·
`AccessibilityScore` (possibly redundant with `ConvenienceScore` — Q1, decision needed)

**Gating rationale:** matches the existing rule that computed/AI-assisted intelligence
scores are Solar+ paid (same tier as `ComfortLevel`/`NaturalLight`/`Privacy`).

### 6.4 Ingestion path (not yet built)

Suggested automation: **`Heatmap Sync`** (Make.com) — pulls scores per property keyed on
already-cached `Latitude`/`Longitude`, on a monthly schedule (hazard data doesn't change
daily), not per-request.

---

## 7. Affordability / Mortgage Calculator — see Open Question #5

### 7.1 Where it lives

Property page "Your Move" section, alongside the existing price fields. **Show only when
`Price_Status = Published`** and a real numeric price exists — never render against "Price
on request."

### 7.2 Calculation (client-side, no backend needed for v1)

```
Principal (P) = Listed Price − Down Payment
Monthly Rate (r) = Annual Interest Rate ÷ 12
n = Loan Term (years) × 12
Monthly Payment = P × [r(1+r)^n] / [(1+r)^n − 1]
```

Inputs: down payment % (default 20%), interest rate (from `CONFIG_MORTGAGE_DEFAULTS`),
loan term years (default 20). Outputs: monthly payment, total interest, total paid.

### 7.3 New Airtable config table — `CONFIG_MORTGAGE_DEFAULTS`

`Lender_Name` (primary) · `Interest_Rate_Percent` · `Max_Loan_Term_Years` ·
`Min_Down_Payment_Percent` · `Is_Default` · `Active`. **Needs real current PH rates —
Open Question #5, data entry not a code decision.**

### 7.4 v1 scope — deliberately excluded

Stateless for v1 (no saving, no auth required, no Supabase table) — ships faster, zero
operational cost. No income/DTI check (avoids sensitive-data/consent question). No
lender integration or pre-qualification (stays clear of BSP lending-regulation exposure,
consistent with "Intelligence First. Transactions Never."). Phase 2 only if wanted:
`saved_calculations` Supabase table for logged-in buyers comparing across properties.

---

## 8. Build order summary

1. **Security core** (§4.1) — before any real user data flows
2. **Confirm Open Questions #6** (API field filtering) — quick check, high safety value
3. **Mission Control dashboard** (§3) — auth, roles, Approval Queue, Disputes
4. **Database integrity** (`spend_connects` RPC, `system_audit_logs`)
5. **Badge engine** (§5.1–5.3, 5.5) — skip §5.4 notifications
6. **Heatmap schema** (§6) — only after Open Questions #1–4 are answered
7. **Affordability calculator** (§7) — only after Open Question #5 (real rates) is answered
8. **Bulk ingestion / PapaParse Blueprint** (§4.3) — lower priority, build when needed

---

## 9. Unit Delegation & Co-Working Operators — BUILT & E2E-VERIFIED 2026-07-03

> Not part of the original 2026-07-01 planning session — added after the owner raised co-working
> (KMC/WeWord-style) operators as a major B2B opportunity. **Status: fully built and
> E2E-verified 2026-07-03** — schema, real CRUD (`property_units` replacing the old
> `units_inventory` JSON blob), the delegation handshake, `OperatorMode.js`, and the Unit Master
> Page. See `08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-07-03.md` for the full build record.
> Not built: the owner-initiated "assign directly" path (deliberately cut, see §9.2's locked
> decisions), Enterprise Mode / multi-seat corporate identity (still parked on the RLS reset, see
> §9.6), and the §9.4 open question below (still open — don't guess).

### 9.1 Correction to an externally-pasted proposal

An AI-generated proposal (pasted into chat by the owner, not written by Claude) suggested
extending the embedded `units_inventory` JSON blob with an `operator_id` key. **Rejected** — units
were already moved out of that JSON blob into a real relational table (`property_units`, built
earlier the same day, wiring still paused) specifically because "a unit *is* a Space instance," not
an embedded blob. Any operator delegation work must build on `property_units`, not resurrect the
JSON approach. The owner's own instinct in conversation ("there would be an operator table... who
can control this particular unit") was the correct one — this section formalizes that.

### 9.2 The delegation model

- Add an `operator_id` column to `property_units` (nullable, references whichever entity currently
  controls that unit — `null` = the building owner controls it, the default).
- Co-working operators (KMC, WeWord-style entities) can be delegated control of specific units
  inside a building they don't own — solves the "coworking space doesn't fit the whole-property
  listing mold" problem without owners creating duplicate fake properties.
- **The handshake:** reuse the existing Connects-based Broker Handshake pattern exactly — operator
  spends 1 Connect to open a chat with the building owner; owner accepts and picks specific units
  (via `InventoryGridManager.js`) to delegate; those units' `operator_id` gets stamped.
- **The operator's dashboard** gets a new "Operated Spaces" mode — a filtered view of
  `InventoryGridManager.js` showing only units where `operator_id` = them. They can edit names,
  photos, availability for their delegated units only — never the rest of the building.
- **Monetization:** delegated-unit count as a gated capability by tier (mirrors existing listing-
  count limits elsewhere) — exact numbers not locked yet, needs the same owner confirmation pattern
  as other pricing numbers (launch with confirmed numbers or none).

### 9.3 Unit Master Page (new route — sound on its own, independent of the operator model)

`/property/[slug]/unit/[unit-id]` — each unit gets its own page instead of just a card on the
parent property page. Five condensed chapters: **The Space** (photos, size, desk-vs-suite
distinction) · **The Differentiator** (what makes this specific unit unique) · **Terms &
Amenities** (operating hours, inclusions, house rules) · **The Building** (pulls the parent
property's macro-intel — flood risk, transit, etc. — so operators piggyback on data the building
owner already filled in) · **Your Move** (the handshake). Unit cards on the parent property page
(existing "Units" chapter) become clickable links to this new route. "Your Move"'s Connect-spend
chat routes to the unit's `operator_id` if set, otherwise the building owner — same pattern as the
existing Broker Handshake, just resolved per-unit instead of per-property.

### 9.4 Multi-role corporate identity (the "KMC is also a broker and a developer" problem)

Resolved by reusing three already-designed-but-separately-built mechanisms instead of inventing a
fourth (the pasted external proposal's `enterprise_seats` idea is **not** used — it duplicated
machinery that already exists elsewhere in this doc):

1. **`TIER_DISTINCTION.md §0`'s per-role "hat" model** — one identity, multiple simultaneous
   role-tiers (a Seeker hat, an Owner hat, a Broker hat, each billed separately). Extend this to
   apply at the entity level, not just the individual level, and add an **Operator hat** to the
   existing Seeker/Owner/Broker/Creator list.
2. **This doc's own §2 Ownership Graph** (`Individual / Corporation / Guild / Clan /
   Association`) — KMC should be its own **Corporation-type Identity entity**, separate from any
   one human's login, not "whoever at KMC signed up first, with coworkers sharing the password."
   This primitive was already sketched in §2 but never built — this is the first concrete use case
   for it.
3. **§3.1's `admin_users`/`permission_grants` pattern** (built for ScoutIt's own internal Mission
   Control team) — reused for external company team members getting scoped access to specific
   hats of their employer's corporate identity (e.g., one KMC staffer only touches the Operator
   side, another only the Broker side).

**Net result:** KMC is one Corporation-identity holding three hats (Broker, Developer/Owner,
Operator), each its own tier/subscription, with individual KMC employees attached as members with
scoped access — not three separate confusing KMC accounts, and not one person's login secretly
representing a whole company.

**✅ RESOLVED 2026-07-03** (real schema design, not just a conversational nod — see
`08_OPERATIONS_AND_BACKLOG/` latest session handoff for the full conversation this came from):
**yes**, a Corporation identity gets its own row, separate from any one human. Concretely: a new
`organizations` table (`id`, `name`, `super_admin_user_id`, subscription/tier info) is the company
identity itself, and a new `organization_members` table maps humans to it (role within the org +
`permission_grants` rows). This is now called **"Enterprise accounts"** in planning docs — it
lives on the **main ScoutIt site** (a customer-facing feature, new dashboard mode alongside Owner/
Broker/Operator), NOT on the separate Mission Control deployment (that stays ScoutIt's own
internal staff tool only). Access control for both Enterprise accounts and Mission Control uses
the same underlying mechanism — RBAC + resource-scoped grants, chosen over full ABAC as
unnecessary complexity for what's actually needed here — via one additive change to §3.1's
`permission_grants` table: a nullable `scope_type`/`scope_id` pair, so a grant can be global
(Mission Control staff) or scoped to a specific property/broker (an Enterprise sub-user).
**Status: explicitly parked behind the RLS security reset** — Enterprise accounts' whole security
promise ("each company only sees its own data") depends on RLS actually enforcing anything, which
it doesn't today. Owner's explicit call: don't build `organizations`/`organization_members` before
that reset happens — this is a hard dependency given what the feature does, not a nice-to-have
sequencing preference.

### 9.5 Corporate identity succession/transfer

Deliberately kept simple, per owner's explicit call — this is a rare event, don't over-engineer it
with voting or inactivity-timer automation:

- **Explicit, real-time transfer only** — whoever holds the top permission tier on that identity
  (the "Enterprise Admin" hat) can hand it to another team member. Reuses the same
  `permission_grants` mechanism from §3.1, just pointed at a company identity instead of internal
  staff.
- **Fallback for the disaster case** (nobody left with access) — ScoutIt's own Mission Control team
  can manually reassign it, using the already-spec'd `team_access.manage` permission. Not
  automation — a human support action taken when asked.
- Explicitly **not building**: hierarchy-based auto-transfer, voting, days-inactive triggers. Add
  later only if this actually becomes a real problem in practice.

### 9.6 Sequencing decision

- **Enterprise Mode (full multi-seat team access) — explicitly PARKED** until the RLS security
  reset (see `VULNERABILITY_AUDIT_2026-06-26.md`) actually happens. Its core security promise
  ("RLS ensures team members only see their own data") is currently **false** given the `dev_all_*`
  findings from earlier the same day — building permission-scoped team access on top of RLS that
  doesn't actually enforce anything would be building the lock before fixing the door.
- **Unit Master Page + `operator_id` column on `property_units`** — buildable sooner, doesn't
  depend on the RLS reset landing first (though it obviously benefits from it eventually like
  everything else).

### 9.7 On the flood-risk map's monetization (unrelated to 9.1–9.6, decided same conversation)

The NOAH flood heatmap (§6, built 2026-07-02 — see
`08_OPERATIONS_AND_BACKLOG/HEATMAP_NOAH_INTEGRATION_PLAN.md §6`) is **fully free, never paywalled,
including the visual map overlay, not just the existing numeric badge.** Owner's explicit reasoning:
it's sourced from a Philippine government open-data project (NOAH); monetizing government hazard
data would look bad. This extends (doesn't just match) the pre-existing "flood risk never gated"
invariant to cover the new visual layer too, not only the `FloodRiskScore` number.
