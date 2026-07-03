# ScoutIt Handoff - End of Session

> ## ▶️ RESUME HERE (latest) — 2026-07-03, Part 7 — impeccable pass shipped; 2 new initiatives captured
> **Property page design pass via `/impeccable` is done and live** — 2 P0s (accessible chapter
> tabs, Vault tier-name bug + illustrative-content labeling), 2 P1s (CSP `frame-src` gap, the new
> "breathing gold glow" primary-CTA rule), a P2 (URL-synced chapter deep-linking), and a P3
> (Location fact-list chunking). Applied to both `ResidentialFlow.js` and `CommercialFlow.js`.
> Commits `893dfd0` → `0e52c05`, all pushed. Full detail: `08_OPERATIONS_AND_BACKLOG/
> SESSION_HANDOFF_2026-07-03.md` Part 7 (top of file).
>
> **Owner then shared two new initiatives (source: `2 Core Ideas.docx`) — captured as docs only,
> nothing built yet:**
> - `03_DESIGN/DASHBOARD_ATMOSPHERE_FRAMEWORK.md` — mandatory dashboard structure (Identity →
>   Status → **Scout Insight** → Workspace → Role Atmosphere) + per-role ambient differentiation.
>   Owner's own read: the dashboard "looks plain" — this is the framework for fixing that, not a
>   generic polish pass.
> - `08_OPERATIONS_AND_BACKLOG/CRM_INITIATIVE.md` — "relationship intelligence, not contact
>   management," framed through the owner's Workflow Gravity strategic lens. Real
>   proto-infrastructure already exists (`deals` table, `BrokerMode.js` Deal File Workspace,
>   `/api/deals/*`) — one concrete gap flagged (deal notes aren't persisted to Supabase yet).
>
> **Next real step for either:** a dedicated scoping/planning conversation with the owner — both
> docs end with open decision questions, not a build plan. They likely interlock for Broker mode
> specifically (Scout Insight ≈ CRM follow-ups) — recommend one combined planning pass.
>
> ## Previous — 2026-07-03, Part 6 — Part 5 verified + fixed + LIVE
> **Part 5's four unverified items are now all verified, fixed where needed, and pushed live**
> (commit `9aab743`, both `scoutit.vercel.app` and `scout-it.vercel.app` — confirmed `READY` on
> both Vercel projects, spot-checked `200` on the live domains). Full detail in
> `08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-07-03.md`'s Part 6 section (top of file).
>
> Also built this session: **one fully-populated "gold standard" master property per category**
> (public + hidden-intel + vault data, real Mapbox geocoding, real Matterport/Luma embeds, real
> NOAH flood risk) — see `04_DATA_AND_SCHEMA/MASTER_PROPERTIES_GOLD_STANDARD.md`. **Do not delete
> those 6 records.** Found and fixed 5 real pre-existing bugs along the way (2 platform-wide,
> affecting every listing of that type, not just the new ones) — full list in that doc's §3.
>
> **Next up (owner's stated direction):** a design pass using the `impeccable` tool
> (github.com/pbakaus/impeccable, installed as a Claude Code plugin at
> `~/.claude/plugins/marketplaces/impeccable`) to raise the visual polish of the property pages.
> Not started yet — no design work has been done against it.
>
> ## Previous — 2026-07-03, Part 5 — READ THE FULL PROMPT, NO SHORTCUTS
> **Owner's explicit instruction this session, read literally:** load full context — the real
> `obsidian-second-brain` vault (not skimmed), this whole file, `00_START_HERE.md`, and
> `08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-07-03.md` **in full** — before writing any code.
> Coding mistakes this session (an invented "50-year" flood dataset, a QuestIT gap briefly
> misdiagnosed as unbuilt when a real schema already existed) came directly from acting on partial
> context instead of checking the real current state first. This is now a standing rule, saved to
> memory (`working-style-and-deploys.md`).
>
> **Read `08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-07-03.md`'s Part 5 section (at the top)
> in full before touching anything** — it lists four pieces of work (footer/enterprise page,
> Mission Control dev-preview, NOAH historical flood ranges, 6 master mock properties) that were
> either built-but-never-verified-in-a-browser or entirely blocked, because of a tool outage that
> hit mid-session. None of it is safe to assume works. Verify each one for real before building
> anything further on top of it, and definitely before committing/pushing.
>
> Everything through commit `c9c17dd` (Unit Delegation, Track 1 Notifications, the QuestIT
> correction, and 5 E2E test fixes) **is real, verified, and already pushed live** to both
> `scoutit.vercel.app` and `scout-it.vercel.app` — that part is solid ground to build from.
>
> ## Previous — 2026-07-03, Part 2
> Unit Delegation (§9) was **built and E2E-verified end-to-end**, not just planned — schema, real CRUD
> replacing the old JSON blob, the delegation handshake, the Operator dashboard, and the Unit
> Master Page. Found + fixed 2 real pre-existing bugs along the way (a silently-broken
> buyer→broker Connect spend; an Airtable Slug field that became computed and was breaking every
> new-property insert) + a 3rd found-but-not-fixed one (`/api/admin/approve`'s role check is
> broken — documented, not patched). Data docs (`DATA_DICTIONARY.md`, `FIELD_VISIBILITY_MAP.md`,
> `SCOUTIT_MASTER_BUILD_SPEC.md §9.4`) updated to match. A follow-up conversation produced a full
> **approved plan** for: Mission Control (staff, separate deployment) + Enterprise accounts
> (external client companies, main site, explicitly parked on the RLS reset) + self-serve
> analytics (on hold pending real instrumentation) + notifications (incl. broker-on-change
> alerts) + Google Sign-In (blocked on needing a debit card for Google Cloud billing).
>
> ## Previous — 2026-07-02, Part 3
> **Read `08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-07-02_PART3.md`**, then Part 2, then
> Part 1 if you need earlier context — same day, three continued sessions. Part 3 highlights: a
> real E2E pass (using a genuinely fresh Supabase Auth user, not a seeded profile) found + fixed a
> **third** real production bug — no `user_profiles` row was ever auto-created on signup, silently
> blocking badges *and* Connects for every new real user; the **NOAH flood heatmap got fully built
> and verified** (`FloodHeatmapMap.js`, MapLibre GL JS + `pmtiles`, points directly at the
> Hugging-Face-hosted data via HTTP range requests, no re-hosting needed), which surfaced two more
> real bugs along the way (a CSP gap that was *already* silently breaking a pre-existing map
> component too, and a flex-layout bug collapsing the map container); and a long design
> conversation about **co-working operators (KMC/WeWork-style) delegating units** is now written up
> in `SCOUTIT_MASTER_BUILD_SPEC.md §9` — corrects an externally-pasted AI proposal that would have
> resurrected the deprecated JSON-blob unit pattern, and resolves the "one company, three roles"
> identity problem by reusing three already-spec'd mechanisms instead of inventing new ones. Next:
> a design-skill pass on the Owner/Operator dashboard UI. Read Part 3 in full before continuing.
>
> **Part 2 highlights (2026-07-02, same day, earlier):** fixed the `inviteBroker` auth bug; found +
> fixed a real production bug (`user_profiles` never had a `badges` column); found the real
> **`SCOUTIT_MASTER_BUILD_SPEC.md` — now copied into the repo** (`_SCOUTIT_BRAIN/
> SCOUTIT_MASTER_BUILD_SPEC.md`), was Desktop-only before, a repo-only search missed it once; built
> the Badge Engine's `user_badges` table per that real spec (§5.2) after an earlier wrong jsonb
> attempt was corrected before any real data existed; confirmed **Mission Control per the real spec
> is a standalone Next.js app that hasn't been built yet** (NOT the existing Airtable Interface);
> confirmed the NOAH heatmap technical path (self-hosted PMTiles is the only sound path, later
> refined in Part 3 to "point at the CDN directly, no re-hosting needed"); corrected the
> role-column docs instead of half-building an unspecified refactor; found RLS effectively
> disabled on 15+ tables platform-wide (flagged with a precise table list, not fixed).
>
> **Original 2026-07-02 session (Part 1), condensed below:**
>
> **Field Visibility Map: ✅ SIGNED OFF by owner 2026-07-02.** The 2026-07-01 draft ("un-hide
> operator facts") was rejected — the owner's real per-section × per-category ruling was already
> built in code (`src/lib/deepIntelSchema.js` + `chapterConfig.js` + `CategorySpecBlock.js`).
> Source of truth is now:
> - `04_DATA_AND_SCHEMA/FIELD_VISIBILITY_MAP.md` — the rule + universal buckets + index
> - `04_DATA_AND_SCHEMA/VISIBILITY_MAP__{RESIDENTIAL,COMMERCIAL,STR,HOSPITALITY,RESTAURANTS,VENUES}.md`
>   — one per category, per-section tables (what's public vs the Deep Intelligence panel per chapter)
>
> **Done this session (2026-07-02):**
> 1. Airtable hygiene: un-approved the 2 live "E2E Test Property" records, deleted 2 empty rows.
> 2. Added `DeepIntel_JSON` field to `PROPERTIES_CMS` (mirrors `Units_JSON` pattern) so records can
>    actually carry hidden-intel values instead of every panel showing "Not recorded" forever.
> 3. Wired `src/lib/airtable.js` to parse `DeepIntel_JSON` → `property.deepIntel` (expanded so both
>    `DI_`-key lookups (DeepIntelWidget) and label lookups (CategorySpecBlock's MinorLockSection)
>    resolve from one JSON blob) + a `category` field for `DEEP_INTEL_SCHEMA[...]` lookups.
> 4. Fixed `ResidentialFlow.js`'s `DeepIntelWidget`/blur-teaser to accept both plain-label and
>    `{key,label}` field formats (CommercialFlow already did; Residential didn't) — **needs a
>    preview verify before this is considered done, see below.**
> 5. Doc consistency pass: `PROPERTY_CATEGORY_SOP.md` + `CATEGORY_FIELD_SOP.md` now point to the
>    new visibility maps; `DESKTOP_CLAUDE_NOTE.md` (had a direct self-contradiction — "prices are
>    shown" vs "no prices anywhere on the platform") marked SUPERSEDED with corrections inline;
>    brain-copy `AGENTS.md` gold values synced to current (`#E8AE3C` etc, was still on old
>    `#FFB800`); `PROPERTY_ARCHITECTURE.md` marked BUILT (was reading like a pending refactor).
>
> **Also done (2026-07-02, Master Build Spec Security Core + Units-as-own-table):**
> 6. **New `UNITS` Airtable table** (`tblfvXBgDzY1l9OpJ`, linked to `PROPERTIES_CMS`) + new
>    Supabase `property_units` table — units are now first-class Space-entity records, not an
>    embedded JSON blob. Backfilled the 10 existing draft units from `details.units_inventory`.
>    `Units_JSON` stays as a deprecated fallback field — **not deleted**. ⚠️ **Not yet wired**:
>    the owner editor, publish/update routes, and both public flows still read/write the OLD
>    JSON path. Wiring those 5 files is its own next batch.
> 7. **🔴 Found + fixed a real production bug:** `audit_record_changes()` (the trigger on
>    `connect_balances`/`deals`/`properties`/`user_profiles`) unconditionally read `NEW.id` —
>    but `connect_balances` has no `id` column (keyed by `user_id`). **Every INSERT/UPDATE on
>    connect_balances has been silently crashing** since this trigger was added; the old
>    `invite/route.js` never checked the update's error, so Connects likely never actually
>    decremented in practice. Fixed: the function now falls back to `user_id` when `id` is
>    absent (`to_jsonb(NEW)->>'id'`, safe instead of a hard field reference).
> 8. **🔴 Also found:** `connect_balances` and `connect_transactions` have **no `role` column**
>    in the live database, despite every doc (and both API routes' `.eq('role', ...)` filters)
>    assuming per-role wallets exist. Today there is ONE wallet per `user_id`, full stop — a
>    broker-who's-also-an-owner shares one pot, not two. This is a real gap between the
>    documented design (`TIER_DISTINCTION.md` "per-role Connects wallets") and reality.
>    **Deliberately not auto-fixed** — adding the column means deciding what role to backfill
>    onto existing rows, which is a real judgment call, not a mechanical migration. Flagged for
>    the owner, not guessed at.
> 9. **Built + tested `spend_connects(user_id, amount, reason, ref_type, ref_id)` RPC** — atomic
>    balance-check + 3-bucket deduction (granted→purchased→earned) + ledger insert in one
>    transaction. `service_role`-only execute grant (never callable by a client directly).
>    Verified with a throwaway wallet: correct bucket math, correct ledger rows, and a clean
>    raised exception (no partial state) on insufficient balance.
> 10. **Wired both live Connects-spending routes** (`api/dashboard/invite`, `api/v1/questit/raise`)
>     to call the RPC instead of the old racy read-then-write pattern. Both verified to compile
>     and respond correctly (401/auth-gated as expected) via a running dev server — full
>     authenticated click-through is deferred to the owner's planned E2E test pass.
>
> **Also done (2026-07-02, later same session) — Connects breakdown UI:**
> 11. `src/components/dashboard/ConnectsBreakdown.js` — click either Connects pill in the
>     dashboard header to see the 3-bucket wallet (Monthly Allowance / Purchased / Earned),
>     each with a plain-language description + a spend-order note. Verified live in a running
>     dev server with real wallet math (not placeholders). Reviewed `connectsWallet.js`'s
>     underlying logic while doing this — it's already correct, nothing needed fixing there.
>
> **Also done (2026-07-02, later same session) — Affordability Calculator (Master Build Spec §7):**
> 12. `src/lib/affordability.js` (pure math: `calculateMortgage`, `parsePriceToNumber`, a clearly
>     marked PLACEHOLDER `MORTGAGE_DEFAULTS` pending Open Question #5's real PH rates) +
>     `src/components/property/AffordabilityCalculator.js` (the UI: editable down payment /
>     term / rate, outputs monthly payment / down payment / total interest, disclaimer that
>     it's illustrative only — not advice, not a loan offer). Wired into `ResidentialFlow.js`'s
>     "Your Move" section, right after the price block.
>     **Gates correctly:** renders only when `Price_Status = Published`, a real numeric price
>     parses out, and `Tenure` isn't a lease/rental (mortgage math doesn't apply to renting).
>     **Verified:** loaded a real, live, approved Airtable residential record
>     (`high-street-glass-penthouse`) — no console/server errors, and the calculator correctly
>     stayed hidden because that record has no `Price_Status="Published"` yet (honest-blank rule
>     working as designed — "Price on request" showed instead). Independently re-derived the
>     amortization formula from scratch and confirmed it matches `calculateMortgage()`'s output
>     exactly (₱18.5M @ 20% down, 6.5%, 20yr → ₱110,345/mo). **Not yet wired into
>     `CommercialFlow.js`** — Residential was the obvious first target; can add there too if
>     wanted. Real numbers will only ever appear on properties that have both a real published
>     price AND (once resumed) real Airtable data — nothing here required touching Airtable.
>
> **⭐ Owner instruction (2026-07-02): all E2E-test/verification items are tracked in their own
> file now — `08_OPERATIONS_AND_BACKLOG/E2E_TEST_FIX_LIST.md`.** Skip that pass for now; keep
> building the Master Build Spec (pure codebase — Airtable work is explicitly paused until the
> owner says otherwise). That file also holds the one already-known-broken item (`inviteBroker()`
> missing its Authorization header, found while hardening the invite route).
>
> **Not yet done — flagged, don't touch without asking:**
> - **Decide the `role` column gap** (§8 above) — add it to `connect_balances`/`connect_transactions`
>   with a real backfill plan, or formally drop "per-role wallets" from the design docs to match
>   reality. Either is fine; guessing is not.
> - Wire the new `UNITS`/`property_units` tables into the editor + publish/update routes + both
>   public flows (§6 above) — **paused, Airtable-adjacent work is on hold** per today's instruction.
> - `INTEL_CMS.SpaceCategory` orphan "Culinary" choice — Airtable UI-only deletion (API can't) — paused.
> - The 10 `ZZ_DEPRECATED_*` columns / consolidation cleanup — paused (Airtable).
> - Populate real `DeepIntel_JSON` + Units data on real listings — paused (Airtable), see
>   `E2E_TEST_FIX_LIST.md` #4.
>
> _(Notes below are prior history and remain valid background.)_

> ### 🆕 2026-06-29 — QA Council, Lighthouse Performance, and Skills Integration
> - **Lighthouse Optimization:** Eliminated a major render-blocking bottleneck by removing global imports of `mapbox-gl.css`. Map components now handle styling efficiently, drastically improving Largest Contentful Paint (LCP) and Speed Index metrics.
> - **QA Council Orchestration:** Created `.agents/skills/qa-council/SKILL.md` to automate website health checks. It successfully runs Lighthouse CI and Playwright E2E tests and reports findings into markdown artifacts.
> - **Skills Repository Expansion:** Integrated `kepano/obsidian-skills` for documentation workflows, along with `petrkindlmann/qa-skills` and `PramodDutta/qaskills` into the `.agents/skills` repository to empower future automated audits.
> - **E2E & React Diagnostics:** Identified that `InteractiveMap` components trigger `Maximum update depth exceeded` loops via `useEffect`. E2E tests (`owner-deep-intel-flow`) are stable (6/6 passing) despite this warning, but addressing this React loop is priority #1 for the next sprint to reduce TTI.

> ### 🆕 2026-06-29 — Units editor rebuild + save-crash fix (most recent work)
> - **Fixed a silent prod crash:** `/api/dashboard/update` was 500-ing on every save because
>   `isomorphic-dompurify` (→ jsdom) throws `ERR_REQUIRE_ESM` under Next 16 serverless. Edits looked
>   saved then reverted on refresh. `src/lib/sanitize.js` is now dependency-free; `update`,
>   `bulk-insert`, `waitlist` routes use it. **Never import a DOM sanitizer in an API route.**
> - **Unit editor rebuilt** → `src/components/dashboard/InventoryGridManager.js` (`/dashboard/inventory/[id]`):
>   Floor field, floor-grouping, search, bulk-add, duplicate, live counts, tier-gated photos (free 1 / pro 5).
> - **Save UX:** animated Save button (idle → Saving… → Saved ✓ → idle); `updateListing()` returns a real boolean.
> - **Public render wired:** `ResidentialFlow.js` + `CommercialFlow.js` now render owner **features** + **floor**
>   and resolve unit photos from `photos[]`/`image`.
> - Details in: `02_ARCHITECTURE_AND_STRUCTURE/WEBSITE_ARCHITECTURE.md §7`,
>   `04_DATA_AND_SCHEMA/DATA_DICTIONARY.md §3`, `UNITS_HANDOFF_2026-06-22.md` (top).
> - **Open:** confirm publish/approve copies `units_inventory` → Airtable `Units_JSON` so units show on the
>   public page (pending Supabase-only properties still show synthesized fallback units).
>
> _The notes below are from the prior (2026-06-28) UnitBuilder session and remain valid history._

---

### What We Accomplished
1. **Unit Builder UI (`UnitBuilder.js`)**
   - Built a dynamic units/spaces inventory builder inside the listing intake flow.
   - Tied it directly as Step 3 in `LiveEditorWorkspace.js` before publishing.

2. **Freemium Gating on Units**
   - Configured uploader limits so Free tier users (Starry) can only upload **1 photo** per unit.
   - Pro tier users (Solar, Cluster, Universe) can upload up to **5 photos** per unit.

3. **Resolved Vercel Build Blocker**
   - Fixed a double declaration of `currentPhotos` in `PhotoUploader.js`.
   - Escaped double quotes inside `UnitBuilder.js` to clear strict ESLint rules that were causing Vercel compilation to exit with code 1. The build is now fully green and active!

4. **Fixed Supabase Photo Upload Error (Invalid Compact JWS)**
   - Identified that the `NEXT_PUBLIC_SUPABASE_ANON_KEY` was using the new non-JWT publishable key format, which caused the Supabase Storage API to crash when expecting a JWT. 
   - Replaced it with the legacy JWT anon key in `.env.local`.

5. **Updated Architecture Docs**
   - Deeply expanded `WEBSITE_ARCHITECTURE.md` to cover all Dual-CMS strategies, Connects, monetization rules, and design details.

## Current State of the Codebase:
- The owner dashboard wizard now has a fully functioning 3-step listing flow with unit details.
- Photo uploads work locally using the legacy JWT anon key.
- Next.js compiles and builds locally and on Vercel with zero linting or syntax errors.

## What's Next (Deployment & Vercel Sync):
1. **GitHub Commit**: Push the latest changes to your repository. Note: `.env.local` is ignored by Git, which is correct and safe!
2. **Vercel Environment Variables**: You **MUST** go to your Vercel Dashboard -> Settings -> Environment Variables, and change the `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the legacy JWT key. If you leave the `sb_publishable_` key in Vercel, photo uploads will still break in production!
3. **Airtable Sync verification**: Confirm that `units_inventory` array properly stringifies and synchronizes with the `Units_JSON` column in Airtable when published, and that it displays correctly in property templates.

## Prompt for Next Session
```text
Hey! We are continuing work on ScoutIt, a premium commercial and residential real estate directory. 

CRITICAL FIRST STEP: Before doing *anything* else, you must familiarize yourself with this project so you aren't flying blind. 
1. Read `_SCOUTIT_BRAIN/00_START_HERE.md` to get the master overview.
2. Read `_SCOUTIT_BRAIN/NEXT_DAY_HANDOFF.md` and `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-06-28.md` to see exactly where we left off.
3. Briefly scan the other architecture and schema docs in `_SCOUTIT_BRAIN/` to understand the Dual-CMS (Airtable + Supabase) architecture and design system.

I have committed the code to GitHub and updated the Vercel environment variables with the legacy JWT anon key to fix the photo upload JWS error. 

Let's begin by testing the new Unit Builder flow in production/local. We need to verify that when an owner adds a unit with photos and publishes, the units_inventory array gets correctly pushed to Airtable's Units_JSON column and loads on the public property page. Let's create an integration test plan for this sync flow!
```
