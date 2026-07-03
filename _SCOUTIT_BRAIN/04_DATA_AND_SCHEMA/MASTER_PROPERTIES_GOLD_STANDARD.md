# Master Gold-Standard Properties — one fully-populated demo per category

> **Built 2026-07-03.** Owner's explicit instruction: build one property per category with
> **every** field populated (public, hidden-intel, and vault) — mock data is fine, completeness is
> the point — and use these six as the reference standard for what a "done" listing looks like.
> **Do not delete these.** When building or auditing any property-page feature, check it against
> these six first — if a chapter looks broken or empty on one of these, it's a real bug, not a
> missing-data artifact.

## 1. The six properties

| Category | Title | Slug | Airtable record | Supabase `properties.id` |
|---|---|---|---|---|
| Residential | The Ridgeline at Capitol Commons | `the-ridgeline-at-capitol-commons` | `recZtZILIHNhOUfty` | `a6125917-c071-40b4-a54f-7fa3cdf733b6` |
| Commercial | Cyber Sigma Tower 3 | `cyber-sigma-tower-3` | `rec7fH6C0M8QELk9G` | `7cb82022-2827-4620-aee9-2981b1b0d1e3` |
| STR | Sea Breeze Loft, Boracay Station 2 | `sea-breeze-loft-boracay-station-2` | `recIfwWQJlze0nvTI` | `5da3b80f-a209-4749-8564-2ee7ac82670b` |
| Hospitality | The Meridian Hotel, Cebu IT Park | `the-meridian-hotel-cebu-it-park` | `recYSi93IJoEVbJPP` | `38d4c401-59c5-4648-90fd-211bd0d38021` |
| Restaurants | Corner Unit, Poblacion Strip | `corner-unit-poblacion-strip` | `reccZO3oXi7bqPBOo` | `a85385bd-c661-4ec3-b883-5f6f35425ef2` |
| Venues | The Foundry, Warehouse District BGC | `the-foundry-warehouse-district-bgc` | `recy3JQPbTS10IyBa` | `06f8fbb1-23f2-4359-a3b7-2dff5c73cd34` |

All six: `Pipeline_Status = "3 - Ready for Market"`, `Approved_For_ScoutIt = true`, live on both
`scoutit.vercel.app` and `scout-it.vercel.app` right now (Airtable/Supabase are shared backends —
approved records go public regardless of which Vercel deployment is running).

Owner explicitly chose **not** to delete the other pre-existing listings (junk test rows, the
Unit Delegation demo property, the two SM Offices commercial examples, etc.) when this was
considered — they're untouched, still in both databases, just not part of this reference set.

## 2. What each one demonstrates (per `FIELD_VISIBILITY_MAP.md`'s buckets)

- **Public:** real, distinct, HTTP-200-verified photos (2-3 each) + unit photos, amenities,
  aesthetic tag, best-for tags, `ScoutItVerdict`/`SpaceStory` editorial copy, developer/architect/
  zoning/commute fields, the full category spec-block (free + locked rows per
  `FIELD_VISIBILITY_MAP.md §3`), 4 real `WhereTo` POIs each.
- **Hidden Intel (Solar+):** the full `DEEP_INTEL_SCHEMA` 5-field × 6-chapter set per category
  (`src/lib/deepIntelSchema.js`), stored in `DeepIntel_JSON`.
- **Vault (Cluster+):** real, HTTP-verified embeds — Matterport showcase
  (`https://my.matterport.com/show/?m=YWayaXpaJyH`) and a Luma 3D Gaussian-splat capture
  (`https://lumalabs.ai/embed/b86b7928-f130-40a5-8cac-8095f30eed54`) — confirmed actually loading
  in an iframe at Cluster+ tier, not just present as a URL.
- **Mapbox:** real geocoded, cached `Latitude`/`Longitude` (not left blank for live-geocode-on-read)
  — verified distinct per property; two initially resolved to the same generic Taguig city-center
  point on a first pass and were re-geocoded with more specific location strings until Mapbox
  returned address/locality-level precision.
- **NOAH flood risk:** `FloodRiskScore` (0-100 scale, see `FloodRiskBadge.js`) + `FloodZoneStatus`
  text per property — never gated, per the platform-wide invariant.

## 3. Real bugs found and fixed while building this (not staged/mock issues — code bugs)

1. **The generation script itself was broken on the first two runs** — wrote Airtable singleSelect
   values (`"Warm Shell"`, `"Short-Term Rental"`, `"With Kitchen"` for Furnishing, etc.) that don't
   exist as real choices in the live schema, and a non-date string into a real `date` field
   (`RS_Turnover_Date`). Fixed by checking the live Airtable schema first and mapping to real
   choices (or omitting the field, per the "no data → blank" rule, where nothing genuinely fit).
2. **`Luma_3D_Map_URL` and `Drone_Heatmap_URL` never existed as Airtable columns**, despite being
   referenced in `src/lib/airtable.js` and this doc folder for a long time — meaning the Vault's
   Luma/drone sections have been silently non-functional on **every** property, platform-wide,
   until these fields were created 2026-07-03. See `FIELD_VISIBILITY_MAP.md §4`.
3. **STR listings showed hardcoded fake placeholder text** (`"2 Beach Suites"`, `"15 Guests"`)
   instead of real data on every STR property on the platform — `src/lib/airtable.js` only ever
   mapped Hospitality's `HOSP_Room_Types`/`HOSP_Room_Count` into the shared `accommodations`/
   `hosting_capacity` keys, never STR's own `STR_Bed_Config`/`STR_Max_Guests`. Fixed in
   `src/lib/airtable.js`.
4. **`ResidentialFlow.js`'s "The Space" chapter hidden-intel panel was hardcoded to Commercial's
   "Life Here" labels** (Ventilation Quality, Noise Level Score, etc.) instead of Residential's own
   fields (HOA Reserve Health, Assoc Dues History, etc.) — a copy-paste bug affecting every
   residential listing, not just these new ones. Fixed to use the same dynamic
   `DEEP_INTEL_SCHEMA[d.category][1]` lookup every sibling chapter already uses.
5. **Two additional hidden-intel panels were wired to hardcoded label strings that never existed
   anywhere in `deepIntelSchema.js`** — ResidentialFlow's "Fine Print" Market Panel (Cap Rate (Area
   Benchmark), Transaction History, Appreciation Projection, Price History, Competitive Density,
   Market Position Index) and CommercialFlow's "Universe" panel (2 of its 4 fields: "Detailed
   Historical Transaction Records", "Architectural Heritage Notes"). These have always shown "Not
   recorded" for every property, everywhere — not a bug in the strict sense (no data source was
   ever designed for them), but a genuine completeness gap. Rather than a riskier architecture
   change to unify them with the schema, supplemented `DeepIntel_JSON` with matching label-keyed
   mock values on these six records so they show real content too. **Not fixed for the rest of the
   platform** — any other property will still show "Not recorded" for these specific fields until
   someone either adds real data under these exact label keys or refactors the two panels to read
   from the schema properly.

## 4. If you add a 7th category or rebuild one of these

Reuse the pattern in this session's throwaway scripts (deleted after running, not preserved in the
repo — see git history around commit `9aab743` if you need to reconstruct one): geocode via the
real Mapbox Geocoding API and write `Latitude`/`Longitude` back to Airtable (don't rely solely on
`route.js`'s live-geocode-on-read fallback for a reference property), verify every third-party
embed URL with a real HTTP check before using it, and check `get_table_schema` for a field's real
singleSelect/multipleSelects choices before writing to it — don't guess values.
