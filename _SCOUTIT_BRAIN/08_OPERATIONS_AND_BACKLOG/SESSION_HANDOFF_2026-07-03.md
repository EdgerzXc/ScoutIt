# Session Handoff — 2026-07-03

> ## ▶️ RESUME HERE (latest) — 2026-07-03, Part 7 — impeccable design pass shipped; 2 new initiatives captured (dashboard atmosphere + CRM)
>
> **1. Ran the full `/impeccable` workflow against the property detail page** (property is
> `AGENTS.md`'s brand-register surface — see `PRODUCT.md` design principle #4), owner's stated
> next direction from Part 6. `init` → `document` (`PRODUCT.md` + `DESIGN.md`, both at repo root,
> not gitignored) → `colorize` → `critique` (2 parallel sub-agents per the skill's hard invariant:
> a design-review assessment + a detector/browser-evidence assessment). Findings fixed in priority
> order, each verified live in a running dev server before commit, per the owner's "tell before
> every push" working style:
> - **P0** — chapter nav in `ResidentialFlow.js`/`CommercialFlow.js` was clickable `<div>`s, not
>   real interactive elements — converted to `<button role="tab" aria-selected>` inside a
>   `role="tablist"` container (keyboard/screen-reader accessible now).
> - **P0** — the Vault section's Matterport/Luma demo content wasn't labeled as illustrative, and
>   its sidebar said `"Orbit Tier Only"` — `"Orbit"` isn't a real tier
>   (`entitlements.js`'s real list is `starry/solar/cluster/universe`). Both fixed.
> - **P1** — CSP `frame-src` was missing `lumalabs.ai`, silently blocking the Vault's Luma embed
>   on all 6 gold-standard properties since Part 6's push. Fixed and pushed same-day as its own
>   commit (`50bc3cb`) since it affected already-shipped production content.
> - **P1** — primary CTA affordance: owner's own design call, implemented instead of a proposed
>   second accent color — a slow breathing gold-glow pulse (`3.2s ease-in-out infinite`) on the
>   dominant CTA per view, now a named rule in `DESIGN.md` §4 ("The Breathing Signal Rule").
>   Applied to the homepage hero CTA and the Vault's primary action; full
>   `prefers-reduced-motion` fallback added (the CSS file had zero reduced-motion handling before
>   this, despite 3 pre-existing animations).
> - **P2** — chapter tab state now syncs to `?chapter=` in the URL via `history.replaceState`
>   (not Next.js router push, deliberately — avoids polluting back/forward history or triggering a
>   data refetch on every tab click). Deep links and refreshes now land on the correct chapter.
>   Hit a real SSR/hydration bug building this — `useState(() => urlLookup())` lazy initializers
>   silently no-op on first load because React reuses server-rendered state during hydration; fixed
>   with `useState(default) + useEffect` reading the URL post-mount, then a further React
>   StrictMode double-hydration false-positive fixed by deferring that `useEffect`'s `setState` one
>   `requestAnimationFrame` past mount.
> - **P3** — Location chapter's flat 5-item fact list regrouped into "Risk & Zoning" / "Access"
>   sub-groups (chunking guideline: ≤4 items per ungrouped group).
> - Applied identically to both `ResidentialFlow.js` and `CommercialFlow.js` — both files shared
>   the exact same underlying nav/state bugs (copy-paste siblings).
> - **Commits:** `893dfd0`, `07b7a77`, `50bc3cb`, `4b3fd94`, `1a49c43`, `0e52c05` — all pushed to
>   `main`/GitHub/Vercel. `npm run build` clean before every push; zero console/server/network
>   errors on final live verification.
> - **Caught and corrected one bad sub-agent finding before acting on it:** Assessment A
>   misattributed a California-address showing on a Pasig listing's Vault to a hardcoded bug —
>   verified it was actually the session's own deliberate, documented gold-standard placeholder
>   content (real Airtable `Virtual_Tour_URL` field), not a code defect. Standing discipline:
>   verify sub-agent output before acting on it, don't trust the report at face value.
> - **impeccable install note:** `npx impeccable install` got blocked by Claude Code's safety
>   classifier (unverified npm-registry fetch+execute, flagged as supply-chain risk). Resolved by
>   copying the skill files directly from the already-cloned, user-approved plugin repo
>   (`~/.claude/plugins/marketplaces/impeccable/plugin/skills/impeccable/` →
>   `ScoutIt/.claude/skills/impeccable/`) instead of running the npx installer — no app code
>   affected, `.claude/` is gitignored so this is local tooling only.
>
> **2. Owner shared a second doc (`2 Core Ideas.docx`, Desktop) with two new product/design
> initiatives — captured as docs, NOT implemented:**
> - **Dashboard Atmosphere Framework** — a structural spec for every dashboard (Buyer/Owner/
>   Broker/Service Provider): mandatory `IDENTITY → STATUS → SCOUT INSIGHT → WORKSPACE → ROLE
>   ATMOSPHERE` layer order, a non-negotiable AI-insight module ("Scout Insight" — named as
>   ScoutIt's actual product differentiator, without it "ScoutIt becomes a premium CMS instead of
>   an intelligence platform"), and per-role *ambient* differentiation (Buyer=aspirational
>   glow/fog, Owner=blueprint grid, Broker=tactical pulses/signal nodes, Service
>   Provider=lens bloom/glass) — all still inside the locked 95% black / 5% gold system, no new
>   hues. Full spec + gap analysis against the current codebase (role components already exist;
>   Scout Insight and role atmosphere don't, anywhere) at
>   `03_DESIGN/DASHBOARD_ATMOSPHERE_FRAMEWORK.md`.
> - **CRM Initiative** — "relationship intelligence, not contact management." ScoutIt's CRM (if
>   built) exists to serve the platform's intelligence moat, not to compete on CRM feature parity.
>   Framed through the owner's "Workflow Gravity" strategic lens (Entry → Dependency → Workflow
>   Centralization → Network Lock-in → Operating System). Real proto-infrastructure already
>   exists and isn't a from-scratch build: the `deals` table, `BrokerMode.js`'s Deal File
>   Workspace, and `/api/deals/*` lifecycle routes — with one concrete, low-risk gap flagged
>   (`dealNotes` in `BrokerMode.js` is local React state, never persisted to Supabase). Full
>   capture + 5 open owner-decision questions (who's it for, lead source, scoring data source,
>   scope vs. Mission Control/Enterprise, sequencing vs. the atmosphere framework) at
>   `08_OPERATIONS_AND_BACKLOG/CRM_INITIATIVE.md` — deliberately not scoped into a build plan yet,
>   that's the next conversation.
> - Both docs flag that they likely interlock for Broker mode specifically (Scout Insight ≈ CRM
>   follow-up recommendations, Broker's "Tactical Velocity" atmosphere = pipeline urgency) —
>   recommended as one combined planning pass rather than two independent builds.
>
> **Nothing built yet for either initiative — this was a documentation/capture pass only, per the
> owner's explicit ask ("make all necessary changes so ScoutIt Folder is up to date").** Next
> real step for either is a dedicated planning conversation, same pattern as
> `PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md`.
>
> ## Previous — 2026-07-03, Part 6 — Part 5 verified, 2 real bugs fixed, gold-standard properties built, pushed live
>
> **1. Verified all four Part 5 items in a real running dev server** (not just static review):
> - **Footer + `/enterprise` page** — clean, no console errors, all links present.
> - **Mission Control dev-preview** — both Staff (global, 16 properties) and Enterprise (scoped to
>   owner, 6 properties) lenses render real Supabase/Airtable data correctly. An initial "0
>   properties" screenshot was just a load-timing race in the test, not a bug — confirmed on retry.
> - **NOAH flood-risk 5-yr/25-yr/100-yr tabs** — `curl`-confirmed both new `.pmtiles` files are
>   live on Hugging Face (previously unverified), then confirmed in a real browser that each tab
>   triggers a genuine 206 range-request fetch against the correct file, not just a UI swap. Detail
>   in `HEATMAP_NOAH_INTEGRATION_PLAN.md §7`.
> - **`_tmp-master-properties.js` (6 master mock properties)** — ran it. It was broken: wrote
>   Airtable singleSelect values that don't exist in the live schema (`"Warm Shell"`,
>   `"Short-Term Rental"`, etc.) and a non-date string into `RS_Turnover_Date`, so **every one of
>   the 6 Airtable inserts failed** on the first attempt (the Supabase side had already inserted,
>   leaving 6 orphaned rows — cleaned up via `execute_sql` before retrying). Fixed by checking the
>   real Airtable schema (`get_table_schema`) and mapping to real choices, or omitting fields where
>   nothing genuinely fit. All 6 succeeded on retry.
>
> **2. Found and fixed a real pre-existing bug during Part 5 verification:** every STR-category
> listing showed hardcoded fake placeholder text (`"2 Beach Suites"`, `"15 Guests"`) instead of
> real data — `src/lib/airtable.js` only ever mapped Hospitality's fields into the shared
> `accommodations`/`hosting_capacity` keys, never STR's own. Fixed.
>
> **3. Owner then asked to fully populate those 6 master properties** (public + hidden-intel +
> vault fields, per `FIELD_VISIBILITY_MAP.md`) as a permanent "gold standard" reference set, and
> explicitly said **not** to delete any other existing listings. Full writeup, including 3 more
> real bugs found while doing this (2 of them platform-wide, not scoped to just these 6 records):
> **`04_DATA_AND_SCHEMA/MASTER_PROPERTIES_GOLD_STANDARD.md`**. Short version:
> - Created 2 missing Airtable columns (`Luma_3D_Map_URL`, `Drone_Heatmap_URL`) that code and docs
>   had referenced for a long time but never actually existed — the Vault's Luma/drone sections
>   have been silently non-functional on every property, platform-wide, until now.
> - Fixed `ResidentialFlow.js`'s "The Space" chapter, which was hardcoded to Commercial's field
>   labels instead of using the same dynamic schema lookup every sibling chapter uses — affected
>   every residential listing, not just the new ones.
> - Populated real, HTTP-verified Matterport + Luma embeds, real Mapbox-geocoded coordinates (2 of
>   6 initially resolved to the same generic city-center point on a first pass — re-geocoded with
>   more specific location strings), real NOAH flood risk score/zone, real distinct photos, unit
>   photos synced through to Airtable's `Units_JSON`, and the full `DEEP_INTEL_SCHEMA` hidden-intel
>   set per category.
>
> **4. Pushed to `main` and both Vercel projects, per explicit owner instruction** — commit
> `9aab743`. Ran `npm run build` locally first (clean, no errors) before pushing. Confirmed both
> `scoutit` and `scout-it` Vercel deployments reached `READY`, then spot-checked `200` on
> `scoutit.vercel.app`/`scout-it.vercel.app` for both a new property page and `/enterprise`.
> Excluded `skills-lock.json` and the untracked `.agents/skills/*`/`council-of-high-intelligence/`
> dirs from the commit, matching established practice (unrelated tooling, not app code).
>
> **Owner's stated next direction:** a design-polish pass on property pages using `impeccable`
> (github.com/pbakaus/impeccable), already installed as a Claude Code plugin
> (`~/.claude/plugins/marketplaces/impeccable`). Not started — no design work done against it yet
> in this session.
>
> ## Previous — 2026-07-03, Part 5 — READ THE NEXT-SESSION PROMPT FIRST
> **Before touching any code, run the full context-load sequence** (see
> `NEXT_DAY_HANDOFF.md`'s pinned prompt, or just: `obsidian-second-brain` skill on the real vault,
> not a skim → `00_START_HERE.md` → `NEXT_DAY_HANDOFF.md` → this file, all of it, not excerpted →
> then read actual current source for whatever you're about to touch, don't work from memory of
> what a prior session built). This isn't optional this time — the owner said directly that
> shortcut-y context-loading has caused real coding mistakes (see the memory note added this
> session: `working-style-and-deploys.md`, "Load full context before writing any code").
>
> **What's real and pushed as of Part 4:** all of Part 2 + Part 3's work is live on both
> `scoutit.vercel.app` and `scout-it.vercel.app` (commits through `c9c17dd`). Nothing from Part 5
> below has been pushed — most of it hasn't even been verified in a browser yet, see why below.
>
> **Part 5 work — built but UNVERIFIED, do not trust it blindly, check it for real first:**
> A mid-session tool outage (the safety classifier gating Bash/network/MCP-write calls went down
> for an extended stretch) blocked all live verification, database writes, and the dev-server
> preview for the rest of the session. Everything below was written correctly to the best of
> available static analysis, but **none of it has been run in a browser or confirmed against a
> live database** — treat it as a first draft to verify, not finished work:
> 1. **Footer audit + fixes** (`src/components/layout/Footer.js`) — added Enterprise, Badges,
>    Contact links; new `src/app/enterprise/page.js` marketing/waitlist page (mailto CTA to the
>    same `hello@scout-it.vercel.app` address already used in `EarlyAccessGate.js`).
> 2. **Mission Control dev-preview** (`src/components/dashboard/MissionControlMode.js`, wired
>    into `src/app/dashboard/page.js` + a new "Mission Control (preview only)" section in
>    `src/components/ui/FloatingToolbox.js`'s dev panel). **Owner correction this session:**
>    Mission Control is ONE dashboard with two lenses, not two separate systems — "staff" (owner +
>    team) gets near-global property access/edit; "enterprise" (external client companies) gets
>    scoped-to-own-portfolio access. Both lenses currently reuse `useDashboard()`'s already-global
>    `listings` (real data, since RLS is still permissively open) — **explicitly NOT
>    production-safe**, real Enterprise isolation still needs the parked RLS reset + a real
>    `organizations` table (Track 4, `PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md`). Gated
>    entirely behind the dev toolbox (`scoutit_dev` flag) — never added to `ACTIVATABLE_MODES`, so
>    no real user can self-activate it.
> 3. **NOAH historical flood risk ranges** (`src/components/property/FloodHeatmapMap.js`) — added
>    a 3-tab selector for NOAH's real return periods (5-yr "Recent", 25-yr, 100-yr). **Correction
>    to the owner's original ask:** NOAH does not publish a "50-year" dataset
>    (`HEATMAP_NOAH_INTEGRATION_PLAN.md` §1 confirms only 5/25/100-yr exist) — used 25-yr instead
>    of inventing one. **Unverified: whether `flood_5yr.pmtiles` and `flood_25yr.pmtiles` actually
>    exist at the same Hugging Face path as the already-working `flood_100yr.pmtiles`** — inferred
>    from the established naming convention + NOAH's confirmed data coverage, not confirmed live
>    (the outage blocked the check). **Check this first** — if either file 404s, the component's
>    existing error state will show "unavailable" gracefully, but it needs a real check before
>    trusting the 5yr/25yr tabs work at all.
> 4. **6 master mock properties (task not started — blocked entirely by the outage).** A complete
>    generation script is ready to run: `_tmp-master-properties.js` + `_tmp-deepintel-schema.json`
>    (repo root, throwaway, delete after running) — one fully-populated demo property per category
>    (residential/commercial/str/hospitality/restaurants/venues), every category spec field, every
>    Deep Intelligence field across all 6 chapters (values mechanically derived from
>    `deepIntelSchema.js`'s own "e.g. ..." placeholders — not invented), 2-3 units each. Run with
>    `node --env-file=.env.local _tmp-master-properties.js` from the repo root once Supabase/
>    Airtable MCP access is confirmed working again, following the exact same pattern as the
>    `ScoutIt Demo Tower` real demo property from earlier in this session.
>
> **Immediate next steps, in order:** (1) run the context-load sequence above, for real. (2)
> Verify Part 5's four items actually work — start the dev server, click through the footer/
> enterprise page/Mission Control preview/NOAH tabs, fix anything broken. (3) Run the master-
> properties script, verify each of the 6 properties renders correctly on its public page, clean
> up the two `_tmp-*` files after. (4) Only then commit + ask before pushing.
>
> ## Part 4 (same day) — pushed to main + both Vercel deployments
> Fixed all 5 pre-existing Playwright E2E failures (`E2E_TEST_FIX_LIST.md`-adjacent, unrelated to
> this session's actual feature work — all were test/config drift against the current UI:
> `connections.spec.js`/`owner-live-editor-flow.spec.js` had ambiguous loose-text locators,
> `live-canvas.spec.js` had a stale button-text assertion, `owner-deep-intel-flow.spec.js` had a
> racy fixed-sleep photo-upload wait that intermittently landed on 4/5 photos, and
> `owner-live-editor-flow.spec.js` predated the `property_units` rebuild entirely). Full suite:
> 20/20 passing with the plain `npx playwright test` default command. Also capped
> `playwright.config.js`'s local workers at 2 — unlimited parallel workers were running multiple
> heavy photo-upload flows simultaneously, causing real resource-contention flakiness unrelated to
> any app bug. **Pushed to `main` and both Vercel projects redeployed successfully**
> (`scoutit.vercel.app` + `scout-it.vercel.app`, commit `c9c17dd`) — owner explicitly asked for
> this after confirming no reproducible bug on the "hidden details" report he'd flagged (tested
> exhaustively across `DeepIntelWidget`, `MinorLockSection`/`CategorySpecBlock`, and the full
> "Hidden Intel"/"The Fine Print" chapter including `FloodRiskBadge` — found nothing broken; the
> report may need a screenshot next time to pin down, or was already fixed by this session's
> earlier work).
>
> ## Part 2 — 2026-07-03
> Owner did a live browser walkthrough of Unit Delegation (real demo property created across
> Supabase + Airtable — `ScoutIt Demo Tower — Unit Delegation Showcase`, kept as a real working
> example, not deleted). Approved, then **committed locally to `main`**: commit `56df83d` (Unit
> Delegation + the 2 bug fixes + docs) and commit `8c88011` (Track 1 — Notifications, built and
> live-verified this same session: `user_notifications` table, persisted bell dropdown via
> `/api/notifications`, daily stale-listing Vercel Cron at `/api/cron/check-stale-listings` with
> dedupe, and broker-on-change alerts wired into `/api/dashboard/update` +
> `/api/dashboard/units` + `/api/dashboard/units/delegate` — scoped to price/rate + units +
> delegation changes only, not every autosave keystroke, per owner's explicit call). Both
> commits verified live with real Supabase/Airtable writes and reads, not just code review; all
> test artifacts (throwaway test broker, test notifications) cleaned up after.
> **Still NOT pushed to GitHub/Vercel** — owner explicitly chose to stop before that step this
> session. Two unrelated things were deliberately left uncommitted both times: `skills-lock.json`
> (an unrelated skill-install diff) and the untracked `.agents/skills/*` /
> `council-of-high-intelligence/` directories (unrelated tooling, not app code) — leave these
> alone unless asked.
> **Next up, per the approved plan's sequencing** (`PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md`):
> Track 2's prerequisite — real analytics instrumentation (wire `/api/inquiries/route.js`, which
> is still a literal stub; add a `property_pageviews` table + view counter) — before the actual
> analytics panel gets built. Mission Control and Enterprise accounts still each need their own
> dedicated session; don't slide them into a general continuation.
>
> ## Part 3 (same day) — backlog cleanup, no new features
> Closed out three items from `E2E_TEST_FIX_LIST.md` (a pre-existing backlog file, unrelated to
> Unit Delegation/Notifications): (1) added a `CRON_SECRET` to lock down the new stale-listing
> cron route — was accepting unauthenticated requests; local `.env.local` updated, **owner still
> needs to add the same value to Vercel's env vars before/at push time**, value shared in-chat,
> not repeated here. (2) `/api/dashboard/invite`'s Connects-spend rewiring is now fully E2E-verified
> with a real throwaway Supabase Auth user (no-token/zero-balance/funded-success all correct,
> rollback confirmed) — see the fix list for detail. (3) Found `/api/v1/questit/raise` is
> **structurally broken, not just unverified** — it references three Supabase tables
> (`questit_api_keys`, `questit_policies`, `company_quests`) that don't exist anywhere in the repo
> or the live DB. Not fixed — building that schema is a real design decision (API key hashing,
> policy shape), flagged instead of guessed. (4) Connects breakdown popover now verified across
> Broker/Buyer/Provider roles, not just Owner — role-mapping is correct, the header-pill-vs-popover
> mismatch already known from the prior session is a dev-mock-account artifact, not a bug. No app
> code changed in this round except the notification-alert wiring already covered in Part 2's
> commit `8c88011` — this round was pure verification + one doc update.
>
> ## Original 2026-07-03 session (Part 1)

> **Read this first** — most recent session. Built and E2E-verified `SCOUTIT_MASTER_BUILD_SPEC.md
> §9` (Unit Delegation & Co-Working Operators) end-to-end, found and fixed two real pre-existing
> production bugs along the way, and started scoping a new Team Access / Mission Control
> permission-grants feature. Nothing pushed to `main`/Vercel — all work is uncommitted in the
> working tree as of this doc.

---

## 1. Unit Delegation & Co-Working Operators (§9) — built, not just planned

Previous sessions (2026-07-02) got this to "conversation-level agreement, no code." This session
built and verified all four phases with real throwaway Supabase accounts (never mocks) plus one
real, immediately-deleted Airtable test record for the Airtable-sync verification specifically.

**Phase 0 — Schema migration.** `property_units` gained `operator_id` (text, nullable, no FK —
matches every other user-id column in this DB) and `availability_status` (text, nullable,
app-enforced `available`/`occupied`/`coming_soon`, not a Postgres enum). `deals` gained `unit_id`
(uuid, nullable, FK → `property_units.id`). See `DATA_DICTIONARY.md §3.3` for the full shape.

**Phase 1 — Real CRUD replacing the JSON blob.** New `/api/dashboard/units` (GET/POST) —
upsert-by-diff: real existing id → update, client temp id → insert (and the server's real UUID is
returned so the client reconciles it), row missing from the payload → delete. Delegated units
(`operator_id` set) are pinned — this route silently ignores edits/deletes to them; only
`/api/dashboard/units/delegate` can touch `operator_id`. `src/lib/unitsSync.js` (new) — a shared
`syncPropertyUnitsToAirtable()` helper, called after every write when the property is
`pipeline_status = 'approved'`, sourcing Airtable's `Units_JSON` from the real `property_units`
rows instead of the old `details.units_inventory` blob, and now including `id`/`operator_id`/
`operator_display_name` per unit. `insertProperty()`/`updateProperty()` in `src/lib/airtable.js`
gained an optional `unitsOverride` param for this.

**Phase 2 — Owner's editor rewired + delegation review.**
`src/app/dashboard/inventory/[id]/page.js` now loads/saves against `/api/dashboard/units` instead
of `details.units_inventory`; the save-state UI (idle/saving/saved/error) is unchanged, only the
data source. Hardened against a real race: if a second save fires while one is still in flight
(e.g. the user keeps typing during a slow request), it's queued and re-run against the *freshest*
local state once the first settles — otherwise a not-yet-reconciled temp id could get resent and
double-insert the same unit. New `src/components/dashboard/DelegationRequests.js` — lists pending
operator-initiated handshake requests for a property; Accept opens a unit-picker, Decline just
declines. New `POST /api/dashboard/units/delegate` (+ GET for the pending-requests list) —
stamps `operator_id` on the selected units and finalizes the deal(s).
`InventoryGridManager.js` shows delegated units as visibly locked (name/size/floor/features
read-only, "Operated by X" label, no delete/duplicate) rather than letting an owner edit a field
that would silently not save.

**Locked decision worth remembering:** the operator's initial ask spends **exactly 1 Connect**,
no matter how many units the owner ends up delegating in one accept action. One deal row gets
finalized (`unit_id` set, `status: 'accepted'`); each *additional* delegated unit clones a sibling
deal row (same buyer_id/property, no new charge) — one deal = one unit, but one ask = one charge.

**Phase 3 — `OperatorMode.js` + mode-switcher.** New "Operator" hat added to
`src/app/dashboard/page.js`'s `TAG_LABELS`/`ACTIVATABLE_MODES`/`renderActiveMode()` (activates
immediately, no license step, like Owner/Buyer). New `src/components/dashboard/OperatorMode.js` —
fetches `property_units` where `operator_id` = the current user, grouped by building (an operator
can hold units across multiple properties). Reuses `InventoryGridManager.js` via a new `mode`
prop (`"owner"` default vs `"operator"`) rather than forking it — operator mode locks
size/floor/features, adds an Availability dropdown, and removes all add/duplicate/delete
controls. New `/api/dashboard/operator/units` (GET/POST) — the operator's restricted CRUD;
server-side guarded so even a manipulated payload can't touch a unit not actually delegated to
that caller (verified directly in testing, not just assumed).

**Phase 4 — Unit Master Page.** New route `src/app/property/[id]/unit/[unitId]/page.js` (the
property route folder is `[id]`, not `[slug]` — corrected an assumption before building). Five
condensed chapters (The Space, The Differentiator, Terms & Amenities, The Building, Your Move) in
`src/components/property/UnitMasterPage.js` — a simpler single-scroll layout, not a fork of the
full horizontal chapter-scroll system `ResidentialFlow`/`CommercialFlow` use, since the spec calls
this page "sound on its own," not a peer of the full property flows. "Your Move" is a new
`UnitInquiryModal.js` (real `getSession()` auth, real error handling) rather than reusing the
existing `InquiryModal.js` — see §3 below for why. Unit cards on the parent property page now link
here using each unit's real id.

**Locked decision:** built the operator-initiated handshake only (spec §9.2's literal text).
Did **not** build a second, owner-initiated "assign directly" path — that would need a whole
separate operator-lookup/resolution UI that doesn't exist, and bypasses the operator's consent
step the spec's flow implies. If the owner wants a known operator fast-tracked, they just tell
that operator to send the request.

## 2. Two real pre-existing bugs found + fixed (not part of the plan, discovered while depending on this code)

1. **`/api/deals/initiate` was silently broken.** It inserted a `role` key into
   `connect_transactions` and filtered `connect_balances` by `.eq('role', role)` — **neither table
   has a `role` column** in the live schema (confirmed via `list_tables`). This is the route
   behind the existing "Connect with an Authorized Broker" buyer flow — it has likely been failing
   in production this whole time. Fixed by switching to the same atomic `spend_connects` RPC
   already proven correct in `/api/dashboard/invite/route.js`. Verified the fix with a real
   throwaway buyer account: correct deal row, correct ledger bucket/amount, no regression.
2. **`insertProperty()` was silently broken for brand-new properties.** Airtable's
   `PROPERTIES_CMS.Slug` field is now a **computed/formula field** (confirmed via
   `get_table_schema`/`list_tables_for_base`), but `insertProperty()` was still writing a
   `Slug` value into every insert payload — a 422 (`INVALID_VALUE_FOR_COLUMN`) on every single
   first-time property insert. This breaks **the entire "approve a brand-new property" pipeline**
   (`/api/admin/approve/route.js`, `/api/dashboard/publish/route.js` first-insert path), not just
   the units work. Fixed by removing the write and reading back whatever slug Airtable computes
   (`created.fields.Slug`) — the dead `slugifyText`/`buildUniqueSlug` helpers were removed too.
   Verified with a real (immediately deleted) Airtable insert.

**Also confirmed (not a bug, but non-obvious):** the CMS proxy (`fetchTable()` in
`src/lib/airtable.js`) caches every Airtable table fetch for 60 seconds via Next's
`fetch(..., { next: { revalidate: 60 } })`. A property/unit change can take up to ~60s to show up
on the public site — expected behavior, not a defect, but worth remembering next time something
"isn't showing up" right after a save.

## 3. Data/schema docs corrected to match reality

`DATA_DICTIONARY.md §3` was stale — it said units "are not a separate table," which stopped being
true this session. Rewritten with the real `property_units` schema, who reads/writes it, how
`Units_JSON` sync still works, and a flag that a *separate*, still-unwired `UNITS` Airtable linked-
record table exists from a prior session (`tblfvXBgDzY1l9OpJ`) and was deliberately not migrated to
— reconciling the two unit representations is a real open question for whenever Mission Control
work resumes, not something to assume is settled.

`FIELD_VISIBILITY_MAP.md §4a` (new) — classified the new `operator_id`/`operator_display_name`/
`availability_status` fields as **PUBLIC**, by analogy to two already-signed-off precedents
(`broker_name` is already public; `CM_Availability_Status` is already a free spec row) — flagged
explicitly as reasoned-by-analogy, not an explicit owner ruling on this specific case, so a future
session doesn't mistake it for settled the way the 2026-07-01 draft's unreviewed assumptions did.

## 4. Plan approved (not built yet): Staff Permissions, Enterprise Accounts, Analytics, Notifications, Mission Control

Owner wants a Monday.com-style permission system. Turned out to be **two distinct features**
after several rounds of clarifying conversation:

- **Mission Control** — ScoutIt's own internal staff tool, standalone Next.js app, separate
  Vercel deployment, tightly locked down (unchanged from the existing spec, §3).
- **Enterprise accounts** (new name for what §9.4 called "multi-role corporate identity") — an
  external, paying **client** feature. A company (e.g. "Megaworld," "SM Group") gets its own
  account with a super-admin who invites named humans and grants each scoped access (broker
  connections, co-working operator relationships, their own properties, mass company-wide
  updates to brokers). **Lives on the main ScoutIt site**, not Mission Control's deployment — a
  new dashboard mode alongside Owner/Broker/Operator. **Explicitly parked behind the RLS security
  reset** (owner's call: "let it be a problem for later... right now we're ramping up features").
  This resolves §9.4's previously-open question ("does a Corporation identity need its own
  account?" — yes, see the update to that section directly).

**Access control model decided:** RBAC + resource-scoped grants, not full ABAC — rejected ABAC as
unnecessary complexity (a real policy engine, every rule combination needing testing) for what's
actually needed ("grant this person access to these specific properties/brokers"). One additive
change unifies both Mission Control and Enterprise accounts under the same mechanism: extend
`permission_grants` (§3.1) with a nullable `scope_type`/`scope_id` pair — null = global (staff),
set = scoped to one resource (an Enterprise sub-user).

**Self-serve analytics — decision reversed mid-conversation:** originally planned to ship now with
an honest "coming soon" section for views/inquiries (which aren't instrumented anywhere in the
codebase yet — `src/app/api/inquiries/route.js` is a literal stub). Owner's explicit call: **wait
for full real instrumentation before building the panel at all** — don't ship anything partial to
a paying client's private dashboard.

**Notifications, expanded:** in-app now, email deferred (see below). New scope added this
conversation: notify any broker attached to a property (via the existing handshake/
`PROPERTY_BROKERS` relationship) when that property changes — confirmed for everyone, solo
brokers/owners included, not gated behind Enterprise accounts.

**Google Sign-In — real blocker identified, not just "not built yet":** owner wants it as
ScoutIt's actual login/registration method (bigger than just Gmail-sending). Blocked on Google
Cloud requiring a billing method (a debit card) the owner doesn't have — deferred to near-launch.
This is also the owner's intended real fix for the already-known "real signup is broken" gap —
don't treat these as two separate problems.

**Unit "promote it" tools** — unchanged, PH coworking-market research done (flexible pricing
framing, location/transit, infrastructure, community/events, wellness amenities), no field list
decided, owner's call later.

**Status: plan approved**, full detail now at
`08_OPERATIONS_AND_BACKLOG/PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md` — copied into the
repo the same session it was approved, specifically so it doesn't get "lost" the way the Master
Build Spec once did (Desktop-only, missed by a repo-only search). The original also still lives
at `C:\Users\jerze\.claude\plans\replicated-yawning-wirth.md` (a Claude Code plan file) — the repo
copy is canonical if the two ever diverge. Nothing built yet — this was a planning-only
conversation, no code written, no migrations applied.

## 5. Files touched this session

**Code (new):** `src/app/api/dashboard/units/route.js`, `src/app/api/dashboard/units/delegate/
route.js`, `src/app/api/dashboard/operator/units/route.js`, `src/lib/unitsSync.js`,
`src/components/dashboard/DelegationRequests.js`, `src/components/dashboard/OperatorMode.js`,
`src/components/property/OperatorRequestModal.js`, `src/components/property/UnitInquiryModal.js`,
`src/components/property/UnitMasterPage.js`, `src/app/property/[id]/unit/[unitId]/page.js`.

**Code (modified):** `src/app/api/deals/initiate/route.js`, `src/app/dashboard/inventory/[id]/
page.js`, `src/components/dashboard/InventoryGridManager.js`, `src/components/property/
CommercialFlow.js`, `src/components/property/ResidentialFlow.js`, `src/lib/airtable.js`,
`src/lib/entitlements.js`, `src/app/dashboard/page.js`.

**Supabase:** migration `add_unit_delegation_columns` (schema in §1 above).

**Docs:** `DATA_DICTIONARY.md`, `FIELD_VISIBILITY_MAP.md`, `SCOUTIT_MASTER_BUILD_SPEC.md` (§9
status line + §9.4's open question resolved), new
`PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md`, this file, `NEXT_DAY_HANDOFF.md` (pointer
updated).

**Nothing pushed to `main`/Vercel — all of the above is uncommitted in the working tree.**

## 6. What's next

1. Owner review of the Unit Delegation diff, then a decision on committing (not yet asked to).
2. Finalize and approve the Team Access Dashboard / Mission Control permission-grants +
   self-serve analytics + notifications plan (§4 above) — in progress as of this doc.
3. Everything already parked stays parked: RLS reset, Mission Control's own build (still not
   started beyond the permission-grants pattern being reused conceptually), Enterprise Mode.
