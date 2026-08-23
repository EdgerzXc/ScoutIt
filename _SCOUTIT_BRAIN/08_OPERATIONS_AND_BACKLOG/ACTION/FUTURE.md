---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [future, deferred, parked, roadmap]
updated: 2026-08-23
related:
  - "[[../00_START_HERE]]"
  - "[[00_MASTER_ACTION_PLAN]]"
  - "[[MASTER_OWNER_ACTIONS]]"
---

# 3 · FUTURE — deliberately deferred

> **Do not start anything on this page.** Every item here was parked *on
> purpose*, with a reason. They live here so they stop looking half-done and
> stop being re-proposed every few weeks.
>
> An item leaves this page only when its **trigger** fires or the owner moves it
> into [[00_MASTER_ACTION_PLAN]].

---

## 1. Parked by owner decision

| Item | Ref | Why parked |
|---|---|---|
| Successor / estate continuity list | §34.4 | Post-launch |
| WebRTC calls / Twilio proxy | §20.2–20.3 | Owner decision, not started |
| Voice AI co-pilot · FSBO intercom · Briefing OS | §6, §7, §33 | Owner-designated future phases; F-002's local Spatial OSINT foundation is complete and its real source/schema activation is owner-gated |
| Manifesto celestial scrollytelling + Founding Team showcase | `ORIGIN_STORY_SCROLLYTELLING` | Direction approved 2026-08-23, implementation not authorized. One continuous founder/product story: realistic celestial bodies and meteor showers converge at the reused black-hole climax; gravitational lensing then disappears into a calm, clear resolution. Click-entry/lazy-loaded About experience only; homepage remains fast. Canonical logic: `03_DESIGN/MANTLE_MANIFESTO_STORY_SYSTEM.md` |
| QuestIT | `QUESTIT_FUTURE/` | Parked feature. ⚠️ Reads 3 tables that do not exist |

⚠️ **QuestIT trap:** `proxy.js` blocks it while the `ai_search` flag is off, but
the guard reads `=== false`, so a **missing** flag row fails open (Standing Rule
6 shape) and produces 500s rather than 404s. **Do not enable `ai_search` until
those tables exist.**

## 2. Trigger-gated — start when the trigger fires, not before

| Item | Trigger |
|---|---|
| Cloudflare R2 media storage | First genuinely large media files. None yet |
| Wishlist per-link revocation | Only if the 90-day expiry proves insufficient |
| Read replicas, search index, heavier caching | A measured bottleneck, never a predicted one |

## 3. Scale-only performance pass — **explicitly not pre-launch**

**114 Supabase advisor lints:** 41 redundant permissive policies, 27 unindexed
foreign keys, 27 unused indexes, 18 `auth_rls_initplan` (`auth.uid()`
re-evaluated per row instead of `(select auth.uid())`), 1 duplicate index.

Every one is a cost that **scales with rows and traffic**. At 13 properties, 0
deals and near-zero analytics events, fixing them is premature optimisation.

Recorded as **one deliberate pass** to run when real load exists — specifically
so it stops resurfacing as "114 problems" and panicking a future session.

## 4. Before payments switch on — not urgent today, non-negotiable later

| Item | Ref |
|---|---|
| 🔴 **Six advertised pricing benefits have no implementation.** Build them, deliver them by hand, or take them off the page | §46.5 |
| CSP tightening — remove `unsafe-inline` | §25.3 ⚠️ verify MapLibre/Matterport first; `unsafe-eval` may be load-bearing |

**Charging for an undelivered benefit is the one mistake with no cheap fix.**

## 5. Post-pilot engineering hygiene

- The `property_id` type split: `uuid` in `analytics_events`/`deals`, `text` in
  `viewing_appointments`/`property_claims`. A legacy of
  `coerce_user_ref_columns_to_text`. Retyping a column live code filters on is
  far larger than any bug so far required — but every cross-table property query
  is a chance to hit it, and it **fails at runtime, never at build**

---

## 6. The product-vision idea list — lives OUTSIDE this folder

⚠️ **Found 2026-08-13 during the folder audit. It had no inbound link from any
backlog file, which is why it kept being forgotten.**

**[[../../01_IDENTITY_AND_VISION/NEW_IDEAS|`01_IDENTITY_AND_VISION/NEW_IDEAS.md`]]**
holds **15 numbered product ideas** with placement and status notes. It is a
*different file* from the `NEW_IDEAS` journals now in `_ARCHIVE/idea_journals/`
— same name, different folder, different job. That name collision is precisely
how it got lost.

| # | Idea | Status noted there |
|---|---|---|
| 1 | Hidden Resident Intel (members only) | **On hold** — risks conflict with the owners whose buy-in we need now |
| 2 | Post-Move Layer (movers, utilities, local services) | Idea |
| 3 | Affordability + Monthly Cost Sandbox | ✅ **Built** |
| 4 | AI Assimilation "Blueprint Rule" (cost-saving architecture) | Idea |
| 5 | Gamified badge ecosystem | Partly built |
| 6 | Multi-LLM parsing pipeline (Gemini → Claude) | Idea |
| 7 | QuestIT standalone bounty API | Parked — see §1 |
| 8 | In-app concierge, "the AI that lives in the database" | Idea |
| 9 | ScoutIt MCP server protocol (B2B / AI ecosystem) | Idea |
| 10 | Google OAuth | Blocked on owner setup |
| 11 | Owner dashboard intelligence + gamification (rule-based, no AI cost) | Idea |
| 12 | **Phased feature-unlock roadmap — milestone-gated, not time-gated** | The roadmap shape |
| 13 | Cinematic audio briefing (VIP Voice Mode) | Parked |
| 14 | Network node referral protocol (permanent reward Connects) | Idea |
| 15 | Web-first launch; native app packaging is milestone-gated | Decision |

**It stays where it is.** Product vision belongs in `01_IDENTITY_AND_VISION`, not
in an operations backlog. This entry exists so it is **reachable** — the problem
was never its location, it was that nothing pointed at it.

### Before adding any of them, apply the founder feature gate

[[../../01_IDENTITY_AND_VISION/FOUNDER_FEATURE_GATE|`FOUNDER_FEATURE_GATE.md`]]
is the "should we build this at all" test: **does it reduce work, increase trust,
and reduce operational cost?**

---

## Why this page exists

Three separate sessions independently rediscovered the 114 advisor lints and
treated them as an emergency. Two sessions proposed building the estate
continuity list. Parking something without writing down *that* it is parked
means paying to rediscover it forever.

> **The test for this page:** if an item is neither blocking today nor has a
> named trigger, it belongs here — or it should not be written down at all.
