# ScoutIt — Website Council Audit (User-Readiness Punch-List)

> The Council walked the live site (by reading what each page renders to a user) and
> looped until findings converged. Result: the issues are **systemic** — 3 root causes
> repeat across surfaces. Fixing them is website code work (needs a testable dev setup).
> Audited: property detail page, property directory, homepage, brokers, discover.

---

## 🔴 Root cause #1 — Mock/sample data is shown to real users (LAUNCH BLOCKER)
Every main page falls back to **fake sample data** when the CMS is empty or the fetch
fails, and the directory even **merges** mock listings with real ones:
- Homepage: `getDISCOVERY_FEED`, `getCATEGORY_PREVIEWS`, `getArticles` (all mock).
- Directory (`property/page.js`): merges ~17 mock properties into the grid.
- Brokers: defaults to `getBrokers()` mock until the API answers.
**Risk:** a visitor sees invented properties/brokers/articles as if real — directly
breaks "the signals are real."
**Fix:** before go-live, disable the mock fallback for end users (keep it only for local
dev), so users see **only real, approved** records.

## 🔴 Root cause #2 — The site invents values when a field is blank (BRAND-BREAKING)
When CMS data is missing, pages show **made-up specifics** instead of "not listed":
- Property page: `"80 Seats"`, `"Commercial AAA"`, `"3.8m ceiling"`, and **computed**
  room sizes (`floor_sqm × 0.6`).
- Directory cards: `hook || "Premium curated property briefing."`,
  `aestheticTag || "Modernist"`.
**Good news:** the site already does it right in one place — "Where To" shows
`"N/A — NO DATA IN CMS"`. **Fix:** make every section copy that honest-blank pattern →
show **"Not listed yet."** never a fabricated value.

## 🔴 Root cause #3 — Price is missing + cards aren't category-aware (BUYER CAN'T DECIDE)
- **No price anywhere a buyer browses:** directory cards show category, aesthetic, beds,
  sqm — but **no price/rent**. Detail page barely surfaces it.
- **Cards are residential-shaped:** they only show `{beds} Beds` + `{sqm}`. An office or
  venue (beds = 0) shows no useful spec on its card.
- **No price or category-specific filters** (no "rent under X", no seating/capacity).
**Fix:** surface price on cards + detail; make the card specs category-aware (rent for
offices, seating for restaurants, capacity for venues); add a price-range filter.

---

## Per-surface notes
- **Property detail page** — rich and category-aware (good chapter system), but worst hit
  by root causes #2; the new `cat.*` data we wired has no render slot yet.
- **Directory** — strong filters (sector/location/aesthetic), search, proximity radar
  (good). Hurt by #1, #2, #3. Label says "Layer 01 // Curated Showcases" but it's the
  Layer 02 directory (minor inconsistency).
- **Homepage** — cinematic hero is strong; content sections run on mock data (#1).
- **Brokers** — ✅ the healthiest page: reads real data via `/api/cms`, solid filters
  (tier/location/closures), good search. Use as the model for the others.
- **Discover** — thin wrapper (`DiscoverClient`); not deeply audited this pass.

## What's already good (keep)
- The chapter/category system on the property page.
- The honest-blank pattern in "Where To."
- Directory filters + proximity radar + map.
- Brokers page data flow.

## Priority order to fix
1. **#1 Mock-data gate** (launch blocker — do first).
2. **#2 Honest-blank** (replace all fabricated fallbacks).
3. **#3 Price + category-aware cards + price filter.**
4. Render the wired `cat.*` detail on the property page (from `airtable-field-wiring`).
5. Paywall / major-minor gating — **separate track, needs the Supabase membership layer.**

## Honest constraint
All fixes are website-page code changes. They need a setup where the site can be run and
verified (route 200s, real render) before going near `main` — not blind edits from the
docs/CMS-only session.

---

## Loop 3 — remaining surfaces swept

**Root cause #1 confirmed site-wide.** Mock data is imported in **20 files**, including
every service roster, Intel, the layer-descent pages, and Discover. The fake-data gate is
a whole-site change, not a per-page one.

### 🔴 New blocker found — Authentication is mock / localStorage (not real)
The Dashboard and homepage read the "logged-in user" from **`localStorage` (`scoutit_user`)**
— there is **no real Supabase login wired yet**. Connects/notifications come from a mock
context. **Why it matters:** the **paywall, subscriptions, Connects, and the whole user
layer all depend on real auth.** This is the foundation that must exist before any
members-only gating can work.

### ✅ Healthy / on-brand (keep as-is)
- **Wishlist / "Your Board" (Layer 04):** device-only via `localStorage`
  (`scoutit_reactions`), privacy-first exactly per the Bible, with a proper empty state and
  no fabrication. (Not yet synced to Supabase — consistent with the plan.)
- **Dashboard:** clean role-aware shell (buyer / owner / broker / provider) via
  `DashboardContext`. Works as a prototype; needs real auth + real data behind it.

### 🟠 Service rosters (photographers / researchers / event-planners)
100% **dummy data** + hardcoded filter lists, but **honestly gated** with a
`RestrictedAccessBanner` ("opens Q4 2026") — so users aren't misled. When they open, wire
them to the new `SERVICE_PROVIDERS` table.

### 🧹 Cleanup
- `src/app/page.original.js` — a leftover backup of the homepage (dead file). Remove.

---

## MASTER "What needs to be done" (consolidated, prioritized)

**A. Launch-blockers (must fix before real users)**
1. **Turn off mock-data fallback for end users** (site-wide; 20 files) — show only real,
   approved records. *(Root cause #1)*
2. **Stop inventing values** — replace every fabricated fallback with "Not listed yet"
   using the existing honest-blank pattern. *(Root cause #2)*

**B. Buyer experience**
3. **Surface price** on directory cards + detail page.
4. **Category-aware cards** (rent for offices, seating for restaurants, capacity for
   venues — not just beds/sqm).
5. **Add price-range + category-specific filters.**
6. **Render the wired `cat.*` detail** on the property page (branch `airtable-field-wiring`).

**C. Foundation for monetization (separate track)**
7. **Real authentication (Supabase)** to replace localStorage mock auth.
8. **Subscription / tier + Connects** in Supabase → then the **major/minor paywall** can be
   enforced (SOP §8).
9. Wire service rosters to `SERVICE_PROVIDERS` when they open.

**D. Polish / cleanup**
10. Remove `page.original.js`; fix directory's "Layer 01" label (it's the Layer 02
    directory); sweep the few unread pages (Intel detail, showcase, about, layer pages,
    profile, settings, onboarding) — expected to share the same root causes.

> Reminder: every "A/B/D-website" item is page code needing a testable dev setup before
> `main`. The "C" items are the Supabase user-layer track (already planned separately).

---

## Loop 4 — Dashboards (Council audit, per mode)

**Verdict: each mode already has a curated, mode-specific workspace.** ✅ The four modes
are Buyer (= "user"/seeker; the "exploring" tag maps here), Owner, Broker, Provider.

- **Owner — ✅ most complete.** Empty-state → GuidedWizard → portfolio view → per-listing
  "dossier" with incoming broker pitches. Genuinely curated. (Runs on mock context data.)
- **Broker — ✅ strong.** Deal pipeline (pending/accepted), opportunity feed of listings to
  pitch, deal-file workspace with notes, **Connects-gated pitching** (sendPitch costs 1
  Connect). Curated. (Mock context data.)
- **Buyer — ⚠️ one real disconnect.** Has feed + map radar + radius search (good). **But its
  "Saved" list is HARDCODED mock (`SAVED_LISTINGS`) and is NOT connected to the user's real
  wishlist** (`localStorage scoutit_reactions` = the Layer 04 Ledger). So a buyer's saved
  items on the dashboard are fake. → Wire the dashboard "Saved" to the real Ledger.
- **Provider — 🟠 gated, with a backdoor to remove.** Correctly shows "gates closed /
  pioneer onboarding" with a dossier + completeness meter (good). **But:**
  - 🔴 a **"Simulate Unlock" test button is visible to users** — it opens the gate for
    anyone. **Must remove before launch.**
  - `MOCK_PROJECTS` / `MOCK_INQUIRIES` are hardcoded.

**Cross-cutting:** all four modes run on **mock context data + mock localStorage auth**
(root cause #1 + the auth blocker). The **Connects economy is wired in the UI but mock** —
no real balances/transactions yet (needs the Supabase user layer).

### Added to MASTER TODO
- **B7.** Wire the **Buyer dashboard "Saved" list to the real wishlist/Ledger**.
- **A-cleanup.** **Remove the Provider "Simulate Unlock" backdoor** button (launch risk).
- **C-extend.** Replace all mode mock data (listings, pitches, Connects) with real data
  once auth + Supabase subscriptions exist; make Connects real (balances + transactions).

---

## Loop 5 — Submission wizard, onboarding, layer pages, Intel

### 🔴🔴 CRITICAL — the submission wizard captures only 6 generic fields
`GuidedWizard.js` (how owners create a listing) collects **only**:
`type · location · price · mediaLink · description · verified`. It captures **none** of
the ~145 per-category fields we just built — no beds/baths, no rent/CAMC/PEZA, no seating,
no capacity, nothing category-specific. Its type list (house/lot/condo/commercial/other)
doesn't even match the 6 canonical categories, and **even "Expert" mode uses the same
6-field object.**

**Why this is the biggest finding:** it's the **bottleneck of the entire vision.** We built
a rich per-category schema, a curated SOP, and a Listing Engine — but the actual owner-facing
intake can't feed any of it. Owners literally cannot enter the data the master page expects.

→ **Rebuild the wizard to be category-aware:** pick category → ask *that* category's curated
questions (SOP §2) → write to Supabase `property_submissions` (pending) → admin approves →
Airtable. This is also exactly where the **PDF-ingest / Listing Engine** plugs in (owner
uploads a deck instead of typing). The wizard, the schema, and the ingest engine must align.

### Onboarding — ✅ good structure, mock auth
Clean role-based flow (buyer / owner / broker / provider / exploring) + provider subtype +
PRC license + location focus. But it's **mock auth** (saves to `localStorage`; password is
collected but not a real account) — confirms the auth blocker.

### Layer-descent pages — thin cinematic shells (low priority)
e.g. `/layer/orbit` = Board podium + animated background. Fine as presentation.

### Intel — same mock-fallback pattern (root cause #1).

### Added to MASTER TODO
- **🔴 B-critical.** **Rebuild the submission wizard to be category-aware** and capture the
  per-category SOP fields; route submissions to Supabase `property_submissions`; wire the
  **PDF-ingest / Listing Engine** as the "upload instead of type" path. *(Aligns owner
  intake ↔ schema ↔ master page — the missing link of the whole pipeline.)*

---

## Loop 6 — showcase, profile, settings, about (final sweep)

### ✅ Big positive — a partial Supabase user layer ALREADY exists
`/profile` uses **`@/lib/profileClient`** (`upsertProfile`, `loadPrivacySettings`,
`loadBrokerProfile`, role panels, privacy controls) and **syncs localStorage → Supabase**,
with `subscription_tier` and `connects_balance` already in the profile shape. So the
auth/user-layer foundation (the thing the paywall needs) is **partly built** — not from
zero. **Inconsistency to fix:** dashboard / onboarding / settings still use
localStorage-only, while profile syncs to Supabase. Unify on the Supabase path.

### ⚠️ Reconciliation — "no price" may be INTENTIONAL brand, not a bug
The About/manifesto page explicitly states: *"No price tags, no intrusive banners… pure,
verified asset data… for serious capital deployment."* So hiding price is a **deliberate
brand stance** (institutional, inquiry-based), which **conflicts with the earlier
"surface price" finding.** → Revised recommendation: show price only where it's
*market-standard public info* (e.g. commercial **rent/sqm**, which the SM deck publishes);
keep the **"inquire" model for luxury residential** per brand. **Owner decides per category.**

### Low-priority / fine
- **Showcase** (`/showcase`) — thin wrapper over `ShowcaseStage` (the Board). Fine.
- **Settings** — localStorage profile editor (same mock-auth pattern).

---

## 📄 NEW GUIDE — Wizard "Upload a Doc" mode (owner front door to the Listing Engine)

Add a **4th option** to the submission wizard's mode-selection screen, alongside
Fast-Track / Guided / Expert:

**"📄 Upload a Document"** — *"Have a brochure, deck, or listing sheet? Drop it and we'll
build the listing for you."*

Flow:
1. Owner uploads a **PDF / DOCX / image** containing property info (e.g. an SM-style deck).
2. The **Listing Engine** (`automations/INGEST_EXTRACTOR.md` → `LISTING_ENGINE.md`) reads it:
   extracts facts, fills the **category-aware** fields (per SOP §2), **leaves blanks where
   there's no source** (never invents), and flags gaps.
3. Owner lands on the **pre-filled category form** to review/correct (not a blank form).
4. Submit → Supabase `property_submissions` (pending) → admin approves → Airtable.

This makes "just send the PDF" a real product path, and it's the same engine as the
internal bulk ingest. It depends on: the **category-aware wizard rebuild** + the
**Listing Engine** being live. Spec lives in `automations/`.

---

## ✅ Audit COMPLETE — all surfaces swept
Property detail, directory, homepage, brokers, discover, wishlist, dashboard (4 modes),
submission wizard, onboarding, layer page, Intel, showcase, profile, settings, about.
Remaining (broker/provider *detail* sub-pages, intel/[slug], other layer pages) are
detail variants sharing the documented root causes — no new categories of problem expected.

➡️ **Compiled, deduplicated, prioritized fix-list: `docs/SCOUTIT_FIX_LIST.md`.**
