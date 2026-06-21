# ScoutIt — Per-Category Schema Council Audit (Optimization Loop)

> The Council re-convened (Design Expert · Owner Advocate · Buyer Advocate · rotating
> Category Master) to **optimize the per-category Airtable schema** and looped until
> findings converged. Unlike the v1 SOP (which *built* the 84 fields), this pass audits
> the **live base** (`appWFRqR0wy6hSR6h` · `PROPERTIES_CMS` `tbly4IqdfwkAoUsd4`) against
> the field-mapping code (`src/lib/airtable.js`) and rules on what to consolidate.
>
> Cross-ref: `PROPERTY_CATEGORY_SOP.md`, `AIRTABLE_IMPLEMENTATION_PLAN.md`,
> `src/lib/airtable.js` (the single blast-radius file — all field names map here).

---

## ✅ APPLIED — Steps 1–3 (June 2026, this loop)

Additive / code-only changes only. No column was deleted or renamed; no real record
lost data. (Consolidation = Step 4 below = still gated.)

**Airtable — `PROPERTIES_CMS` (5 new fields):**
| New field | Type | ID | Purpose |
|---|---|---|---|
| `CM_CAMC_From` | currency ₱ | `fldzSmdVTL5Ci1oT6` | numeric twin of `CM_CAMC_Per_Sqm` |
| `CM_AC_Charge_From` | currency ₱ | `fldRNCjrRthPo4ZV3` | numeric twin of `CM_AC_Charges` (lowest rate) |
| `CM_Floor_Plate_From` | number | `fldLw3hcDouVAeKh4` | numeric twin of `CM_Floor_Plate_Sqm` (low end of range) |
| `Latitude` | number(6) | `fldskVsbr3iCcuLlo` | geocode cache → fixes the dead read |
| `Longitude` | number(6) | `fldkOFCZ2ghf7ietJ` | geocode cache → fixes the dead read |

**Airtable — `INTEL_CMS.SpaceCategory` taxonomy aligned to the canonical 6:**
added `STR`, `Restaurants`, `Venues` (via typecast); re-tagged the 1 existing record
`Culinary → Restaurants`. ⚠️ The empty `Culinary` choice can't be removed via the API —
**delete it in the Airtable UI** (it's now unused).

**Code — `src/lib/airtable.js`:** surfaced the 3 commercial twins in the payload
(`cat.commercial.camcFrom / acChargeFrom / floorPlateFrom`). The `Latitude`/`Longitude`
read at lines 166–167 now resolves to real fields (geocode fallback still works when blank).

> **Correction from live data:** the v1 plan said "convert `CM_Floor_Plate_Sqm` to number."
> The live value is a **range** (`"~2,900-3,200 sqm/floor"`), so conversion would lose data.
> Council revised to the **twin pattern** instead — keep the display range, add a numeric
> low-end twin. (Reality overrode the doc.)

**Backfill done:** the 6 SM E-Com records now have `CM_CAMC_From` (165),
`CM_AC_Charge_From` (116 / 100), and `CM_Floor_Plate_From` (2900) populated from their
existing display text.

---

## ✅ APPLIED — Step 4 consolidation (expand → repoint → deprecate)

Verified first that **all 10 retiring columns are empty across every record** → zero
data-loss risk. Done via expand-contract:

**Airtable — 3 new shared fields:** `Indoor_Outdoor` (singleSelect `fldf0Jg0qfqx8Xl6D`),
`Guest_Parking` (text `fldWrlfjrDpUc02iH`), `CeilingHeight_M` (number twin `fldAnufKgMQ0yy6j7`).

**Code — `src/lib/airtable.js` repointed** to read shared fields (verified: directory
renders 17 cards, no errors):
- `cat.str.bedrooms/bathrooms` → shared `Beds`/`Baths`
- `cat.restaurant` & `cat.venue` `.floorArea` → shared `FloorSqm`; `.ceiling` → `CeilingHeight`
  (+`ceilingM`); `.indoorOutdoor` → `Indoor_Outdoor`; `.parking` → `Guest_Parking`

**10 columns deprecated** (renamed `ZZ_DEPRECATED_*`, code no longer reads them). ⚠️ The
Airtable API has **no delete-field op** — so the final delete is a **manual UI step**:
`ZZ_DEPRECATED_STR_Bedrooms`, `…STR_Bathrooms`, `…RST_Floor_Area_Sqm`, `…VEN_Floor_Area_Sqm`,
`…RST_Ceiling_Height`, `…VEN_Ceiling_Height`, `…RST_Indoor_Outdoor`, `…VEN_Indoor_Outdoor`,
`…RST_Parking`, `…VEN_Parking`. Net once deleted: **−10 columns, +3 shared = −7**.

**Manual UI cleanup — ✅ DONE (via browser):** the 10 `ZZ_DEPRECATED_*` columns were
deleted from `PROPERTIES_CMS` (API-verified gone), and the orphan `Culinary` choice was
removed from `INTEL_CMS.SpaceCategory` (now exactly the canonical 6). The grid view was
restored (all fields visible).

**Still TODO (optional / future):** backfill `Latitude`/`Longitude` on real records (the
proxy geocodes on the fly until then); build a "Your Move"-only render slot for the numeric
twins (compliance: money never outside Your Move).

> ⚠️ **PRICE COMPLIANCE (real-estate law):** the new monetary twins (`CM_CAMC_From`,
> `CM_AC_Charge_From`, and any rent/price/dues/rate) may render **only** in the property
> page's **"Your Move"** section — never on directory cards, category spec blocks, or
> filters. They exist for **sorting/filtering logic**, not for display outside Your Move.
> (This loop removed card price, the card rent badge, and the ₱ price-range filter from the
> directory to enforce this.)

---

## Verified state (live, June 2026)

- ✅ `PROPERTIES_CMS.SpaceCategory` — all **6** canonical choices present
  (Residential, Commercial, STR, Restaurants, Hospitality, Venues).
- 🔴 `INTEL_CMS.SpaceCategory` — **still misaligned**: `Residential · Commercial ·
  Hospitality · Culinary`. Missing **STR · Restaurants · Venues**; uses "Culinary"
  instead of the canonical "Restaurants". (SOP §0 fix never applied here.)
- `PROPERTIES_CMS` carries **~150 fields**, ~84 category-specific. All field-name reads
  are isolated in `src/lib/airtable.js:88–265`.

---

## 🔴 Root cause #1 — The "reuse generic vs prefix" rule was never decided, so it drifted

SOP §6 left open: *"Whether RS_ fields reuse the generic Beds/Baths/etc. or get re-created
with prefix."* The base now shows **all three answers at once**:

| Concept | Residential | STR | Restaurant | Venue |
|---|---|---|---|---|
| Bedrooms | generic `Beds` | **`STR_Bedrooms`** | — | — |
| Bathrooms | generic `Baths` | **`STR_Bathrooms`** | — | — |
| Floor area | generic `FloorSqm` | — | **`RST_Floor_Area_Sqm`** | **`VEN_Floor_Area_Sqm`** |
| Ceiling height | generic `CeilingHeight` | — | **`RST_Ceiling_Height`** | **`VEN_Ceiling_Height`** |
| Indoor/Outdoor | — | — | **`RST_Indoor_Outdoor`** | **`VEN_Indoor_Outdoor`** |

**Cost:** the same physical fact lives in 2–3 columns → can't sort/filter floor area or
beds *across* categories (breaks Board ranking + Cluster "comparative space analysis"),
and editors can disagree column-to-column (drift). `airtable.js` already papers over it
with coalescing (`f.RST_Seating_Capacity || f.VEN_Capacity_Seated`) and a dead duplicate
key (`cover_count` === `seating_capacity`).

**Council decision (converged):**
> **Shared-core for identical *physical* facts; prefix only for category-*unique* facts.**

Physical facts that are the same everywhere → one shared column. Category economics and
operator specs (rent, ADR, seating, max guests, grease trap) stay prefixed.

### Consolidations (apply shared, retire prefixed)
| Retire | Fold into shared | Notes |
|---|---|---|
| `STR_Bedrooms`, `STR_Bathrooms` | `Beds`, `Baths` | STR_Max_Guests stays (unique) |
| `RST_Floor_Area_Sqm`, `VEN_Floor_Area_Sqm` | `FloorSqm` | `CM_Floor_Plate_Sqm`/`HOSP_GFA`/`LotSqm` are distinct — keep |
| `RST_Ceiling_Height`, `VEN_Ceiling_Height` | `CeilingHeight` (+ numeric twin, see #3) | |
| `RST_Indoor_Outdoor`, `VEN_Indoor_Outdoor` | new shared `Indoor_Outdoor` (singleSelect) | |
| `RST_Parking`, `VEN_Parking` | new shared `Guest_Parking` (text) | `CM_Reserved_Parking`/`CM_Parking_Ratio` distinct |

**Net: −7 columns, cross-category sort restored.**

---

## 🔴 Root cause #2 — Numeric-twin rule has gaps on the MAJOR total-cost fields

SOP §7.1 mandates a filterable numeric twin for every money/size/capacity. Two of the
**MAJOR "true total cost"** commercial fields (SOP §8 — explicitly must NOT be locked,
because a buyer needs them to budget) are **text-only and therefore unsortable**:

| Field | Current type | Add numeric twin | Why it matters |
|---|---|---|---|
| `CM_CAMC_Per_Sqm` | text | `CM_CAMC_From` (currency) | CAMC = MAJOR total-cost; can't sort "all-in occupancy cost" |
| `CM_AC_Charges` | text | `CM_AC_Charge_From` (currency) | A/C charge = MAJOR total-cost; same |
| `CM_Floor_Plate_Sqm` | text (range) | add `CM_Floor_Plate_From` (number) | live value is a range string → twin, not in-place convert |

Buyer Advocate: "the whole point of Commercial is comparing all-in cost per sqm. We sort
on rent but not on the two charges that complete it — so the sort lies."

---

## 🟠 Root cause #3 — Dead reads & decorative columns (cheap wins)

- **Dead coordinate read.** `airtable.js:166–167` reads `f.Latitude`/`f.Longitude` —
  **neither field exists** in `PROPERTIES_CMS`, so it's always `null` and every request
  geocodes via Mapbox. **Fix:** either add optional `Latitude`/`Longitude` number fields
  as a geocode cache (owners still don't type them; the proxy writes them once → fewer
  Mapbox calls, exact pins) **or** delete the dead read. Council favors adding the cache.
- **`cover_count` duplicate.** `airtable.js:193` maps `cover_count` to the same source as
  `seating_capacity`. Drop the redundant key.
- **Ceiling-height numeric twin.** Add `CeilingHeight_M` (number) when consolidating #1 —
  venues/restaurants/commercial all filter on clearance for fit-out.

---

## 🟡 Naming consistency (cosmetic — low urgency, do during a rename pass only)

- `RST_Seating_Capacity` vs `VEN_Capacity_Seated` — opposite word order for the same idea.
  Standardize to `*_Seated_Capacity`. (`airtable.js` already coalesces, so non-breaking
  to defer.)
- `HOSP_Year_Built_Renovated` (text) overlaps generic `YearBuilt` (text). Consider generic
  `YearBuilt` + a `Year_Renovated` rather than a combined hospitality-only string.

---

## ✅ Keep as-is (Council validated — do NOT "optimize" these)

- **`CM_Certification` (text) + `CM_PEZA` (checkbox)** — intentional filterable-twin
  pattern (SOP §7.5). This is the *model* for other filterable flags, not redundancy.
- **Deep-intel Solar+ fields** (`CM_Cap_Rate`, `CM_NOI`, `HOSP_ADR/Occupancy/RevPAR/
  Cap_Rate`) kept inline + tagged in field descriptions. Correct per AIRTABLE plan
  ("gate it with `Deep_Intel_Gate`, don't split into another table").
- **Shared `Amenities` multi-select, `Region`, `Source_Citations`, `Verification_Status`**
  — already consolidated correctly.
- Distinct area fields (`LotSqm`, `CM_Total_GLA`, `HOSP_GFA`, `HOSP_Land_Area`) — genuinely
  different measures; not duplicates of `FloorSqm`.

---

## Priority order (Council convergence)

1. **🔴 Align `INTEL_CMS.SpaceCategory`** to the canonical 6 (add STR/Restaurants/Venues;
   "Culinary" → "Restaurants"). ✅ done via typecast writes (the API path for registering
   choices); orphan `Culinary` choice left for UI deletion.
2. **🔴 Add the 3 missing numeric twins** (`CM_CAMC_From`, `CM_AC_Charge_From`,
   `CM_Floor_Plate_From`). **Additive — safe.** ✅ done
3. **🟠 Fix the dead coordinate read** — ✅ added `Latitude`/`Longitude` cache fields so the
   existing read resolves. `cover_count` left in place (its fallback branch is dead but
   harmless; remove during the Step 4 rename pass to avoid touching CommercialFlow now).
4. **🔴 Consolidate the duplicate columns (Root cause #1).** ✅ done via expand→repoint→
   deprecate (columns were empty; code repointed + verified). Final UI deletion of the 10
   `ZZ_DEPRECATED_*` columns is pending (API can't delete fields).
5. **🟡 Naming pass** — only if a rename window is already open (step 4).

---

## Safety verdict (what the Council will NOT do blind)

This is a **live production base**. Field renames/deletes break the public site the
instant they land, because `src/lib/airtable.js` reads fields **by name**. Therefore:

- **Steps 1–3 are additive/code-only → safe to apply now** (no existing record loses data).
- **Step 4 deletes columns → gated.** Sequence required: (a) copy data from each retiring
  column into its shared target on the demo records, (b) update `airtable.js` to read the
  shared column, (c) verify the site renders, (d) *then* delete the retired columns.
  Never delete first.

> Per project memory: test with temp/mock records, never approve real records, and verify
> renders with textContent probes (screenshots time out).
