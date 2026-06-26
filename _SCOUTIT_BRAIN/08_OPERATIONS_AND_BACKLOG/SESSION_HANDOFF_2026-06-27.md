# Session Handoff — 2026-06-27  ·  FOR ANTIGRAVITY ("ScoutIt Builder")

> **Read this first, in full, before touching code.** It transitions everything done in the
> 2026-06-27 Claude session and tells you what is yours to build, what is parked, and the rules
> you must not break. Pairs with `MASTER_CONTEXT.md`, `AGENTS.md`, `00_SOP.md`, `00_COUNCIL.md`.
> **Running code + live data win over any doc — verify before acting.**

---

## 0. The split (how work is divided right now)

- **You (Antigravity):** build what's left and improve the website — **everything EXCEPT security.** See §6.
- **Owner (Jerzel):** self-studying cybersecurity for the next day or two.
- **Claude:** being used for the owner's security learning, not building.
- **Security overhaul is PARKED on purpose** (see §5). Do **not** start it. It is one deliberate
  final overhaul so it isn't recalibrated again and again.

---

## 1. ⚠️ CRITICAL COORDINATION — sync before you build

The 2026-06-27 work is committed **locally** on `main` as commit **`3d6fa9f`** but **was NOT pushed**
to GitHub/Vercel (the owner approves every push).

- If you work in the **same local repo**, you already have `3d6fa9f` — verify with `git log --oneline -3`.
- If you sync from GitHub, this commit may not be there yet. **Confirm you have `3d6fa9f` before
  building on top of it**, or you may duplicate/conflict with the legal pages, 404, and listing-tool fixes.
- Do not force-push or rewrite `3d6fa9f`. Branch or commit forward.

---

## 2. What was done this session (commit `3d6fa9f`, 11 files)

### A. Legal pages — Terms + Privacy (NEW)
- `src/app/terms/page.js` — Terms of Service, 18 sections.
- `src/app/privacy/page.js` — Privacy Policy, 13 sections (built around RA 10173 Data Privacy Act).
- `src/components/legal/LegalDoc.js` — shared presentational shell both pages use (DRY; pages pass
  data only).
- Rewritten to match the REAL model: Intelligence First / Transactions Never; Connects =
  authorization not brokerage (RA 9646); 3-bucket Connects + spent-on-send no-refund; two-key
  handshake + owner-first/no-exclusivity; ephemeral chat + the required disclaimer + contact-info
  tradeoff; Vault media ownership (license-while-subscribed); soft-delete vs support-only erase;
  Scout Rating = closures only; honest-blank + Your-Move pricing; platform-disputes-only.
- **These are DRAFTS, not lawyer-reviewed.** Do not treat as final. Flagged high-risk clauses that
  need a PH lawyer before launch: (1) the Vault churn/media-ownership clause (Terms §10) — continuing
  to display a cancelled owner's property; (2) the ephemeral-chat "permanently deleted" promise vs.
  the fact that message hard-delete isn't built yet — do not let that claim reach real users until
  the delete works; (3) the "verified / no fake listings" brand claim vs. the accuracy disclaimer.
  Contact info is **placeholder** ("the contact channel listed on the platform") — a real DPO email
  is legally expected under RA 10173 before collecting real user data. **Do not invent emails.**

### B. Branded 404 (NEW)
- `src/app/not-found.js` — "Signal Lost" page (radar rings, gold pulse, Return to Base / Explore
  Spaces CTAs). Replaces the raw Next.js default 404. On-brand, static.

### C. Footer legal links (FIX)
- `src/components/layout/Footer.js` — Terms/Privacy links were `href="#"`; now point to `/terms`
  and `/privacy`.

### D. Discover page — killed fake metrics (FIX)
- `src/app/discover/DiscoverClient.js` — every spotlight card showed a **hardcoded** `Zoning Profile:
  AAA Tier` and `Affinity Rating: 98.4%` (literal strings, identical on every property — they would
  have shipped onto real listings too, violating "the signals are real"). Replaced with real,
  varying fields: **Location · Category · Layout**. Also added a branded gradient **image fallback**
  so a missing cover photo no longer renders as a broken black box.

### E. Listing-intake tools made usable (the big one)
- **`src/app/api/ai/read-pdf/route.js` (NEW)** — real PDF text extraction via `unpdf` (added as a
  dependency). The Concierge previously used `FileReader.readAsText()` on a binary PDF, which returns
  compressed garbage — so the AI never saw the property text. This route does proper server-side
  extraction and returns a friendly error for scanned-image PDFs.
- **`src/components/dashboard/OwnerMode.js` (FIX)** — the Concierge handler now: (1) POSTs the PDF to
  `/api/ai/read-pdf` → gets clean text, (2) sends that text to the existing `/api/ai/assimilate`. The
  assimilate route is unchanged.
- **`src/components/dashboard/BulkImporterMode.js` (FIX)** — replaced the naive `split(",")` CSV
  parser (which corrupts any field containing a comma, e.g. "Makati, Metro Manila") with `Papa.parse`
  (already a dependency). Robust to quoted commas and newlines in cells.
- **Pipeline PROVEN end-to-end (2026-06-27):** real PDF → text ✓; CSV headers → blueprint mapping ✓;
  transform (price "25,000,000" → 25000000, comma-location preserved, extras → `details`) ✓;
  `/api/dashboard/bulk-insert` → 2 real draft rows in Supabase `properties` with correct columns ✓.
  Test rows were inserted then **deleted** — the DB is clean (owner_id `'pipeline-test'` if you ever
  see leftovers, safe to delete).

---

## 3. Verified facts (don't re-derive)

- **Supabase project:** `yyixsuaimdzyiocswcgc` (auto-pauses when idle — restore if queries time out).
- **`properties` live columns (confirmed via schema read):** `id` (uuid), `created_at`, `owner_id`
  (text), `title`, `type` (NOT NULL), `location` (NOT NULL), `price` (numeric), `description`,
  `media_link`, `verified`, `completeness_score`, `coordinates` (geography), `space_category`,
  `details` (jsonb), `pipeline_status` (default 'draft'), `slug`. Every column the listing tools
  insert EXISTS — no column-mismatch risk. `type` and `location` are required (code always provides
  fallbacks).
- **The live CSV importer is `BulkImporterMode`** (OwnerMode returns it early for `showWizard==='bulk'`).

---

## 4. Known issues / gotchas to be aware of

- **`GEMINI_API_KEY` is NOT set** (local, and likely not in Vercel). The listing tools work
  mechanically but fall back to dumb keyword mapping without it; the **PDF Concierge especially**
  needs it to turn prose into structured fields. This is the owner's small to-do (a feature API key,
  NOT part of the security overhaul). The blueprint/assimilate routes already have naive fallbacks.
- **Dead code in `OwnerMode.js`:** there are TWO `if (showWizard === 'bulk')` blocks. The first
  (~line 107) returns `<BulkImporterMode>` and wins; the second (~lines 182–298, an inline
  Papa.parse flow) is **unreachable dead code**. Harmless but confusing — safe to remove if you're
  cleaning up, but verify the early return stays.
- **Untracked junk in the repo root** (not committed, leave alone unless intentional): `.obsidian/`,
  `Untitled.base`, `shots/audit/`, `shots/verify/`, `skills-lock.json`, `.agents/`. A few legit brain
  docs are also untracked (`BRAND_VOICE_AND_COPY_SOP.md`, `ORIGIN_STORY_SCROLLYTELLING.md`,
  `OBSIDIAN_VAULT_GUIDE.md`) — commit those deliberately if desired.
- **Vault wiring gap (still open):** owner-submission fields `Video_URL`/`Virtual_Tour_URL` are not
  connected to the fields the Vault widget reads (`matterportTourUrl`/`luma3dMapUrl`/
  `droneHeatmapUrl`). An owner-pasted tour link won't appear yet. (Phase 2 in
  `06_MONETIZATION/VAULT_LISTING_LIFECYCLE.md`.)

---

## 5. PARKED — do NOT touch (owner's security study)

One deliberate final overhaul, done all at once so it isn't recalibrated repeatedly:
- Supabase **reset** with RLS-on-from-day-one (RLS is currently DEV-OPEN everywhere).
- Real **Supabase Auth** replacing the localStorage mock (`usr-...` text IDs).
- **Token rotation** (Supabase, Airtable, Mapbox, add Gemini).
- **Connects Edge Functions** (grant/reset, handshake charge, bounty payout, Airtable↔Supabase sync).
- **Scaffolding removal:** demo-owner login, the `Simulate Unlock` backdoor, mock data.
- **Input validation on property submissions** (Zod) — folds INTO this overhaul; do NOT add it
  piecemeal now, the submission pipeline is rebuilt during the reset.

If you touch the data layer for a feature, keep it additive and reversible; don't half-harden RLS.

---

## 6. YOUR LANE — what's left to build / improve (non-security)

Prioritize against the north star: **200 real listings before monetization**, and the GTM moat
(editorial quality + design DNA + SEO).

1. **Public-site launch polish (low-risk, high-trust).** Extend the discover image-fallback pattern
   site-wide (any card that can show a blank cover). Address the guest-visible dashboard demo state
   (a logged-out visitor currently lands on a seeded "15 Connects" dashboard — make it read as a
   preview or gate it). Sweep for any other "looks broken/fake" surfaces (the council flagged these
   on the live site).
2. **Claude editorial descriptions (NEW_IDEAS #6) — the SEO/brand moat.** After Gemini extracts the
   facts, pass the structured payload to Claude to write the compelling, honest property write-up
   ("show what a space could be, backed by data"). Pure API work, no security entanglement. Needs
   `ANTHROPIC_API_KEY`. This is the single most on-strategy feature.
3. **Owner editor / publish flow polish.** Make sure upload → draft → review → Publish → Airtable
   (public) is smooth. The draft half is proven; verify the publish→Airtable mirror.
4. **Founding-cohort badge system (NEW_IDEAS #5).** `/badges` + `/api/badges/claim` exist partially.
   Pokémon-style FOMO tied to the waitlist + Pioneer pricing. NOTE: writes to Supabase, so it lightly
   touches the data layer that will be reset — keep it additive.
5. **Mapbox geocoding write-back.** After first geocode, write Lat/Lng back to Airtable so the same
   address isn't geocoded on every fetch. Do before listing count grows past ~50.
6. **Manual Airtable:** add the `Active_Listings_Count` rollup on `BROKERS_CMS` (API can't make rollups).
7. **Deferred (don't start unless asked):** payments (PayMongo/Xendit — after 200 listings), email
   (Resend/Brevo), the in-app buyer Concierge / pgvector search (NEW_IDEAS #8, plan carefully — token
   cost), QuestIT standalone, the on-hold ideas (Resident Intel, Post-Move, Affordability — needs legal).

---

## 7. NON-NEGOTIABLE RULES (break these and you break the product)

- **This is a MODIFIED Next.js 16.2.7** (App Router, Turbopack). **Read `node_modules/next/dist/docs/`
  before writing framework-level code.** APIs may differ from training data.
- **Design DNA:** ~95% dark / ~5% gold. **CSS variables only, never raw hex.** `--accent #E8AE3C`,
  `--accent-bright #F7C64E`, `--accent-muted #6E531A`. Count the gold before adding more.
- **Dual-CMS:** Airtable = public read-only via the one proxy `src/app/api/cms/route.js`. Supabase =
  private user state. **Never mix them**, never call Airtable from the client.
- **Never invent property data.** No source → blank field. A blank is honest; a fake value is not.
- **Never push to `main`/Vercel without the owner's explicit say-so.** Owner is non-technical —
  explain in plain language. `main` must always be deployable (`next build` is the gate).
- **Connects writes go through API routes only** (service role), never client-side INSERT.
- **Scout Rating = verified closures only.** Never bought, never tier-granted, never from a handshake.
- Tailwind is allowed in dashboards; public site stays vanilla CSS. Three.js/WebGL backgrounds are
  allowed but **must** degrade via Lite Mode (`src/lib/liteMode.js`).
- Scroll-snap: `y proximity` only — never `mandatory` + smooth together.
- **The UFO stays. Always.**

---

## 8. Key files

| File | What it is |
|---|---|
| `src/app/api/cms/route.js` | Airtable proxy — ALL public data (60s ISR cache) |
| `src/lib/entitlements.js` | Tier/feature gating — source of truth |
| `src/context/DashboardContext.js` | Dashboard state + `addListing`/`bulkAddListings`/`publishListing` |
| `src/components/dashboard/OwnerMode.js` | Owner dashboard + Concierge + Vault wizard |
| `src/components/dashboard/BulkImporterMode.js` | The live CSV importer (Papa.parse) |
| `src/app/api/ai/read-pdf/route.js` | PDF → text (unpdf) — NEW this session |
| `src/app/api/ai/assimilate/route.js` | Text/row → ScoutIt schema (Gemini, naive fallback) |
| `src/app/api/ai/blueprint/route.js` | CSV header → schema mapping (Gemini, naive fallback) |
| `src/app/api/dashboard/bulk-insert/route.js` | Bulk Supabase insert |
| `src/components/legal/LegalDoc.js` · `src/app/{terms,privacy}/page.js` | Legal pages (DRAFTS) |
| `src/app/not-found.js` | Branded 404 |

---

## 9. Deeper specs (source of truth per area)

- Vision/legal: `01_IDENTITY_AND_VISION/SCOUTIT_BIBLE.md` · full context: `MASTER_CONTEXT.md`
- Connects + handshake: `06_MONETIZATION/CONNECTS_AND_BROKER_HANDSHAKE.md`
- Vault lifecycle / media ownership: `06_MONETIZATION/VAULT_LISTING_LIFECYCLE.md`
- Chat spec (DESIGNED, not built): `07_FEATURES_AND_FLOWS/BROKER_HANDSHAKE_CHAT.md`
- Live Supabase schema: `04_DATA_AND_SCHEMA/SUPABASE_LIVE_SCHEMA.md`
- Brand voice (for any copy): `03_DESIGN/BRAND_VOICE_AND_COPY_SOP.md`
- New ideas backlog: `01_IDENTITY_AND_VISION/NEW_IDEAS.md`
- Risk/vulnerability map: `08_OPERATIONS_AND_BACKLOG/VULNERABILITY_AUDIT_2026-06-26.md`

---

> Last updated: 2026-06-27 (Claude session with Jerzel). Prior handoff: `SESSION_HANDOFF_2026-06-26.md`.
> First thing to confirm: you have commit `3d6fa9f` (§1). Then pick from §6, follow §7, ask the owner
> before any push.
