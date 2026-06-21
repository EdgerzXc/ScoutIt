# CLAUDE.md — ScoutIt Project Context

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

**Live site:** scout-it.vercel.app

---

## 2. Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Hosting | Vercel — auto deploys from GitHub |
| CMS | Airtable — connected via serverless proxy API routes |
| AI Tools | Antigravity IDE (Gemini Flash + Claude Sonnet) |
| Maps | Mapbox — dark themed, free tier |
| Auth | NOT built yet — planned V2 with Clerk |
| Database V2 | Supabase — planned migration from Airtable |

---

## 3. Site Structure

| Path | Description |
|---|---|
| `/` | Homepage — 4-layer animated demo (the platform trailer) |
| `/discover` | Browse & Discover — property feed with reactions |
| `/property/[slug]` | Property Page — V6 template, 9 intelligence chapters |
| `/property/[slug]/brokers` | Authorized brokers for that property |
| `/brokers` | Global broker directory with filters and tiers |
| `/brokers/[slug]` | Individual broker full profile |
| `/brokers/portal` | Private broker dashboard (B2B SaaS) |
| `/intel/[slug]` | Intel article full page with SEO |
| `/wishlist` | Saved / Your Board — localStorage V1 |
| `/photographers` | Space photographers directory |
| `/researchers` | Site researchers directory |
| `/event-planners` | Event planners and designers directory |
| `/about` | About & Founding Partners — static stub |

---

## 4. Design System — NEVER DEVIATE FROM THESE

### Colors
| Token | Value | Use |
|---|---|---|
| Background | `#0e0e0e` | Pure dark monolith |
| Surface / Cards | `#161616` | Elevated dark surface |
| Borders | `#262626` | Steel frame lines |
| Gold Accent | `#c8a96e` | Raw muted gold — active states, highlights |
| Text Primary | `#f0ede8` | Warm off-white |
| Text Muted | `#8a8a8a` | Secondary content |
| Compliance Green | `#4caf7d` | RA 9646 verification badges |

### Typography
| Use | Font |
|---|---|
| Editorial / Display | `Georgia, serif` |
| UI / Labels / Body | `system-ui, sans-serif` |
| IDs / Technical Values | `Courier New, monospace` |

### Hard Design Rules (Never Break)
- ❌ No drop shadows
- ❌ No gradients
- ❌ No rounded corners beyond `4px`
- ❌ No prices anywhere on the platform
- ❌ No star ratings
- ❌ No transaction language
- ❌ No emojis in UI

---

## 5. Property Page — V6 Template

Three-zone layout with 9 intelligence chapters navigated via sticky chapter strip.

| Zone | Description |
|---|---|
| Zone 1 | Hero photo — full width, gallery with Natural/Enhanced toggle |
| Zone 2 | Chapter navigation strip — sticky, 9 tabs with icons |
| Zone 3 | Story content panels — main content + right sidebar |

### Nine Chapters
1. **The Space** — Raw architectural description, materials, dimensions
2. **Location** — City context, infrastructure, commute, Mapbox dark map
3. **Life Here** — Neighborhood vibe, daily life, safety
4. **Where To?** — Nearby landmarks with walk/drive times
5. **Build Plans** — Expansion potential, structural possibilities, zoning
6. **Hidden Intel** — GATED (verified scout tier). Cap rates, transaction history
7. **Units** — Room-by-room breakdown with sqm and features
8. **Universe** — Market position, architectural classification
9. **Your Move** — Reactions, broker CTA, compliance note

### Your Move Section Rules
- Georgia serif heading: *"When you're ready, we'll make the introduction."*
- Four reaction buttons: Save (bookmark), Inspired Me (star), Potential Fit (hexagon), Interested (heart)
- Reactions toggle gold active state + save to localStorage + fire anonymous POST to `/api/reactions`
- CTA: *"Connect with an Authorized Broker →"* → `/property/[slug]/brokers`
- Compliance note: *"Display only. No transaction facilitation. RA 9646 compliant. ScoutIt connects — brokers close."*

---

## 6. Reaction System

| Reaction | Shape | Signal |
|---|---|---|
| Save | Bookmark | Saved for later |
| Inspired Me | Star | Design inspiration, aspirational |
| Potential Fit | Hexagon | Strong candidate |
| Interested | Heart | Active interest |

- Saves locally to user's board (localStorage)
- Anonymously pings database with category/city parameters
- No user account required in V1

---

## 7. Broker System

- **Trust metrics** — Scout Rating out of 100 (no star ratings):
  - Active Retentions: 40%
  - Continuity Score: 40%
  - Stewardship Velocity: 20%
- **Tiers:** Diamond → Platinum → Gold → Silver → Bronze
- **Dashboard** at `/brokers/portal` — 4 tabs: Profile Studio, Connected Assets, Intent Leads Desk, System Settings
- **Digital ID Card** — downloadable credential with PRC license, DHSUD registration, LERIS status, QR code

---

## 8. Intel / News System

Five content types: News, Article, Insight, Blog, Summary

- **Insight** type always gets gold disclaimer banner: *"This is a ScoutIt Insight — a projection based on available data, not a verified fact."*
- Intel Side Panel slides in from right when news capsule clicked
- City-based linking — articles tagged to cities, surface on property pages

---

## 9. Scout Guide System

- Hamster UFO mascot — ambient, respectful, never forced
- 4-phase lifecycle: First Visit (scrollytelling) → Ambient Mode → Guide Mode → Guide Mode Active
- localStorage keys: `scoutit_visited`, `scoutit_layers_seen`, `scoutit_guide_seen`

---

## 10. V1 Scope — What's Built vs Planned

### V1 Includes
- Homepage 4-layer demo
- Property pages (9 chapters)
- Broker directory & dashboards
- Intel/News system
- Wishlist/Board (localStorage)
- Mapbox integration

### V1 Excludes (Do Not Build Unless Told)
- User authentication (Clerk — V2)
- Payment systems (V2)
- Google Street View (V2)
- Supabase migration (V2)
- Advanced analytics (V2)
- Booking engines (V3)

---

## 11. Compliance

- Platform operates under **RA 9646 (RESA Law Philippines)**
- Display-only. No transactions. No contracts. No payments.
- Always include compliance note in relevant UI sections.

---

## 12. Working with Antigravity IDE

This project is also worked on by Antigravity IDE (Gemini Flash + Claude Sonnet). Both tools share the same folder.

- Always check git log or recently modified files before starting work
- Commit clearly after every significant task so the other AI has clean context
- Never assume you made the last change — verify first
- If you see code you didn't write, do not refactor it without being asked

---

*Last updated from ScoutIt Master Documentation — June 2026. Always verify against actual codebase.*
