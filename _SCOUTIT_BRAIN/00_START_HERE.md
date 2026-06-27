# 🛸 SCOUTIT BRAIN — START HERE

**This folder is the complete knowledge base for ScoutIT.** Everything an AI agent, a new
developer, a partner, or an investor needs to understand *the whole of ScoutIT* lives here —
the idea, the concept, the bible, the architecture, the design system, the data model, the
automations, and the monetization.

> If you read only one file, read `01_IDENTITY_AND_VISION/SCOUTIT_BIBLE.md`. It is the single
> source of truth for what ScoutIT *is*. This file (`00_START_HERE.md`) is the map that points
> at everything else.

*Maintained by: EdgerzXc / Jerzel · Knowledge base compiled June 2026.*

---

## 1. ScoutIT in 30 seconds

ScoutIT is a **Spatial Commerce platform** for the Philippines — *not* a real estate listing
site. It treats all physical space (residential, commercial, short-term rentals, hospitality,
restaurants, event venues) as a single, data-dense intelligence layer. Instead of
pressure-selling listings, it gives buyers **editorial briefings, market signals, curated
discovery, and a private wishlist** that never touches a server. It connects them to a verified
ecosystem of brokers, photographers, researchers, and event designers.

> Think less Lamudi, more **Bloomberg for space.**

**The name is a layered puzzle:**

- **Scout + IT** = intelligence technology applied to scouting space
- **SIT** = what you do when you seriously consider a space — you *sit* with it
- **S.I.T.** = **Space · Intelligence · Technology** (the positioning spine)

The **UFO mascot** = something that doesn't fit existing categories, descending from a
different altitude. That is ScoutIT in the market. The UFO stays. Always.

**Core promise:** *No guesswork. No gatekeeping. No pressure. The signals are real.*

---

## 2. How to read this folder (recommended order)

| # | Folder | Read it to understand… |
|---|---|---|
| 0 | **`00_START_HERE.md`** (this file) | The map + the cheat sheet |
| ★ | **`00_SOP.md`** | **Read every turn** — operating rules + invariants that keep work aligned & non-breaking |
| ★ | **`00_COUNCIL.md`** | The 5-seat decision panel for product/UX calls |
| ▶ | **`NEXT_DAY_HANDOFF.md`** | **Resume here** — current build status, locked decisions, ordered next steps |
| 1 | **`01_IDENTITY_AND_VISION/`** | What ScoutIT *is*, why it exists, the wordplay, the manifesto, future ideas |
| 2 | **`02_ARCHITECTURE_AND_STRUCTURE/`** | The tech stack, folder map, dual-CMS data flow, AI working rules |
| 3 | **`03_DESIGN/`** | The visual DNA: 95% black / 5% gold, tokens, typography, motion |
| 4 | **`04_DATA_AND_SCHEMA/`** | Airtable + Supabase schemas, per-category data entry rules, SQL |
| 5 | **`05_AUTOMATIONS/`** | The Listing Engine, the AI Council, the PDF extractor specs |
| 6 | **`06_MONETIZATION/`** | The Cosmic tier system, Connects economy, bounties, pricing |
| 7 | **`07_FEATURES_AND_FLOWS/`** | User journeys, scrollytelling manifesto, comparison tool, onboarding |
| 8 | **`08_OPERATIONS_AND_BACKLOG/`** | Build order, fix list, audits, cleanup playbook |
| 9 | **`09_REFERENCE_RAW/`** | Original project README + reference-asset notes |
| 10 | **`10_CYBER_SECURITY/`** | Security hardening reports, Upstash Redis rate limiting, API security, and Supabase RLS policies |
| 11 | **`11_SCHEMATICS/`** | Visual system maps (one `.svg` per system) — start with Mission Control |

---

## 3. The cheat sheet (everything condensed)

### Identity
- **Category invented:** *Spatial Commerce* — programmatic liquidation, utilization, and
  data-dense mapping of physical space. Radical claim: **every kind of space is the same
  product in disguise** (sqm, location signals, foot traffic, a buyer on the other side).
- **Six space categories:** Residential · Commercial · STR · Hospitality · Restaurants · Venues.
- **Tagline:** *"Get lost in spaces that actually inspire you."* (may sharpen toward
  *"Philippine space. Decoded."*)
- **Compliance:** Operates under the **Real Estate Service Act, RA 9646** — display/intelligence
  only. *Intelligence First. Transactions Never.* (Note an evolving tension on whether
  authorized prices show — see §6.)

### Architecture (Dual-CMS — the golden rule)
- **Airtable = public, read-only content.** Properties, intel articles, brokers. Every record
  is approval-gated. Served through one proxy: `src/app/api/cms/route.js`.
- **Supabase = private user data.** Auth, saved reactions, owner property submissions.
- **Never mix them.** Airtable = public display. Supabase = private state.
- **Mapbox** geocodes string locations server-side; a **Haversine** formula in the API route
  powers radius search. **Leaflet** draws static property maps.
- **Stack:** Next.js 16.2.7 (App Router, Turbopack, *modified* — check
  `node_modules/next/dist/docs/`), React 19, plain JS, vanilla CSS + CSS Modules (**no
  Tailwind**), deployed on Vercel (`EdgerzXc/ScoutIt`).

### The product surface
- **Homepage = a descent** through 6 numbered layers (Hero → The Board → Property Experiences
  → Discovery & Intelligence → Ecosystem Services → Your Board → About).
- **6 dedicated "layer" route pages (all under `/layer/*`):** `/layer/orbit` (The Board) ·
  `/layer/stratosphere` (Intel) · `/layer/metropolis` (Explore) · `/layer/crust` (Network) ·
  `/layer/mantle` (Archive) · `/layer/core` (Your Workspace). Nav pills show plain labels
  (e.g. "Stratosphere · Intel").
- **The Ledger** = private, device-only wishlist (4 tags: Potential Fit / Interested /
  Inspired Me / Save). No account required.
- **Property pages** use a **chapter-registry system** — 10 chapters, reframed per category
  (see `02/PROPERTY_ARCHITECTURE.md`). Fields are tiered `needed` (free) or `extra` (paid).

### Design DNA
- **~95% darkness, ~5% gold.** Gold is a signature, not wallpaper.
- **Use CSS variables, never raw hex.** `--accent` `#E8AE3C` (refined amber, 2026-06-26 — warmer
  than the old `#FFB800`), `--accent-bright` `#F7C64E`, `--accent-muted` `#6E531A`, canvas `--bg` `#0e0e0e`.
- Serif display headlines (Georgia), Geist Sans body, **mono uppercase wide-tracked eyebrows**.
- Glassmorphism, slow/intentional motion, localized glow.
- **Allowed (corrected 2026-06-26):** **Tailwind** (used across the app alongside vanilla CSS) and
  **Three.js/WebGL** backgrounds — both gated by **Lite Mode** (`src/lib/liteMode.js`), a global toggle
  that disables animations/3D for low-end phones. **Banned:** raw hex, glow-everywhere. Dark is the
  default; light/high-contrast modes live in the Display panel.

### Monetization (the Cosmic tiers)
- Four ascending tiers for every user type: **Starry (free) → Solar → Cluster → Universe.**
- Monetizes **access, intelligence, visibility, and connection — never the act of discovery.**
- **Connects** = internal currency for cross-user actions (contact a broker, pitch a listing,
  commission a shoot). Monthly allocation per tier; earnable via bounties.
- **Bounty Hunts** = crowdsourced, geo-tagged data verification → a living, self-updating
  dataset. **Brokers' Scout Rating is earned by closures only — never bought.**
- B2B (brokers, photographers, researchers, event designers pay for tools + visibility) +
  B2C (buyers pay for deeper intelligence + privacy).

### Automations
- **Listing Engine** (Phase 2, monetized): thin PDF → AI extractor → web researcher → an AI
  **Council** (Design Expert + Owner Advocate + Buyer Advocate + Category Master) → an Arbiter
  that routes Approve / loop / human. **No source → field stays blank. Never invents.**
- **PDF Ingest Extractor** (Phase 1, runs now): extracts only facts literally present, writes
  unapproved records to the Approval Queue.

---

## 4. The non-negotiable rules (for anyone — human or AI — working on ScoutIT)

1. Read `01_IDENTITY_AND_VISION/SCOUTIT_BIBLE.md` and `02/AGENTS.md` first.
2. This is a **modified Next.js 16.2.7** — check `node_modules/next/dist/docs/` before writing
   framework code. **The code is always the source of truth** over any doc.
3. **Use CSS variables, never raw hex.** Count the gold before adding more — 95/5.
4. **Airtable = public display. Supabase = private state. Never mix.**
5. **Never push to Vercel / `main` without asking the owner first.** The owner is non-technical;
   explain in plain language. `main` must always be deployable.
6. Scroll-snap: use `y proximity` only — never `mandatory` + `scroll-behavior: smooth` together.
7. Never invent the centerpiece visual — signature imagery comes from the owner's `reference/`.
8. The UFO stays. Always.

---

## 5. Full document index

**01 · Identity & Vision**
- `SCOUTIT_BIBLE.md` — ⭐ the master reference (identity, wordplay, vision, business, features, design, data, GTM)
- `NEW_IDEAS.md` — future feature ideas (Resident Intel, Post-Move Layer, Affordability Layer)

**02 · Architecture & Structure**
- `STRUCTURE.md` — master architecture & folder map
- `PROPERTY_ARCHITECTURE.md` — the chapter-registry refactor + per-category content system
- `AGENTS.md` — the master AI system prompt and design rules
- `DESKTOP_CLAUDE_NOTE.md` — standing project context for AI sessions
- `structure.txt` — raw folder tree snapshot

**03 · Design**
- `SCOUTIT_DESIGN_BRIEF.md` — brand brief & visual system
- `DESIGN_AUDIT_2026-06.md` — design audit findings

**04 · Data & Schema**
- `DATA_DICTIONARY.md` — Airtable + Supabase column schemas
- `AIRTABLE_IMPLEMENTATION_PLAN.md` — the data model build plan
- `SCOUTIT_AIRTABLE_SOP.md` — per-category data-entry SOP (golden rule: no data → blank)
- `PROPERTY_CATEGORY_SOP.md` — category content/spec rules
- `SCHEMA_COUNCIL_AUDIT.md` — schema review
- `supabase_schema.sql` · `supabase_rpc.sql` · `user_profile_schema.sql` — live SQL

**05 · Automations**
- `README.md` — automation registry + shared principles
- `LISTING_ENGINE.md` — the AI Council pipeline (Phase 2, monetized)
- `INGEST_EXTRACTOR.md` — the PDF → fields extractor (Phase 1)

**06 · Monetization**
- `SCOUTIT_PRICING_STRATEGY.md` — Cosmic tiers, Connects economy, bounties, ID cards, GTM sequencing

**07 · Features & Flows**
- `USER_FLOWS.md` — buyer & owner journeys
- `COMPARISON_TOOL_SPEC.md` — side-by-side space comparison spec
- `SCOUTIT_SCROLLYTELLING_PROMPT.md` — the cinematic manifesto build spec
- `scrollytelling-mission-text.md` — locked manifesto copy
- `FABLE_ONBOARDING_PROMPT.md` — onboarding prompt

**08 · Operations & Backlog**
- `SCOUTIT_FIX_LIST.md` — the single prioritized build/fix list + launch build order
- `WEBSITE_COUNCIL_AUDIT.md` — website audit
- `SCOUTIT_CLEANUP_PROMPT.md` — pre-launch cleanup playbook

**09 · Reference (raw)**
- `PROJECT_README.md` — original Next.js project README
- `REFERENCE_README.md` — notes on the owner's reference assets

**10 · Cyber Security**
- `SECURITY_HARDENING_REPORT.md` — record of Upstash rate limits, API payload checks, Playwright Council E2E tests, and Supabase RLS lockdown

---

## 6. Decisions log + remaining open items

> Owner rulings (June 2026). 1–3 are **decided — do not reverse**. 4 is still open.

**✅ DECIDED — Property prices (the "Your Move" price policy).**
Prices **are shown**, but **only in the property page's "Your Move" section** — it's the one
major data point almost every user needs. Compliance is preserved by **verification**:
- A price renders **only when owner-confirmed**, and the page **states it is the owner's
  asking price** (not a ScoutIt valuation). **Negotiation is a separate, later, off-platform
  step** — ScoutIt never facilitates the transaction.
- **No exact figure → a vague range is allowed, but still only with owner confirmation.**
- **No price data at all → show nothing.** (Honest blank, never a guess.)
- Money **never** appears on directory cards, category spec blocks, or filters — Your Move only.
- Schema already supports this: `Price_Status` (Published / On Request),
  `Price_Verified_By` (Owner / Property Manager / Broker / Unverified), `Listed_Price`,
  `Price_Source`, `Price_Notes`. (This supersedes the old "no prices shown anywhere" line.)

**✅ DECIDED — Launch pricing of the platform itself.**
Launch with **confirmed numbers or nothing.** No placeholder/guessed subscription prices go
live. The Cosmic-tier amounts in the Pricing Strategy stay internal until validated; until
then the public sees tier *names* only, not prices.

**✅ DECIDED — The Listing Engine / PDF extractor is a priority.**
Build the best-in-class AI extraction pipeline that can ingest **any PDF format an owner
submits** and turn it into a draft listing (still owner/human-approved, never auto-published).
Spec: `05_AUTOMATIONS/LISTING_ENGINE.md` + `INGEST_EXTRACTOR.md`.

**🟡 OPEN — Tagline.**
Still debatable — needs a rethink. Current: *"Get lost in spaces that actually inspire you."*
Candidate direction: a sharper, intelligence-terminal line (e.g. *"Philippine space.
Decoded."*). **Not decided.**

---

## 7. Keeping this folder fresh

This `_SCOUTIT_BRAIN` is a **consolidated copy** of docs that also live in the project root,
`/docs`, `/automations`, and `.claude`. When a source doc changes, refresh its copy here, or
treat this folder as the new canonical home and collapse the originals. **The running code
always wins over any document.**
