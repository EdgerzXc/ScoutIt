# ScoutIt — New Feature Ideas

## 1. Hidden Resident Intel (Members Only)
Community voice from actual residents — what's the building management really like, is it noisy, does the landlord fix things, real neighborhood experience. This should live inside ScoutIt as gated/premium content for registered members, not public-facing. Separate from the broker/researcher/photographer supply side — this is the demand side speaking.

**Placement:** Intel section, hidden behind member login. Could surface as a "Resident Report" on each property or area page.

---

## 2. Post-Move Layer (ScoutIt Feature)
Once a user signs and moves in, ScoutIt's job doesn't end — that's when stress starts. This layer covers:
- Movers / moving services in the area
- Utility setup (electricity, water, internet providers available in that building/area)
- Local services nearby (laundry, groceries, clinics, etc.)
- Move-in checklist

**Placement:** Could be a new Layer or a dashboard feature unlocked after a user marks a property as "moved in." Connects naturally to the existing service ecosystem (Crust layer).

---

## 3. Financial Affordability Layer (Needs Legal Review First)
Show users the real monthly cost of a property — not just rent but HOA, estimated utilities, commute cost, area cost of living. Requires review against RESA and financial advisory regulations before building. Need to consult on compliance before touching this.

**Status:** On hold — check Philippine real estate law and financial advisory regulations first.

---

## 4. Enterprise Living Portfolios + Badge Economy (Developer Anchor Play)
The big bet: let large developers (Ayala, SM, Megaworld, etc.) run a **living portfolio** inside
ScoutIt — a Mission-Control-style edit surface scoped to their assets, kept always-current, so
brokers and buyers come *to* them instead of everyone chasing each other. This is the move that
turns ScoutIt from "a nicer marketplace" into the **system of record / intelligence layer** for
Philippine space, and the way we retain an anchor developer (real switching costs once their daily
workflow lives here). Not a near-term build — a deliberate "phase two with teeth." **Start after QA.**

**Why it's the moat, not just a feature:** one credible anchor developer solves the marketplace
cold-start from the supply side (premium PH inventory is concentrated in a few names), pulls brokers
+ buyers, converts us to high-ACV recurring enterprise revenue, and their maintained structured data
becomes the fuel for the intelligence layer (Bloomberg-for-space, not a board).

**The membership primitive (design once, express three ways).** Enterprise "org with multiple
listers," the QuestIT **Guild**, and a "team" are the SAME underlying concept: a *membership* — people
with roles attached to a shared entity. Build one model (org/team/Guild) with roles
(admin / lister / viewer / approver), not three half-versions. `owner_id` is already plain text, so
the path is `owner_id → org-owned` and additive — make that naming/shape decision deliberately NOW so
Antigravity doesn't build a wall we demolish later. This is the same road as the QuestIT plan, not a detour.

**The badge / status economy (solves anchor-tenant dependency).** Badges are **limited, earned, never
bought** — part of a developer's identity + visibility. They create a competitive environment where
developers compete *for our recognition* (power stays with the platform, no single whale owns the
roadmap). Earning a badge unlocks incentives, e.g. a 5% discount. Hard rules:
- **Earned vs. bought wall:** visibility can be sold; status cannot. A buyable badge is worthless.
  (Same principle as Scout Rating = closures only, never bought.)
- **Discounts apply to OUR fees/subscription only — never to a property's price** (price discounting =
  transacting = RESA violation; we never touch the transaction. That's the endgame red line.)
- **Status is public; operating data is private to the developer's workspace.** Developers fear having
  their numbers benchmarked next to rivals — compete over the badge, never over exposing their books.

**Hard gates before any developer data goes live (non-negotiable):**
- **Real authentication** (we're still on the mock/demo login — replace first).
- **Bulletproof multi-tenant isolation / RLS.** This is the existential risk: once two companies share
  the DB, a cross-tenant leak isn't a bug, it's the end of the company. RLS is currently dev-open. This
  is the one area where "move fast with AI" is dangerous — code can look right, pass the demo, and still
  leak. Treat tenant isolation as **move-slow-and-verify**, ideally a dedicated human/security-review
  hardening pass before a second company's data is added.

**On-ramp:** developers won't hand-key hundreds of properties — the **Listing Engine** (PDF/deck →
draft) + QuestIT verification is the migration bridge that makes onboarding a portfolio feel like
minutes, not months.

**Known disadvantages to keep watching:** (1) compliance creep — the more it looks like developers +
brokers transacting inside our walls, the closer we drift to brokering; keep "intelligence first,
transactions never" airtight even as we make broker dealings easier. (2) Hollow-win risk — a living
portfolio only retains a developer if brokers/buyers actually show up against it; don't let enterprise
supply run ahead of demand-side liquidity. (3) Channel conflict — developers have their own sites +
broker networks; the pitch must be the neutral broker marketplace + verification + market intelligence
they can't build alone. (4) Operational load — enterprises expect humans/SLAs; a small team must be
able to support an anchor account.

**Status:** Captured for build **after current QA pass**. Sequence: finish single-owner loop → design
membership primitive + badge economy on paper → real auth + tenant isolation gate → enterprise rollout.

---

## Notes
- Cannot touch transaction/negotiation layer — RESA compliance (Real Estate Service Act of the Philippines)
- Financial computation possible only with proper legal clearance and disclaimers
- Enterprise/badge discounts apply to ScoutIt fees only, never to property prices (see Idea #4)
