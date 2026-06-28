# ScoutIt — Compiled Fix List

> The single, deduplicated, prioritized list of everything to fix, compiled from the
> Council website audit (`WEBSITE_COUNCIL_AUDIT.md`) + the Airtable/schema work
> (`AIRTABLE_IMPLEMENTATION_PLAN.md`, `PROPERTY_CATEGORY_SOP.md`) + the automation specs
> (`automations/`). Fix order is top-to-bottom. Nothing here is started unless marked.
>
> **Tags:** `[Airtable]` I can do directly · `[Website]` page code, needs a runnable dev
> setup before `main` · `[Supabase]` user-layer track · `[Make]` automation track.

---

## BUILD ORDER (prototype → launch) — overrides the P0–P3 grouping below

**Owner principle (June 2026): fake data is scaffolding — keep it IN while building so
every screen is visible/testable; remove it LAST, right before launch.** Build
functionality first; strip mock data + honest-blanks + dev backdoors in the final pass.

- **Stage 0 (now, from CMS session — no dev server):** add Hospitality/Venues categories;
  build per-category admin entry pages; keep data/specs aligned.
- **Stage 1 — core loop `[Website]`:** real Supabase auth → category-aware wizard + Upload
  mode → submissions → Supabase pending → approve → Airtable → property page renders
  `cat.*` Spec Block + price in "Your Move." *Milestone: one real property end-to-end.*
- **Stage 2 — buyer side `[Website]`:** category-aware directory cards + price + filters;
  Buyer "Saved" → real wishlist; Connects/subscriptions → paywall.
- **Stage 3 — ecosystem `[Website]/[Make]`:** rosters → SERVICE_PROVIDERS; Make.com bridges.
- **Stage 4 — FINAL cleanup (last, fast):** turn off mock-data fallback; honest-blanks;
  remove "Simulate Unlock" backdoor + `page.original.js`; soften About "no price tags";
  full route/render verification.

> Items #1–#4 below (fake data, invented values, backdoor, dead file) are **moved to
> Stage 4** per the owner principle — they are the *last* removals, not the first.
> Stages 1–3 need a runnable ScoutIt dev session; Stage 0 can be done from the CMS session.

---

## P0 — Launch blockers (before any real visitor)
1. **Kill the fake-data fallback for end users** `[Website]` — site-wide (~20 files); show
   only real, approved records (keep mock for local dev only).
2. **Stop inventing values** `[Website]` — replace every fabricated fallback ("80 Seats",
   "Commercial AAA", "3.8m ceiling", computed sqm, "Modernist", default hooks) with honest
   **"Not listed yet"** (reuse the existing "Where To — N/A" pattern).
3. **Remove the Provider "Simulate Unlock" backdoor** `[Website]` — opens the gate for anyone.
4. **Delete dead file** `src/app/page.original.js` `[Website]`.

## P1 — The listing pipeline (the missing link) + master page
5. ✅ **Rebuild the submission wizard to be category-aware** `[Website]` — pick category →
   ask that category's curated fields (SOP §2). Today it captures only 6 generic fields.
6. 🔴 **Add the wizard "Upload a Doc" mode** `[Website]+[Make]` — PDF/DOCX → Listing Engine
   extracts → owner reviews a **pre-filled** category form. (Guide in the audit doc;
   engine in `automations/INGEST_EXTRACTOR.md` + `LISTING_ENGINE.md`.)
7. **Route owner submissions to Supabase `property_submissions`** `[Website]+[Supabase]` →
   admin approves → Airtable (today they go to mock context).
8. **Render the per-category Spec Block** on the property page `[Website]` — the data is
   already wired on branch **`airtable-field-wiring`**; the component must display `cat.*`.
9. **Wire the Buyer dashboard "Saved" list to the real wishlist/Ledger** `[Website]` —
   currently hardcoded fake saves.
10. **Category-aware directory cards** `[Website]` — show rent (offices) / seating
    (restaurants) / capacity (venues), not just beds + sqm.
11. **Add price-range + category-specific filters** to the directory `[Website]`.
12. **Show verified price in "Your Move"** `[Website]` — *policy locked (SOP §9).* Price IS
    shown (supersedes "no price tags"). Render rule: `Published` + `Price_Verified_By` →
    show `Listed_Price` with a **"✓ Verified by Owner/Manager/Broker"** badge + source;
    `On Request` → **"Price on request — inquire."** Never display an unverified/AI price.
    *(Airtable fields `Price_Status` + `Price_Verified_By` already built.)*

## P2 — Monetization foundation (Supabase user layer)
13. **Unify auth on Supabase** `[Supabase]+[Website]` — `/profile` already syncs via
    `profileClient`; dashboard/onboarding/settings still localStorage-only. Real accounts.
14. **Real subscriptions/tiers + real Connects** (balances + transactions) `[Supabase]` —
    today Connects are mock UI only.
15. **Enforce the major/minor paywall** (SOP §8) `[Website]+[Supabase]` — gate MINOR fields,
    show the locked teaser. Depends on #13–14.
16. **Wire service rosters + ProviderMode** to `SERVICE_PROVIDERS` `[Website]+[Airtable]`
    when they open (currently dummy + honestly gated "Q4 2026").

## P3 — Polish / cleanup
17. **Fix directory mislabel** — "Layer 01 // Curated Showcases" → it's the Layer 02
    directory `[Website]`.
18. ✅ **DONE (June 2026)** — `Hospitality` + `Venues` added to `SpaceCategory`; taxonomy
    now complete (6 categories). `[Airtable]`
19. **Approve real records** so they render — the 6 SM offices are unapproved drafts
    `[Airtable]` (they're meant to stay drafts until reviewed).
20. **Build per-category conditional-visibility entry pages** in Mission Control `[Airtable]`
    (the curated "pick type → only its fields" forms — manual interface-designer step).
21. **Sweep remaining detail sub-pages** (broker/provider profiles, intel/[slug], other
    layer pages) — expected to share P0/P1 root causes.

---

## How the pieces connect (so fixes aren't done in the wrong order)
- **#5 wizard rebuild + #6 upload + #8 Spec Block** all sit on the **per-category schema
  (already built)** + the **normalizer wiring (branch `airtable-field-wiring`)**. Do the
  Spec Block (#8) and wizard (#5/#6) against that branch.
- **#15 paywall** cannot ship before **#13–14 (real auth + subscriptions)**. Until then,
  MINOR data stays mapped + flagged; the existing blur-lock is the placeholder.
- **Everything `[Website]`** needs a runnable ScoutIt dev session to verify (route 200 +
  real render) before going near `main`. **`[Airtable]`** items I can do straight away.

## Quick wins I can do now without a dev setup
- #18 (add SpaceCategory choices), #20 (per-category interface pages), #19 (approve records
  when you say so), and continuing any Airtable/CMS data work.
