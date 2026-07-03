# Session Handoff — 2026-07-01 · Master Build Spec kickoff + Field Visibility Map (Step 0)

> Resume point for the next session (even a brand-new chat). Everything we decided on
> 2026-07-01 is here. Pairs with the live memory and `NEXT_DAY_HANDOFF.md`.

---

## 0. ⚠️ FIRST — READ THE WHOLE `_SCOUTIT_BRAIN` FOLDER. NO SHORTCUTS. (owner instruction)

Before doing ANY work or writing ANY code, read **every** doc in `_SCOUTIT_BRAIN/` in the
order given by `00_START_HERE.md` — Identity → Architecture → Design → Data & Schema →
Automations → Monetization → Features & Flows → Operations & Backlog → Security → Schematics.
Also read `00_SOP.md`, `00_COUNCIL.md`, this handoff, and `NEXT_DAY_HANDOFF.md`. **Do not
skim, do not shortcut.** The owner is explicit: understand the *whole* of ScoutIt first.
Then cross-check docs against the **live code + live Airtable base** — running code and live
data win over any doc; flag conflicts to the owner instead of guessing.

**Owner context:** non-technical — explain in plain language, go slow, tell him before any
push. Never push to `main`/Vercel without his say-so. See memory `working-style-and-deploys`.

---

## 1. What this session was

Owner shared **`SCOUTIT_MASTER_BUILD_SPEC.md`** (on his Desktop:
`C:\Users\jerze\OneDrive\Desktop\SCOUTIT_MASTER_BUILD_SPEC.md`) — the post-reset priority
queue: Mission Control dashboard, Badge engine, backend security hardening, Heatmap schema,
Affordability calculator. We did NOT write code — this was context-building, verification,
and planning only. Mid-session the owner added a new priority (**field visibility**) that
becomes **Step 0**.

---

## 2. The Master Build Spec (read it in full next session)

8 sections: (0) instructions for Claude, (1) open questions, (2) canonical entity model
(root = **Space**, not Property; 6 roots: Space/Identity/Listings/Intelligence/Trust/Economy;
data is the primary moat), (3) Mission Control dashboard (separate Next.js app, Supabase
**magic-link** admin auth), (4) backend security & ingestion, (5) badge engine, (6) heatmap
schema, (7) affordability calculator, (8) build order. Confirmed IDs: base `appWFRqR0wy6hSR6h`;
old Mission Control Airtable interface `pbdyvI1PCjfhxUH5V` is being **retired** (build the
custom dashboard instead).

---

## 3. Settled decisions (owner rulings, 2026-07-01)

1. **Security split** — do the *additive* safety pieces now (they can't lock anyone out);
   the big Auth/RLS server-side lockdown stays the **deferred single overhaul, done LAST**
   (reconciles the spec's "security early" with the parked-overhaul rule). Mission Control,
   being a brand-new admin app, gets proper login from day one.
2. **Co-owner role** — full parity with Owner **EXCEPT `team_access.manage`** (only the
   super-admin/Owner controls who has access & permissions).
3. **AccessibilityScore = ConvenienceScore** — reuse the existing field; do NOT duplicate.
4. **Field visibility rule** (the big one) — see §4.
5. **Open Question #6** (staff-field filtering) — **no work needed**: `src/lib/airtable.js`
   uses an allow-list normalizer, so internal fields (`PriceRange_Internal`,
   `Broker_Input_Notes`, `AI_Draft_Notes`, `Pipeline_Status`, `Verification_Status`) are
   already excluded by omission.

---

## 4. ⭐ STEP 0 — Field Visibility Map (the main deliverable this session)

**Owner's rule (verbatim intent):** being AI-generated does NOT make something non-factual.
The free/paid line is by **content**, not source:
- **PUBLIC (white text, free):** every hard *fact* — physical specs, **all-in costs**
  (rent + CAMC + A/C + dues), operator/technical details, location, developer, and **risk**
  (flood/hazard is NEVER gated). AI or owner/team can author it — doesn't matter.
- **HIDDEN INTEL (gold text, paid):** only **ROI/return metrics** (Cap Rate, NOI, ADR,
  Occupancy, RevPAR) + **deep analytical intel** (comfort/light/privacy feel-scores,
  convenience/heatmap scores). Solar+ for intel; **Cluster+** for Vault media (3D/360/drone).
  Owner can author these too, not only AI.
- **INTERNAL (never public):** drafts, notes, pipeline/verification state, price-internal,
  control flags.

**Single source of truth created:** `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/FIELD_VISIBILITY_MAP.md`
(status: **DRAFT — pending owner sign-off**). It has the full per-category Public/Hidden/Internal
lists + the code-reconciliation checklist.

**Root problem it fixes:** the two schema docs conflict — `CATEGORY_FIELD_SOP.md` (current,
looser: facts free) vs `PROPERTY_CATEGORY_SOP.md §8` (older, stricter). The **live code**
(`src/components/property/CategorySpecBlock.js`) follows the **stricter** one, so it
**over-hides** — e.g. on Commercial it blurs 11 fields (CAMC, A/C Charges, A/C System,
Reserved Parking, Escalation, Fit-out, Rent-free, Parking Ratio, Backup Power, Available
Units, Towers/Zones) that the ruling says are **public**. Same pattern in Restaurants/Venues
("Engine Room / Back of House") and STR/Hospitality. Only true ROI numbers (Cap Rate, NOI,
ADR, RevPAR) stay hidden. **This is why the owner saw "only some is public."** (Note: a lot of
apparent emptiness is also just **missing data** — most fields on the ~8 live listings are
blank; Mission Control is meant to fix that.)

**Live-verified via dev tier (Playwright/preview):** white value = public, gold value =
hidden intel. Confirmed on `/property/one-ecom-center`.

**3 borderline calls defaulted to PUBLIC (owner may veto next session):**
`CM_Internet_Providers`, `CM_Floor_Loading`, `VEN_Power_Capacity` (operator *facts* → public).
`STR_Avg_Rating` kept **hidden** (signal, not hard fact). Descriptive text
(NoiseLevel/CeilingHeight/Ventilation) = public; only numeric feel-scores are hidden.

---

## 5. Airtable verification (live base `appWFRqR0wy6hSR6h`, checked 2026-07-01)

- **Every table the spec relies on already exists:** PROPERTIES_CMS, INTEL_CMS, BROKERS_CMS,
  HOMEPAGE_CMS, Subscription Tiers, SERVICE_PROVIDERS, L1_BOARD, L2_CATEGORIES, L3_COLLECTIONS,
  L6_ABOUT, FEATURE_GATES, CONNECT_COSTS, CONNECT_PACKS, BOUNTIES, REACTION_TAGS,
  **PROPERTY_BROKERS**.
- **Only 2 NEW tables to create** (when we reach those steps): `BADGE_DEFINITIONS` (§5) and
  `CONFIG_MORTGAGE_DEFAULTS` (§7). Create via the Airtable connector.
- **PROPERTY_BROKERS** exists with the exact fields the Disputes page needs (Role, Status,
  Initiated_By, Authority_Source, Handshake_Connect_Spent, dates). Intended split:
  Airtable PROPERTY_BROKERS = public relationship/status; Supabase `deals` = live ledger.
  ⚠️ **Verify the `deals` → PROPERTY_BROKERS sync exists** before building Disputes, else it
  starts empty.
- **All the score fields are EMPTY** across the ~8 live listings (FloodRiskScore,
  ConvenienceScore, ComfortLevel, etc.). So there's **no existing scale to match** for the
  heatmap — pick one fresh (suggest 0–100), owner approves at Step 6 (this answers old Q3).

---

## 6. Already built — do NOT rebuild (spec §4 assumed these were to-do)

- `src/lib/supabaseAdmin.js` — service-role client, correct (null-guarded, server-only).
- **Publish sequential lock** — `api/dashboard/publish/route.js` marks Supabase `approved`
  only AFTER Airtable write succeeds, and already does zero-trust (`auth.getUser(token)` +
  ownership check).
- `src/lib/sanitize.js` — dependency-free (never import `isomorphic-dompurify`/`jsdom` in an
  API route). NOTE: `isomorphic-dompurify` is still a dead entry in `package.json` (unused).
- `src/lib/connectsWallet.js` — the 3-bucket Connects logic (granted→purchased→earned),
  client-side. **Missing:** the atomic server-side `spend_connects` RPC + `system_audit_logs`.
- Supabase Auth is fully wired (`authClient.js` + `DashboardContext.js`), with a `master-dev`
  localStorage mock backdoor (dev scaffolding — remove before launch).

---

## 7. Open questions still pending (owner to answer)

- **Sign off the Field Visibility Map** + the 3 borderline calls (§4). ← unblocks Step 0 code.
- **Q2** — data provider for `AirPollutionIndex` + `HeatIslandIndex` (blocks §6 only).
- **Q4** — do Gemini's "Foot Traffic density" / "Infrastructure Redundancy" merge into the
  §6 mobility fields or stay distinct? (blocks §6 only).
- **Q5** — real current PH mortgage rates (Pag-IBIG/banks) for `CONFIG_MORTGAGE_DEFAULTS`
  (blocks §7 only).

---

## 8. Build order (revised)

0. **Field Visibility Map** — finalize map → set `Deep_Intel_Gate` in Airtable → fix
   `CategorySpecBlock.js` to un-hide the facts → (later) Mission Control shows the tag.
1. **Safety sweep** — confirm all POST/PUT routes use `sanitize.js`. (Q6 = no filter work;
   StructuralNotes stays public.)
2. **Database integrity** — atomic `spend_connects` RPC + append-only `system_audit_logs`
   (additive; locks no one out).
3. **Mission Control dashboard** (§3) — magic-link admin auth, roles (Co-owner minus
   team-access), Overview, Approval Queue, **Disputes** (verify deals↔PROPERTY_BROKERS sync
   first), Trust & Badges, Content, Team & Access. Each editor field labeled Public/Hidden/Internal.
4. **Badge engine** (§5) — create `BADGE_DEFINITIONS` + Badges page. Skip notifications (§5.4).
5. **Heatmap** (§6) — after Q2, Q4. Scale = fresh 0–100.
6. **Affordability calculator** (§7) — after Q5. Create `CONFIG_MORTGAGE_DEFAULTS`.
7. **Bulk CSV / PapaParse Blueprint** (§4.3) — last, when unit-heavy listings need it.
Big Auth/RLS lockdown = the deferred final overhaul (owner's call).

---

## 8.5 Additions & watch-outs (keep these in view)

1. **Make.com automations are UNBUILT, but several spec pieces depend on them.** The badge
   auto-grant job (§5.3), the `deals` → Airtable `PROPERTY_BROKERS` sync (Disputes page),
   and the heatmap sync (§6.4) all assume Make.com scenarios that don't exist yet. Don't
   assume they run — build the automation (or a code equivalent) when its feature is built.
2. **Step 0 changes the LIVE public page.** Un-hiding the operator facts alters what real
   visitors see on real listings. Do it on a **branch + preview**, have the owner eyeball a
   property page, THEN deploy. `main` stays deployable; tell the owner before any push.
3. **The real bottleneck is FILLED LISTINGS, not features.** ~8 live listings, most fields
   empty; the north star is 200. Mission Control's **listing editor** (team fills fields
   without touching Airtable) is the highest-leverage piece for the business — treat it as
   first-class, ahead of badges/heatmap/calculator in *value*, even if built in step order.
4. **Trust-badge nuance:** `Verification_Status` (Drafted/Rules passed/…) stays INTERNAL;
   derive a public "Verified ✓" badge from it — never expose raw workflow states publicly.
5. **Pre-launch cleanup (tag now, do last):** remove the `master-dev` localStorage backdoor;
   drop the dead `isomorphic-dompurify` dependency from `package.json`.
6. **Model-agnostic working rule:** whatever model runs next (including Fable 5), it MUST
   still (a) read the whole `_SCOUTIT_BRAIN` folder first, (b) get owner sign-off on the
   Field Visibility Map before touching code, and (c) keep the **staged order** — do NOT
   "update everything at once." Big-bang changes break the live site and are hard for a
   non-technical owner to verify/roll back. Continuity lives in these files, not in the model.

---

## 8.6 Owner Q&A + decisions (end of 2026-07-01)

- **PUBLISH FLOW (DECIDED):** owners do **NOT** auto-publish. Owner-facing button = **"Submit
  for Review"** → lands in Mission Control Approval Queue (`pipeline_status='pending'`) →
  ScoutIt / the live council double-checks against the standard → **ScoutIt publishes.** This is
  already how the pipeline works (pending → admin approve → Airtable/live); just make sure the
  owner UI says "Submit for Review," never "Publish." On-brand: ScoutIt curates; raw listings
  never hit the public site directly.

- **AIRTABLE — KEEP IT (corrected 2026-07-01; I had misread the owner).** Owner does **NOT**
  want to drop Airtable — it keeps the team running smoothly, and they can't be editing
  server-side code after deploy. Airtable stays as the dual-CMS public layer. What he actually
  wants: the **automations currently on Make.com** (Airtable↔Supabase sync, badge auto-grant,
  heatmap sync, publish sync) should **migrate to our own server-side code** (Next.js API routes
  / Supabase functions) over time, so we're not dependent on Make.com. **Rule going forward:
  when building an automation, prefer server-side code over a new Make.com scenario.** Net:
  the dual-CMS stays; **Mission Control is NOT blocked by any database decision — just build it.**

- **SHOWCASE MOCK DATA (new near-term task):** create **1 COMPLETE listing per category** (all
  six: Residential, Commercial, STR, Hospitality, Restaurants, Venues), fully populated
  including the hidden-intel fields — dummy/placeholder data is fine — to prove the concept
  works and the page looks **"pretty"** (vs today's mostly-empty "Not listed yet" pages). Do
  this AFTER the field-map code fix so public=white / intel=gold render correctly. Placement is
  a small call next session (clearly-tagged dummy Airtable records vs `src/data` mock files).

- **ENVIRONMENTS:** owner confirms they already have **sandbox/production + a local server**, so
  staging the field-visibility change before it hits live is already possible — use it.

- **WORKING STYLE (DECIDED):** work in **batches of 3–4 related steps**, not one-at-a-time and
  not everything-at-once. Verify each batch on a branch/preview → show owner → then push.

- **PRE-LAUNCH DATA (reality):** owner has ~zero real data except **one SM offices PDF**.
  Realistic move = run that PDF through the **PDF→listing extractor** (Ingest Extractor / §4.3)
  to generate draft listings for review — don't wait on manual entry. Data scarcity is expected
  pre-launch; the job now is building the tools + processing the one asset we have.

- **CLEANUP (CONFIRMED):** remove the `master-dev` localStorage backdoor + the dead
  `isomorphic-dompurify` dependency before launch ("those things are dangerous" — owner).

> Owner emphasis: **pacing & process matter — "never throw a bad listing."** The
> Submit-for-Review → council-check → publish flow, plus careful batches of 3–4, exist
> specifically to protect listing quality. Quality of the few listings > speed.

---

## 9. Files created/touched this session

- **Created:** `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/FIELD_VISIBILITY_MAP.md` (draft).
- **Created:** this handoff.
- **No code changed** — planning/verification only. (Pre-existing uncommitted WIP on
  `BrokerMode.js`, `brokers/page.js`, `globals.css` is unrelated broker-mode work.)

**Resume next session at §0 (read the whole folder) → then §8 Step 0 after owner signs off the map.**
