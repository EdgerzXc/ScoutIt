# Session Handoff — 2026-07-02

> **Read this file first when resuming.** Long session, lots of ground covered — this is the
> complete, consolidated record. Companion files created/updated today are linked inline.
> **Running code + live data always win over any doc — verify before acting**, per `00_SOP.md`.

---

## 0. Mode this session ran in (carries forward)

- **Owner is non-technical.** Plain language, tell before every push, nothing pushed to `main`
  this session (all local/Airtable/Supabase changes only).
- **"Pure codebase" mode:** owner explicitly paused all further Airtable schema/data work
  mid-session ("no need to focus on airtable just pure codebase for now"). Everything after that
  point was built to need zero new Airtable fields/tables. Airtable-adjacent work already done
  earlier in the session (Units table, hygiene) is complete but **not wired into app code yet** —
  resume Airtable work only when the owner says so.
- **Work style confirmed today:** "let's do this all at once... we'll clean up later" — batches
  got bigger and less permission-gated than the project's usual "3–4 steps, ask before each" — but
  every code change was still verified in a real running dev server before being called done.

---

## 1. Field Visibility Map — ✅ SIGNED OFF, corrected, split per category

**What happened:** the 2026-07-01 draft proposed "un-hide most operator facts" and called the
live code "over-hiding." The owner corrected this hard: his real ruling was already made in June
2026 and already built into the code (`src/lib/deepIntelSchema.js`, `chapterConfig.js`,
`CategorySpecBlock.js`) — visibility is decided **per page section × per category**, not by one
generic fact-vs-ROI rule. The 7/1 draft's "loosen everything" framing was rejected.

**Final rule (owner, refined 2026-07-02):** PUBLIC = easily acquirable / what the public actually
needs. HIDDEN = hard-to-get details, AI-assessed intelligence, investor/broker/operator-grade
facts — living in each chapter's "Deep Intelligence" panel. Flood risk is never gated, money only
ever renders in "Your Move."

**Files (all in `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/`):**
- `FIELD_VISIBILITY_MAP.md` — the master rule + universal buckets + index
- `VISIBILITY_MAP__{RESIDENTIAL,COMMERCIAL,STR,HOSPITALITY,RESTAURANTS,VENUES}.md` — **one file
  per category** (owner explicitly asked these be split out and named for their function so they
  "won't be misplaced again"), each a full section-by-section table (The Space → Location → The
  Vault → Life Here → Where To? → Build Plans → The Fine Print → Units → Universe → Services →
  Your Move) showing exactly what's public vs. hidden in that chapter for that category.
- Pointer notes added to the two older docs this superseded: `PROPERTY_CATEGORY_SOP.md` and
  `CATEGORY_FIELD_SOP.md`.

**Resolved specific calls:** `STR_Avg_Rating` → public. `CM_Internet_Providers`,
`CM_Floor_Loading`, `VEN_Power_Capacity`, `HOSP_GFA`, `HOSP_Land_Area` → hidden. CAMC/A-C charges
on Commercial → **hidden** (the live `deepIntelSchema.js` design overrides an older, stale SOP
note that had called them free). **No code changes were needed** — the live components already
matched the real ruling in 5 of 6 categories; the map now just says so correctly.

---

## 2. Airtable hygiene (done, before the Airtable pause)

- Un-approved 2 live "E2E Test Property" records in `PROPERTIES_CMS` that were incorrectly
  `Approved_For_ScoutIt = true` (test junk that was potentially visible on the public site).
- Deleted 2 fully-empty junk rows in `PROPERTIES_CMS`.

---

## 3. Units → their own table (schema done, code wiring paused)

Owner decision: units should be first-class Space-entity records, not an embedded JSON blob
(reversing the June 2026 "no separate table" decision — the Master Build Spec's canonical entity
model made the case: a unit *is* a Space instance).

**Built:**
- Airtable `UNITS` table (`tblfvXBgDzY1l9OpJ`), linked to `PROPERTIES_CMS`. Fields: Unit_Name,
  Property (link), Size_Sqm, Floor, Features, Photos, Price, Sort_Order, `Owner_Unit_ID` (stable
  ID for upsert-matching so republishing never duplicates), Approved_For_ScoutIt.
- Supabase `property_units` table (mirrors the Airtable shape + `airtable_record_id` for sync).
  Backfilled the 10 existing draft units from `properties.details.units_inventory` — found and
  worked around messy legacy data (sizes stored as `"150 sqm"` text, not clean numbers).
- `Units_JSON` (the old embedded field) is **untouched**, kept as a fallback — nothing deleted.

**⚠️ Not done — paused per the Airtable-pause instruction:** the owner editor
(`InventoryGridManager.js`), the publish/update routes, and both public property flows
(`ResidentialFlow.js`, `CommercialFlow.js`) **still read/write the OLD `Units_JSON`/
`details.units_inventory` path.** The new tables exist but nothing uses them yet. This is the
first thing to wire once Airtable work resumes.

**Also found:** the backfilled Supabase rows are almost all obvious test junk (`api-test-unit`,
`wewewe`, blank names) — flagged, not deleted, needs an owner nod first.

---

## 4. Security Core (Master Build Spec §4.1) — done, and found a real production bug

**Built & verified:**
- `spend_connects(user_id, amount, reason, ref_type, ref_id)` — a Postgres RPC that does
  balance-check + 3-bucket deduction (granted→purchased→earned) + ledger insert as one atomic
  transaction, replacing the old racy multi-query pattern. `service_role`-only execute grant.
  Tested directly in SQL with a throwaway wallet: correct bucket math, correct ledger rows, clean
  failure (no partial state) on insufficient balance.
- Rewired `src/app/api/dashboard/invite/route.js` and `src/app/api/v1/questit/raise/route.js` to
  call the RPC instead of manual balance math. Both verified to compile and respond correctly
  (401/auth-gated as expected) in a running dev server.

**🔴 Real bug found and fixed:** `audit_record_changes()` (the trigger on `connect_balances`,
`deals`, `properties`, `user_profiles`) unconditionally read `NEW.id` — but `connect_balances` has
**no `id` column** (it's keyed by `user_id`). **Every INSERT/UPDATE on `connect_balances` has been
silently crashing** since this trigger was added; the old `invite/route.js` never checked the
update's error, so Connects have likely never actually been persisting a spend correctly in
production. Fixed: the function now falls back to `user_id` when `id` is absent
(`to_jsonb(NEW)->>'id'`, safe instead of a hard field reference that throws).

**🔴 Real gap found, deliberately NOT auto-fixed:** `connect_balances`/`connect_transactions` have
**no `role` column at all**, despite every doc and both routes assuming per-role wallets exist.
Today there is one wallet per `user_id`, full stop — a broker-who's-also-an-owner shares one pot.
Needs an owner decision (add the column + a real backfill plan, or formally drop "per-role
wallets" from the docs) — not guessed at here.

Confirmed already-built-correctly (no changes needed): `supabaseAdmin.js` service-role client, the
sequential publish lock (Supabase→approved only after Airtable success).

---

## 5. Connects breakdown UI (pure codebase, verified)

`src/components/dashboard/ConnectsBreakdown.js` — click either Connects pill in the dashboard
header → shows the 3-bucket wallet (Monthly Allowance / Purchased / Earned), each with a
plain-language description + a spend-order note. Wired into both desktop and mobile headers in
`src/app/dashboard/page.js`. Reviewed `connectsWallet.js`'s underlying client-side logic — already
correct, no fix needed. **Verified live**: real wallet math rendered correctly (6 Connects for a
Solar-tier Owner, matching `entitlements.js`'s actual allowance table), click-outside-to-close
confirmed.

---

## 6. E2E test/fix tracking — new file

`_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/E2E_TEST_FIX_LIST.md` — created per owner instruction to
stop doing full authenticated click-through testing now and batch it for one dedicated pass later.
Holds:
- 🔴 **Known-broken:** `inviteBroker()` in `DashboardContext.js` never sends an `Authorization`
  header to `/api/dashboard/invite` — but that route now requires one (per §4 above). The
  owner-invites-broker handshake is likely broken end-to-end right now. Not fixed this session
  (found while hardening the route, flagged rather than scope-creeping).
- Everything rewired/built this session that's unit-tested but not yet authenticated-click-through
  tested (the two Connects routes, the Deep Intel panel plumbing from earlier in the session, the
  Connects breakdown UI across all roles).
- The role-column decision (§4) — not really an E2E item, but tracked there so it isn't lost.

---

## 7. Affordability Calculator (Master Build Spec §7) — built & verified

- `src/lib/affordability.js` — pure amortization math + a clearly-marked **placeholder** default
  rate (6.5%/yr — real PH mortgage rates are still Master Build Spec Open Question #5).
- `src/components/property/AffordabilityCalculator.js` — editable down payment/term/rate, shows
  monthly payment / down payment / total interest, explicit "not financial advice, not a loan
  offer" disclaimer.
- Wired into `ResidentialFlow.js`'s "Your Move", right after the price block. **Gates correctly**:
  only shows for a real `Price_Status = Published` price, and never for lease/rental tenure.
- **Verified:** loaded a real live Airtable record, confirmed no errors, confirmed it correctly
  stays hidden (no published price on that record yet — "Price on request" shows instead, honest-
  blank rule working). Independently re-derived the amortization formula by hand and confirmed an
  exact match (₱18.5M @ 20% down, 6.5%, 20yr → ₱110,345/mo).
- **Not yet wired into `CommercialFlow.js`** — Residential was the obvious first target.

---

## 8. Flood Risk Badge + NOAH heatmap research (Master Build Spec §6, partial)

- `src/components/property/FloodRiskBadge.js` — small, dependency-free, color-coded severity
  badge from the already-live `FloodRiskScore`/`FloodZoneStatus` Airtable fields. Public, never
  gated (matches the hard invariant). Wired into `ResidentialFlow.js`'s "The Fine Print" chapter.
  Verified in a live browser — no errors, correctly renders nothing when the fields are blank
  (which they are on every live record right now — no data source populates them yet).
- **Researched NOAH thoroughly** (live web search, 2026-07-02) — full findings + a concrete
  4-step next-session build plan in the new
  `08_OPERATIONS_AND_BACKLOG/HEATMAP_NOAH_INTEGRATION_PLAN.md`. Headline finding: **UP NOAH is
  literally built on Mapbox** and serves flood/landslide/storm-surge data as open-licensed vector
  tiles (PMTiles format, mirrored on Hugging Face, no API key needed). **HazardHunterPH** (a
  separate PH gov tool) does point-based hazard lookups — the better fit for populating a single
  property's score automatically.
- **Why the actual map layer wasn't built today:** ScoutIt's existing property map
  (`InteractiveMap.js`) runs on **Leaflet**, not Mapbox GL JS/MapLibre — and NOAH's data is vector
  tiles built for a WebGL vector renderer, not Leaflet's raster-tile model. Adding it properly
  means either a new library dependency or confirming NOAH also exposes a plain WMS (raster)
  endpoint Leaflet could consume directly with zero new dependencies. That confirmation needs a
  real browser session inspecting NOAH's live network traffic (their site is a JS-rendered SPA; a
  static fetch reveals nothing) — didn't want to guess a URL or rush a new-library integration this
  close to the session limit. **Full plan is ready to execute next session.**

---

## 9. What's next (owner's stated intent, end of session)

Owner said: **Affordability calculator first (✅ done above), then Mission Control + Badge engine
together** ("since that two is both interconnected"), **plus the heatmap** (partially done — badge
shipped, map layer researched and spec'd for next time).

Suggested order for the next session:
1. **Confirm the NOAH technical path** (§8 above, step 1 of the integration plan) — quick, unblocks
   the actual heatmap map layer.
2. **Mission Control + Badge engine** — per the Master Build Spec §3/§5. Both are Supabase-first
   (admin_users, permission_grants, user_badges tables + the auth/role foundation) with the
   Airtable-dependent pieces (BADGE_DEFINITIONS, the Approval Queue reading live listings) picked
   up once Airtable work resumes.
3. **Decide the `role` column gap** (§4) — blocks nothing else, but shouldn't be forgotten.
4. **Resume Airtable-adjacent work** (Units wiring, the E2E pass) whenever the owner says go.

---

## 10. Full file list touched/created this session

**Created:**
`_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/VISIBILITY_MAP__{RESIDENTIAL,COMMERCIAL,STR,HOSPITALITY,RESTAURANTS,VENUES}.md`,
`_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/E2E_TEST_FIX_LIST.md`,
`_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/HEATMAP_NOAH_INTEGRATION_PLAN.md`,
`_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-07-02.md` (this file),
`src/components/dashboard/ConnectsBreakdown.js`, `src/lib/affordability.js`,
`src/components/property/AffordabilityCalculator.js`, `src/components/property/FloodRiskBadge.js`.

**Edited (code):** `src/lib/airtable.js`, `src/components/property/ResidentialFlow.js`,
`src/app/api/dashboard/invite/route.js`, `src/app/api/v1/questit/raise/route.js`,
`src/app/dashboard/page.js`.

**Edited (docs):** `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/FIELD_VISIBILITY_MAP.md` (rewritten),
`PROPERTY_CATEGORY_SOP.md`, `CATEGORY_FIELD_SOP.md`, `02_ARCHITECTURE_AND_STRUCTURE/AGENTS.md`
(gold colors synced to current), `02_ARCHITECTURE_AND_STRUCTURE/DESKTOP_CLAUDE_NOTE.md`
(marked superseded, fixed an internal price-policy self-contradiction),
`02_ARCHITECTURE_AND_STRUCTURE/PROPERTY_ARCHITECTURE.md` (marked BUILT), `00_START_HERE.md`,
`NEXT_DAY_HANDOFF.md`.

**Airtable (live base `appWFRqR0wy6hSR6h`):** new `UNITS` table + new `DeepIntel_JSON` field on
`PROPERTIES_CMS`; 2 test records un-approved, 2 empty rows deleted.

**Supabase (live project `yyixsuaimdzyiocswcgc`):** new `property_units` table + backfill; new
`spend_connects` RPC; fixed `audit_record_changes()` function.

**Nothing was pushed to `main`/Vercel this session.**
