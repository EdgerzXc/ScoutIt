# SCOUTIT — MASTER CONTEXT FILE
### The single document that gives any AI complete project context.
> Read this before touching anything. It covers identity, architecture, design, monetization,
> data, features, decisions, current build state, and what comes next.
> **The running code always wins over any document.** When in doubt, read the source.

---

## PART 1 — WHAT SCOUTIT IS

ScoutIt is a **Spatial Commerce platform** for the Philippines — not a real estate listing site.
It treats all physical space (residential, commercial, STR, hospitality, restaurants, event venues)
as a single, data-dense intelligence layer. Instead of pressure-selling listings, it gives users
**editorial briefings, market signals, curated discovery, and a private wishlist** that never
touches a server.

> Think less Lamudi, more **Bloomberg for space.**

**The name is a layered puzzle:**
- **Scout + IT** = intelligence technology applied to scouting space
- **SIT** = what you do when seriously considering a space — you *sit* with it
- **S.I.T.** = Space · Intelligence · Technology (the positioning spine)

**The UFO mascot** = something that doesn't fit existing categories, descending from a different
altitude. That is ScoutIt in the market. **The UFO stays. Always.**

**Core promise:** No guesswork. No gatekeeping. No pressure. The signals are real.

**Tagline:** *"Get lost in spaces that actually inspire you."*
(Candidate: *"Philippine space. Decoded."* — not yet decided)

**Compliance:** Operates under the Real Estate Service Act, RA 9646.
*Intelligence First. Transactions Never.* ScoutIt displays and informs — never facilitates transactions.

**Six space categories:** Residential · Commercial · Short-Term Rental · Hospitality · Restaurants · Venues

---

## PART 2 — DESIGN DNA (NON-NEGOTIABLE)

- **Always dark mode.** 95% deep black, 5% gold. Gold is a signature, not wallpaper.
- **CSS variables only — never raw hex:**
  - `--accent: #E8AE3C` (primary amber gold — refined 2026-06-26, warmer/less yellow than the old #FFB800)
  - `--accent-bright: #F7C64E` (buttons, CTAs, hover)
  - `--accent-muted: #6E531A` (borders, dividers)
  - rgb tuples for glows: primary `232, 174, 60`, bright `247, 198, 78` (used in `rgba(...)` shadows + the WebGL backgrounds)
  - Canvas: `#0d0d0d` / `#121212`
- **Typography:** Serif display headlines (Georgia), Geist Sans body, mono uppercase wide-tracked eyebrows (`var(--font-mono)`) for labels/buttons/metrics
- **Feel:** Glassmorphism (`backdrop-filter: blur`), slow/intentional motion, localized glow
- **Banned:** light mode as the *default*, raw hex, glow-everywhere, Bootstrap-style components
- **Allowed (reality check, 2026-06-26):** Tailwind utility classes are used throughout alongside vanilla CSS + CSS Modules. Three.js/WebGL and a 2D canvas power the homepage + layer-page backgrounds. These are permitted because **Lite Mode** (a global toggle in the Display panel / mobile Theme sheet) disables all animations, the canvas, and the WebGL backgrounds so low-end phones never lag. See `src/lib/liteMode.js`.

---

## PART 3 — TECH STACK & ARCHITECTURE

### Stack
- **Framework:** Next.js 16.2.7 (App Router, Turbopack) — **modified version with breaking changes**. Always read `node_modules/next/dist/docs/` before writing framework code.
- **Language:** Plain JavaScript (no TypeScript). React 19.
- **Styling:** Vanilla CSS + CSS Modules **and Tailwind** (utility classes are used across pages/components; Tailwind is configured in `tailwind.config.js`).
- **Maps:** Mapbox (geocoding, tokens), Leaflet (static property maps)
- **Deployment:** Vercel. Two projects deploy the same repo: `scoutit` and `scout-it`. Both auto-deploy on push to `main`.
- **Repo:** `EdgerzXc/ScoutIt` on GitHub

### The Dual-CMS Golden Rule — NEVER mix these

| System | Role | Access |
|---|---|---|
| **Airtable** | Public read-only content | Properties, brokers, articles, bounties, categories, pricing config |
| **Supabase** | Private user data | Auth, owner submissions, connects wallet, deals, saved intel, profiles |

- **Airtable** is served through one proxy: `src/app/api/cms/route.js` — never call Airtable directly from the client
- **Supabase** is for everything a logged-in user owns or creates
- Mapbox geocodes string locations server-side; a Haversine formula in the API route powers radius search

### Key Source Files

```
src/app/api/cms/route.js          ← Airtable proxy (public CMS, ALL public data)
src/lib/airtable.js               ← Airtable field mapping + camelCase aliases
src/lib/supabaseClient.js         ← Supabase client
src/lib/profileClient.js          ← all profile read/write functions
src/lib/entitlements.js           ← tier/feature gating + Connects allowance (source of truth)
src/lib/connectsWallet.js         ← 3-bucket Connects engine (localStorage, Supabase is next)
src/context/DashboardContext.js   ← main dashboard state, all actions
src/components/dashboard/OwnerMode.js  ← owner dashboard + Vault wizard
src/app/api/dashboard/invite/route.js  ← handshake/broker invite + Connect deduction
src/app/api/dashboard/publish/route.js ← owner publish → Supabase → Airtable sync
src/app/api/dashboard/update/route.js  ← owner edit → Supabase + Airtable sync (if approved)
src/app/api/v1/questit/raise/route.js  ← QuestIT API bridge
src/app/pricing/                  ← all pricing pages
```

### Supabase → Airtable Sync Points
1. `POST /api/dashboard/publish` → `pipeline_status = approved` in Supabase → `insertProperty()` to Airtable `PROPERTIES_CMS`
2. `POST /api/dashboard/update` → updates Supabase → if already approved, calls `updateProperty()` to keep Airtable in sync

---

## PART 4 — THE PRODUCT SURFACE

### Site Structure
- **Homepage** = a descent through 6 numbered layers:
  1. Hero
  2. The Board (properties)
  3. Property Experiences
  4. Discovery & Intelligence
  5. Ecosystem Services
  6. Your Board → About

- **6 dedicated layer route pages (all under `/layer/*`):**
  - `/layer/orbit` — The Board (top properties)
  - `/layer/stratosphere` — Stories & Intel
  - `/layer/metropolis` — Explore (property directory)
  - `/layer/crust` — The Ecosystem (verified network)
  - `/layer/mantle` — Discovery
  - `/layer/core` — Your Workspace (wishlist + dashboard)
  - Each layer nav pill shows a plain-language companion (e.g. "Stratosphere · Intel") so first-time users aren't lost.

- **The Ledger** = private, device-only wishlist. 4 reaction tags: Potential Fit / Interested / Inspired Me / Save. **No account required. Never gated. Never server-required.**

### Property Pages — Chapter System
10 chapters per property page, reframed per space category. Fields split into:
- `needed` = free tier (everyone sees)
- `extra` = paid tier (Solar+ unlocks)

### The VIP Spatial Vault
- Luma 3D maps, Matterport 360 tours, drone heatmaps
- **Gated at Cluster+ tier**
- Owners input via the Vault wizard in OwnerMode:
  - **Path A:** Paste a URL (Matterport/Luma/etc) → live immediately
  - **Path B:** Build one — "I'll record myself" (video upload) OR "ScoutIT team records it" (joins queue → internal QuestIT quest, invisible to owner)

---

## PART 5 — USER ROLES & ECOSYSTEM

| Role | What they do | Key tools |
|---|---|---|
| **Seeker / Buyer** | Discover and research spaces | Ledger, Vault, Deep Intel, anonymous browsing |
| **Property Owner** | List and manage their assets | Dashboard, VIP Vault, Concierge, broker management |
| **Broker** | Get leads, pitch owners, manage listings | Scout Rating, pitch system, Lead Analytics |
| **Photographer / Creator** | Shoot listings, earn bounties | CDN portfolio, bounty access, ID card |
| **Researcher** | Submit and verify intel | Credibility score, bounty participation |

**Brokers' Scout Rating:** earned by verified closures only — never bought, never tier-granted. This is a locked invariant.

---

## PART 6 — MONETIZATION

### The Cosmic Tier System
Four tiers for every role: **Starry (free) → Solar → Cluster → Universe**

Monetizes: **access · intelligence · visibility · connection** — never the act of discovery.

### Per-Role Pricing (Cluster = the sweet spot)

| Role | Starry | Solar | Cluster | Universe |
|---|---|---|---|---|
| Seeker | ₱0 | ₱149 | ₱499 | ₱2,499 |
| Owner | ₱0 | ₱899 | ₱2,499 | ₱9,999 |
| Broker | ₱0 | ₱999 | ₱1,999 | ₱7,999 |
| Photographer | ₱0 | ₱199 | ₱599 | ₱1,499 |

> Pioneer Cohort: locked-forever rates for first 20 slots per role.
> All prices show "Coming Soon" — payments launch after 200 properties are listed.

### Monthly Connects Allowance per Tier

| Role | Starry | Solar | Cluster | Universe |
|---|---|---|---|---|
| Seeker | 1 | 6 | 15 | 40 |
| Owner | 1 | 6 | 18 | 40 |
| Broker | 1 | 8 | 20 | 50 |
| Photographer | 1 | 5 | 12 | 25 |
| Researcher | 1 | 5 | 12 | 25 |

### Multi-Role Bundles (live at `/pricing/bundles`)

| Bundle | Roles | Price | Saves | Connects |
|---|---|---|---|---|
| **Binary** | Seeker + Broker | ₱2,199 | ₱299 (12%) | 38/mo |
| **Eclipse** | Seeker + Owner | ₱2,599 | ₱399 (13%) | 36/mo |
| **Orbit** | Owner + Photographer | ₱2,699 | ₱399 (13%) | 33/mo |
| **Constellation** | Seeker + Owner + Broker | ₱3,999 | ₱998 (20%) | 60/mo |

> **Eclipse is the strongest ARPU lever** — only ₱100 more than standalone Owner Cluster.
> Lead owner-facing screens with Eclipse, not standalone Owner.

### The Connects Economy

**3 buckets per (user, role) wallet:**
- `granted` — monthly allowance, resets on the 1st, no rollover
- `purchased` — bought via Connect packs, never expires
- `earned` — bounty payouts, never expires

**Spend order:** granted first → purchased → earned (use the expiring ones first)

**Anti-exploit rule:** `granted_tier` tracks which tier issued this month's grant. Mid-month upgrade → grant the delta only. Downgrade → next month resets at lower tier. Subscribe-cancel farming is blocked.

**Costs:**
- Handshake (owner invites broker OR broker pitches owner): 1 Connect
- Seeker → broker contact: 1 Connect
- Commission photographer/researcher/event planner: 2 Connects

**Connect Packs (buy extra):** ₱49 / ₱199 / ₱499 / ₱1,199

### Bounty Hunts
- Crowdsourced, geo-tagged data verification tasks
- Researchers/photographers claim bounties, submit proof, earn Connects
- Owner (Cluster+) must approve before payout
- Bounty definitions live in Airtable `BOUNTIES`; claims stored in Supabase `bounty_claims`

### QuestIT
- A **separate future platform** — ScoutIT is just one client/company that uses it
- QuestIT has its own API + MCP server; companies integrate it via policy
- When an owner joins the Vault queue → ScoutIT internally posts a QuestIT quest
- If no community member claims it → ScoutIT sends their own team
- **Invisible to the property owner** — they just see "ScoutIT team records it"
- ⚠️ **Explicitly parked — see `QUESTIT_FUTURE/README.md` before touching any `questit_*` table
  or route.** The bridge routes (`api/v1/questit/raise`, `api/v1/questit/quests`) and their draft
  schema already exist but are intentionally not wired up yet.

### The Vault Listing Lifecycle
1. Owner joins Vault queue (Cluster+)
2. ScoutIT posts internal QuestIT quest
3. Creator/photographer claims quest and shoots the space
4. ScoutIT delivers: Luma 3D map + Matterport tour + drone heatmap
5. Owner pastes delivery URL into Vault wizard → goes live on property page

---

## PART 7 — SUPABASE DATABASE

### Current State
- **Auth:** localStorage-based mock (no Supabase Auth yet). `user_id` is text like `"usr-1700000000"`
- **RLS:** DEV-OPEN (`for all using (true)`) — must harden before real subscribers
- **All 15 tables documented in:** `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/SUPABASE_REBUILD_GUIDE.md`

### Tables

| Table | Purpose |
|---|---|
| `properties` | Owner submissions / listing drafts (NOT public Airtable listings) |
| `deals` | Broker pitch / handshake workspace |
| `saved_intel` | Private wishlist server-mirror (localStorage is primary) |
| `error_reports` | Client error logging |
| `user_profiles` | Identity + tier/role cache |
| `privacy_settings` | Per-user privacy controls |
| `broker_profiles` | Broker extended data (scout_rating, verified_closures) |
| `researcher_profiles` | Researcher extended data |
| `projects` | Photographer/provider portfolio items |
| `connect_balances` | 3-bucket Connects wallet per (user_id, role) |
| `connect_transactions` | Immutable audit ledger for all Connect movements |
| `subscriptions` | Per-role tier subscriptions (future — not yet wired) |
| `bounty_claims` | Individual user claims against Airtable bounty definitions |
| `questit_api_keys` | API key auth for QuestIT ↔ ScoutIT bridge |
| `questit_policies` | Policy rules per company using the QuestIT API |
| `company_quests` | Quests raised via QuestIT API |
| `property_leads` | Inquiry submissions (commented out pending inquiry flow build) |

### Supabase → Airtable Sync
- Publish: `properties.pipeline_status = approved` → `insertProperty()` → Airtable `PROPERTIES_CMS`
- Update: if already approved, `updateProperty()` keeps Airtable in sync

### What Lives in Airtable (NOT Supabase)

| Table | Purpose |
|---|---|
| `PROPERTIES_CMS` | Public approved listings |
| `BROKERS_CMS` | Public broker directory |
| `PROPERTY_BROKERS` | Broker↔property relationships + handshake status |
| `CONNECT_COSTS` | Cost per action config |
| `CONNECT_PACKS` | Buy ladder config |
| `Subscription Tiers` | Tier config per role |
| `BOUNTIES` | Bounty definitions |
| `INTEL_CMS` | Editorial intel articles |
| `L2_CATEGORIES` | Property category taxonomy |
| `REACTION_TAGS` | Ledger reaction types |
| `FEATURE_GATES` | Feature flag config per tier |

---

## PART 8 — FEATURE GATES (entitlements.js)

```
deepIntel        → Solar+    (cap rate, yield, noise/quiet, verdict)
enhancedPhotos   → Solar+
brokerContact    → Solar+    (anonymous proxy + 1 Connect)
guideWizard      → Solar+
conciergeBasic   → Solar+
vault            → Cluster+  (Luma 3D, 360 tours, drone heatmaps)
marketIntel      → Cluster+  (txn history, cap-rate benchmark, appreciation)
offMarket        → Cluster+
compare          → Cluster+  (side-by-side comparison)
identityReveal   → Cluster+
conciergeDeep    → Cluster+  (vector/vibe search)
bounties         → Cluster+
universeListings → Universe
customBriefings  → Universe
dedicatedCurator → Universe
conciergeAutodraft → Universe
ownAiMcp         → Universe  (plug your own AI into ScoutIt via MCP)
```

**SSR-safe pattern for all client-side gates:**
```js
const [canSeeFeature, setCanSeeFeature] = useState(false);
useEffect(() => { setCanSeeFeature(canSee("vault", getCurrentTier())); }, []);
```

---

## PART 9 — AUTOMATIONS ROADMAP

### Phase 1 — PDF Ingest Extractor (priority, build now)
- Owner submits any PDF → AI extracts only facts literally present
- No source → field stays blank. **Never invents.**
- Writes unapproved draft to Supabase `properties` → human reviews → approve → Airtable sync

### Phase 2 — AI Listing Engine (monetized, post-launch)
- PDF → AI extractor → web researcher → **The Council**:
  - Design Expert, Owner Advocate, Buyer Advocate, Category Master
  - Arbiter routes: Approve / loop back / escalate to human
- Still owner-approved before going live. Never auto-publishes.

### Bulk CSV Engine
- For owners with multiple properties — bulk upload via CSV
- Auto-maps columns, validates, creates draft rows per property

---

## PART 10 — DECISIONS LOCKED (DO NOT RE-LITIGATE)

| Decision | Ruling |
|---|---|
| Property prices shown | Only in "Your Move" section, owner-confirmed only, stated as owner's asking price |
| Listing Ledger | Always localStorage, never gated, Supabase = cross-device sync only |
| `user_id` type | Stays `text` until Supabase Auth migration |
| Connects writes | Only through API routes / Edge Functions — never direct client INSERT |
| QuestIT visibility | Invisible to owners — internal ScoutIT fulfillment tool only |
| Payments timing | Deferred until 200 properties listed |
| RLS hardening | Last step, per-table, after Auth is wired |
| Branch strategy | All work goes to `main` directly unless owner says otherwise |
| Scout Rating | Earned by verified closures only — never bought or tier-granted |
| Tailwind | Allowed — used alongside vanilla CSS + CSS Modules (doc corrected 2026-06-26) |
| Three.js / canvas | Allowed for backgrounds — **must** be disabled by Lite Mode for low-end devices |
| Light mode | Dark is the default; light/high-contrast modes exist in the Display panel |
| Framework-level code | Always read `node_modules/next/dist/docs/` first |
| The UFO | Stays. Always. |

---

## PART 11 — NEW IDEAS (future, not yet built)

- **Resident Intel Layer** — lifestyle signals for a neighborhood (transport, food, noise, safety). Fills the gap between "I like the unit" and "I like where it is."
- **Post-Move Layer** — "you moved in, now what?" Connects movers to local services (internet, movers, cleaning, décor). Low-effort B2B revenue stream.
- **Affordability Layer** — "spaces within your budget" filter using user-declared range (private, never stored). Makes the platform accessible to mid-market, not just premium.
- **ScoutIT for Business** — commercial space intelligence for companies doing site selection (BPOs, F&B chains, retail expansion).
- **Universe own AI MCP** — Universe tier users can plug their own AI into ScoutIT data via MCP. Elite differentiator.

---

## PART 12 — CURRENT BUILD STATE (as of 2026-06-25)

### What Is Live on Main (deployed to Vercel)
- Full homepage descent (6 layers)
- Property pages with chapter system
- Public property directory (from Airtable CMS)
- Owner dashboard — listing creation, editing, broker management
- VIP Spatial Vault wizard (URL paste + build-for-me paths, Cluster+ gated)
- Connects wallet engine (3-bucket, localStorage, anti-exploit)
- Pricing pages — all 4 roles + bundles page, all show Connects per tier
- Entitlements engine — feature gating across all surfaces
- Hidden dev tier/role switcher for testing
- Demo showcase property (for testing gating)
- Supabase tables: properties, deals, saved_intel, user_profiles, privacy_settings, broker_profiles, researcher_profiles, projects, connect_balances, connect_transactions, bounty_claims, questit tables, error_reports

### What Is NOT Done Yet (ordered by priority)

1. **Security hardening + token rotation** — owner doing security study independently
2. **Supabase reset** — after security study; run `SUPABASE_REBUILD_GUIDE.md` SQL to restore
3. **Supabase Auth** — replace localStorage mock with real auth. 7-phase plan: `SUPABASE_AUTH_INTEGRATION_PLAN.md`
4. **RLS hardening** — all policies DEV-OPEN now; harden per-table after Auth
5. **Getting to 200 properties** — the unlock for payments. Is there friction in the listing flow?
6. **Payments** — `/checkout` is 404; PayMongo or Xendit; deferred until 200 properties
7. **PDF Ingest Extractor** — Phase 1 of the AI listing engine (high priority once Auth is done)
8. **`property_leads` inquiry route** — commented out in `/api/inquiries/route.js`
9. **Email** — Resend or Brevo (onboarding, handshake notifications, Vault queue)

### Known Code Issues (documented, not yet fixed)
- `connect_balances` design: per-role wallet in schema, code historically queried per-user — fixed in invite + questit routes but verify others
- `invite/route.js` still uses `broker_id: brokerName` (name string, not user ID) — works but should be a real user ID once Auth is live
- `subscriptions` table exists but nothing reads or writes to it yet (future payments hook)

---

## PART 13 — THE COUNCIL

Five-seat decision panel for product/UX calls. Convene for anything ambiguous.

| Seat | Role |
|---|---|
| **The Strategist** | Long-term product vision, market positioning, GTM |
| **The Builder** | Technical feasibility, architecture, implementation risk |
| **The Advocate** | User experience, what the end user actually feels |
| **The Operator** | Revenue, monetization logic, business sustainability |
| **The Arbiter** | Breaks ties, ensures consistency with past decisions |

---

## PART 14 — OPERATING RULES FOR AI AGENTS

1. Read this file + `AGENTS.md` before doing anything
2. **This is a modified Next.js 16** — read `node_modules/next/dist/docs/` before any framework code
3. **Use CSS variables, never raw hex.** Count the gold — 95/5 rule
4. **Airtable = public display. Supabase = private state. Never mix.**
5. **Tell the owner before every push to Vercel/main.** He is non-technical; plain language always
6. Never invent property data. No source → blank field
7. `main` must always be deployable — never push broken code
8. When touching Supabase: writes go through API routes only (service role key, never client-side)
9. SSR-safe pattern for tier gates: `useState(false)` + `useEffect(() => setState(canSee(...)), [])`
10. Scroll-snap: `y proximity` only — never `mandatory` + `scroll-behavior: smooth` together

---

## PART 15 — HOW TO START A NEW SESSION

Read these files in order, then confirm context and ask what to work on:

```
1. _SCOUTIT_BRAIN/MASTER_CONTEXT.md          ← this file (you're reading it)
2. AGENTS.md                                  ← project AI rules
3. _SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/SESSION_HANDOFF_2026-06-25-B.md  ← latest resume point
4. src/lib/entitlements.js                   ← gating source of truth
5. src/context/DashboardContext.js            ← dashboard state
```

Once read: confirm you're up to speed, state the next suggested steps from the handoff doc, then ask what to work on.
