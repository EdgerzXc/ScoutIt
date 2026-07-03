# CLAUDE.md — ScoutIt Project Context

> ⚠️ **SUPERSEDED (2026-07-02) — kept as historical record only.** This is the ORIGINAL project
> brief from early builds. Large parts are now stale or directly contradict current, signed-off
> decisions (flagged inline below rather than silently deleted, so the history stays visible).
> **For current truth, read:** `01_IDENTITY_AND_VISION/SCOUTIT_BIBLE.md` (identity/vision/design),
> `MASTER_CONTEXT.md` (single-file complete state), `00_START_HERE.md` (the map + decisions log),
> `04_DATA_AND_SCHEMA/FIELD_VISIBILITY_MAP.md` + `VISIBILITY_MAP__*.md` (what's public vs paid).
> The root `AGENTS.md` (project root, loaded every session via `CLAUDE.md`) is the live AI system
> prompt — not this file.

> This file gives you standing context for ScoutIt. Before doing ANY task, read the codebase first to get the true current state. This document covers stable context only — philosophy, design rules, architecture. The code is always the source of truth.

---

## 0. READ FIRST — Before Every Session

1. Scan the full folder structure to understand what exists.
2. Read any recently modified files before touching anything.
3. Check `package.json` for current dependencies.
4. Never assume a feature is built or not built — verify in the code first.
5. If something in this file conflicts with what you see in the code, **trust the code**.

---

## 1. What ScoutIt Is

ScoutIt is a **Space Intelligence platform** for the Philippine real estate market. It is NOT a listing site or transactional marketplace.

- Curated architectural archive — people dream-scroll properties and engage with spatial content
- Connects users with verified brokers and service providers
- Operates strictly as display-only under **Republic Act No. 9646 (RESA Law Philippines)**
- **Prices ARE shown — but only in the property page's "Your Move" section** (it's the one major data point almost every user needs). Compliance rule: a price renders *only* when **owner-confirmed**, and the page states it is the **owner's asking price** (negotiation is a separate, later, off-platform step). If there's no exact figure, a **vague range** is allowed — but still **only with owner confirmation**. If there's no price data at all, **nothing is shown**. Money never appears on directory cards, category spec blocks, or filters. (Schema: `Price_Status`, `Price_Verified_By`, `Listed_Price`, `Price_Source`, `Price_Notes`.)
- No transactions facilitated. No commissions taken.
- Core philosophy: **Intelligence First. Transactions Never.**

**Live site:** scout-it.vercel.app (+ sandbox `scoutit.vercel.app` — both deploy the same repo)

---

## 2. Tech Stack

> ⚠️ Stale — see `MASTER_CONTEXT.md` Part 3 for the current stack. Corrections: Auth is
> **localStorage-mock evolving toward real Supabase Auth** (no Clerk anywhere in the actual
> plan — that was an early idea, never built and not planned). Supabase is not "V2 planned" —
> it is the **live, primary private database** today (properties, deals, connects, profiles).

| Component | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router, Turbopack) — modified version, breaking changes from training data |
| Hosting | Vercel — auto deploys from GitHub on push to `main` |
| CMS (public) | Airtable — connected via `src/app/api/cms/route.js` proxy |
| CMS (private) | Supabase — auth (localStorage-mock today), owner submissions, Connects, profiles |
| Maps | Mapbox (geocoding, radius search) + Leaflet (static property maps) |

---

## 3. Site Structure

> ⚠️ Stale — route list has grown significantly. See `SCOUTIT_BIBLE.md` Part 5 "Full Route Map"
> for the current, complete list (includes `/layer/*` descent pages, `/dashboard`, pricing pages,
> legal pages, etc. not listed here).

| Path | Description |
|---|---|
| `/` | Homepage — the 6-layer descent |
| `/discover` | Browse & Discover — property feed with reactions |
| `/property/[slug]` | Property Page — 10-chapter registry, category-aware |
| `/property/[slug]/brokers` | Authorized brokers for that property |
| `/brokers` | Global broker directory with filters and tiers |
| `/brokers/[slug]` | Individual broker full profile |
| `/brokers/portal` | Private broker dashboard (B2B SaaS) |
| `/intel/[slug]` | Intel article full page with SEO |
| `/wishlist` | Saved / Your Board — localStorage, privacy-first |
| `/photographers` / `/researchers` / `/event-planners` | Ecosystem service rosters |
| `/about` | About & manifesto |

---

## 4. Design System

> ⚠️ Gold values below are STALE (June-2026-early palette). **Current tokens (refined
> 2026-06-26):** `--accent: #E8AE3C` · `--accent-bright: #F7C64E` · `--accent-muted: #6E531A`.
> Always read from `src/app/globals.css`, never hardcode.

### Colors
| Token | Value | Use |
|---|---|---|
| Background | `#0e0e0e` | Pure dark monolith |
| Surface / Cards | `#161616` | Elevated dark surface |
| Borders | `#262626` | Steel frame lines |
| Gold Accent | ~~`#c8a96e`~~ → **`#E8AE3C`** (current) | Active states, highlights |
| Text Primary | `#f0ede8` | Warm off-white |
| Text Muted | `#c8c8c8` (raised from the old `#8a8a8a` — contrast fix, June 2026 design audit) | Secondary content |
| Compliance Green | `#4caf7d` | RA 9646 verification badges |

### Typography
| Use | Font |
|---|---|
| Editorial / Display | `Georgia, serif` |
| UI / Labels / Body | Geist Sans (`next/font`) |
| IDs / Technical Values / Eyebrows | Geist Mono, uppercase, wide letter-spacing |

### Hard Design Rules (Never Break)
- ❌ No drop shadows beyond the token `--shadow-sm/md/lg/glow`
- ❌ No gradients outside signature elements (hero canvas, CTA glow)
- ❌ No rounded corners beyond the radius tokens (`--radius-sm..xl`)
- ~~❌ No prices anywhere on the platform~~ → **CONTRADICTED BY CURRENT POLICY, REMOVED
  2026-07-02.** Prices show in "Your Move" only, owner-verified — see §1 above and
  `00_START_HERE.md` §6 ("supersedes the old 'no prices shown anywhere' line").
- ❌ No star ratings (Scout Rating is a numeric trust score, not stars)
- ❌ No transaction language ("Intelligence First. Transactions Never.")
- ❌ No emojis in UI

---

## 5. Property Page — Chapter Registry (current)

> ⚠️ Stale — this used to be a fixed "V6 Template" with 9 chapters. It is now a **10-chapter
> registry system** (`src/components/property/chapterConfig.js`), reframed per category. See
> `02_ARCHITECTURE_AND_STRUCTURE/PROPERTY_ARCHITECTURE.md` (marked BUILT) and the per-category
> `04_DATA_AND_SCHEMA/VISIBILITY_MAP__*.md` files for exactly what each chapter shows/hides.

### Ten Chapters (current)
1. The Space · 2. Location · 3. Life Here · 4. Where To? · 5. Build Plans ·
6. The Fine Print · 7. Units & Spaces · 8. Property Universe · 9. Services · 10. Your Move
(+ The Vault, Cluster+ gated, sits between Location and Life Here on the live pages)

### Your Move Section Rules
- Four reaction buttons: Save · Inspired Me · Potential Fit · Interested
- Reactions save to on-device Ledger (`scoutit_reactions`) — never gated, never server-required
- CTA → Advisors/brokers roster for that property
- Compliance note: display-only, RA 9646 compliant, ScoutIt connects — brokers close
- **The only place money renders** — owner-verified price + "✓ Verified by …" badge, or "Price on request"

---

## 6. Reaction System

| Reaction | Signal |
|---|---|
| Save | Saved for later |
| Inspired Me | Design inspiration, aspirational |
| Potential Fit | Strong candidate |
| Interested | Active interest |

- Saves to the on-device Ledger (localStorage `scoutit_reactions`) — no account required, ever
- Server mirror for logged-in cross-device sync only (`saved_intel`), never the source of truth

---

## 7. Broker System

- **Scout Rating** — earned by **verified closures only**, never bought, never tier-granted (hard invariant)
- **Tiers:** Starry Closer → Solar Advisor → Cluster Strategist → Universe Elite (see `SCOUTIT_PRICING_STRATEGY.md`)
- **Dashboard** at `/dashboard` (role-aware; broker mode = pipeline, pitching, Scout Rating)
- **Digital ID Card** — Solar+ benefit, ScoutIt-branded, QR to live profile, auto-expires on lapse

---

## 8. Intel / News System

- `IntelType`: Article / News / Spotlight / Market Report
- City-based linking — articles tagged to cities, surface on property pages

---

## 9. Compliance

- Platform operates under **RA 9646 (RESA Law Philippines)**
- Display-only. No transactions. No contracts facilitated. No payments processed by ScoutIt.
- **Connects = an authorization + anti-spam layer, not a brokerage fee** — confirmed clean under RA 9646.

---

## 10. Working with other AI tools

This project has also been worked on by Antigravity IDE (Gemini Flash + Claude Sonnet). Both tools share the same folder/repo.

- Always check git log or recently modified files before starting work
- Commit clearly after every significant task so the other AI has clean context
- Never assume you made the last change — verify first
- If you see code you didn't write, do not refactor it without being asked

---

*Original content: June 2026. Corrections + supersession banner added 2026-07-02. Always verify against the actual codebase — the running code wins over any document.*
