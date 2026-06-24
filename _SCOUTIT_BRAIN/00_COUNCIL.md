# ScoutIT — The Standing Council (anti-loop decision panel)

> Purpose: stop re-deriving scope every session. For any decision, convene the relevant seats,
> let them converge, ship the converged punch-list. Loop cap: **2 rounds**, then the Founder seat
> breaks the tie and we execute. (Mirrors the Listing-Engine council pattern in
> `05_AUTOMATIONS/LISTING_ENGINE.md`.)
>
> **Two kinds of seats:**
> - **Standing seats** — the 5 product/UX voices. Convene them for any user-facing decision.
> - **Specialist seats** — domain experts you pull in *by task type* (schema, security, money, AI,
>   brand, performance, etc.). Add them to the table only when the task touches their domain.
>
> **Cost note:** the Council is a way of thinking, not a product. Convening seats = one AI reasoning
> through each lens in this chat. It costs nothing extra. Do **not** spin up separate paid sub-agents
> for this unless the Founder explicitly asks — inline role-play is the cheap, default path.

---

## The 5 standing seats (product / UX)

| Seat | Speaks for | Strongest say on |
|---|---|---|
| **Founder (us)** | The business, brand, compliance, launch focus | Brand integrity (95/5 gold, no-pressure, privacy-first Ledger), RA 9646 (Your Move price only, owner-verified), scope discipline (don't over-build), final tie-break |
| **User / Seeker** | The person browsing with no account | Frictionless browse, fast on a phone, understands a space quickly, saves & re-finds without signing up |
| **UI/UX Planner** | Craft of the interface | Mobile-first layout, one canonical control per action, ≥44px tap targets, scroll/perf, consistency, accessibility |
| **Property Developer** | The supply pro listing many assets | Category-rich property page (6 categories render right), fit-out/operator/spec depth, accurate data |
| **Property Owner** | The individual asset holder | Correct Your-Move price (owner-verified), their advisors shown, accurate title/city/photos, asset presented fairly |

---

## Specialist seats (convene by task)

Pull these in only when the task touches their domain. The Founder always sits and breaks ties.

| Seat | Speaks for | Strongest say on | Convene when… |
|---|---|---|---|
| **Data / Schema Architect** | The dual-CMS integrity | Airtable = public / Supabase = private (never mix); **Airtable additive-only** (read-by-name); per-category fields (shared vs `CM_`/`STR_`/etc. prefixes); honest-blank rule (no data → empty, never 0/N/A); `details` jsonb shape | Adding/changing fields, new category data, Airtable↔Supabase sync, migrations, the admin port pipeline |
| **Security & Privacy Officer** | The trust promise + the attack surface | RLS (deferred *dedicated* overhaul — don't half-harden), input sanitization, CSP/headers, secrets/env hygiene, privacy-first Ledger stays on-device, the Double-Blind Shield | Auth, user data, RLS, API routes, anything handling credentials or the privacy guarantee |
| **Compliance / Legal (RA 9646 · RESA)** | Philippine real-estate law | Price renders only in "Your Move", only owner-verified; broker verification & authority; **STR legality (re-verify quarterly)**; the Financial Affordability layer needs legal clearance first; `[UNVERIFIED]` flags | Pricing display, broker authority, STR, money/affordability features, any legally-adjacent field |
| **Monetization Economist** | The platform economy | Connects rules (granted resets monthly, no roll-over; earned+bought never expire; handshake spent-on-send, no refund); subscription tiers & packs (₱49/199/499/1,199); churned-owner escrow trap; **Scout Rating = closures only, never bought by tier** | Pricing, Connects spend, tier gating, bounty payouts, any revenue mechanic |
| **AI / Cost Architect** | Smart AI without burning budget | The **Blueprint Rule** (send only headers + 3 rows to map, loop the rest in free JS); multi-LLM pipeline (Gemini cheap extract → Claude high-reasoning); Concierge/vector search gated to paid tiers; token-cost discipline | Bulk import, any LLM feature, Concierge, vector search, MCP server, draft generation |
| **Brand / Visual Guardian** | The luxury look | ~95% dark / ~5% gold (count the gold), CSS tokens never raw hex, slow/intentional motion, localized glow (no "glowing fog"), the UFO stays, **no Tailwind on the public site** (dashboards may) | New components' visual design, animations, hero/centerpiece work, anything that could dilute the brand ratio |
| **Performance / Mobile Engineer** | Speed on a phone | Mobile-first default; scroll-snap `y proximity` only (never `mandatory` + smooth); compositor-only animation (transform/opacity); CWV budgets; bundle/image weight; no WebGL in main site | Animations, heavy media, scroll behavior, perceived-perf, layout at 390px, bundle regressions |
| **Ecosystem / Pro-Supply Advocate** | The B2B professionals | Brokers/photographers/researchers/event designers experience; **QuestIT** (initiator pays 1 Connect; open board vs direct/Guild); verification badges; pro lead-gen; provider HUDs | Provider dashboards, QuestIT, the owner↔broker handshake, badges, any supply-side feature |
| **Growth / GTM Strategist** | Acquisition & conversion | The decoupled funnel (LOUD social / QUIET Vault site); UFO viral hooks top-of-funnel; restrained editorial conversion bottom-of-funnel; onboarding clarity; SEO/share | Marketing surfaces, onboarding, landing/share content, social hooks, conversion |
| **Release / Reliability (DevOps)** | A deployable `main`, always | `next build` is the deploy gate (lint won't fail it); **`NEXT_PUBLIC_*` env vars must be NON-sensitive** to reach the browser; verify every route returns 200; nothing to `main`/Vercel without the Founder's say-so | Deploys, env-var changes, build/CI config, Vercel issues |
| **QA / Skeptic (Verifier)** | Reality over docs | **Running code + live data win over any doc** — verify before acting; link-check before any delete; remove scaffolding (demo login, mock fallbacks, dev-open RLS) before launch; report honestly (failures stated plainly) | Before any delete, before launch, when a doc and the code might disagree, final review of a change |

---

## Task → which seats (quick picker)

| If the task is about… | Standing seats | + Specialist seats |
|---|---|---|
| A property page / category fields | UI/UX, Developer, Owner | Data/Schema, Compliance, Brand |
| Owner wizard / Live Editor | UI/UX, Owner | Data/Schema, Compliance |
| Pricing / Connects / tiers | Founder, Owner | Monetization, Compliance |
| QuestIT / bounties / Guilds | Developer, Owner | Ecosystem, Monetization, AI/Cost |
| Concierge / AI search / bulk import | User | AI/Cost, Security, Monetization |
| Auth / RLS / user data | — | Security, Data/Schema, Release |
| A new visual / animation / hero | UI/UX | Brand, Performance |
| Onboarding / marketing / social | User, Founder | Growth, Brand |
| Deploying / env / build | Founder | Release, QA/Skeptic |
| Deleting or refactoring anything | — | QA/Skeptic, Data/Schema |

> Don't over-convene. Most turns need the Founder + 2–3 relevant seats, not the whole roster.

---

## How it runs
1. State the surface/decision in one line and which surface it touches.
2. Pick the seats: the relevant standing seats **+** any specialist seats from the picker above.
3. Each seat gives its top concerns + must-haves.
4. Converge → one ranked punch-list (dedupe overlaps; Founder enforces scope + compliance).
5. Cap at 2 rounds; Founder breaks ties; then execute.
6. Record the converged list (in the relevant doc) so it isn't re-litigated.

## Convergence rules
- Mobile-first is the default lens (project mandate).
- Privacy-first Ledger stays on-device (localStorage `scoutit_reactions`) — never gated.
- Money renders only in Your Move, owner-verified (RA 9646).
- One canonical control per action — no duplicate save widgets.
- Prefer fixing data correctness + flow completeness before visual polish.
- Running code + live data win over any document — verify before acting.
- Smallest change that achieves the goal; additive over destructive.

---

*Cross-reference: `00_SOP.md` (how we work each turn) · `00_START_HERE.md` (the map) ·
`07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md` (per-persona experiences).*
