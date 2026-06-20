# ScoutIt — Airtable Implementation Plan (Layered Architecture)

> **This is the living blueprint for the ScoutIt Airtable base.**
> When something changes — a new field, a new table, a new monetization rule —
> update it *here first*, then build it in Airtable. This doc is how we never lose
> track of everything.
>
> Live base: **`ScoutIt CMS — Airtable Setup Blueprint`** · `appWFRqR0wy6hSR6h`
> Cross-reference: `SCOUTIT_BIBLE.md` · `docs/DATA_DICTIONARY.md` · `SCOUTIT_PRICING_STRATEGY.md`
> Last updated: June 2026.

> **✅ BUILT — June 2026.** All Airtable tables, fields, and the Mission Control
> interface are live in the base. Table/field/page IDs are in the Build Log at the
> bottom. Remaining work is the **Supabase user-layer tables** and the **Make.com
> scenarios** — neither is in Airtable.

---

## The Two Golden Rules (read before editing the base)

1. **Airtable = what ScoutIt offers & shows. Supabase = what each user has & did.**
   The simple test when you don't know where data goes:
   - *"Is this part of the menu — a listing, an article, a roster, a tier/price the
     public sees?"* → **Airtable**.
   - *"Is this something a specific user owns or did — their account, their tier right
     now, their Connect balance, their wishlist, their bounty claim?"* → **Supabase**.
   Never mix them. (See the data-location schematic for the full picture.)

2. **No clutter across layers.** Every table belongs to exactly **one** layer or
   group. Layers connect to each other *only* by linking to the shared **spine**
   (`PROPERTIES_CMS`) — never by copying a field from another layer. If you find
   yourself duplicating a field, link to the spine instead.

---

## Naming Convention (this is what prevents clutter)

| Prefix / suffix | Meaning | Examples |
|---|---|---|
| `_CMS` (no layer prefix) | **Spine / shared** — referenced by many layers | `PROPERTIES_CMS`, `INTEL_CMS`, `BROKERS_CMS` |
| `L1_` … `L6_` | **Layer-specific** — owned by one homepage layer | `L1_BOARD`, `L2_CATEGORIES`, `L6_ABOUT` |
| `CONFIG_` / plain config name | **Cross-cutting config** — monetization & site config | `Subscription Tiers`, `FEATURE_GATES`, `BOUNTIES` |

Rule of thumb: if a table starts with `L#_`, only that layer's interface page edits it.

---

## Quick Lookup — "I have X to enter, where does it live?"

| I want to enter / change… | Goes in | Table |
|---|---|---|
| A new property listing | Airtable | `PROPERTIES_CMS` |
| The leaderboard ranking / champion | Airtable | `L1_BOARD` |
| Category tabs (rename, reorder) | Airtable | `L2_CATEGORIES` |
| An intel article / news / spotlight | Airtable | `INTEL_CMS` |
| A curated collection | Airtable | `L3_COLLECTIONS` |
| A broker profile | Airtable | `BROKERS_CMS` |
| A photographer / researcher / event planner | Airtable | `SERVICE_PROVIDERS` |
| About / manifesto copy | Airtable | `L6_ABOUT` |
| Hero text, featured links, footer | Airtable | `HOMEPAGE_CMS` |
| Tier names / prices / Connect allowance | Airtable | `Subscription Tiers` |
| Which features are paywalled | Airtable | `FEATURE_GATES` |
| What an action costs in Connects | Airtable | `CONNECT_COSTS` |
| A new bounty *task type / template* | Airtable | `BOUNTIES` |
| **A user's account / login / role** | **Supabase** | `profiles` |
| **An owner's account** | **Supabase** | `owner_accounts` |
| **What tier a user is on right now** | **Supabase** | `subscriptions` |
| **A user's Connect balance / a transaction** | **Supabase** | `connect_balances` |
| **A user's saved/shortlisted property (Ledger)** | **Supabase** | `user_reactions` |
| **A bounty someone claimed / their proof / payout** | **Supabase** | `bounty_claims` |
| **An owner's pending wizard submission** | **Supabase** | `property_submissions` |

---

## Layer Map — the 6 Homepage Layers (canonical)

The homepage is a 6-layer descent (Bible, Part 5). This is the **canonical**
organization for the Airtable. The 5 route pages (`/layer/orbit` → `/layer/core`)
draw from the *same tables* — see the cross-reference at the bottom.

| Homepage layer | Eyebrow | Tables that feed it |
|---|---|---|
| **Hero** | SPACE · INTELLIGENCE · TECHNOLOGY | `HOMEPAGE_CMS` (config) |
| **Layer 01** | THE BOARD | `L1_BOARD` (+ spine) |
| **Layer 02** | PROPERTY EXPERIENCES | `PROPERTIES_CMS` (spine) + `L2_CATEGORIES` |
| **Layer 03** | DISCOVERY & INTELLIGENCE | `INTEL_CMS` + `L3_COLLECTIONS` |
| **Layer 04** | ECOSYSTEM SERVICES | `BROKERS_CMS` + `SERVICE_PROVIDERS` |
| **Layer 05** | YOUR BOARD (Ledger) | *Supabase* (+ optional `REACTION_TAGS`) |
| **Layer 06** | ABOUT US | `L6_ABOUT` |
| **Footer** | — | `HOMEPAGE_CMS` (config) |
| **Cross-cutting (Airtable config)** | Monetization menu | `Subscription Tiers`, `FEATURE_GATES`, `CONNECT_COSTS`, `BOUNTIES` (defs) |
| **Take Command (`/layer/core`)** | User layer | *Supabase:* `profiles`, `owner_accounts`, `subscriptions`, `connect_balances`, `bounty_claims` |

---

## SPINE — `PROPERTIES_CMS` (exists; extend lightly)

The master property record. Already very rich (50 fields: AI vision, hard metrics,
aesthetics, `ScoutItVerdict`, `Approved_For_ScoutIt`). **Every layer links here.**

**Add these fields:**
- `Owner` → link to `OWNERS_CMS`
- `Brokers_Attached` → link to `BROKERS_CMS`
- `Inquiry_Count` (number) — drives Layer 01 ranking
- `Listing_Visibility` (single select: Standard / Boosted / Priority / Showcase / Universe) — set by the owner's tier
- `Deep_Intel_Gate` (single select: Free / Solar+ / Cluster+) — tells the API which intel fields to hide for free users

> Deep-intel data (`ScoutItVerdict`, `FloodRiskScore`, comfort/light/privacy scores)
> already lives inline here. Keep it inline — gate it with `Deep_Intel_Gate`, don't
> split it into another table.

---

## HERO + FOOTER — `HOMEPAGE_CMS` (exists)

Central config panel. Already holds `Hero_Headline`, `Hero_Subtext`,
`Hero_Background_Video`, `Featured_Properties`, `Featured_Intel`,
`Featured_Brokers`, `Is_Active_Config`. **This is the data behind the Master Page.**

**Add footer fields:** `Footer_Platform_Links`, `Footer_Services_Links`,
`Footer_Company_Links` (or a small `CONFIG_FOOTER` table if it grows).

---

## LAYER 01 — THE BOARD (`/layer/orbit`)

*Elements: ranked leaderboard, the "champion," inquiry trend.*

**New table: `L1_BOARD`**

| Field | Type | Purpose |
|---|---|---|
| `Rank_Label` | single line (primary) | "Champion", "#2", … |
| `Property` | link → `PROPERTIES_CMS` | the ranked space |
| `Inquiry_Count_Snapshot` | number | frozen at publish |
| `Is_Champion` | checkbox | top podium spot |
| `Trend` | single select (Up / Down / Steady) | |
| `Board_Period` | single select (This Week / This Month) | |
| `Published` | checkbox | live gate |

**Why a table, not just a live sort:** lets you manually pin/curate a champion and
freeze a weekly snapshot, so the board doesn't flicker on every inquiry. Editing the
board never touches property records.

---

## LAYER 02 — PROPERTY EXPERIENCES (the directory)

*Elements: the property grid + category tabs (Residential / Commercial / STR /
Hospitality / Restaurants / Venues) + searchable preview cards.*

- **`PROPERTIES_CMS`** (spine) — the grid.
- **New table: `L2_CATEGORIES`** — the category tab config.

| Field | Type | Purpose |
|---|---|---|
| `Category_Name` | single line (primary) | "Residential", … |
| `Icon` | single line / attachment | tab icon |
| `Sort_Order` | number | tab order |
| `Is_Active` | checkbox | show/hide tab |
| `Tagline` | single line | short blurb per category |

> Why a config table: lets the owner reorder/rename tabs without code, and keeps
> category presentation out of the property records (anti-clutter).

---

## LAYER 03 — DISCOVERY & INTELLIGENCE (`/layer/stratosphere`)

*Elements: editorial feed, property spotlights, linked intel articles, news, curated
collections.*

- **`INTEL_CMS`** (exists) — keep. Use the existing `IntelType` field as the splitter
  (**Article / News / Spotlight / Market Report**) so we do **not** fragment into 4
  tables. **Add:** `Related_Property` (link → spine), `Credited_Researcher`
  (link → `SERVICE_PROVIDERS`, for bounty attribution).
- **New table: `L3_COLLECTIONS`** — curated collections.

| Field | Type | Purpose |
|---|---|---|
| `Name` | single line (primary) | collection title |
| `Description` | long text | |
| `Hero_Image` | url / attachment | |
| `Properties` | link → `PROPERTIES_CMS` | members of the collection |
| `Published` | checkbox | live gate |

---

## LAYER 04 — ECOSYSTEM SERVICES (`/layer/metropolis`)

*Elements: the vetted professional network — advisors/brokers, photographers,
researchers, event designers.*

- **`BROKERS_CMS`** (exists) — keep **separate**. It has unique closure/rating logic
  (`Closures`, `Rating`, `ClearanceTier`, `RosterRank`). **Add:** `Subscription_Tier`
  (link → `Subscription Tiers`), `Listings` (link → spine).
  > **Critical rule (pricing doc):** Scout Rating is earned by *verified closures
  > only* — never by subscription tier. Tier buys visibility; rating buys trust.

- **New table: `SERVICE_PROVIDERS`** — **one unified table** for Photographers +
  Researchers + Event Planners (split by a `Provider_Type` field).

| Field | Type | Purpose |
|---|---|---|
| `Name` | single line (primary) | |
| `Provider_Type` | single select (Photographer / Researcher / Event Planner) | |
| `Profile_Image` | url / attachment | |
| `Portfolio` | multiple attachments | |
| `Service_Tags` | multi-select | architectural, aerial, field-report, … |
| `Subscription_Tier` | link → `Subscription Tiers` | |
| `Verified` | checkbox | verified badge |
| `ID_Card_Status` | single select (None / Active / Expired) | Solar+ credential |
| `Roster_Rank` | number | placement |
| `Approved_For_Live_Site` | checkbox | live gate |

> **Why unified, not 3 tables:** the pricing doc shows all three share identical
> machinery (tiers, Connects, ID cards, verified badges, roster placement, portfolio).
> Three near-identical tables = drift and clutter. One table + a type field is easier
> to edit and easier to keep consistent. Brokers stay separate because their
> rating/closure logic genuinely differs.

---

## LAYER 05 — YOUR BOARD / THE LEDGER (`/layer/crust`)

**Deliberately almost absent from Airtable — and that is correct.**

The Bible (Part 8 golden rule): the Ledger is privacy-first, **on-device / Supabase**
(`user_reactions`). Putting per-user wishlists in Airtable would break the core
privacy promise.

- **Only Airtable artifact (optional):** `REACTION_TAGS` — 4 config rows
  (Save / Inspired Me / Potential Fit / Interested) with label + color, *only* if you
  want to manage tag presentation centrally. Everything else here stays in Supabase.

---

## LAYER 06 — ABOUT US (`/about`)

*Elements: the manifesto.*

- **New table: `L6_ABOUT`** — editable manifesto sections, so the non-technical owner
  can update the About copy without touching code.

| Field | Type | Purpose |
|---|---|---|
| `Section_Name` | single line (primary) | "Manifesto", "RA 9646 Notice", … |
| `Heading` | single line | |
| `Body` | long text / rich text | |
| `Sort_Order` | number | section order |
| `Published` | checkbox | live gate |

---

## CROSS-CUTTING — Monetization & Take Command (`/layer/core`)

The dashboard (`/layer/core`, "Take Command") is role-aware and **Supabase-driven** —
it *is* the user layer. **Airtable's only job here is the menu/config that the
dashboard and the paywall read.** The live user state (accounts, current tier, Connect
balances, bounty claims) lives in Supabase — see the table below for the exact split.

> **Naming note:** in this plan **Layer 06 = About Us** (editorial, stays in Airtable).
> "Take Command" / `/layer/core` is the *route* descent's layer and is the user
> dashboard — its data is Supabase, not an Airtable layer table.

### `Subscription Tiers` (exists — skeletal; complete it)
Currently only UI styling (glow/border). **Add:** `User_Type`
(Seeker / Broker / Owner / Photographer / Researcher), `Cosmic_Tier`
(Starry / Solar / Cluster / Universe), `Price_PHP`, `Monthly_Connects`, `Symbol`,
`Sort_Order`. → One row per user-type × tier (≈ 20 rows).

### `FEATURE_GATES` (new)
The Feature Gate Reference table from the pricing doc.
Fields: `Feature_Name`, `Free`, `Solar`, `Cluster`, `Universe` (checkboxes).
The code reads this to decide what is paywalled.

### `CONNECT_COSTS` (new)
Action → Connect cost. Fields: `Action` (Seeker→Broker contact, Owner→Photographer
commission, Owner→Researcher field report, …), `Connect_Cost` (number), `Notes`.

### `BOUNTIES` (new — Airtable holds **definitions only**)
The catalog of bounty task types the platform offers.
Fields: `Title`, `Task_Type` (single select), `Connect_Payout` (number),
`Property` (link → spine, optional), `Active` (checkbox).
> The **live claims** — who claimed it, their geo-tagged proof, verification status,
> payout, and Cluster+ owner approval — are **per-user activity → Supabase
> `bounty_claims`**. Airtable says "this task exists and pays +3"; Supabase records
> "researcher Y submitted proof and was paid."

### Owners → **Supabase** (`owner_accounts`), not Airtable
Owners are users (they log in, hold a tier, have a balance). Their account lives in
Supabase alongside `profiles`. Their *properties* still appear in `PROPERTIES_CMS`
(linked by an owner id), so the public directory is unaffected.

> **Boundary:** Airtable holds the *menu/definitions* (tier catalog + prices, gate
> matrix, Connect price list, bounty task types). The *user layer* — accounts, live
> subscriptions, Connect balances + transactions, bounty claims, the Ledger — is
> **Supabase**.

---

## THE MASTER PAGE — Airtable Interface: "ScoutIt Mission Control"

One Interface app. `HOMEPAGE_CMS` is the data behind its home screen. Pages:

1. **Overview** — KPIs: live properties, pending-approval count, current Board
   champion, active brokers, open bounties.
2. **Approval Queue** — *the most important page.* Every record where
   `Approved_* = false` across all tables, in one place. This is the publish gate.
3. **One tab per layer** — Board · Property Directory · Discovery & Intel · Ecosystem ·
   About · Monetization Config. Each tab edits only its own `L#_` tables → isolation.
4. **Homepage & Hero Control** — edits the active `HOMEPAGE_CMS` config + featured links.

---

## Build Status Tracker

| Table | Layer | Status | Action |
|---|---|---|---|
| `PROPERTIES_CMS` | Spine | Exists | Add 5 fields |
| `HOMEPAGE_CMS` | Hero/Footer/Master | Exists | Add footer fields |
| `INTEL_CMS` | L3 | Exists | Add 2 link fields |
| `BROKERS_CMS` | L4 | Exists | Add tier + listings links |
| `Subscription Tiers` | Cross-cutting | Skeletal | Add monetization fields |
| `L1_BOARD` | L1 | New | Create |
| `L2_CATEGORIES` | L2 | New | Create |
| `L3_COLLECTIONS` | L3 | New | Create |
| `SERVICE_PROVIDERS` | L4 | New | Create |
| `L6_ABOUT` | L6 | New | Create |
| `FEATURE_GATES` | Cross-cutting | New | Create |
| `CONNECT_COSTS` | Cross-cutting | New | Create |
| `BOUNTIES` (definitions only) | Cross-cutting | New | Create |
| `REACTION_TAGS` | L5 (optional) | New | Optional |
| **Mission Control** Interface | Master | New | Build after tables |
| `owner_accounts` | User layer | **Supabase** | Create in Supabase |
| `subscriptions` (live tier) | User layer | **Supabase** | Create in Supabase |
| `connect_balances` (+ transactions) | User layer | **Supabase** | Create in Supabase |
| `bounty_claims` (claims/proof/payout) | User layer | **Supabase** | Create in Supabase |
| *Wishlists / reactions / auth* | L5 | **Supabase** (exists) | Do not put in Airtable |

---

## Cross-reference: Route Descent Pages → Tables

The 5 route pages reuse the same tables (no new data needed):

| Route | Reads from |
|---|---|
| `/layer/orbit` (Board) | `L1_BOARD` + spine |
| `/layer/stratosphere` (Stories & Intel) | `INTEL_CMS` + `L3_COLLECTIONS` |
| `/layer/metropolis` (Network) | `BROKERS_CMS` + `SERVICE_PROVIDERS` |
| `/layer/crust` (Your Board) | Supabase (+ `REACTION_TAGS`) |
| `/layer/core` (Take Command) | Supabase user layer (`profiles`, `owner_accounts`, `subscriptions`, `connect_balances`, `bounty_claims`); reads Airtable config (`Subscription Tiers`, `FEATURE_GATES`, `CONNECT_COSTS`, `BOUNTIES`) |

---

## The Automation Layer (Make.com — outside the codebase)

> **AI automations** (the Listing Engine, ingestion, verification council) are spec'd in
> the **`../automations/`** folder — start with `automations/LISTING_ENGINE.md`. Make.com
> below covers only the deterministic *cross-system sync*.


Sync **between** Airtable and Supabase is handled in **Make.com** (visual scenarios)
using API keys — **not** in the Next.js repo. This is distinct from in-code data access:

- **In-code (stays in the app):** `src/app/api/cms/route.js` reads Airtable for the
  public site; `supabaseClient.js` reads/writes user state. Make.com does **not**
  replace these.
- **Make.com (the bridges):** cross-system flows, e.g.
  - approved owner submission (`property_submissions`) → port into `PROPERTIES_CMS`
    (automates today's manual admin copy step)
  - bounty verified (`bounty_claims`) → flag the property "Verified by community"
  - tier change (`subscriptions`) → refresh any display flag the public site shows

**Rules for the automation layer:**
1. **One direction per field.** Airtable = public-content source of truth; Supabase =
   user-state source of truth. A given field syncs one way only — never bidirectional,
   to avoid sync loops.
2. **Keys live in Make.com's connection vault / env vars — never in the repo.** The
   Supabase *service-role* key bypasses row-level security: guard it like a password.
   Scope the Airtable token to this base only.
3. **Respect rate limits.** Airtable ≈ 5 requests/sec per base — batch records in Make,
   don't fire one call per row.

---

## The Approval Gate (applies to every public table)

Every public-facing record has an approval checkbox that **must be `true`** before the
API (`src/app/api/cms/route.js`) serves it:
- `PROPERTIES_CMS` → `Approved_For_ScoutIt`
- `INTEL_CMS`, `BROKERS_CMS`, `SERVICE_PROVIDERS` → `Approved_For_Live_Site`
- `L1_BOARD`, `L3_COLLECTIONS`, `L6_ABOUT` → `Published`

The **Approval Queue** page in Mission Control is the single place to manage all of these.

---

## Build Log — live IDs (June 2026)

Base: `appWFRqR0wy6hSR6h`

### New tables created
| Table | Table ID |
|---|---|
| `SERVICE_PROVIDERS` | `tblGD4Gl9Lcaac9CF` |
| `L1_BOARD` | `tblcuaRC7uKi4asrZ` |
| `L2_CATEGORIES` | `tblpYUDC4dKvVpQEb` |
| `L3_COLLECTIONS` | `tblI5qMMBFdd2P6tj` |
| `L6_ABOUT` | `tblbhD7vcwUGlZZFy` |
| `FEATURE_GATES` | `tblqDRICMFu9KGMdc` |
| `CONNECT_COSTS` | `tblzu0v87TQwa8sl7` |
| `BOUNTIES` | `tbljpHV9MO8EWGEJw` |
| `REACTION_TAGS` | `tblTxwcuFhxQxurWN` |

### Existing tables (IDs) + fields added
- `PROPERTIES_CMS` `tbly4IqdfwkAoUsd4` — added: Brokers_Attached, Inquiry_Count, Listing_Visibility, Deep_Intel_Gate, Owner_Ref
- `BROKERS_CMS` `tblA9PhsYb5PAE3JZ` — added: Subscription_Tier (+ inverse link from Properties)
- `INTEL_CMS` `tblOT5WpMlbsGuPVy` — added: Related_Property, Credited_Researcher
- `HOMEPAGE_CMS` `tblWS4aQFB1Uo8HmT` — added: Footer_Platform_Links, Footer_Services_Links, Footer_Company_Links
- `Subscription Tiers` `tblyK7JCQlmGXAogZ` — added: User_Type, Cosmic_Tier, Price_PHP (₱), Monthly_Connects, Symbol, Sort_Order

### Interface — "ScoutIt Mission Control" `pbdyvI1PCjfhxUH5V` (published)
Overview (dashboard) · Approval Queue — Properties · L1 The Board · L2 Categories ·
L3 Intel Articles · L3 Collections · L4 Brokers · L4 Service Providers · L6 About ·
Monetization Tiers · Monetization Feature Gates.

### Not built here (next tracks)
- **Supabase:** `owner_accounts`, `subscriptions`, `connect_balances`, `bounty_claims`
  (plus existing `profiles`, `user_reactions`, `property_submissions`).
- **Make.com:** sync scenarios (submission→port, bounty-verified→flag, tier-change→display).
