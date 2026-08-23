---
section: "00_META"
status: locked
tags: [sop, operating-rules, invariants, workflow]
updated: 2026-08-22
related: ["[[00_COUNCIL]]", "[[00_START_HERE]]", "[[00_LOGIC_HIERARCHY]]", "[[USER_EXPERIENCES]]"]
---

# ScoutIT — Operating SOP (read at the start of every turn)

> The contract for how we work each turn so everything aligns to one goal and no change
> compromises another part. If a turn would violate anything here, stop and flag it first.
> Pairs with [[00_START_HERE]] (the map) and [[00_COUNCIL]] (the decision panel).
> Last updated: August 22, 2026.

---

## 0. North Star (the common goal)
Ship a **launch-ready ScoutIT** where **every user type has a distinct, fulfilling experience**
(see [[USER_EXPERIENCES]]), built on honest, curated, category-aware data,
**mobile-first**, without breaking what already works. Two sides must both reach "near-perfect":
the **user side** (the app people use) and the **founder side** (our Mission Control + data).

---

## 1. Every-turn checklist

**Before doing anything:**
1. Re-read this SOP + the relevant brain doc for the area you're touching.
2. **The running code + live data win over any document.** Verify current state before acting
   (read the file / query the table) — never assume a doc is still true.
3. State the goal of the turn in one line and which surface it touches.

### Mandatory action-control transaction

Before implementation, open
[[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|the Master Action Plan]],
name the stable task ID, and confirm it has exactly one authorized queue home.
Unverified findings go to the Inbox and cannot be executed until promoted.

Before ending, close the documentation transaction in the same change: keep an
unfinished item current in its one queue; move an item with an exact unblock
condition to Waiting; move an owner decision to Owner Actions; move deliberately
deferred work to Future; or remove completed work from every live queue and add
an evidence row to the current monthly Done file. A code, data, UI, operations,
or documentation change is not complete until this disposition is recorded.

**While working:**
4. Use the **Council** ([[00_COUNCIL]]) for product/UX decisions; 2-round cap, Founder breaks ties.
5. Make the **smallest change that achieves the goal**; prefer additive over destructive.
6. One canonical source per thing — don't duplicate a field/control/record that already exists.

**Before ending the turn:**
7. **Verify:** lint/build for code; read-back for data; link-check before any delete.
8. **Sync the docs:** if reality changed, update the matching brain doc in the same turn.
9. Report in plain language: what changed, what's verified, what's next.

---

## 2. System invariants — NEVER compromise these (cross-cutting)

These protect other parts of the platform. Breaking one to fix something else is not allowed.

- **Dual-CMS golden rule.** Airtable = public content (what ScoutIT *shows*). Supabase = private
  user state (what a user *has/did*). Never mix. (`04_DATA_AND_SCHEMA/`)
- **Live Airtable base (`appWFRqR0wy6hSR6h`) = additive only.** The app reads fields *by name*,
  so renaming/deleting a field breaks the live site instantly. New fields/choices/rows OK;
  deletes require: confirm empty/unlinked → repoint code → verify → then delete (often a manual
  UI step the API can't do).
- **App ↔ database must point at the same place.** The app's `.env.local`
  (`NEXT_PUBLIC_SUPABASE_URL`) must match the live Supabase project `yyixsuaimdzyiocswcgc`.
  Verify env alignment whenever data "doesn't show up." (Live Airtable base is `appWFRqR0wy6hSR6h`.)
- **Price compliance (RA 9646).** A price renders **only** in the property page's "Your Move"
  section, **only when owner-verified** (`Price_Status` = Published AND `Price_Verified_By` ∈
  {Owner, Property Manager, Broker}). Never on cards, filters, or spec blocks. No data → show nothing.
- **Privacy-first Ledger.** The buyer's saved board stays on-device (`scoutit_reactions`) — never
  gated, never server-required.
- **Connects rules.** Monthly Connects reset with no rollover; purchased and
  reward Connects are permanent. Spend order is monthly → purchased → reward.
  Paid actions are spent on send/delivery with no automatic refund for decline,
  non-response, or timeout; only confirmed exceptional platform/administrative
  errors may receive a discretionary correction.
- **Scout Rating = completed in-platform transaction handshakes only.** The
  owner–broker representation handshake does not count. Tier buys visibility;
  badges are granted; rating is earned and is never bought. A private/off-platform
  success that never completes ScoutIt's transaction handshake receives no
  ScoutIt count or incentive.
- **Brand DNA.** ~95% dark / ~5% gold, CSS variables/tokens (never raw hex — this includes
  Tailwind arbitrary values), the UFO stays. Tailwind IS allowed (2026-06-26 correction —
  dashboards use it; public/marketing surfaces stay vanilla CSS). Dark is the default; light/
  high-contrast live in the Display panel only. **Mobile-first** is the default lens.
- **Owner-approved surfaces are checksum-locked.** Run `npm run verify:surfaces` before and after edits. A failure is a stop signal: restore the accepted source unless the owner explicitly approved that exact visual change. Never refresh the manifest during unrelated work.
- **Showcase Curation Invariant (The Board / Orbit Showcase).** The Showcase (`/showcase`)
  is ScoutIt's premier editorial and spatial showcase. It cannot be automated with generic
  placeholders or unsourced claims. Operators may calibrate only source-evidenced merits;
  sample and projected telemetry must remain explicitly labelled. Because the surface is
  owner-approved and checksum-locked, every visual/source change requires its exact Action
  item and owner review. See
  [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|A-007 completion evidence]].
- **Security hardening is DONE (2026-07-09)** — RLS permissive-policy reset executed and
  verified, `mockOwnerId` gated in 17 routes. RLS is no longer dev-open: **never** add an
  always-true policy or a direct client write to a service-role-only table (`deals` inserts,
  `deal_messages`, `subscriptions`, `property_units`) — go through the server routes.
- **Nothing goes live to `main`/Vercel without the owner's say-so.** The owner is non-technical;
  explain in plain language.

---

## 3. Build method (so work compounds instead of thrashing)
- **Vertical slices, not broad shallow passes.** Make one persona/flow work end-to-end (data →
  logic → UI → verify) before replicating. Current slice: **Owner**.
- **Scaffolding (mock/demo/dev backdoors) stays IN while building, removed LAST before launch.**
  Tag every dev-only affordance with a `remove before launch` comment (e.g. the demo-owner login).
- **Confirmed numbers or none.** No placeholder public prices go live (Connect packs, tiers).

---

## 4. Per-category data SOPs (each category curates different data)
A property is **not** one generic form. Each of the six categories needs its own curated data and
its own "what matters" — entered per the category SOP, with the universal **honest-blank rule:
no data → leave it empty; never 0 / N/A / a guess. Wrong data is worse than no data.**

| Category | The data that defines it (curate these) | SOP source |
|---|---|---|
| **Residential** | beds/baths/floor & lot sqm, furnishing, tenure, dues, turnover, view | [[SCOUTIT_AIRTABLE_SOP]], [[PROPERTY_CATEGORY_SOP]] |
| **Commercial** | floor plate, building grade, rent + CAMC + AC charges (all-in cost), PEZA, hand-over, GLA | same |
| **STR** | max guests, nightly/weekend rate, min stay, **short-let legality (re-verify quarterly)**, permits | same |
| **Hospitality** | keys/rooms, star rating, F&B outlets, function rooms, operator brand, ADR/occupancy (deep-intel) | same |
| **Restaurants** | covers/seating, kitchen grade, hood/grease/gas, power, frontage, foot traffic, F&B permits | same |
| **Venues** | seated/standing capacity, setup grade, rigging, AV, load-in, noise curfew, fire cert | same |

Rules that apply across categories:
- **Shared physical facts use one shared column** (beds, floor sqm, ceiling); **category-unique
  facts get a prefix** (`CM_`, `STR_`, `RST_`, `VEN_`, `HOSP_`, `RS_`). Don't re-create a shared fact per category.
- **Legally-adjacent fields** (STR legality, health/fire permits, broker authority) carry a
  verification flag and are flagged `[UNVERIFIED]` until a human asserts them.
- **Deep-intel fields** (cap rate, yield, ADR, RevPAR, comfort/light/privacy scores) are paid-gated
  via `Deep_Intel_Gate`, kept inline — not split into another table.
- The **owner wizard, the directory cards, and the property page must all branch by category** —
  same engine, different fields per category (the chapter-registry idea in [[PROPERTY_ARCHITECTURE]]).

> When a category's curation rules change, update the category SOP **first**, then the Airtable
> fields, then the wizard/page code — in that order — so the three never drift apart.

---

## 5. When in doubt
Ask the Council. Keep the change small and additive. Verify. Sync the doc. Tell the owner plainly.
