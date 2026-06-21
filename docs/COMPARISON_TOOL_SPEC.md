# ScoutIt — Comparison Tool Spec (Solar+ · Specs-Only)

> Feature spec produced by the Council. **Plan first** — build in a follow-up.
> Lets a user put properties side-by-side on their **specifications** (capacity, area,
> grade, beds, etc.). Gated at **Solar+**.
>
> Cross-ref: `PROPERTY_CATEGORY_SOP.md` §7.1 ("Cluster-tier comparative space analysis" —
> owner has set the gate to **Solar+**), `SCHEMA_COUNCIL_AUDIT.md` (the numeric twins this
> tool consumes), `scoutit-price-compliance` (the money rule below).

---

## 1. Hard constraints (decided)

- **Specs only — NO money.** Rent, price, dues, CAMC, A/C charges, ADR, nightly/rental
  rates are **never** shown in the comparison view. Money stays in each property's
  "Your Move" section only (real-estate-law compliance). The comparison links out to each
  property page, where price lives.
- **Gate: Solar+.** Same tier mechanism as the deep-intel fields (`Deep_Intel_Gate` /
  `FEATURE_GATES`). Until the real Supabase subscription layer is live, gate it the way the
  rest of the site does — a **blur-locked teaser** (mirror `CategorySpecBlock`'s
  `MinorLockSection` / the deep-intel widget), swapped for the real check later.

---

## 2. What gets compared (per category)

All values come from the existing normalizer `src/lib/airtable.js` (`d.cat.<type>` +
shared facts). **Numeric twins make rows sortable** — that's the payoff of the schema pass.
**Every money key below is intentionally excluded.**

| Category | Spec rows (compared) | Excluded (money — not shown) |
|---|---|---|
| **Shared (all)** | City/Region, Floor area (sqm), Building/Space type, Amenities, Verification status | — |
| **Commercial** | Total GLA, Floor plate (`floorPlateFrom`), Building grade, Hand-over, Min lease term, PEZA, Backup power, Parking ratio | rent, CAMC, A/C charges, NOI |
| **Residential** | Beds, Baths, Floor area, Floor level, View, Furnishing, Pet policy, Studio flag, Title status | price, price/sqm, assoc dues |
| **STR** | Max guests, Bedrooms, Bathrooms, Min stay, Avg rating, Self check-in, WiFi speed | nightly/weekend/cleaning rates |
| **Restaurants** | Floor area, Seating capacity, Kitchen condition, Frontage, Foot traffic, Indoor/Outdoor, Hood/Grease/Gas, Power | rent, CUSA dues |
| **Hospitality** | Room count, Star rating, F&B outlets, Function rooms, Room types, Operator, Year renovated | ADR, RevPAR, Cap rate |
| **Venues** | Seated/Standing capacity, Floor area, Min booking hrs, Ceiling height, A/C, Catering, AV, Accessibility | rental rate |

> **Cross-category rule:** comparison is cleanest **within one category** (the spec rows
> align). If a user compares across categories, show only the **shared** rows and mark
> category-specific rows "—". Default the compare picker to the currently filtered category.

---

## 3. UX flow

1. **Select** — a "Compare" checkbox/affordance on each directory card (reuses the card; no
   money on it). Selecting adds to a compare tray (max **4** properties).
2. **Compare bar** — a sticky tray shows selected thumbnails + "Compare (N)" CTA.
3. **Compare view** — a side-by-side table: properties as columns, spec rows as rows.
   Numeric rows get a subtle "best in row" emphasis (e.g. largest GLA) — specs only.
4. **Gate (Solar+):**
   - Free user: the compare view renders the **first 1–2 spec rows**, the rest blur-locked
     with an "Unlock comparison // Solar+" CTA (reuse `MinorLockSection` styling).
   - Solar+ user: full spec table.
5. **Each column header links to the property page** (where price/"Your Move" lives).

---

## 4. Build plan (follow-up)

1. `src/lib/compare.js` — pure helpers: `getCompareRows(property)` returning category spec
   rows from `d.cat.*` (money keys hard-excluded by an allowlist, not a blocklist — safer).
2. Compare state — lightweight context or URL param (`?compare=slug1,slug2`) so a comparison
   is shareable. (URL-as-state per web patterns.)
3. `CompareTray` (sticky bar) + `CompareView` (table) components.
4. Card affordance — add the select control to `property/page.js` cards (no money).
5. Gate — `useTier()` placeholder reading the mock auth today; blur-lock rows for non-Solar+.
6. `FEATURE_GATES` (Airtable) — add a **"Comparison Tool"** row: Free ☐ · Solar ☑ · Cluster ☑
   · Universe ☑, so the gate is config-driven once auth is real.
7. Verify in preview: no `₱` anywhere in the compare surface; gate teaser shows for free users.

---

## 5. Compliance check (must pass before merge)

- [ ] No money token (`₱`, rent, price, dues, ADR, rate) anywhere in the compare UI.
- [ ] Spec rows sourced via an **allowlist** of non-monetary keys (adding a new `cat.*`
      money field can never leak it into compare).
- [ ] Column headers deep-link to the property page (price stays in "Your Move").
- [ ] Gate defaults to **locked** for non-Solar+ (fail-closed).
