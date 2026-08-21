---
section: "00_META"
status: locked
tags: [meta, index, moc]
updated: 2026-08-18
related: ["[[00_SOP]]", "[[00_COUNCIL]]", "[[OBSIDIAN_VAULT_GUIDE]]", "[[00_VAULT_CONVENTIONS]]", "[[00_LOGIC_HIERARCHY]]"]
---

# 🛸 SCOUTIT BRAIN — START HERE

> **Graph spine:** [[00_LOGIC_HIERARCHY|ScoutIt Absolute Logic Hierarchy]] connects every ScoutIt-owned note through one parent MOC chain. Use it whenever you need to understand where a document belongs or why it exists.

**This folder is the complete knowledge base for ScoutIT.** Everything an AI agent, a new
developer, a partner, or an investor needs to understand *the whole of ScoutIT* lives here —
the idea, the concept, the bible, the architecture, the design system, the data model, the
automations, and the monetization.

> If you read only one file, read [[SCOUTIT_BIBLE]]. It is the single source of truth for what
> ScoutIT *is*. This file (`00_START_HERE.md`) is the map that points at everything else.

*Maintained by: EdgerzXc / Jerzel · Knowledge base compiled June 2026 · reorganized 2026-07-08.*

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

> 🆕 **2026-07-08 reorganization:** folder numbering had a bug (`08` was double-booked by both
> Operations and Security). Security is now consolidated into a single `09_SECURITY`, raw
> obsolete raw reference copies were removed, schematics stayed `11_SCHEMATICS`, a new
> `12_EXTERNAL_TOOLS` was added to hold vendored/cloned tool repos that aren't ScoutIt knowledge,
> and a new `13_EXTERNAL_INPUTS` was added as the bridge for future NotebookLM/ChatGPT brainstorm
> sessions. See [[00_VAULT_CONVENTIONS]] for the linking/frontmatter rules every note here follows.
>
> 🆕 **Same day, second and third passes:** a full read-through of `Dump/` found a large body of
> never-migrated Mission Control / security design work, then a follow-up pass finished the job —
> all 27 files read in full, cross-checked against the brain, and either confirmed already-covered
> or cut into atomic notes. The duplicated raw files were pruned after verified migration on 2026-08-13
> and `Dump/` itself is empty (see [[00_VAULT_CONVENTIONS]] §8). See
> [[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]] for what moved
> where, and read **[[00_MASTER_SYNC]] before anything else** below — it's the new always-current
> one-page dashboard.

| # | Folder | Read it to understand… |
|---|---|---|
| 0 | **`00_START_HERE.md`** (this file) | The map + the cheat sheet |
| ★★ | [[00_MASTER_SYNC]] | 🆕 **Read this first** — the always-current one-pager (North Star, active build queue, decision log, open owner decisions). Updated in place every session. |
| MASTER | [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] | **The only live execution list** — unfinished engineering, owner actions, unresolved decisions, and milestone-triggered obligations. Completed work is intentionally excluded. |
| ★ | [[00_SOP]] | **Read every turn** — operating rules + invariants that keep work aligned & non-breaking |
| ★ | [[00_COUNCIL]] | The 5-seat decision panel for product/UX calls |
| 📄 | `00_CONTEXT/` | Small standing-context notes (brand voice draft, SEO brainstorm) |
| 📅 | [[00_DAILY_LOG/README|Daily Log README]] | Quick dated scratch notes (Obsidian Daily Notes plugin writes here) |
| HISTORY | [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] | Historical launch program evidence; current open work is in the Master Action Plan. |
| 1 | **`01_IDENTITY_AND_VISION/`** | What ScoutIT *is*, why it exists, the wordplay, the manifesto, future ideas |
| 2 | **`02_ARCHITECTURE_AND_STRUCTURE/`** | The tech stack, folder map, dual-CMS data flow, AI working rules |
| 3 | **`03_DESIGN/`** | The visual DNA: 95% black / 5% gold, tokens, typography, motion |
| 4 | **`04_DATA_AND_SCHEMA/`** | Airtable + Supabase schemas, per-category data entry rules, SQL |
| 5 | **`05_AUTOMATIONS/`** | The Listing Engine, the AI Council, the PDF extractor specs |
| 6 | **`06_MONETIZATION/`** | The Cosmic tier system, Connects economy, bounties, pricing |
| 7 | **`07_FEATURES_AND_FLOWS/`** | User journeys, scrollytelling manifesto, comparison tool, onboarding |
| 8 | **`08_OPERATIONS_AND_BACKLOG/`** | Build order, fix list, audits, cleanup playbook, session handoffs, 🆕 Mission Control blueprint + Scenarios & Playbooks (draft) |
| 9 | **`09_SECURITY/`** | 🆕 merged security home — OWASP, CIS benchmarks, Supabase RLS, hardening report, 🆕 Sentinel Layer design (draft) |
| 11 | **`11_SCHEMATICS/`** | Visual system maps (one `.svg` per system) — start with Mission Control |
| 12 | **`12_EXTERNAL_TOOLS/`** | 🆕 vendored/cloned tool repos (e.g. `SEO_REPOS/`) kept for reference — **not** ScoutIt knowledge, excluded from Obsidian's graph/search |
| 13 | **`13_EXTERNAL_INPUTS/`** | 🆕 the bridge for external AI brainstorming (NotebookLM/ChatGPT/Gemini) — dated, triaged entries that graduate into the real numbered sections |
| 14 | **`14_CLI_OPERATIONAL_AUTOMATIONS/`** | Staff-triggered command-line workflow blueprints and safety rules |
| 15 | **`15_IMPLEMENTATION_RECORDS/`** | Tracked active packets plus clearly labelled historical/reference implementation records moved out of the repository root |
| 16 | **`16_LEGAL_AND_COMPLIANCE/`** | 🆕 Statutory Legal Master Blueprint & Pre-Launch Compliance Action Plan (RESA RA 9646, DPA RA 10173, E-Commerce Act RA 8792, Consumer Act RA 7394, IP Code RA 8293, NPC Circulars) |

**Also in this folder, outside the numbered sections:**
- [[BRAIN_MAP]] — a visual canvas map of how every section connects
- `All Notes.base` — a live, filterable table of every note (by section / status / tags)
- `QUESTIT_FUTURE/` — a parked, unrelated future platform. ⚠️ Read its own README before touching anything there.

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
- **Supabase = private user data.** Auth, explicitly merged cloud saves (`saved_intel`),
  owner drafts/properties, units, deals, CRM, calendars, and operations. The public Ledger
  remains device-local until a user chooses to merge it.
- **Never mix them.** Airtable = public display. Supabase = private state.
- **Mapbox** geocodes string locations server-side; a **Haversine** formula in the API route
  powers radius search. **Leaflet** draws static property maps.
- **Stack:** Next.js 16.3.0 (App Router, *modified* — check
  `node_modules/next/dist/docs/`), React 19, plain JS, vanilla CSS + CSS Modules on public
  surfaces + **Tailwind on the dashboards** (allowed since the 2026-06-26 correction — see
  Design DNA below), deployed on Vercel (`EdgerzXc/ScoutIt`).

### The product surface
- **Homepage = a descent** through 6 numbered layers (Hero → The Board → Property Experiences
  → Discovery & Intelligence → Ecosystem Services → Your Board → About).
- **6 dedicated "layer" route pages (all under `/layer/*`):** `/layer/orbit` (The Board) ·
  `/layer/stratosphere` (Intel) · `/layer/metropolis` (Explore) · `/layer/crust` (Network) ·
  `/layer/mantle` (Archive) · `/layer/core` (Your Workspace). Nav pills show plain labels
  (e.g. "Stratosphere · Intel").
- **The Showcase (`/showcase` / "The Board")** = a curated, luxury leaderboard ranking top
  properties by earned demand, inquiry velocity, and spatial intelligence merit. 3-column
  desktop HUD (Left = Inquiry Velocity, Center = 16:9 verified media, Right = Showcase
  Distinction & Merits). Per-rank cosmic periphery backgrounds (Universe = deep-space nebula,
  Cluster = galactic gas clouds, Solar = planetary orbits, Starry = Van Gogh beach horizon).
  Monthly operator curation per Master Action Plan §16. Raw data tables are banned from the
  Showcase — they belong on the Property Page. See [[WEBSITE_ARCHITECTURE]] §8.
- **The Ledger** = private, device-only wishlist (4 tags: Potential Fit / Interested /
  Inspired Me / Save). No account required.
- **Property pages** use a **chapter-registry system** — 10 chapters, reframed per category
  (see [[PROPERTY_ARCHITECTURE]]). Fields are tiered `needed` (free) or `extra` (paid).

### Design DNA
- **~95% darkness, ~5% gold.** Gold is a signature, not wallpaper.
- **Use CSS variables, never raw hex.** `--accent` `#E8AE3C` (refined amber, 2026-06-26 — warmer
  than the old `#FFB800`), `--accent-bright` `#F7C64E`, `--accent-muted` `#6E531A`, canvas `--bg` `#0d0d0d`.
- Serif display headlines (Georgia), Geist Sans body, **mono uppercase wide-tracked eyebrows**.
- Glassmorphism, slow/intentional motion, localized glow.
- **Allowed (corrected 2026-06-26):** **Tailwind** (used across the app alongside vanilla CSS) and
  **Three.js/WebGL** backgrounds — both gated by **Lite Mode** (`src/lib/liteMode.js`), a global toggle
  that disables animations/3D for low-end phones. **Banned:** raw hex, glow-everywhere. Dark is the
  default; light/high-contrast modes live in the Display panel.

### Monetization (the Cosmic tiers)
- Four ascending tiers for every user type: **Starry (free) → Solar → Cluster → Universe.**
- Monetizes **access, intelligence, visibility, and connection — never the act of discovery.**
- **Connects** = internal currency for cross-user actions (contact a broker,
  pitch a listing, commission a shoot). The ledger separates monthly
  (expiring), purchased (permanent), and reward (permanent) balances and spends
  them in that order.
- **Bounty Hunts** = crowdsourced, geo-tagged data verification → a living, self-updating
  dataset. **Brokers' Scout Rating is earned only when both sides complete the
  in-platform buyer–broker transaction handshake after a viewing.** The separate
  owner–broker representation handshake does not count, and rating is never bought.
- B2B (brokers, photographers, researchers, event designers pay for tools + visibility) +
  B2C (buyers pay for deeper intelligence + privacy).

### Automations
- **Listing Engine** (Phase 2, monetized): thin PDF → AI extractor → web researcher → an AI
  **Council** (Design Expert + Owner Advocate + Buyer Advocate + Category Master) → an Arbiter
  that routes Approve / loop / human. **No source → field stays blank. Never invents.**
- **PDF Ingest Extractor** (Phase 1): extracts only facts literally present,
  creates a private Supabase property draft, and routes ScoutIt's translation
  through source-PDF verification before publication.

---

## 4. The non-negotiable rules (for anyone — human or AI — working on ScoutIT)

1. Read [[SCOUTIT_BIBLE]] and `02_ARCHITECTURE_AND_STRUCTURE/AGENTS.md` first.
2. This is a **modified Next.js 16.3.0** — check `node_modules/next/dist/docs/` before writing
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

**00 · Meta**
- [[00_LOGIC_HIERARCHY]] - exhaustive root-to-note graph spine
- [[00_MASTER_SYNC]] — 🆕 **read first** — the always-current one-pager
- [[00_SOP]] — operating rules, read every session
- [[00_COUNCIL]] — the 5-seat decision panel
- [[00_VAULT_CONVENTIONS]] — 🆕 how this vault is organized: frontmatter schema, linking rules, status tags
- [[OBSIDIAN_VAULT_GUIDE]] — how to actually use this folder as an Obsidian vault
- [[15_IMPLEMENTATION_RECORDS/reference/property-units/UNITS_HANDOFF_2026-06-22|UNITS_HANDOFF_2026-06-22]] - historical property-unit source record
- [[00_DAILY_LOG/README|Daily Log README]] - rare dated working notes; current state belongs in [[00_MASTER_SYNC]]
- `00_CONTEXT/brand-voice.md` — early brand-voice draft (⚠️ check against [[BRAND_VOICE_AND_COPY_SOP]] in 03 — may be superseded, see [[00_VAULT_CONVENTIONS]] duplicate-flags)
- `00_CONTEXT/SEO_BRAINSTORM.md` — SEO brainstorm notes

**01 · Identity & Vision**
- [[SCOUTIT_BIBLE]] — ⭐ the master reference (identity, wordplay, vision, business, features, design, data, GTM)
- [[01_IDENTITY_AND_VISION/NEW_IDEAS|NEW_IDEAS]] — future feature ideas (Resident Intel, Post-Move Layer, Affordability Layer). 🆕
  2026-07-08 gained #11 Owner Dashboard Intelligence & Gamification and #12 Phased Feature-Unlock
  Roadmap, both from the Dump migration.
- [[LEGAL_AI_REVIEW_PROMPT]] — the legal/compliance AI review prompt
- [[UNIFIED_SURFACE_TEST]] — 🆕 draft (2026-07-08, from Dump): the litmus test for whether a
  proposed feature belongs on ScoutIt's unified surface or should stay a separate module
- [[FOUNDER_FEATURE_GATE]] — 🆕 draft (2026-07-08, from Dump): the founder-approval gate a new
  feature idea must pass before it gets built
- [[PRODUCT_STRATEGY_PILLARS]] — 🆕 draft (2026-07-08, from Dump): the strategic pillars behind
  product decisions, companion to the Workflow Gravity lens in [[CRM_INITIATIVE]]

**02 · Architecture & Structure**
- [[SCOUTIT_OS_ARCHITECTURE]] — 🆕 User, Role, Workspace & Enterprise Architecture
- [[02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE|STRUCTURE]] — master architecture & folder map
- [[PROPERTY_ARCHITECTURE]] — the chapter-registry refactor + per-category content system
- `02_ARCHITECTURE_AND_STRUCTURE/AGENTS.md` — the master AI system prompt and design rules
- [[02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE|STRUCTURE]] — standing project context for AI sessions
- [[WEBSITE_ARCHITECTURE]] — site/route map
- [[MMC_AND_BRAIN_VISION]] — the Mission-Control-and-Brain long-term vision note
- `structure.txt` — raw folder tree snapshot
- [[SECOND_BRAIN_FIVE_LEVELS]] — 🆕 draft (2026-07-08, from Dump): the five-level model for how
  this vault itself should mature as a "second brain"

**03 · Design**
- [[SCOUTIT_DESIGN_BRIEF]] — brand brief & visual system
- [[SCOUTIT_DESIGN_BRIEF]] — design audit findings
- [[BRAND_VOICE_AND_COPY_SOP]] — voice + copy rules
- [[DASHBOARD_ATMOSPHERE_FRAMEWORK]] — 🆕 approved-direction, not-yet-built spec for dashboard
  structure (Identity → Status → Scout Insight → Workspace → Role Atmosphere) + per-role ambient
  differentiation — read before any dashboard design/UI work

**04 · Data & Schema**
- [[MASTER_PROPERTIES_GOLD_STANDARD]] — ⭐ the 6 reference properties (one per category, fully
  populated public/hidden/vault data) — the "done" standard to check any property-page feature
  against; do not delete these records
- [[FIELD_VISIBILITY_MAP]] — ⭐ SIGNED OFF (2026-07-02): what's PUBLIC vs HIDDEN INTEL vs INTERNAL, per page section × category
- [[VISIBILITY_MAP__RESIDENTIAL]] · [[VISIBILITY_MAP__COMMERCIAL]] · [[VISIBILITY_MAP__STR]] ·
  [[VISIBILITY_MAP__HOSPITALITY]] · [[VISIBILITY_MAP__RESTAURANTS]] · [[VISIBILITY_MAP__VENUES]] —
  one per category, the operational references
- [[DATA_DICTIONARY]] — Airtable + Supabase column schemas
- [[AIRTABLE_COMPRESSION_PLAN]] — 🆕 2026-07-30 integration audit. Proves the base was already
  ~90% correctly wired, records the 3 real findings (incl. an SEO generator that had **never**
  worked), and costs + **rejects** category-field compression. Also holds the settled
  **one row per building** units ruling.
- [[FIELD_REGISTRY_AND_KEY_ALIASES]] — 🆕 2026-07-30. The code-side layer that makes the terse
  base human-readable in Mission Control without changing Airtable, and collapses the three
  naming conventions that coexist in `properties.details`.
- [[CATEGORY_FIELD_SOP]] — per-field rules by category
- [[AIRTABLE_IMPLEMENTATION_PLAN]] — the data model build plan
- [[SCOUTIT_AIRTABLE_SOP]] — per-category data-entry SOP (golden rule: no data → blank)
- [[PROPERTY_CATEGORY_SOP]] — category content/spec rules
- [[SCHEMA_COUNCIL_AUDIT]] — schema review
- [[OPTION3_BACKEND_HARDENING_PLAN]] — backend hardening options
- [[SUPABASE_AUTH_INTEGRATION_PLAN]] — auth integration plan
- [[DATA_DICTIONARY]] — the live Supabase schema, human-readable
- [[DATA_DICTIONARY]] — how to rebuild Supabase after a reset
- `supabase_schema.sql` · `supabase_rpc.sql` · `user_profile_schema.sql` · `VIDEO_UPLOAD_QUEUE_MIGRATION.sql` — live SQL

**05 · Automations**
- [[05_AUTOMATIONS/README|Automations README]] — automation registry + shared principles
- [[LISTING_ENGINE]] — the AI Council pipeline (Phase 2, monetized)
- [[INGEST_EXTRACTOR]] — the PDF → private draft → source-verification extractor (Phase 1)
- [[BULK_CSV_ENGINE]] — bulk CSV ingest spec

**06 · Monetization**
- [[SCOUTIT_PRICING_STRATEGY]] — Cosmic tiers, Connects economy, bounties, ID cards, GTM sequencing
- [[CONNECTS_AND_BROKER_HANDSHAKE]] — Connects economy ⇄ broker handshake mechanics
- [[TIER_DISTINCTION]] — what separates each Cosmic tier
- [[VAULT_LISTING_LIFECYCLE]] — a listing's lifecycle through the Vault

**07 · Features & Flows**
- [[07_FEATURES_AND_FLOWS/SEO_STRATEGY/README|SEO Strategy]] - canonical SEO operating model, structured-data registry, source curation, and validation runbook
- [[OSINT_INTEL_ARCHITECTURE]] — ⭐ Master Architecture & Operational Blueprint for OSINT Ingestion, AI Search Engine Integration, Mission Control 1-Click Prompting, and 3D Spatial Radar Map
- [[USER_FLOWS]] — buyer & owner journeys
- [[USER_EXPERIENCES]] — experience-level detail behind the flows
- [[COMPARISON_TOOL_SPEC]] — side-by-side space comparison spec
- [[SCOUTIT_SCROLLYTELLING_PROMPT]] — the cinematic manifesto build spec
- [[scrollytelling-mission-text]] — locked manifesto copy
- [[ORIGIN_STORY_SCROLLYTELLING]] — the parked origin-story scrollytelling spec
- [[SCOUTIT_SCROLLYTELLING_PROMPT]] — onboarding prompt
- [[BROKER_HANDSHAKE_CHAT]] — broker handshake/chat build spec
- [[VIRTUAL_TOUR_STRATEGY]] — virtual tour strategy
- [[BROKER_FIELD_BRIEFING_AND_VOICE_COPILOT_SPEC]] — field briefing, voice copilot, and owner-intercom blueprint
- [[LIFESTYLE_INTELLIGENCE_V2_SPEC]] — deeper "Where To?" lifestyle intelligence architecture
- [[PROPERTY_FRESHNESS_AND_STALENESS_SPEC]] — listing freshness, re-verification, and staleness lifecycle
- [[ZERO_LOG_AI_CRM_SPEC]] — CRM milestone intelligence without retaining raw chat/audio

**08 · Operations & Backlog**
- [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] — ⭐ canonical step-by-step launch execution plan
- [[MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN]] — pre-launch property/owner/broker Spotify-Wrapped-style metrics build
- [[FOUNDER_LAUNCH_BUDGET_CHECKLIST]] — dated required/optional provider budget and founder activation order
- [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] - retired historical LR-01 execution prompt; do not run as the current queue
- [[SESSION_HANDOFF_2026-07-30]] - latest dated handoff in the archived handoff chain; use [[00_MASTER_SYNC]] and the canonical action files for current state, because handoffs are chronological evidence rather than live queues
- [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] — every bug/unverified flow flagged during codebase work, batched for one E2E pass
- [[HEATMAP_NOAH_INTEGRATION_PLAN]] — NOAH/HazardHunterPH research + the ready-to-execute plan for the flood-risk map layer
- [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] — the single prioritized build/fix list + launch build order
- [[FUTURE_SCALING_ROADMAP]] — longer-horizon scaling plan
- [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] — website audit
- [[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]] — pre-launch cleanup playbook
- [[MISSION_CONTROL_SOP]] — how Mission Control operates
- [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] — stale historical pre-launch checklist; superseded by [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]]
- [[PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS]] — staff/enterprise analytics + notifications plan
- [[09_SECURITY/README|Security]] — vulnerability audit
- [[00_START_HERE]] — the standing prompt used to launch a fresh AI session
- [[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]] — deploy prompt record
- [[CRM_INITIATIVE]] — "relationship intelligence, not contact management" CRM philosophy +
  Workflow Gravity strategic lens. 🆕 **2026-07-09: v1 built** (Broker mode + Timeline + Tasks +
  Listing Strength, see its §6) — read before scoping any further lead/pipeline work.
- `SESSION_HANDOFF_*.md` — the full dated run of session handoffs, oldest to newest (2026-06-25 → 2026-07-30)

- [[SCENARIOS_AND_PLAYBOOKS]] — draft (2026-07-08, from Dump, not yet owner-reviewed): the
  edge-case rule matrix (disputes, AI guardrails, Connects economy, enterprise delegation,
  compliance/privacy, infrastructure)
- [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] — 🆕 draft (2026-07-08, from Dump): a proposed launch order that
  conflicts with [[00_MASTER_SYNC]]'s security-first order — open, not resolved
- [[PROFESSIONAL_CRM_MODULE_MAP]] — 🆕 draft (2026-07-08, from Dump; updated 2026-07-09): the
  Professional cockpit's module list per role — Broker portion now partly built, see the note itself
- [[ENTERPRISE_MISSION_CONTROL_SPEC]] — 🆕 draft (2026-07-08, from Dump): the Enterprise cockpit's
  role hierarchy + checklist-based permission model
- [[MISSION_KANBAN_AUTOMATIONS]] — 🆕 draft (2026-07-08, from Dump): the churn win-back automation
  + the Lexitary-column Kanban variant
- [[CRM_WORKFLOW_GRAVITY_AUTOMATIONS]] — 🆕 draft (2026-07-08, from Dump): the concrete
  auto-linking/timeline/reminder automations behind [[CRM_INITIATIVE]]'s Workflow Gravity lens —
  the Timeline piece is now real, see [[CRM_INITIATIVE]] §6
- [[MISSION_CONTROL_REAL_BUILD_STATUS]] — 🆕 (2026-07-09) **read this first for anything Mission
  Control**: what's actually live in the real, separate `ScoutIt/mission-control/` app (RBAC, User
  CRM, Property Review Queue, Audit Log, Feature Gates, Staff IAM, Badges, CSV import, Metrics) +
  the standing caution that repo has zero git commits, don't commit there without asking
- [[MISSION_CONTROL_REAL_BUILD_STATUS]] — 🆕 (2026-07-09) copy-paste one-shot build prompt for
  Mission Control — **superseded, do not run**, a real app already exists (see above)
- [[CRM_INITIATIVE]] — 🆕 (2026-07-09) **✅ run** — the CRM counterpart, extends the
  main repo. Full outcome (what got built/fixed, incl. a real security bug found and partially
  fixed) is logged in the doc itself and in [[00_MASTER_SYNC]]

**09 · MCP & Integrations**
- [[09_MCP_AND_INTEGRATIONS/README|MCP & Integrations README]] — services ScoutIt actually uses,
  their operational constraints, and the external MCP reference catalogue
- [[09_MCP_AND_INTEGRATIONS/README|MCP and Integrations]] — reference catalogue only; inclusion is not an adoption decision

**09 · Security** *(merged from the old `08_SECURITY` + `10_CYBER_SECURITY` split)*
- [[SENTINEL_LAYER]] — draft (2026-07-08, from Dump, not yet owner-reviewed): behavioral
  telemetry / IP-masking active-defense design (Velocity Radar, automated quarantine)
- [[SECURITY_HARDENING_REPORT]] — record of Upstash rate limits, API payload checks, Playwright Council E2E tests, and Supabase RLS lockdown
- [[SUPABASE_RLS_GUIDE]] — how RLS is applied across tables
- [[OWASP_TOP_10]] · [[OWASP_CHEAT_SHEETS]] — reference material
- [[CIS_BENCHMARKS_OVERVIEW]] — CIS benchmark reference
- [[SEC_LISTS_DEFENSE]] — SecLists-based defense notes
- **Resolved 2026-07-09:** the `mockOwnerId` client-trusted-ID impersonation gap was closed
  across the affected routes and the permissive RLS policies were reset. See
  [[09_SECURITY/README|Security]] for the original finding and verification record.

**11 · Schematics**
- `mission-control.svg` — visual system map, start here
- [[SCOUTIT_FULL_WORKFLOW]] — owner-locked end-to-end platform and property lifecycle map
- `11_SCHEMATICS/README.md` — how to read the schematics

**12 · External Tools** 🆕
- `SEO_REPOS/` — three vendored/cloned repos (`claude-seo`, `geo-seo-claude`, `seomachine`) kept
  as reference material for the SearchFit SEO plugin work. **Not ScoutIt knowledge** — excluded
  from Obsidian's search/graph. Don't treat anything in here as a source of truth about ScoutIt.

**13 · External Inputs** 🆕
- [[13_EXTERNAL_INPUTS/README|External Inputs README]] — the protocol for bridging future
  NotebookLM/ChatGPT/Gemini brainstorming into the brain (dated entries, triaged within weeks)
- [[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]] —
  the log of what this reorg pass found in `Dump/` and where it landed

**14 · CLI Operational Automations**
- [[14_CLI_OPERATIONAL_AUTOMATIONS/README|CLI Automations README]] — scope, safety boundaries,
  and status of every staff-triggered command-line workflow
- [[01_HEADLESS_CLI_OPERATIONAL_BLUEPRINT]] — umbrella OSINT/PDF/3D/map/SEO blueprint
- [[02_OSINT_ARTICLE_AUTOMATION_PROMPT]] — weekly OSINT article research prompt
- [[INGEST_EXTRACTOR]] — **stale; do not run** until replaced by the
  owner-linked private-draft and source-verification flow

**15 · Implementation Records**
- [[15_IMPLEMENTATION_RECORDS/README|Implementation Records README]] — the status-labelled home
  for active execution packets, old handoff chains, launch audits, and preserved source material
  that previously sat loose at the repository root
- Historical records are evidence, not the current build queue; always start from
  [[00_MASTER_SYNC]] and runtime code

**16 - Legal & Compliance**
- [[16_LEGAL_AND_COMPLIANCE/README|Legal and Compliance README]] - section rules, official sources, and classification cautions
- [[LEGAL_DOCUMENTATION_COMPLIANCE_MASTER_BLUEPRINT]] - draft design target; not legal sign-off

**QuestIT (future — do not touch)**
- [[QUESTIT_FUTURE/README|QuestIT README]] — ⚠️ **read before touching anything QuestIT-related.** QuestIT is
  a separate standalone future platform (not a ScoutIt module) — explicitly parked by the owner.
- `QUESTIT_FUTURE/questit_api_schema.sql` — the draft DB schema for the ScoutIt↔QuestIT bridge, written but never applied

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
live. The Cosmic-tier amounts in [[SCOUTIT_PRICING_STRATEGY]] stay internal until validated;
until then the public sees tier *names* only, not prices.

**✅ DECIDED — The Listing Engine / PDF extractor is a priority.**
Build the best-in-class extraction pipeline that can ingest **any PDF format an
owner submits** and turn it into a private draft listing. ScoutIt verifies that
its structured extraction matches the source PDF before publication; the owner
remains the primary source of truth. Spec: [[LISTING_ENGINE]] +
[[INGEST_EXTRACTOR]].

**🟡 OPEN — Tagline.**
Still debatable — needs a rethink. Current: *"Get lost in spaces that actually inspire you."*
Candidate direction: a sharper, intelligence-terminal line (e.g. *"Philippine space.
Decoded."*). **Not decided.**

---

## 7. Keeping this folder fresh

`_SCOUTIT_BRAIN` is the **canonical home** for ScoutIt knowledge, strategy, handoffs,
and operating documentation. Do not recreate parallel copies in the repository root,
`/docs`, `/automations`, or agent folders. Historical records may remain where indexed,
but current actions belong only in the two canonical action files. **The running code and
verified live systems always win over any document.**

See [[00_VAULT_CONVENTIONS]] for the frontmatter + linking rules to follow whenever you add or
edit a note here, so the graph and backlinks stay meaningful instead of decorative.
