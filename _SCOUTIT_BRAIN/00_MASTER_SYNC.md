---
section: "00_META"
status: active
tags: [master-sync, north-star, build-queue, decision-log, always-current]
updated: 2026-08-18
related: ["[[SCOUTIT_FULL_WORKFLOW]]", "[[SESSION_HANDOFF_2026-07-30]]", "[[00_START_HERE]]", "[[15_IMPLEMENTATION_RECORDS/README|Implementation Records]]", "[[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]]", "[[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]]", "[[13_EXTERNAL_INPUTS/README|External Inputs README]]"]
---

> **2026-08-21 Owner-approved surface lock checkpoint:** the accepted Showcase stage,
> Metropolis foreground, and Metropolis WebGL background are protected by normalized
> source checksums in `scripts/approved-surfaces.json`. `npm run verify:surfaces` and CI
> fail on drift. Checksums may change only after the owner reviews and explicitly accepts
> the new local appearance; cleanup and unrelated fixes must restore the approved source.
> The root README, AGENTS contract, and tracked design contract carry the same rule.

> **2026-08-18 Stratosphere (Layer 02) 40/60 Split-Canvas & Spatial Discovery overhaul:**
> Layer 02 (`/layer/stratosphere`) has been fully re-engineered into a bespoke **Spatial Intelligence & Discovery Terminal** using the 40/60 Split-Canvas architecture:
> 1. **Left Discovery & Spatial Radar Pane (~40%)**: Dual-axis Category & Regional corridor selectors (BGC, Makati, Siargao, Palawan, Cebu), live Discovered News & Development signal cards with status badges and impact radiuses, and dynamic **Impacted Property Nodes** (linking physical directory listings directly affected by the active news item).
> 2. **Right Interactive Intelligence Dossier Pane (~60%)**: OSINT header with verified source provenance citations, **Chronological Scrollytelling Timeline** tracking development milestones (Origin $\rightarrow$ Construction $\rightarrow$ Activation), **ScoutIt "Our Take" Spatial Impact Matrix** (⚡ The Catalysts/Boosts, ⚠️ Friction/Disadvantages, 🏛️ Spatial Promises), and architectural massing/specification projections.
> 3. **3D WebGL Stratosphere Archipelago Background**: Descended from Orbit to stratospheric altitude over the Philippine Island Archipelago with high-density glowing city lights (Metro Manila, Cebu, Clark, Davao, Siargao, El Nido), arterial highway corridors (NLEX, SLEX, SCTEX, CCLEX), and drifting stratospheric cloud bands.
> 4. **Continuous Spatial Descent**: Connected with top `LayerNav` and bottom `LayerTransition` leading to **Layer 03: Metropolis** (`/layer/metropolis`). Passes 100% Vitest tests (1,189/1,189) and clean ESLint.

> **2026-08-18 Showcase & 6-Layer Descent session checkpoint:** The Orbit Showcase
> (`/showcase`) received a complete visual overhaul: cosmic periphery canvas with
> per-rank atmospheric backgrounds (Universe = deep-space nebula & orbit rings,
> Cluster = galactic cluster gas clouds, Solar = planetary orbit system, Starry =
> Van Gogh beach horizon), mobile layout recalibration (3-row compact header, full-width
> swipeable category rail, restored 16:9 media glass, bottom clearance above floating nav),
> and the "Asset Specifications" table was replaced with curated **Showcase Distinction &
> Merits** cards (Demand Standing, Inquiry Momentum, Curation Standard) plus a gold
> `Explore Full Briefing →` CTA. Two new Master Action Plan sections were added: **§16
> Monthly Showcase Curation & Merit Calibration SOP** (P0 Operating Rhythm — operators
> calibrate property merits monthly) and **§17 6-Layer Spatial Descent Visual Style &
> Layer Navigation Polish** (P1 Experience — cosmic-to-terrestrial transitions across
> `/layer/orbit` → `/layer/stratosphere` → `/layer/metropolis` → `/layer/crust` →
> `/layer/mantle` → `/layer/core`). The Showcase Curation Invariant was codified in
> [[00_SOP]] §2. All changes passed Vitest (1,189/1,189 tests), Next.js production
> build (116/116 static pages), and were pushed to GitHub as `e8b939d` on
> `codex/production-release-verification`.

> **2026-08-17 UX direction & workspace cohesion checkpoint:** canonical UX decisions and
> implementation logic recorded in [[03_DESIGN/SCOUTIT_UX_DIRECTION|SCOUTIT_UX_DIRECTION]],
> [[07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC|DASHBOARD_AND_WORKSPACE_COHESION_SPEC]], and
> [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]].
> Key tenets: preserve ScoutIt's distinctive branded nomenclature paired with plain-language
> human translations (*translation, not replacement*); keep the 11-tool non-linear
> property environment; treat Discover and Intelligence as twin modes of a unified layer;
> maintain transparent sample data and capability demo notices; zero dead ends (*doorway principle*);
> establish the *Context Bridges $\rightarrow$ Notifications $\rightarrow$ Return Brief $\rightarrow$ Continue Where You Left Off $\rightarrow$ Board Intelligence* loop;
> and enforce Mission Control isolation and server-side RBAC security.

> **2026-08-14 migration authority checkpoint:** tracked Supabase migrations are
> now the owner-approved database source of truth. The complete read-only live
> reconciliation found five migrations ready conditionally and held the PostGIS
> `spatial_ref_sys` change. Two conflicting historical migrations are marked
> superseded. Nothing was applied; separate approval is required for the
> documented one-at-a-time sequence. The next direct owner task is Search Console.


> **2026-08-13 release merge correction:** GitHub PR #63 merged
> `codex/production-release-verification` into `main` as `77f0ce4`. The branch
> comparison therefore correctly has zero changes. Checkpoint 1 now requires only
> confirmation that Vercel deployed `77f0ce4` as Ready on the production domain.
> **2026-08-13 execution-order reconciliation:** work now follows the execution
> router at the top of [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]],
> not the physical position of its stable section IDs. ScoutIt is **not fully
> blocked**: agents may continue deterministic T0 code/tests, responsive work,
> JSON-LD safety, documentation, and read-only security analysis. The next
> high-leverage human move is the six-package **Current checkpoint** in
> [[08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS|MASTER OWNER ACTIONS]]:
> release baseline -> migration authority -> Search Console before DNS -> production
> credentials -> public profile contract -> real-device acceptance. No live DB,
> DNS, provider, repository-setting, or physical-device claim may bypass that lane.

> **Correction to the earlier merge checkpoint:** the former 242-entry working
> tree was reviewed and shipped coherently in `43aa7c7`. The current working tree
> has zero untracked files; do not route work through the historical inventory.

<!-- BEGIN:SUPERSEDED_242_FILE_CHECKPOINT
> **2026-08-13 merge and documentation checkpoint:** critical security,
> repository-hygiene, OG-image, analytics, and sharing work is now present on
> `origin/main` through merges `a312ce7` and `5289be5`. The curated mobile share
> path, Viber/Messenger, opaque attribution, and share tests are therefore not
> pending builds. A separate 242-entry working tree (145 modified, 5 deleted,
> 92 untracked at the documentation audit) remains local and must not be described
> as deployed or swept into one commit. The canonical queue is
> [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]];
> executed root work-order prompts have been retired after their evidence was
> consolidated into implementation records.

END:SUPERSEDED_242_FILE_CHECKPOINT -->

> **2026-08-08 execution-list consolidation:** this file remains the compact
> project/status context, but [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]]
> is now the only live task list. Do not execute older queue bullets here
> without reconciling them against that master and the current code/live state.

> **2026-08-11 controlled-pilot checkpoint:** payment controls remain inactive;
> sample property notifications now fail closed at the shared notification boundary;
> private cohort migration/operations and public sample-profile provenance are ready
> locally. Live credentials, migrations, deployment verification, tester enrollment,
> physical-device checks, and message delivery remain in Owner-Only Actions. True
> Light Mode is still open: desktop currently withholds its failed contrast state while
> mobile still exposes it, an explicitly documented inconsistency awaiting owner direction.

> **2026-08-09 browser and dependency checkpoint:** the production-mode
> Playwright matrix now contains 366 checks and finishes with **365 passed plus
> one intentional mobile skip** for the desktop-only PDF control. The five
> main-app production advisories are patched with targeted releases; its full
> npm audit is 0, build is 113/113, unit is 882/882, and lint is clean. Mission
> Control is independently patched on Next 15.5.23; both audits are 0, its
> 26/26-page build and lint pass, and all 10 staff security boundaries are green.
> Property tear-sheets now use a deterministic jsPDF brief instead of unbounded
> full-DOM rasterization, with real PDF-signature and Sharp optimizer contracts.
> All three location hubs now build as SSG with explicit one-hour revalidation;
> the conflicting Upstash `no-store` warning is resolved and regression-guarded.
> Live deployment and the Turnstile, cron, telemetry migration, Airtable, and
> real-device assistive-technology checks remain
> owner-gated in [[08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS|MASTER OWNER ACTIONS]].

> **What this file is:** the compact, always-current status checkpoint. It is not a task list and it does not replace [[00_LOGIC_HIERARCHY]]. For current work use the two canonical action files; for chronology use the historical [[15_IMPLEMENTATION_RECORDS/README|Implementation Records]] only when older session detail is genuinely needed.
>
> **The rule going forward:** update this file at the end of every session (or ask the AI to).
> Don't create a new sync file each time — that's exactly the proliferation this file exists to
> stop. See §6 for the exact update prompt.

# ScoutIt Master Sync

## 1. North Star

**200 real, approved property listings before normal subscription paywalls and
paid operations go live.** Before that threshold, premium features are free and
controlled by a Master Mission Control locker. ScoutIt must remain geography-
and category-flexible rather than hard-coding one launch city; promotion may
focus wherever useful inventory and demand develop.

> **Canonical launch execution update - corrected 2026-08-13:** scoutit.space is live and
> NEXT_PUBLIC_SITE_URL is verified. Paid-provider activation is still trigger-gated,
> and the invited pilot is **not complete**. Use
> [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]]
> for engineering order and
> [[08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS|MASTER OWNER ACTIONS]]
> for credentials, real-device checks, legal decisions, and external dashboards.
> [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] is implementation history, not the live queue.

## 2. Active Build Queue (top items, in order)

This table now mirrors [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]]. Completed historical
work remains recorded later in this file; it is not the current execution
queue. Update package state in the canonical plan first, then mirror it here.

| Order | Package | State | Canonical acceptance source |
|---|---|---|---|
| 1 | LR-01 — property URL and lifecycle safety | DONE | [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] LR-01 |
| 1b | LR-05 — auth, listing trust, PDF verification, and reproducible schema | DONE | [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] LR-05 |
| 2 | LR-02 — broker roster, visibility, and lead routing | DONE | [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] LR-02 |
| 3 | LR-03 — hybrid Connect wallet and server-side tiers | DONE | [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] LR-03 |
| 4 | LR-04 — two handshakes, chat closure, disputes, and retention | DONE | [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] LR-04 |
| 5 | MW-01 — Monthly Scout Wrap metric/event contract | DONE | [[MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN]] MW-01 |
| 6 | LR-06/LR-07 — analytics foundation and complete Monthly Scout Wrap | DONE | [[MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN]] |
| 7 | LR-08 — mobile polish and honest-data sweep | DONE | [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] LR-08 |
| 8 | Invited pilot and live verification | OPEN - code fixes, migrations, credentials, legal sign-off, and real-device checks remain | [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] + [[08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS|MASTER OWNER ACTIONS]] |
| 9 | LR-10/LR-11 — domain, paid infrastructure, and paid-mode activation | FOUNDER ACTION NEAR LAUNCH/AT 200 | [[FOUNDER_LAUNCH_BUDGET_CHECKLIST]] |

> **2026-08-02 LR-01 implementation checkpoint — DONE:** lifecycle-safe publish/update/withdraw/remove code, additive migration (`20260802000001_property_lifecycle_safety.sql`), server-gated off-market reads/contact, password re-authentication, mobile Danger Zone controls, unit tests (426/426), Playwright browser tests (4/4 passed), lint, and production build (102/102 routes) are complete. SQL migration executed by founder in Supabase. Live title edits remain locked until an immutable Airtable field or staff redirect migration path is deployed.

> **2026-08-02 LR-02 implementation checkpoint — DONE:** property-scoped representation state, deterministic roster routing, routed-deal recipient access, logged-out inquiry routing, property roster UI, unit tests (426/426), Playwright browser tests (4/4 passed), lint, and production build (102/102 routes) are complete. SQL migration `20260802000002_broker_representation_routing.sql` executed by founder in Supabase.

> **2026-08-02 LR-03 implementation checkpoint — DONE:** hybrid Connect wallet model, role-scoped monthly allowances, spend priority (monthly → purchased → reward), audit ledger schema, RPC wallet deduction, unit tests (427/427), Playwright browser tests (4/4 passed), lint, and production build (102/102 routes) are complete. SQL migration `20260802000003_connects_wallet_and_tiers.sql` executed by founder in Supabase.

> **2026-08-02 LR-04 implementation checkpoint — DONE:** Handshake #1 (Representation) vs Handshake #2 (Transaction) authority separation, Scout Rating restriction, read-only 7-day chat closure, 7-day message purge RPC with dispute legal holds, audit logging, unit tests (429/429), Playwright browser tests (2/2 passed), lint, and production build (102/102 routes) are complete. SQL migration `20260802000004_handshakes_and_chat_lifecycle.sql` executed by founder in Supabase.

> **2026-08-02 LR-05 implementation checkpoint — DONE:** auth hardening, PDF draft verification pre-publish gate, PRC license verification queue (`/api/admin/prc`), reproducible schema migration `20260802000005_auth_trust_and_pdf_verification.sql`, unit tests (431/431), Playwright browser tests (2/2 passed), lint, and production build (102/102 routes) are complete. SQL migration executed by founder in Supabase.

> **2026-08-02 LR-06 & LR-07 implementation checkpoint — DONE:** dedicated privacy-safe `analytics_events` telemetry table, salted SHA256 viewer key hashing, `/api/analytics` ingestion endpoint, `generate_monthly_scout_wrap` RPC, portfolio deduplication, unit tests (433/433), Playwright browser tests (2/2 passed), lint, and production build (103/103 routes) are complete. SQL migration `20260802000006_analytics_and_monthly_scout_wrap.sql` executed by founder in Supabase.

> **2026-08-02 LR-08 implementation checkpoint - historical evidence only:** the recorded mobile suite, unit suite, lint, and build passed at that checkpoint. This does **not** close LR-09 or the current pilot gate; later audits found additional code, migration, operational, and legal work in the canonical action files.

## 3. Decision Log (highlights — full log lives in [[00_START_HERE]] §6)

- 🆕 ✅ **2026-08-18 — Showcase Curation Invariant codified.** The `/showcase` (The Board)
  is ScoutIt's premier editorial and spatial showcase. It displays curated **Showcase
  Distinction & Merits** (Demand Standing, Inquiry Momentum, Curation Standard) — never
  raw technical specifications or generic data tables. Deep technical briefings live on the
  dedicated Property Page (`/property/[slug]`), accessed via the gold `Explore Full Briefing →`
  CTA. Every month, operators calibrate property merits per Master Action Plan §16. Invariant
  codified in [[00_SOP]] §2. → [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] §16
- 🆕 ✅ **2026-08-18 — 6-Layer Spatial Descent architecture documented.** The descent
  from orbit to core now has a standing specification: Layer 1 Orbit/Universe (`/layer/orbit`
  & `/showcase`), Layer 2 Stratosphere (`/layer/stratosphere`), Layer 3 Metropolis
  (`/layer/metropolis`), Layer 4 Crust (`/layer/crust`), Layer 5 Mantle (`/layer/mantle`),
  Layer 6 Core (`/layer/core` & `/property/[slug]`). Each layer has atmospheric telemetry,
  particle transitions, and altitude indicators. Per-rank cosmic periphery backgrounds
  (Universe, Cluster, Solar, Starry) shipped on the Showcase. →
  [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] §17
- 🆕 ✅ **2026-08-02 — full property and Connect lifecycle locked.** CSV, PDF,
  Build from Scratch, and Advanced Editor converge into one Property Review
  Workspace; Spatial Vault is an enhancement. Owners are the primary source of
  truth: owner-authored listings and edits publish directly after attestation,
  while only ScoutIt-created PDF drafts require source verification. Canonical
  URLs freeze on first publication. Withdraw creates recoverable, authenticated
  Cluster/Universe off-market inventory. Permanently Remove Listing is guarded
  and non-reactivatable but retains internal history, reserved URL, and
  ScoutIt-owned assets. Connects spend monthly → purchased → reward and are not
  automatically refunded on decline, non-response, or timeout. →
  [[SCOUTIT_FULL_WORKFLOW]]
- 🆕 ✅ **2026-07-30 — `core.fsmonitor` is OFF permanently in the main repo.** It was producing a
  **false-clean `git status`** — reporting an empty tree while 6 tracked files were modified and 2
  untracked. This repo is far below the size where fsmonitor pays for itself, and the failure mode
  (a green status that is lying) is indistinguishable from "nothing to commit" — the exact way an
  incomplete change set ships believing it was complete. Correctness beats milliseconds.
  ⚠️ It did **not** reproduce on every check, so it is intermittent: a passing spot-check proves
  nothing. Verify with `git hash-object <file>` vs `git rev-parse HEAD:<file>`.
  → [[01_IDENTITY_AND_VISION/NEW_IDEAS|NEW IDEAS]] **B4**
- 🆕 ✅ **2026-07-30 — Master Mission Control shipped in full, with owner approval.** Commit
  `0f28bc8` (local backup), migrations 0005–0007 applied, deployed live. The staff-publish field
  wipe (W3) is fixed in production. Corrections to the prior record: the repo **has** 2 commits
  (not zero) and has **no git remote at all**, so "commit + push" was never an option — and the
  actual blocker was a **build failure**, not the missing tables: `audit/actions.js` imported
  `@/lib/auditLog`, a module that does not exist. `logAction` was already in `@/lib/rbac` with the
  same signature; the fix was one import line, not a new file. ⚠️ Still no off-machine backup.
  → [[01_IDENTITY_AND_VISION/NEW_IDEAS|NEW IDEAS]] **B6**
- 🆕 ✅ **2026-07-30 — "Mission Control" now names exactly ONE product: the staff console.** The
  in-app surface is the **Enterprise Console** (`0872e88`). Two things shared the name, and the
  collision hid a real defect: the property section editor was mounted only in the MAIN app's
  dev-toolbox-only `MissionControlMode`, so **no staff member could reach it** — while the staff
  console has no Portfolio page at all. The editor was **moved to the staff console's CMS page**
  and verified against production. Mode IDs (`mc_staff`, `mc_enterprise`) stay as-is: they are
  persisted on profiles and asserted by e2e specs. → [[01_IDENTITY_AND_VISION/NEW_IDEAS|NEW IDEAS]] **B7**
- 🆕 ⚠️ **2026-07-30 — local `.env.local` Airtable credentials are STALE in both apps.** The
  main and mission-control values both 404, including the metadata endpoint. Production is fine
  (Vercel env vars). Consequence: anything run locally against Airtable silently talks to
  nothing, and a local test can look "clean" for the wrong reason.

- 🆕 ✅ **2026-07-30 — Units stay ONE ROW PER BUILDING.** The empty Airtable `UNITS` table was
  **deleted**. Airtable caps on **records, not columns**, and the free plan's 1,000-record limit is
  cumulative across the whole base — units-as-rows would make 100 units = 100 records and force the
  Team plan (~$20/seat/mo) before 200 listings. `Units_JSON` keeps 100 units = **1 record**.
  Reopens only for genuine cross-building unit search. → [[AIRTABLE_COMPRESSION_PLAN]] §5
- 🆕 ✅ **2026-07-30 — Airtable is NOT being compressed.** Audit found the base was already ~90%
  correctly wired (165/183 fields). The ~90 category fields are deliberately typed for filtering;
  collapsing them to JSON would destroy that and save nothing (billing is per record, and the base
  is at 186 of a **500**-field cap). The "readable for humans" half was solved in code instead →
  [[FIELD_REGISTRY_AND_KEY_ALIASES]]
- 🆕 🔴 **2026-07-30 — the SEO generator had NEVER worked.** `SEO_Title`/`SEO_Description`/
  `SEO_JSON_LD` were written and read by code but **did not exist in Airtable** → every run 422'd,
  and every property served a generic `<title>`. Fields created; feature unblocked.
- 🆕 ✅ **2026-07-30 — TWO Airtable write clients had diverged; FIXED.** The separate
  `mission-control/` app wrote only ~6 fields while the main app wrote ~90, so staff publishes
  silently left rent, GLA, grade and every other spec stale. The mapper was extracted to
  `propertyFieldMapping.js` and **vendored** into both apps, with a **drift test** that SHA-256s the
  copies and fails if they diverge. Files edited, **not committed** — `mission-control` keeps its
  no-commit rule. → [[MISSION_CONTROL_REAL_BUILD_STATUS]], W3
- 🆕 ✅ **2026-07-30 — freshness contradiction resolved (L2).** The 6 live listings were backfilled
  from Airtable's real `2026-07-03` date, so Supabase and Airtable finally agree. The other 14 were
  **deliberately left NULL**: `created_at` is when a record was typed, not when a human checked it,
  and writing it would fabricate a trust signal. ⏰ The **2026-08-02 cliff still arrives** — all 6
  flip to Re-Verification Due together. → [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] L2
- 🆕 ✅ **2026-07-30 — `Floor_Plans` now actually renders (F2).** A Cluster+ benefit owners could
  upload and the site could not display. It's an *attachment* field (array, not URL), so it renders
  as a gated thumbnail grid.
- ✅ **Price policy:** shown only in "Your Move," only when owner-verified. Never elsewhere.
- ✅ **Launch pricing:** confirmed numbers or nothing — no placeholder subscription prices go live.
- ✅ **Field Visibility Map signed off** 2026-07-02 — [[FIELD_VISIBILITY_MAP]] + the six
  `VISIBILITY_MAP__*` files are the operational source of truth.
- ✅ **`_SCOUTIT_BRAIN` is the canonical docs home** (2026-06-24) — root/`.claude`/`docs` copies are
  superseded, not authoritative.
- 🆕 **2026-07-08 vault reorg:** folder-numbering bug fixed (old duplicate `08_SECURITY` merged
  into [[09_SECURITY/README|09_SECURITY]]), `SEO_REPOS` vendored tools relocated to
  `12_EXTERNAL_TOOLS/`, every note given frontmatter + real `wikilinks`. See
  [[00_VAULT_CONVENTIONS]].
- 🆕 **2026-07-08 Dump migration — complete:** all 27 raw Dump files read in full across two
  passes, cross-checked against the brain, and either confirmed already-covered or cut into atomic
  notes. Added: [[SCENARIOS_AND_PLAYBOOKS]], [[MISSION_CONTROL_REAL_BUILD_STATUS]], [[SENTINEL_LAYER]],
  [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]], [[PROFESSIONAL_CRM_MODULE_MAP]], [[ENTERPRISE_MISSION_CONTROL_SPEC]],
  [[MISSION_KANBAN_AUTOMATIONS]], [[CRM_WORKFLOW_GRAVITY_AUTOMATIONS]], [[UNIFIED_SURFACE_TEST]],
  [[SECOND_BRAIN_FIVE_LEVELS]], plus two new [[01_IDENTITY_AND_VISION/NEW_IDEAS|NEW_IDEAS]] entries — all `status: draft`,
  **not yet owner-reviewed.** Raw source was fully migrated and pruned on 2026-08-13;
  `Dump/` is now empty. See [[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]].
- 🆕 **2026-07-13 — SCOUTIT OS ARCHITECTURE established:** New definitive guide on identity, roles, workspaces, and permissions created at [[SCOUTIT_OS_ARCHITECTURE]]. Firm rule: "One Person = One ScoutIt Account" with multiple concurrent roles, and Enterprise workspaces owning properties instead of individuals.
- 🆕 **2026-07-09 — Two build prompts written** ([[MISSION_CONTROL_REAL_BUILD_STATUS]],
  [[CRM_INITIATIVE]]), **then Mission Control's turned out to be moot:** a real,
  already-deployed Mission Control app was found at `ScoutIt/mission-control/` (RBAC core, User
  CRM, Property Review Queue, Audit Log, Feature Gates, Staff IAM, Badges, CSV import, Metrics —
  see [[MISSION_CONTROL_REAL_BUILD_STATUS]]). Its architecture (3-tier RBAC) is different from and
  better-grounded than the Dump blueprint. **The Mission Control build prompt is superseded, do
  not run it** — [[MISSION_CONTROL_REAL_BUILD_STATUS]] is now idea-reference only. The **CRM build
  prompt is unaffected** (different feature, lives in the main repo) — it has since been run, see
  the entry below.
- ✅ **Correction 2026-08-01:** `mission-control/` is tracked inside the main ScoutIt
  repository and has commit history; it is not a zero-commit nested repository. The operational
  rule remains unchanged: do not commit, push, or deploy without the owner's explicit go-ahead.
- 🆕 **2026-07-09 — Professional CRM v1 built, then independently verified against the actual
  diff** (not just the build session's own report — that report understated the security finding).
  [[CRM_INITIATIVE]] was run against the real main repo (not mission-control).
  **Built:** `crm_tasks` + `crm_activity_log` tables (⚠️ live but no migration file checked in), a
  Timeline engine, rule-based Listing Strength scoring, Broker mode's "Tactical Velocity"
  atmosphere, Owner mode dossier updates. **Genuinely fixed:** the real inquiries stub now
  persists + logs (verified clean); a buyer/owner role-resolution bug and a uuid type-crash bug in
  the deal routes; and `dashboard/crm/page.js` (the real Broker CRM page, confirmed to live in
  *this* repo, not mission-control) — it was collapsing every visitor onto the `master-dev`
  account's real deals, now fixed. 🔴 **NOT fixed, worse than first reported:** the server-side
  `mockOwnerId` fallback has no production env-gate and accepts *any* client-supplied ID as a real
  user — and the three brand-new CRM API routes this pass added use the exact same pattern. Full
  corrected writeup: [[09_SECURITY/README|Security]]. **Also found on review:** CRLF
  line-ending noise inflating ~15 unrelated files' diffs, and a stale `.git/index.lock`. **Correctly
  left alone:** `dealNotes` persistence — already fixed 2026-07-04 a different way
  (`deals.private_notes`). **Not committed or pushed** — working tree has the changes, several
  things (migration file, CRLF cleanup, the mockOwnerId pattern, the stale lock file) should be
  resolved before it is. See [[CRM_INITIATIVE]] §6 and [[CRM_INITIATIVE]]'s
  "Outcome" section for full detail.

- ✅ **2026-07-09 — combined review done, independently verified against real files.** The
  mockOwnerId gap is genuinely closed (17 routes, not the original 10 — see
  [[09_SECURITY/README|Security]]), the missing migration is genuinely written, and the CRLF
  cleanup genuinely worked. 🔴 **New blocker found during verification, not in the fix report: the
  git index is corrupt** (`bad index file sha1 signature`) — likely caused by the repeated manual
  index-refresh steps the fix pass ran. **Not data loss** — commit history and file content are
  intact, only git's staging bookkeeping is broken. Fix (safe, standard, does not touch working
  tree): delete `.git/index`, then run `git status` to let git rebuild it from HEAD. This sandbox's
  mount won't allow deleting that file — **needs to be done on the machine with real write access**
  before any `git add`/`commit` is attempted. Once that's done and `git status` shows the expected
  changes cleanly, the actual code (CRM build + security fix) is verified ready to review-and-commit.
- 🆕 **2026-07-09 — [[00_MASTER_SYNC]] written.** Covers the git index
  repair above, plus a real lockout-prevention check the security tightening made newly urgent:
  confirming the owner (jerzelguerra26@gmail.com) has a real, verified `role='admin'` account on
  the main site and a bootstrapped Tier 3 Super Admin row in Mission Control's `admin_users`
  table — the latter was already a known, undone setup gap per
  [[MISSION_CONTROL_REAL_BUILD_STATUS]]. Not yet run.
- 🆕 **2026-07-09 — deploy sequencing confirmed with owner:** nothing has been pushed to
  GitHub/Vercel yet for either the CRM build or the security fix, and MMC isn't in production yet
  either — so production is still on old code, meaning `master-dev` still works live today as a
  safety net. **Order locked in: bootstrap the real admin accounts first (§3–4 of
  [[00_MASTER_SYNC]]), verify they work, only then push/deploy the security
  fix.** Reversing that order would cut off the fallback before a tested real account replaces it.
- 🔴 **2026-07-09 — sign-up is completely broken on production, found while trying to follow the
  sequencing above.** `src/app/onboarding/page.js` (the site's only sign-up/sign-in page — no
  other exists) calls `src/lib/authClient.js`'s five auth functions with positional arguments;
  every one of those functions is defined to take a single object instead, so arguments get
  silently dropped, the real Supabase SDK throws, and users see a generic "Authentication failed."
  with no real detail. **Pre-existing, unrelated to the CRM/security work, has been live this whole
  session.** Fix (5 short function bodies) written into
  [[00_MASTER_SYNC]] §1 — must ship as its own isolated hotfix before
  anything else in that prompt (or any real signup) can proceed. **Fixed directly in the working
  tree and verified** (2026-07-09) — `src/lib/authClient.js` now matches its only caller's
  calling convention.
- 🆕 **2026-07-09 — signup blocked by a second, unrelated issue: SMTP misconfiguration**, found
  after the authClient.js fix. Confirmed via direct Supabase auth logs: `535 "Invalid username"`.
  Root cause: Auth → SMTP Settings has Resend configured with Username = `scoutit`, but Resend's
  SMTP relay requires the literal username `resend` (confirmed against Resend's own docs). Fix is a
  one-field dashboard change, not code — owner fixing directly. **Username fix confirmed working**
  (re-checked via fresh Supabase auth logs: error changed from `Invalid username` to
  `Authentication credentials invalid`) — now the SMTP Password field needs a valid, active Resend
  API key. **Resolved 2026-07-09** — owner signed up successfully on production after fixing both.
- 🆕 **2026-07-09 — new flow bug found post-signup, logged not fixed:** onboarding doesn't tell
  users email confirmation is required until the very last step, three steps too late — see
  [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] #7 for the exact cause and recommended fix shape. Not blocking (workaround:
  manually check email), queued for a future build prompt.
- 🆕 **2026-07-09 — third onboarding blocker, config not code:** Supabase Auth's **Site URL** is
  still set to `localhost:3000`, so confirmation email links redirect to a dead local address
  instead of `scout-it.vercel.app`. Immediate workaround: edit `localhost:3000` to
  `scout-it.vercel.app` in the confirmation link's URL, keep the `#access_token=...` fragment —
  Supabase's client auto-detects the session from it. Real fix: update Site URL (and Redirect
  URLs) in Supabase Dashboard → Authentication → URL Configuration. **Not fixable via available
  tools — dashboard-only, still needs the owner to do it.**
- ✅ **2026-07-09 — owner's real account bootstrapped, done directly via Supabase MCP (not a
  written prompt this time).** Real account confirmed: `jerzelguerra26@gmail.com`
  (`auth.users.id = 57a67739-a919-4141-a706-d943c82ac75c`). Found a **real, previously-unknown
  bug**: `user_profiles` had no `role` column at all, despite `admin/approve/route.js` checking
  `role !== 'admin'` — meaning property approval has been unreachable for literally everyone,
  always 403, this whole time, unrelated to anything else this session. Fixed: added `role text`
  column (additive migration `add_role_column_to_user_profiles`), set the owner's row to
  `role='admin'`, `subscription_tier='universe'`, `connects_balance=999`,
  `active_roles=['broker','owner','buyer','provider']`. 🔴 **Sharpened risk, not new:** the
  already-tracked `dev_all_user_profiles`/`Allow update on user_profiles` always-true RLS policies
  (see the RLS reset item at the top of this file) mean any user could self-grant `role='admin'`
  the same way right now — one more reason that reset is overdue, not a new problem.
- 🆕 **2026-07-09 — owner decision: push everything now, sign in and QA manually afterward**,
  rather than bootstrapping admin accounts first. [[00_MASTER_SYNC]] written as the
  single, self-contained prompt to run in a real terminal session — repairs the git index
  (sandboxed attempts hit a hard filesystem wall trying to write git's index on this mount and had
  to be abandoned, leaving harmless stray `index.hotfix*`/`index.readonly3` files to clean up),
  stages exactly the CRM+security+authfix scope, commits, pushes to `origin/main`. Admin bootstrap
  ([[00_MASTER_SYNC]] §3–5) is deferred until the owner actually needs
  admin-gated access. **✅ Since run — commit `ef5a8c1` landed and the git index is healthy again;
  every commit since (through `a1d0217`, 2026-07-11) has gone through cleanly. The git-index
  blocker above is fully resolved.**
- ✅ **2026-07-09 — RLS security reset done, executed directly via Supabase MCP** (migration
  `rls_security_reset_remove_permissive_policies`, project `yyixsuaimdzyiocswcgc`). This is the
  top-priority item that's been sitting open since 2026-06-26 — see [[09_SECURITY/README|Security]]
  for the full per-table breakdown. Short version: re-pulled the real policy list from live
  `pg_policies` (17 tables affected, 2 more than the original estimate), dropped every `dev_all_*`
  and "Allow public *" (`true`/`true`) policy, kept the real scoped policies already sitting
  underneath on most tables, added missing real `user_id = auth.uid()` policies where none existed
  (`privacy_settings`, `broker_profiles`, `researcher_profiles`), and fully locked
  `property_units`/`deal_messages`/`subscriptions` to service-role-only (confirmed via grep: zero
  legitimate client-side/anon-key access to any of the three). Bonus find while in there:
  `bounty_claims`'s "own claims" policies were misleadingly named — the actual check was just
  `auth.role() = 'authenticated'`, not ownership — fixed to a real `researcher_user_id = auth.uid()`
  check. `user_profiles`'s blanket public-read was narrowed to `is_profile_public = true` rather
  than dropped outright (the app has a real public-profile feature), with one honestly-flagged
  residual: RLS is row-level only, so a public profile's full row (including `role`,
  `connects_balance`) is still fetchable directly, not just the safe columns the UI selects — a
  proper fix needs a security-definer view, not done this pass. Verified clean via
  `get_advisors(type: security)`: the `rls_policy_always_true` warning is gone entirely.

- 🆕 **2026-07-09 (later) — shipped in three commits:** `ef5a8c1` (Professional CRM v1 + security
  hardening + the authClient hotfix — the FINAL_COMMIT_AND_PUSH scope), `42d200b` (9 seeded,
  `is_example_account`-flagged demo providers + live /researchers + /photographers directories),
  `a76b81a` (health check probed a nonexistent Airtable table — was permanently reporting 503 —
  plus roster card polish). Full detail: [[00_START_HERE]]'s handoff run + the memory notes.
- 🆕 **2026-07-10 — the dedicated E2E pass finally happened + hero rebuilt.** Permanent
  read-only-safe Playwright suite at `e2e_tests/full-system/` (now 83 tests × desktop + mobile; run
  `npx playwright test full-system`). It exposed that the 2026-07-05 "dead code cleanup" left
  consuming code pointing at deleted mocks (empty Board everywhere, 404 news teasers, empty
  /intel + /layer/stratosphere, self-crashing CMS catch block) — all fixed, plus new
  `src/lib/cmsCache.js` (60s cache, geocode memoization, serve-stale-on-error) now the one way
  routes read Airtable. Same day: raymarched golden black-hole hero shipped per the owner's
  Golden Horizon spec (`75b2384`, `1fbe181`) with a three-tier system — Balance (raymarched),
  Interactive (Golden Horizon simulator, 5-click UFO), Lite (off). See [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]]
  2026-07-10 block.
- 🆕 **2026-07-11 (morning) — pre-launch audit + role-dashboard sense audit, commit `d8388e9`:**
  gold-standard data verified, `image` fallback fix (8/10 live cards were gradient placeholders),
  /event-planners wired live (+3 owner-approved demo planners = 12 total), dead Tailwind gold
  glows fixed repo-wide (spaces inside arbitrary values silently kill the class), raw gold hex
  swept for tokens; then the Buyer/Owner/Broker coherence pass purged fake data (hardcoded
  "Miguel Torres" ID card, fake owner phone numbers, flattering 100% completeness rings, 404
  intel cards) — the **Honest Blank Rule** is now the standing dashboard pattern. See
  [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] 2026-07-11 blocks.
- 🆕 **2026-07-11 (afternoon) — full-role transaction rehearsal, commit `a1d0217`, NOT yet
  pushed:** owner's `/goal` — act as broker/owner/buyer with REAL accounts, complete one real
  transaction, verify the CRM makes sense. It worked end-to-end — but only after finding and
  fixing **14 real bugs**, several catastrophic: the entire real-user onboarding chain was broken
  (wrong role whitelist, upserts into non-existent columns, no wallet provisioning, no local
  session → infinite onboarding loop), broker pitching was 100% silently RLS-blocked (new
  `/api/deals/pitch` server route), owner-invited brokers were orphaned (raw name stored as
  `broker_id`), deal lists hardcoded every viewer as broker AND owner, internal property links
  used UUIDs the public page can't resolve, pitch notifications were promised in a comment but
  never sent, and the client Connects wallet double-charged on failures (now: spend locally only
  after server confirms, prefer server `newBalance`). Full detail: [[SESSION_HANDOFF_2026-07-11]].
- ✅ **2026-07-11 — dual-CMS drift RESOLVED with owner's explicit approval** (the item blocked
  since 2026-07-09): Supabase slugs renamed to match Airtable's computed ones
  (`one-ecom-center`/`two-ecom-center`), mirror rows created for the 2 Airtable-only live
  properties (Contact now works on all 3 previously-broken listings — verified), 3 e2e junk rows
  archived. **Root cause killed in code:** Airtable's `Slug` is a formula field; the publish
  route now reads the computed slug back on both update and insert paths and persists it to
  Supabase — Airtable is the single source of slug truth. Also: the real `Is_Example` checkbox
  now exists in Airtable BROKERS_CMS (created via the authenticated connector, checked on the 3
  demo brokers), and the empty nameless BROKERS_CMS record was un-published.
- 🆕 **2026-07-11 — verified working, closing an old item:** `/api/admin/approve`'s role check
  (documented broken 2026-07-03) was already fixed by the `4dbbd28` security pass and the owner's
  real account is `role='admin'` — property approval is reachable. No action needed.
- 🆕 **2026-07-11 (late) — owner-flow E2E found + fixed the wizard→Airtable spec-field drop, then
  built the Unit Master Page.** A faithful replay of the owner "list a property" flow proved every
  category/spec field an owner types was **silently dropped on Airtable sync** (editor writes
  `CM_Rent_Per_Sqm` keys; the sync only read camelCase) — fixed in `airtable.js` (editor-key alias
  table + typecast + comma-safe numbers + a photo-sync helper carrying Supabase-Storage URLs into
  Airtable). **Then built the Unit Master Page end-to-end** (§9.3): `property_units.details` +
  `subdivision_scenarios` jsonb (migration `add_unit_master_page_fields`), a rebuilt chaptered
  `UnitMasterPage.js` with the interactive "This space flexes" subdivision toggle + auto-estimated
  capacity + inherited macro-intel, a drill-in `UnitDetailsDrawer.js` owner editor + scenario
  manager, and gold "EXPLORE 3D SPACE ✦ / VIEW SUITE →" discovery teasers on parent Chapter 07
  (Commercial done; Residential parity TODO). Owner design rule: owner curates the valid cuts,
  buyers pick from them. AI 2D→3D engine DEFERRED (needs a raw-geometry vendor; generation is free/
  paywalled, only a commissioned pro model costs Connects). Verified live end-to-end; build green.
  **Not committed/pushed.** Full detail: [[SESSION_HANDOFF_2026-07-11]] §4.

## 4. Parked / Deferred (do not build without asking)

- **Enterprise Mode / multi-seat** — parked until the Supabase RLS reset is fully complete.
- **QuestIT** — a separate, standalone future platform; ScoutIt is its first customer, not the
  other way around. See `QUESTIT_FUTURE/README.md`.
- **AI Buyer Chatbot (Feature B)** — distinct from the PDF Concierge (Feature A); not started.
- **Full AI Council / Phase 2 Listing Engine** — deferred, high inference cost.
- **Always-on AI dashboard features** (live demand meters, AI property coaches) — repeatedly
  proposed by outside brainstorming, repeatedly parked by the owner as too costly pre-revenue. See
  [[SCENARIOS_AND_PLAYBOOKS]] and the anti-bloat doctrine in [[01_IDENTITY_AND_VISION/NEW_IDEAS|NEW_IDEAS]].

## 5. Open Decisions Needing the Owner (don't guess at these)

0. ✅ **Mission Control W3 divergence resolved.** The shared Airtable field mapping was committed
   in `8046b30`; both applications write the same field registry and the drift test guards it.
   Mission Control is tracked in the main repository, not a zero-commit nested repo. Deployment
   still requires explicit owner approval. → [[MISSION_CONTROL_REAL_BUILD_STATUS]]
0b. ✅ **`published_rent` ambiguity resolved 2026-08-02.** ScoutIt does not
   publish a scraped or ScoutIt-estimated rent. The public rent/price is the
   owner/lister-confirmed value; if uncertain, use an honest blank or Price on
   request. Treat the old field as the owner-confirmed rent concept rather than
   creating a second public market-price fact. → [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] L14
1. ✅ **Lexitary vs. internal-only AI Legal Council — resolved pragmatically 2026-07-09.** Both get
   built: internal AI Council is the real working path, Lexitary is a UI-only stub button
   ("somewhere to live") with the real API wired later. See [[MISSION_CONTROL_REAL_BUILD_STATUS]] §2
   and [[MISSION_CONTROL_REAL_BUILD_STATUS]] §3 page I.
2. ✅ **Wallet scope decided 2026-08-02; schema work remains.** Monthly grants
   are role-scoped. Purchased and reward balances are permanent and account-wide.
   The live one-wallet schema needs a migration and backfill that implements this
   hybrid model without duplicating permanent value.
2b. ✅ **Pre-200 Connect behavior decided 2026-08-02:** actions consume free
   monthly Connects for anti-spam and economy testing. Connect purchases remain
   disabled; Mission Control may grant/top up test allowances.
2c. ✅ **Post-handshake contact routing decided 2026-08-02:** before any
   accepted representation, new leads go to the uploader/lister. Once at least
   one broker is active, visible, and contactable, all new buyer leads go only to
   that broker roster and the owner stops receiving new direct leads. Locked,
   suspended, unavailable, or ended brokers do not appear on the listing and do
   not count as representation. If no qualifying broker remains, the property is
   simply unrepresented and follows the normal uploader/lister contact path—not
   a special fallback. Earlier leads remain with their original recipient.
2d. ✅ **Scout Rating event decided 2026-08-02:** rating credit occurs when
   buyer and broker complete ScoutIt's two-sided post-viewing transaction
   handshake. A private success with no completed ScoutIt transaction handshake
   receives no platform count or incentive. The separate owner–broker
   representation handshake never adds rating.
2e. ✅ **Geography decided 2026-08-02:** ScoutIt is Philippines-wide for now.
   Keep the product flexible within the country, but do not claim international
   support until foreign currency, law, address, and credential rules are designed.
2f. ✅ **Starry Seeker contact decided 2026-08-02:** Starry's one monthly
   Connect may contact a broker when the selected property has an accepted broker
   roster. Broker contact is not a Solar-only capability; higher tiers gain more
   allowance and intelligence rather than exclusive basic contact.
3. 🟡 **Tagline** — still undecided between the current line and a sharper "Philippine space.
   Decoded." direction.
4. ✅ **Launch order: security-first vs. build-CRM-first — moot as of 2026-07-11.** Both are done:
   the security hardening shipped 2026-07-09 (RLS reset + mockOwnerId gating) and CRM v1 + the
   full transaction chain are live-verified. [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] is historical now.
5. ✅ **Housekeeping done** — the empty leftover folders (`08_SECURITY/`, `10_CYBER_SECURITY/`,
   `_REVIEW_QUEUE/*`) are confirmed gone as of 2026-07-11. Same pass also: `Dump/` re-emptied
   (3 Blackhole hero specs archived — already consumed by the 2026-07-10 hero build, see
   `13_EXTERNAL_INPUTS/2026-07-11_blackhole-hero-dump-triage`), a root debug script with a
   hardcoded Supabase secret key moved into gitignored `scratch/` (it was untracked, never
   committed), empty `docs/` husk + `Untitled.canvas` removed, and the former handoff log's 71
   mojibake-corrupted lines repaired.

## 6. How to keep this file honest (the update ritual)

At the end of any working session — human or AI — update this file **in place**:

```
Update 00_MASTER_SYNC.md in place:
1. Reconcile current status against runtime code, verified live systems, and the two canonical action files.
2. Record newly locked decisions with a link to their canonical logic note.
3. Record newly parked work, owner blockers, and deployment evidence without creating duplicate checklists.
4. If files moved, regenerate folder MOC indexes and verify 00_LOGIC_HIERARCHY still reaches every owned note.
5. Do not create a new sync file. Put dated execution evidence in 15_IMPLEMENTATION_RECORDS.
```

If you're starting a *new AI session* (fresh chat, different tool), paste this instead:

```
Open _SCOUTIT_BRAIN/00_START_HERE.md, then read 00_MASTER_SYNC.md for current status.
Use 00_LOGIC_HIERARCHY.md to enter the relevant branch. Read the Master Action Plan
for engineering work or Master Owner Actions for founder work. Consult historical
handoffs only when current documents explicitly require older evidence.
```
