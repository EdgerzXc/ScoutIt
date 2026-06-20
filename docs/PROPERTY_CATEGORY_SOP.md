# ScoutIt — Property-by-Category SOP (Council Output)

> The standard operating procedure for **what data the CMS holds per property type**
> and **how the master page presents it.** Produced by the Council (Design Expert,
> Owner Advocate, Buyer Advocate, + the rotating Category Master).
>
> Model (decided): **one table** (`PROPERTIES_CMS`) + **per-category field groups**
> (prefixed) + **conditional visibility** so each type shows only its own fields.
> Cross-ref: `../automations/LISTING_ENGINE.md`, `INGEST_EXTRACTOR.md`,
> `AIRTABLE_IMPLEMENTATION_PLAN.md`.

---

## 0. Canonical category taxonomy (fix this first)

The Bible defines **6** space categories. Standardize everywhere:

`Residential · Commercial · STR · Hospitality · Restaurants (Culinary) · Venues`

- `PROPERTIES_CMS.SpaceCategory` → ✅ **all 6 now present** (Residential, Commercial, STR,
  Restaurants, Hospitality, Venues) — added June 2026.
- `INTEL_CMS.SpaceCategory` uses a different set (Hospitality, Culinary) → align to the
  canonical 6 (treat "Culinary" = "Restaurants").

---

## 1. Shared Core (every property, every category)

These apply regardless of type — no prefix.

**Identity / facts:** `Title`, `Hook`, `SpaceCategory`, `City`, `Location`,
`Image` / `Photos`, `Tenure`.
**Workflow:** `Approved_For_ScoutIt`, `Pipeline_Status`, `AI_Draft_Notes`.
**Editorial layer (Phase-2 Council-crafted, not extracted):** `SpaceStory`,
`AestheticTag`, `LifestyleVibe`, `BestFor`, `ScoutItVerdict`, feel-scores
(`ComfortLevel`, `NaturalLight`, `Privacy`, `SpaceFeel`).

---

## 2. Per-category field sets

> Naming: `CM_` Commercial · `RS_` Residential · `STR_` STR · `RST_` Restaurants ·
> `HOSP_` Hospitality · `VEN_` Venues. Only a type's own group is shown for its records.

### Commercial — `CM_` ✅ (built)
Rent_Per_Sqm · CAMC_Per_Sqm · Hand_Over_Condition · Certification · AC_System ·
AC_Charges · Reserved_Parking · Availability_Status · Available_Units_Summary ·
Floor_Plate_Sqm · Towers_Zones
**Council additions (recommended):** Total_GLA · Building_Grade (Premium/A/B) ·
Min_Lease_Term · Parking_Ratio · Backup_Power · Internet_Providers · Floor_Loading ·
Ceiling_Height · Turnover_Year
- 🏛 Design: floor plate, ceiling height, loading, grade define usability.
- 🔑 Owner: certification (PEZA/LEED) and backup power are top selling points.
- 🔍 Buyer: total GLA, parking ratio, min lease term, internet redundancy drive the decision.

### Residential — `RS_`
Beds · Baths · Floor_Area_Sqm · Lot_Area_Sqm · Parking_Slots · Floor_Level ·
Furnishing · Price · Assoc_Dues · Turnover_Date · View · Amenities · Pet_Policy ·
Title_Status
- 🏛 Design: view, floor level, natural light, layout.
- 🔑 Owner: amenities, furnishing, turnover readiness.
- 🔍 Buyer: price, assoc dues, title status, pet policy, parking.
> Note: Beds/Baths/FloorSqm/LotSqm/Parking/Furnishing/TitleStatus already exist as
> generic fields — formalize them as the RS group; add Assoc_Dues, Turnover_Date,
> View, Amenities, Pet_Policy.

### STR (short-term rental) — `STR_`
Nightly_Rate · Max_Guests · Bedrooms · Bed_Config · Bathrooms · Min_Stay_Nights ·
Check_In_Out · Self_Check_In · Amenities · House_Rules · Cleaning_Fee ·
Permit_Accreditation · Avg_Rating
- 🔑 Owner: nightly rate, amenities, self check-in convenience.
- 🔍 Buyer: max guests, bed config, min stay, cleaning fee, rating.
- 🎯 Master: DOT accreditation / LGU permit signals legitimacy.

### Restaurants / Culinary — `RST_`
Floor_Area_Sqm · Seating_Capacity · Kitchen_Condition · Hood_Exhaust · Grease_Trap ·
Power_Capacity · Gas_Line · Previous_Use · Frontage · Foot_Traffic ·
FB_Zoning_Permit · Rent · Dues_CUSA · Turnover_Condition · Parking · Delivery_Access ·
Ventilation
- 🏛 Design: frontage, ventilation, kitchen condition, hood/exhaust.
- 🔑 Owner: previous use, turnover condition, foot traffic.
- 🔍 Buyer: power/gas capacity, grease trap, F&B zoning/permit, rent, delivery access.

### Hospitality — `HOSP_`
Room_Count · Star_Rating · Room_Types · FB_Outlets · Function_Rooms · Amenities ·
ADR (avg daily rate) · Occupancy_Rate · Operator_Brand · Year_Built_Renovated
- 🔑 Owner: brand/operator, amenities, renovation recency.
- 🔍 Buyer/investor: ADR, occupancy, room mix, F&B outlets.

### Venues — `VEN_`
Capacity_Seated · Capacity_Standing · Floor_Area_Sqm · Layout_Configs · Ceiling_Height ·
AV_Equipment · Catering_Policy · Air_Conditioning · Parking · Rental_Rate ·
Min_Booking_Hours · Accessibility
- 🏛 Design: capacity, layouts, ceiling height, A/C.
- 🔑 Owner: AV, catering policy, rental rate.
- 🔍 Buyer: min booking, parking, accessibility.

---

## 3. Master-page presentation (the Council's rule)

Every public property page is built in the same order, but the middle block is
category-aware:

```
[ Hero photo + Title + Hook ]
[ Editorial: SpaceStory · ScoutItVerdict · BestFor ]   ← universal (Council-crafted)
[ CATEGORY SPEC BLOCK ]                                 ← only that type's fields
[ Location map ]
[ Ecosystem: attached brokers / providers ]
```

- **Public site:** the property detail page conditionally renders the Spec Block for the
  record's `SpaceCategory` (offices show CM_ fields; restaurants show RST_; etc.).
- **Mission Control:** one curated **"Category — <Type>" edit/review page** per type, with
  conditional visibility on `SpaceCategory`, so editors only ever see relevant fields.
- **Entry SOP:** pick `SpaceCategory` first → only that category's curated fields appear.

---

## 4. Ingestion SOP impact

The `INGEST_EXTRACTOR` and the `LISTING_ENGINE` Council must map extracted facts into
the **matching category group**. The rotating **Category Master** in the Listing Engine
owns its category's field group here — this SOP is its rulebook.

---

## 5. Build order

1. Fix taxonomy: add `Hospitality`, `Venues` to `SpaceCategory`; align `INTEL_CMS`.
2. Commercial `CM_` — ✅ done.
3. Residential `RS_` (most common) — add the missing fields, formalize existing.
4. STR `STR_`, Restaurants `RST_`.
5. Hospitality `HOSP_`, Venues `VEN_`.
6. Per-category interface pages with conditional visibility.

## 8. MAJOR (free) vs MINOR (paywalled) — Council classification

**Rule:** MAJOR = decision-grade (enough to decide whether to pursue, incl. ALL
total-cost components + risk). MINOR = deeper perspective for budget-conscious buyers
(operator specs, investor metrics, negotiation levers, enhanced media, fine context).
Drives the wiring: MAJOR renders free; MINOR is gated behind a subscription.

### Universal
- **MAJOR (free):** Title, Hook, SpaceCategory, City, Location, Region, natural Photos,
  Listed_Price, Price_Source, ScoutItVerdict, BestFor, SpaceStory, DeveloperName, Tenure,
  YearBuilt, PublicTransport, NearestHighway, **FloodZoneStatus** (risk = decision-critical),
  Verification_Status / Last_Verified_Date.
- **MINOR (paid):** Enhanced_Photos, Virtual_Tour_URL, Video_URL, Floor_Plans,
  CommuteBGC/Makati/Ortigas, SafetyPerception, CommunityFeel, ZoningClassification,
  ZoningType, StructuralNotes, ExpansionPotential, UniverseSummary, ArchitectDesigner,
  BuildingStyle, DeveloperNotes, Price_Notes.

### Commercial
- **MAJOR:** CM_Rent_From/Rent_Per_Sqm, **CM_CAMC_Per_Sqm**, **CM_AC_Charges**
  (total occupancy cost), CM_Hand_Over_Condition, CM_Availability_Status,
  CM_Building_Grade, CM_Total_GLA, CM_Floor_Plate_Sqm, CM_PEZA, CM_Certification,
  CM_Min_Lease_Term.
- **MINOR:** CM_AC_System, CM_Reserved_Parking, CM_Escalation_Rate, CM_Fit_Out_Allowance,
  CM_Rent_Free_Period, CM_Parking_Ratio, CM_Backup_Power, CM_Floor_Loading,
  CM_Internet_Providers, CM_Available_Units_Summary, CM_Towers_Zones, CM_Cap_Rate, CM_NOI.

### Residential
- **MAJOR:** Beds, Baths, FloorSqm, LotSqm, Parking, Floors, RS_Floor_Level, RS_Price,
  Furnishing, RS_Turnover_Date, RS_View, TitleStatus, RS_Studio_Flag, **RS_Assoc_Dues**
  (monthly cost), Amenities, **RS_Pet_Policy** (owner-confirmed → free).
- **MINOR:** RS_Price_Per_Sqm, RS_Payment_Terms.

### STR
- **MAJOR:** STR_Nightly_Rate, **STR_Cleaning_Fee** (total cost), STR_Max_Guests,
  STR_Bedrooms, STR_Bathrooms, STR_Min_Stay_Nights, STR_Avg_Rating, STR_Check_In_Out,
  Amenities.
- **MINOR:** STR_Weekend_Rate, STR_Bed_Config, STR_Self_Check_In, STR_House_Rules,
  STR_Cancellation_Policy, STR_Permit_Accreditation, STR_WiFi_Speed.

### Restaurants
- **MAJOR:** RST_Floor_Area_Sqm, RST_Seating_Capacity, RST_Rent, **RST_Dues_CUSA**,
  RST_Kitchen_Condition, RST_Foot_Traffic, RST_Frontage, RST_Indoor_Outdoor,
  RST_Previous_Use.
- **MINOR (the "Engine Room" — already operator-collapsed in UI):** RST_Hood_Exhaust,
  RST_Grease_Trap, RST_Gas_Line, RST_Power_Capacity, RST_Delivery_Access,
  RST_Liquor_License, RST_FB_Zoning_Permit, RST_Ceiling_Height, RST_Turnover_Condition,
  RST_Parking.

### Hospitality
- **MAJOR:** HOSP_Room_Count, HOSP_Star_Rating, HOSP_Operator_Brand, HOSP_Room_Types,
  HOSP_FB_Outlets, HOSP_Function_Rooms, HOSP_Year_Built_Renovated, Listed_Price.
- **MINOR (investor deep-intel):** HOSP_ADR, HOSP_Occupancy_Rate, HOSP_RevPAR,
  HOSP_Cap_Rate, HOSP_GFA, HOSP_Land_Area.

### Venues
- **MAJOR:** VEN_Capacity_Seated, VEN_Capacity_Standing, VEN_Floor_Area_Sqm,
  VEN_Rental_Rate, VEN_Rate_Basis, VEN_Min_Booking_Hours, VEN_Indoor_Outdoor,
  VEN_Air_Conditioning, VEN_Catering_Policy.
- **MINOR (Back of House — already operator-collapsed in UI):** VEN_Layout_Configs,
  VEN_Ceiling_Height, VEN_AV_Equipment, VEN_Power_Capacity, VEN_Parking,
  VEN_Accessibility, VEN_Noise_Curfew.

### Council-debated borderline calls (flagged for owner)
- **FloodZoneStatus → MAJOR** (Manila flood risk is buy/no-buy; never lock it).
- **CAMC / AC charges / CUSA / Assoc dues / Cleaning fee → MAJOR** (they're part of true
  total cost; locking them would hide what a buyer needs to budget).
- **RST/VEN operator specs → MINOR** (the frontend already collapses these as
  "For Operators," so the paywall maps cleanly onto an existing UI boundary).
- **Owner final calls (June 2026):** STR Permit/Accreditation → stays MINOR;
  RS Pet_Policy → promoted to MAJOR; Commercial Backup_Power → stays MINOR.

---

## 9. PRICE POLICY (owner decision, June 2026)

**Price IS shown** — it's a major detail buyers/onlookers need. This **supersedes** the
manifesto's "no price tags" stance (update the About copy later — owner's content call).
Price is presented on the property master page in the **"Your Move"** chapter.

**Fields:** `Listed_Price` (the value) · `Price_Status` (Published / On Request) ·
`Price_Verified_By` (Owner / Property Manager / Broker / Unverified) · `Price_Source`
(where it came from) · `Price_Notes`.

**Rules:**
1. **A price is only Published if a human authority confirmed it** — Owner, Property
   Manager, or Broker. **Price is NOT a web-research / AI-guessed field.** The Listing
   Engine must never publish a price from the web; an unconfirmed price → On Request.
2. **Published →** show the price **with a "Verified by [Owner/Manager/Broker]" badge** and
   the source. The badge is the confirmation the buyer can trust.
3. **Owner withholds →** `Price_Status = On Request` → page shows
   **"Price on request — inquire with the owner / manager / broker."**
4. **Unverified →** treat as On Request until confirmed; never display as a real price.

**Your Move (master page) render logic:**
- `Published` + verified → `Listed_Price` + "✓ Verified by {Price_Verified_By}" + source.
- `On Request` → "Price on request" + inquiry CTA (to owner/manager/broker).

> Demo on the 6 SM E-Com records: five are **Published · Property Manager-verified**
> (the SM Offices deck is official leasing material); **Six E-Com = On Request**
> (pre-leasing, no rate published).

> Web-research enrichment is sequenced AFTER wiring (see §6 / build plan): wire first,
> confirm every needed field is listable, then run the Web Researcher pass.

---

## 6. Open decisions
- Confirm the field lists above per category (add/remove any).
- `Amenities` as multi-select (shared choice list) vs free text per category.
- Whether `RS_` fields reuse the existing generic Beds/Baths/etc. or get re-created with prefix.

---

## 7. Council Review v1 — proposed changes (PENDING owner's final recheck)

The Council reviewed §1–§5. Proposed amendments before building:

**Cross-cutting (apply to all categories):**
1. **Numeric twins for every fact field.** Money/size/capacity must have a numeric or
   currency field (filterable/sortable) alongside any display text. Required for the
   Board ranking, search, and the Cluster-tier "comparative space analysis."
   e.g. `CM_Rent_From` (number), `RS_Price` (currency), `STR_Nightly_Rate` (currency),
   `*_Capacity` (number), `*_Floor_Area_Sqm` (number).
2. **One shared `Amenities` multi-select** (master choice list) — replaces per-category
   free-text Amenities in Residential / STR / Hospitality / Venues.
3. **Source + verification fields** (align with Listing Engine): `Source_Citations`
   (long text), `Verification_Status` (Drafted / Rules passed / Council passed /
   Needs human / Verified). SOP previously omitted these.
4. **Region / Province** field for geo-filtering (use `regions.js` mapping).
5. **Filterable certifications** — add a `PEZA` checkbox (and similar) in addition to the
   `Certification` text, so buyers can filter.
6. **Category-appropriate editorial** — do not apply residential feel-scores
   (Comfort/Light/Privacy) to Commercial/Venues; define per-type editorial where needed.

**Per-category additions:**
- **Commercial:** `CM_Rent_From` (numeric), `CM_Fit_Out_Allowance`, `CM_Rent_Free_Period`,
  `CM_Escalation_Rate`, `CM_Min_Lease_Term`, `CM_Net_vs_Gross` note, `CM_Cap_Rate`,
  `CM_NOI`, `PEZA` (checkbox).
- **Residential:** `RS_Price` (currency), `RS_Price_Per_Sqm`, `RS_Payment_Terms`,
  `RS_Studio_Flag` (checkbox — powers the "Studio" filter; Beds=0 kept as underlying data).
- **STR:** `STR_Nightly_Rate` (currency), `STR_Weekend_Rate`, `STR_Cancellation_Policy`.
- **Restaurants:** numeric `RST_Power_Capacity`, `RST_Seating_Capacity`,
  `RST_Liquor_License`, `RST_Ceiling_Height`, indoor/outdoor.
- **Hospitality:** `HOSP_Room_Count` (number), `HOSP_ADR` (currency),
  `HOSP_Occupancy_Rate` (percent), `HOSP_RevPAR`, `HOSP_Cap_Rate`.
- **Venues:** numeric `VEN_Capacity_Seated` / `VEN_Capacity_Standing`,
  `VEN_Rental_Rate` (currency) + rate basis (hour/day/event), `VEN_Indoor_Outdoor`,
  `VEN_Noise_Curfew`.

**Master page:** each category Spec Block leads with 3–5 numeric "hero facts"
(comparison-ready), then full details.

**Field visibility / gating (decided):**
- Most fields are **free-public** (rent, area, beds, capacity, etc.).
- **Deep-intel = Solar+ gated** via the existing `Deep_Intel_Gate` field:
  `CM_Cap_Rate`, `CM_NOI`, `HOSP_ADR`, `HOSP_Occupancy_Rate`, `HOSP_RevPAR`,
  `HOSP_Cap_Rate`. Mission Control (admin) always sees them; the public site/API serves
  them only to Solar+ subscribers and shows free users a locked "upgrade" row.
- The category **Spec Block** is built with a dedicated **"locked premium" sub-section**
  for these fields from the start — so no interface rework when gating is enforced.

> Status: ✅ BUILT (June 2026). All 6 category field groups created on PROPERTIES_CMS:
> shared (Amenities, Region, Source_Citations, Verification_Status) + CM_/RS_/STR_/RST_/
> HOSP_/VEN_ groups, incl. numeric twins and the Solar+ deep-intel fields. 84 new fields.
> REMAINING: (a) add `Hospitality` + `Venues` choices to SpaceCategory (API can't edit
> select choices — auto-creates on first typecast record, or add in UI); (b) per-category
> interface pages — grid views are API-buildable; conditional-visibility entry forms are
> a manual Airtable interface-designer step.
