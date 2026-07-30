---
section: "00_META"
status: active
tags: [master-sync, north-star, build-queue, decision-log, always-current]
updated: 2026-07-30
related: ["[[SESSION_HANDOFF_2026-07-30]]", "[[00_START_HERE]]", "[[NEXT_DAY_HANDOFF]]", "[[PRE_LAUNCH_BUILD_LIST]]", "[[SCOUTIT_FIX_LIST]]", "[[13_EXTERNAL_INPUTS/README|External Inputs README]]"]
---

> ✅ **B1/B3/B4/B5 are CLEARED (2026-07-30, Claude Code).** The 2026-07-30 fixes are
> committed (`8046b30`), pushed, and **live on both Vercel projects** — verified in production,
> not just in a build log. The toolchain ran for the first time: **399/399 tests, build green,
> eslint 0 errors.**
>
> ✅ **B6 is CLEARED too (2026-07-30).** Owner approved the full ship. Master Mission Control is
> committed locally (`0f28bc8`), migrations 0005–0007 applied, and **deployed live** to
> `mission-control-sigma-one-89.vercel.app`. **Staff publishes no longer wipe listing specs.**
> The real blocker turned out to be a **build-breaking bad import**, not the missing tables —
> the project had never been built either.
>
> ✅ **B7 is CLEARED (2026-07-30) — and the premise was wrong.** The property section editor was
> in the **wrong app**: mounted only in a dev-toolbox-only surface no staff member can reach.
> It has been **moved to the staff console's CMS page**, and the full checklist was run against
> production (grouped/labelled sections, no duplicate fields, edit→save→reload persisted, saving
> one section left the others intact, restaurant shows no Commercial rows). Test value restored.
>
> ✅ **The "Mission Control" name collision is fixed.** That name now means exactly ONE thing:
> the staff console. The in-app surface is the **Enterprise Console**.
>
> 🔴 **All B-items are now closed.** Remaining open work is the pre-existing backlog (P1, P2,
> I1, I3, V-items, B8's two decisions, and the **2026-08-02 freshness cliff, B9**).

> **What this file is:** the one-page, always-current dashboard. Unlike [[NEXT_DAY_HANDOFF]] (a
> long, valuable, but ever-growing chronological log of every session), this file gets
> **overwritten in place** each session — not appended to. If you only read one file to know
> "where are we right now," read this one, then go deeper into [[NEXT_DAY_HANDOFF]] or the specific
> doc only if you need history or detail.
>
> **The rule going forward:** update this file at the end of every session (or ask the AI to).
> Don't create a new sync file each time — that's exactly the proliferation this file exists to
> stop. See §6 for the exact update prompt.

# ScoutIt Master Sync

## 1. North Star

**200 real, approved property listings before the subscriptions and Connects economy go live.**
One city, one category (residential) first. Prove the model, then expand. (Source:
[[PRE_LAUNCH_BUILD_LIST]], confirmed with the owner 2026-06-26 — still the standing target.)

## 2. Active Build Queue (top items, in order)

Pulled from [[PRE_LAUNCH_BUILD_LIST]] + [[SCOUTIT_FIX_LIST]] + [[NEXT_DAY_HANDOFF]]'s latest entry.
Update this list's status in place as items move — don't just append more.

| # | Task | Status | Source |
|---|---|---|---|
| 1 | Persistent Device Telemetry & Ingest API (`scout_did` UUIDs, search intent, friction tracking) | ✅ **Done 2026-07-30** — `src/lib/deviceTracker.js`, `<DeviceTracker />`, `/api/telemetry/device` pushed to `origin/main` | [[NEW_IDEAS]] 2026-07-30 |
| 2 | Master Mission Control Spatial Map & 30-Day History HUD (`<SecuritySpatialMap />`) | ✅ **Done 2026-07-30** — Dark Leaflet spatial map instance, 30-day time filters, search demand & friction drop-off HUD | [[NEW_IDEAS]] 2026-07-30 |
| 3 | Main Site Feature Flag Enforcement (`src/middleware.js`) | ✅ **Done 2026-07-30** — `global_read_only` maintenance switch, `ai_search` gate, and `deep_intel` gate active | [[NEW_IDEAS]] 2026-07-30 |
| 4 | 1-Click Audit Log Revert Engine (`/dashboard/audit`) | ✅ **Done 2026-07-30** — Staff `[Revert]` Server Actions for rolling back moderation status, IP bans, and verification states | [[NEW_IDEAS]] 2026-07-30 |
| 5 | Disputes Hub & RESA Law (RA 9646) Compliance Panel (`/dashboard/disputes`) | ✅ **Done 2026-07-30** — Double-blind dispute resolution workspace with RESA Law Sec. 29/31 compliance guidance | [[NEW_IDEAS]] 2026-07-30 |
| 6 | Security hardening completion (RLS tightening, input validation, `mockOwnerId` client-trusted-ID reads) | ✅ **Done 2026-07-09** — `mockOwnerId` gated in 17 routes, RLS permissive-policy reset executed and verified clean via advisor | [[NEXT_DAY_HANDOFF]] 2026-07-05 Part 2; [[VULNERABILITY_AUDIT_2026-06-26]] 2026-07-09 |
| 7 | Real-user signup → transaction chain (onboarding roles/columns/wallet/session, broker pitch, owner accept, buyer inquiry) | ✅ **Done 2026-07-11** — live 3-role rehearsal with real accounts found + fixed 14 real bugs, commit `a1d0217` (see [[SESSION_HANDOFF_2026-07-11]]) | this file §3 2026-07-11 |
| 8 | Dual-CMS slug drift (3 live properties' Contact broken) | ✅ **Done 2026-07-11** — data fixed with owner approval + publish route now syncs Airtable's computed Slug back, drift can't recur | [[SESSION_HANDOFF_2026-07-11]] |
| 8b | Shared Airtable write mapping (W3) + `Floor_Plans` wired (F2) | ✅ **Done 2026-07-30** — commit `8046b30`, live on both projects; `floorPlans` confirmed present in the production `/api/cms` response. ⚠️ **the staff-side half is still unshipped — see B6** | [[NEW_IDEAS_TO_CLAUDE_CODE]] B5 |
| 9 | Auto-Next Photo Carousel & High-Value SEO ALT Text (`UnitMasterPage.js`, `CommercialFlow.js`, `ResidentialFlow.js`) | ✅ **Done 2026-07-30** — 5s auto-advance, conflict-free Lightbox/hover guards, `▶ Auto` / `⏸ Auto` toggle, and rich SEO ALT metadata pushed to `origin/main` | User Request 2026-07-30 |
| 10 | CSV Bulk Importer — wire `/api/dashboard/bulk-insert` to real Supabase storage | Pending | [[PRE_LAUNCH_BUILD_LIST]] #1 |
| 11 | PDF Concierge (Feature A) — replace mock with real Gemini 2.5 Flash extraction | Pending | [[PRE_LAUNCH_BUILD_LIST]] #2 |

## 3. Decision Log (highlights — full log lives in [[00_START_HERE]] §6)

- 🆕 ✅ **2026-07-30 — `core.fsmonitor` is OFF permanently in the main repo.** It was producing a
  **false-clean `git status`** — reporting an empty tree while 6 tracked files were modified and 2
  untracked. This repo is far below the size where fsmonitor pays for itself, and the failure mode
  (a green status that is lying) is indistinguishable from "nothing to commit" — the exact way an
  incomplete change set ships believing it was complete. Correctness beats milliseconds.
  ⚠️ It did **not** reproduce on every check, so it is intermittent: a passing spot-check proves
  nothing. Verify with `git hash-object <file>` vs `git rev-parse HEAD:<file>`.
  → [[NEW_IDEAS_TO_CLAUDE_CODE]] **B4**
- 🆕 ✅ **2026-07-30 — Master Mission Control shipped in full, with owner approval.** Commit
  `0f28bc8` (local backup), migrations 0005–0007 applied, deployed live. The staff-publish field
  wipe (W3) is fixed in production. Corrections to the prior record: the repo **has** 2 commits
  (not zero) and has **no git remote at all**, so "commit + push" was never an option — and the
  actual blocker was a **build failure**, not the missing tables: `audit/actions.js` imported
  `@/lib/auditLog`, a module that does not exist. `logAction` was already in `@/lib/rbac` with the
  same signature; the fix was one import line, not a new file. ⚠️ Still no off-machine backup.
  → [[NEW_IDEAS_TO_CLAUDE_CODE]] **B6**
- 🆕 ✅ **2026-07-30 — "Mission Control" now names exactly ONE product: the staff console.** The
  in-app surface is the **Enterprise Console** (`0872e88`). Two things shared the name, and the
  collision hid a real defect: the property section editor was mounted only in the MAIN app's
  dev-toolbox-only `MissionControlMode`, so **no staff member could reach it** — while the staff
  console has no Portfolio page at all. The editor was **moved to the staff console's CMS page**
  and verified against production. Mode IDs (`mc_staff`, `mc_enterprise`) stay as-is: they are
  persisted on profiles and asserted by e2e specs. → [[NEW_IDEAS_TO_CLAUDE_CODE]] **B7**
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
  flip to Re-Verification Due together. → [[LOGIC_TO_TIGHTEN]] L2
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
  `12_EXTERNAL_TOOLS/`, every note given frontmatter + real `[[wikilinks]]`. See
  [[00_VAULT_CONVENTIONS]].
- 🆕 **2026-07-08 Dump migration — complete:** all 27 raw Dump files read in full across two
  passes, cross-checked against the brain, and either confirmed already-covered or cut into atomic
  notes. Added: [[SCENARIOS_AND_PLAYBOOKS]], [[MASTER_MISSION_CONTROL_BLUEPRINT]], [[SENTINEL_LAYER]],
  [[LAUNCH_SEQUENCE_PRIORITIES]], [[PROFESSIONAL_CRM_MODULE_MAP]], [[ENTERPRISE_MISSION_CONTROL_SPEC]],
  [[MISSION_KANBAN_AUTOMATIONS]], [[CRM_WORKFLOW_GRAVITY_AUTOMATIONS]], [[UNIFIED_SURFACE_TEST]],
  [[SECOND_BRAIN_FIVE_LEVELS]], plus two new [[NEW_IDEAS]] entries — all `status: draft`,
  **not yet owner-reviewed.** Raw files archived to `13_EXTERNAL_INPUTS/_DUMP_RAW_ARCHIVE/`;
  `Dump/` is now empty. See [[13_EXTERNAL_INPUTS/2026-07-08_dump-audit-and-migration|the migration log]].
- 🆕 **2026-07-13 — SCOUTIT OS ARCHITECTURE established:** New definitive guide on identity, roles, workspaces, and permissions created at [[SCOUTIT_OS_ARCHITECTURE]]. Firm rule: "One Person = One ScoutIt Account" with multiple concurrent roles, and Enterprise workspaces owning properties instead of individuals.
- 🆕 **2026-07-09 — Two build prompts written** ([[MASTER_MISSION_CONTROL_BUILD_PROMPT]],
  [[PROFESSIONAL_CRM_BUILD_PROMPT]]), **then Mission Control's turned out to be moot:** a real,
  already-deployed Mission Control app was found at `ScoutIt/mission-control/` (RBAC core, User
  CRM, Property Review Queue, Audit Log, Feature Gates, Staff IAM, Badges, CSV import, Metrics —
  see [[MISSION_CONTROL_REAL_BUILD_STATUS]]). Its architecture (3-tier RBAC) is different from and
  better-grounded than the Dump blueprint. **The Mission Control build prompt is superseded, do
  not run it** — [[MASTER_MISSION_CONTROL_BLUEPRINT]] is now idea-reference only. The **CRM build
  prompt is unaffected** (different feature, lives in the main repo) — it has since been run, see
  the entry below.
- 🔴 **Standing operational caution:** `ScoutIt/mission-control/` has **zero git commits** despite
  being deployed to Vercel. Do not `git add`/`commit`/`push` in that repo without the owner's
  explicit go-ahead, in this session or any future one.
- 🆕 **2026-07-09 — Professional CRM v1 built, then independently verified against the actual
  diff** (not just the build session's own report — that report understated the security finding).
  [[PROFESSIONAL_CRM_BUILD_PROMPT]] was run against the real main repo (not mission-control).
  **Built:** `crm_tasks` + `crm_activity_log` tables (⚠️ live but no migration file checked in), a
  Timeline engine, rule-based Listing Strength scoring, Broker mode's "Tactical Velocity"
  atmosphere, Owner mode dossier updates. **Genuinely fixed:** the real inquiries stub now
  persists + logs (verified clean); a buyer/owner role-resolution bug and a uuid type-crash bug in
  the deal routes; and `dashboard/crm/page.js` (the real Broker CRM page, confirmed to live in
  *this* repo, not mission-control) — it was collapsing every visitor onto the `master-dev`
  account's real deals, now fixed. 🔴 **NOT fixed, worse than first reported:** the server-side
  `mockOwnerId` fallback has no production env-gate and accepts *any* client-supplied ID as a real
  user — and the three brand-new CRM API routes this pass added use the exact same pattern. Full
  corrected writeup: [[VULNERABILITY_AUDIT_2026-06-26]]. **Also found on review:** CRLF
  line-ending noise inflating ~15 unrelated files' diffs, and a stale `.git/index.lock`. **Correctly
  left alone:** `dealNotes` persistence — already fixed 2026-07-04 a different way
  (`deals.private_notes`). **Not committed or pushed** — working tree has the changes, several
  things (migration file, CRLF cleanup, the mockOwnerId pattern, the stale lock file) should be
  resolved before it is. See [[CRM_INITIATIVE]] §6 and [[PROFESSIONAL_CRM_BUILD_PROMPT]]'s
  "Outcome" section for full detail.

- ✅ **2026-07-09 — combined review done, independently verified against real files.** The
  mockOwnerId gap is genuinely closed (17 routes, not the original 10 — see
  [[VULNERABILITY_AUDIT_2026-06-26]]), the missing migration is genuinely written, and the CRLF
  cleanup genuinely worked. 🔴 **New blocker found during verification, not in the fix report: the
  git index is corrupt** (`bad index file sha1 signature`) — likely caused by the repeated manual
  index-refresh steps the fix pass ran. **Not data loss** — commit history and file content are
  intact, only git's staging bookkeeping is broken. Fix (safe, standard, does not touch working
  tree): delete `.git/index`, then run `git status` to let git rebuild it from HEAD. This sandbox's
  mount won't allow deleting that file — **needs to be done on the machine with real write access**
  before any `git add`/`commit` is attempted. Once that's done and `git status` shows the expected
  changes cleanly, the actual code (CRM build + security fix) is verified ready to review-and-commit.
- 🆕 **2026-07-09 — [[GIT_REPAIR_AND_ADMIN_BOOTSTRAP_PROMPT]] written.** Covers the git index
  repair above, plus a real lockout-prevention check the security tightening made newly urgent:
  confirming the owner (jerzelguerra26@gmail.com) has a real, verified `role='admin'` account on
  the main site and a bootstrapped Tier 3 Super Admin row in Mission Control's `admin_users`
  table — the latter was already a known, undone setup gap per
  [[MISSION_CONTROL_REAL_BUILD_STATUS]]. Not yet run.
- 🆕 **2026-07-09 — deploy sequencing confirmed with owner:** nothing has been pushed to
  GitHub/Vercel yet for either the CRM build or the security fix, and MMC isn't in production yet
  either — so production is still on old code, meaning `master-dev` still works live today as a
  safety net. **Order locked in: bootstrap the real admin accounts first (§3–4 of
  [[GIT_REPAIR_AND_ADMIN_BOOTSTRAP_PROMPT]]), verify they work, only then push/deploy the security
  fix.** Reversing that order would cut off the fallback before a tested real account replaces it.
- 🔴 **2026-07-09 — sign-up is completely broken on production, found while trying to follow the
  sequencing above.** `src/app/onboarding/page.js` (the site's only sign-up/sign-in page — no
  other exists) calls `src/lib/authClient.js`'s five auth functions with positional arguments;
  every one of those functions is defined to take a single object instead, so arguments get
  silently dropped, the real Supabase SDK throws, and users see a generic "Authentication failed."
  with no real detail. **Pre-existing, unrelated to the CRM/security work, has been live this whole
  session.** Fix (5 short function bodies) written into
  [[GIT_REPAIR_AND_ADMIN_BOOTSTRAP_PROMPT]] §1 — must ship as its own isolated hotfix before
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
  [[E2E_TEST_FIX_LIST]] #7 for the exact cause and recommended fix shape. Not blocking (workaround:
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
  rather than bootstrapping admin accounts first. [[FINAL_COMMIT_AND_PUSH_PROMPT]] written as the
  single, self-contained prompt to run in a real terminal session — repairs the git index
  (sandboxed attempts hit a hard filesystem wall trying to write git's index on this mount and had
  to be abandoned, leaving harmless stray `index.hotfix*`/`index.readonly3` files to clean up),
  stages exactly the CRM+security+authfix scope, commits, pushes to `origin/main`. Admin bootstrap
  ([[GIT_REPAIR_AND_ADMIN_BOOTSTRAP_PROMPT]] §3–5) is deferred until the owner actually needs
  admin-gated access. **✅ Since run — commit `ef5a8c1` landed and the git index is healthy again;
  every commit since (through `a1d0217`, 2026-07-11) has gone through cleanly. The git-index
  blocker above is fully resolved.**
- ✅ **2026-07-09 — RLS security reset done, executed directly via Supabase MCP** (migration
  `rls_security_reset_remove_permissive_policies`, project `yyixsuaimdzyiocswcgc`). This is the
  top-priority item that's been sitting open since 2026-06-26 — see [[VULNERABILITY_AUDIT_2026-06-26]]
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
  read-only-safe Playwright suite at `e2e_tests/full-system/` (71 tests × desktop + mobile; run
  `npx playwright test full-system`). It exposed that the 2026-07-05 "dead code cleanup" left
  consuming code pointing at deleted mocks (empty Board everywhere, 404 news teasers, empty
  /intel + /layer/stratosphere, self-crashing CMS catch block) — all fixed, plus new
  `src/lib/cmsCache.js` (60s cache, geocode memoization, serve-stale-on-error) now the one way
  routes read Airtable. Same day: raymarched golden black-hole hero shipped per the owner's
  Golden Horizon spec (`75b2384`, `1fbe181`) with a three-tier system — Balance (raymarched),
  Interactive (Golden Horizon simulator, 5-click UFO), Lite (off). See [[E2E_TEST_FIX_LIST]]
  2026-07-10 block.
- 🆕 **2026-07-11 (morning) — pre-launch audit + role-dashboard sense audit, commit `d8388e9`:**
  gold-standard data verified, `image` fallback fix (8/10 live cards were gradient placeholders),
  /event-planners wired live (+3 owner-approved demo planners = 12 total), dead Tailwind gold
  glows fixed repo-wide (spaces inside arbitrary values silently kill the class), raw gold hex
  swept for tokens; then the Buyer/Owner/Broker coherence pass purged fake data (hardcoded
  "Miguel Torres" ID card, fake owner phone numbers, flattering 100% completeness rings, 404
  intel cards) — the **Honest Blank Rule** is now the standing dashboard pattern. See
  [[E2E_TEST_FIX_LIST]] 2026-07-11 blocks.
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
  [[SCENARIOS_AND_PLAYBOOKS]] and the anti-bloat doctrine in [[NEW_IDEAS]].

## 5. Open Decisions Needing the Owner (don't guess at these)

0. 🆕 🟡 **Commit the `mission-control` fix?** (added 2026-07-30) The W3 divergence is **fixed in
   files** — both apps now write the same ~90 fields, guarded by a drift test. But that repo carries
   the standing *"no git commits yet, do not push without go-ahead"* rule, so the fix is sitting
   uncommitted. **The only decision left is whether to commit and deploy it.** Until then, staff
   publishes in production still write 6 fields. → [[MISSION_CONTROL_REAL_BUILD_STATUS]]
0b. 🆕 🟠 **Is `published_rent` the same fact as `CM_Rent_Per_Sqm`?** (added 2026-07-30) Unanswerable
   from the code — only whoever built the Listing Engine knows. Guessing wrong **merges two facts
   and hides one**, so it's deliberately left unmapped meanwhile. → [[LOGIC_TO_TIGHTEN]] L14
1. ✅ **Lexitary vs. internal-only AI Legal Council — resolved pragmatically 2026-07-09.** Both get
   built: internal AI Council is the real working path, Lexitary is a UI-only stub button
   ("somewhere to live") with the real API wired later. See [[MASTER_MISSION_CONTROL_BLUEPRINT]] §2
   and [[MASTER_MISSION_CONTROL_BUILD_PROMPT]] §3 page I.
2. 🟡 **The `role` column gap** — docs describe per-role Connects wallets; the live
   `connect_balances`/`connect_transactions` tables have no `role` column at all (one wallet per
   person, today). Add the column with a real backfill plan, or formally drop "per-role wallets"
   from the docs to match reality. Flagged 2026-07-02, still open.
3. 🟡 **Tagline** — still undecided between the current line and a sharper "Philippine space.
   Decoded." direction.
4. ✅ **Launch order: security-first vs. build-CRM-first — moot as of 2026-07-11.** Both are done:
   the security hardening shipped 2026-07-09 (RLS reset + mockOwnerId gating) and CRM v1 + the
   full transaction chain are live-verified. [[LAUNCH_SEQUENCE_PRIORITIES]] is historical now.
5. ✅ **Housekeeping done** — the empty leftover folders (`08_SECURITY/`, `10_CYBER_SECURITY/`,
   `_REVIEW_QUEUE/*`) are confirmed gone as of 2026-07-11. Same pass also: `Dump/` re-emptied
   (3 Blackhole hero specs archived — already consumed by the 2026-07-10 hero build, see
   `13_EXTERNAL_INPUTS/2026-07-11_blackhole-hero-dump-triage`), a root debug script with a
   hardcoded Supabase secret key moved into gitignored `scratch/` (it was untracked, never
   committed), empty `docs/` husk + `Untitled.canvas` removed, and NEXT_DAY_HANDOFF's 71
   mojibake-corrupted lines repaired.

## 6. How to keep this file honest (the update ritual)

At the end of any working session — human or AI — update this file **in place**:

```
Update 00_MASTER_SYNC.md:
1. Move any completed Build Queue item's status to Done, and pull the next item up from
   PRE_LAUNCH_BUILD_LIST.md / SCOUTIT_FIX_LIST.md if the queue is getting short.
2. Add any new locked decision to §3 (one line, link to the full doc).
3. Add anything newly parked to §4, anything newly blocking-on-owner to §5.
4. Do NOT create a new dated sync file. Overwrite this one. NEXT_DAY_HANDOFF.md is still the
   place for the long-form session narrative if you want to keep that habit too.
```

If you're starting a *new AI session* (fresh chat, different tool), paste this instead:

```
Read _SCOUTIT_BRAIN/00_MASTER_SYNC.md first — that's the current state. Then read
NEXT_DAY_HANDOFF.md's most recent entry only if you need more detail on how we got here. Confirm
the North Star, the top 3 Active Build Queue items, and anything in Open Decisions, then tell me
you're ready.
```
