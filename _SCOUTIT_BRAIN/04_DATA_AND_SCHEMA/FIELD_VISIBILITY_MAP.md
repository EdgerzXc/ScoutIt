# ScoutIt — Field Visibility Map (per SECTION × per CATEGORY)

> **The single source of truth for what is PUBLIC vs HIDDEN INTEL vs INTERNAL on a property page.**
> Status: **✅ SIGNED OFF by owner 2026-07-02.**
>
> **📁 One dedicated file per category (the operational references — start there):**
> [VISIBILITY_MAP__RESIDENTIAL.md](VISIBILITY_MAP__RESIDENTIAL.md) ·
> [VISIBILITY_MAP__COMMERCIAL.md](VISIBILITY_MAP__COMMERCIAL.md) ·
> [VISIBILITY_MAP__STR.md](VISIBILITY_MAP__STR.md) ·
> [VISIBILITY_MAP__HOSPITALITY.md](VISIBILITY_MAP__HOSPITALITY.md) ·
> [VISIBILITY_MAP__RESTAURANTS.md](VISIBILITY_MAP__RESTAURANTS.md) ·
> [VISIBILITY_MAP__VENUES.md](VISIBILITY_MAP__VENUES.md)
>
> **The owner's design was already built and recorded in code — this doc mirrors it:**
> - `src/lib/deepIntelSchema.js` — the per-category × per-chapter hidden-intel lists (6 categories × 6 panels)
> - `src/components/property/chapterConfig.js` — the chapter registry (order, per-category names)
> - `src/components/property/CategorySpecBlock.js` — the Space chapter's spec rows (major/minor)
> - `src/lib/entitlements.js` — the tier gates (deep intel Solar+, Vault/market intel Cluster+)
> - Airtable field descriptions ("MINOR/paywalled" / "DEEP-INTEL" tags) on base `appWFRqR0wy6hSR6h`
>
> ⚠️ **History:** the 2026-07-01 first draft of this file proposed "all operator facts free" and treated the
> code as over-hiding. WRONG — the owner had already ruled per-section/per-category (June 2026, encoded in
> the files above + `PROPERTY_CATEGORY_SOP.md §8`). Owner rejected the loosening on 2026-07-02. Where §8 and
> `deepIntelSchema.js` disagree (e.g. CAMC/AC charges), **the code design wins** (it is the later ruling).

---

## 0. The rule

**Visibility is decided per SECTION of the property page, per CATEGORY. Some sections have a hidden-intel
panel, some don't.** The line is **acquirability + need**:

| Bucket | On the page | What belongs here |
|---|---|---|
| **PUBLIC** (free / Starry) | white text | Easily acquirable details / what a regular visitor actually needs |
| **HIDDEN INTEL** (Solar+, gold) | the "DEEP INTELLIGENCE" blur-locked panel inside a section | Hard-to-get details, AI/expert-assessed readings, investor/broker/operator-grade facts |
| **VAULT** (Cluster+) | The Vault chapter | 3D/360/drone spatial media |
| **INTERNAL** | never served | drafts, notes, pipeline/verification state, price-internal, control flags |

**Cross-cutting invariants:** flood/hazard risk is NEVER gated · money renders ONLY in "Your Move"
(owner-verified: `Price_Status=Published` + `Price_Verified_By` ∈ Owner/Manager/Broker) — never on cards,
spec blocks, or filters · `Deep_Intel_Gate` (Airtable) is labeling only, no code reads it (verified
2026-07-02) — enforcement lives in the components above (client-side until the deferred security overhaul).

---

## 1. The page, section by section

| # | Section (Residential name; renamed per category) | PUBLIC (white) | HIDDEN INTEL panel? |
|---|---|---|---|
| 01 | **The Space** (Floor Plate / The Stay / The Grounds / Kitchen & Dining / Production Capacity) | Story text, awarded badge, core stats (beds/baths/sqm/parking), ceiling height, furnishing, outdoor space + the category spec rows (§3) | ✅ Panel 1 (§2) + the spec block's locked minor rows (§3) |
| 02 | **Location** (Access & Logistics / Getting There / The Transfer / How Guests Arrive / Guest Logistics) | Map, address/city, transit basics | ✅ Panel 2 (§2) |
| — | **The Vault** | Nothing — teaser only | 🔒 ENTIRE chapter = Cluster+ (Luma 3D / 360 tour / drone heatmap; `Virtual_Tour_URL`, `Luma_3D_Map_URL`, `Drone_Heatmap_URL`) |
| 03 | **Life Here** (The Workday / The Experience / Guest Experience / The Vibe / Event Atmosphere) | Neighborhood/vibe narrative, safety-adjacent text | ✅ Panel 3 (§2) — the assessed quality readings (ventilation/noise/light/privacy…) |
| 04 | **Where To?** (The Block / The Radius / Around the Table / Guest Radius) | POI list ("Where To" data), landmarks + times | ✅ Panel 4 (§2) |
| 05 | **Build Plans** (Fit-Out Potential / Operating Context / The Operational Shell / **The Engine Room** / **Back of House**) | Expansion narrative; for Restaurants/Venues this chapter is operator-collapsed by default | ✅ Panel 5 (§2) — MEP/structural/technical. Engine Room & Back of House content is the hidden-intel layer |
| 06 | **The Fine Print** | Flood zone status + risk (NEVER gated), title status, structural caveats-as-facts | ✅ Panel 6 (§2) — records: historical transactions, ownership lineage, permits/blueprints, precise dimensions *(rendered in Units chapter on Commercial, Universe on Residential — same content)* |
| 07 | **Units & Spaces** (Floors & Suites / Rooms & Beds / Room Types / The Rooms / Space Segments) | Unit list: name, size, floor, features, 1 photo; **+ operator name + availability status when a unit is delegated (§9.2, added 2026-07-03 — see note below)** | Owner-tier photo cap (free 1 / PRO 5 per unit); exact floor level folds into the Space panel when present |
| 08 | **Property Universe** | FULLY FREE — verdict line, market-position narrative | ❌ none |
| 09 | **Services** | FULLY FREE — attached brokers/providers roster | ❌ none (contacting costs Connects — economy, not visibility) |
| 10 | **Your Move** | Reactions, broker CTA, compliance note. **The ONLY place money renders**, owner-verified, with "✓ Verified by …" badge; else "Price on request" | ❌ none (compliance-gated, not tier-gated) |

---

## 2. The hidden-intel panels — per category (verbatim from `deepIntelSchema.js`)

> These are the owner's authored lists. When Mission Control edits these fields, label them **Hidden**.
> Panels are Solar+ (`deepIntel` gate). Empty values render "Not recorded" — never invented.

### Commercial
1. **The Space:** CAMS (CUSA) · A/C Charges · Escalation Rate · Fit-out Allowance · Rent-free Period · Cap Rate · NOI
2. **Location:** Towers/Zones · Parking Ratio · Reserved Parking · Solar Orientation · Pedestrian Flow Metrics
3. **Life Here:** Ventilation Quality · Noise Level Score · Natural Light Score · Privacy Score · Acoustic Baseline
4. **Where To?:** Internet Providers · Walkability Score · Peak Hour Traffic Data · Delivery Zone Coverage · Transport Node Coverage
5. **Build Plans:** Backup Power · Floor Loading · MEP Specifications · Electrical Load Capacity · Structural Calculations
6. **Records:** Available Units · Office Density Data · Development Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive

### Residential
1. **The Space:** HOA Reserve Health · Assoc Dues History · Annual Property Tax · Insurance Coverage · Upcoming CapEx
2. **Location:** Solar Orientation · View Protection · Zoning Classification · Flood/Elevation Risk detail · Pedestrian Flow Metrics
3. **Life Here:** Visual Privacy Rating · Noise Decibel Readings · Lighting Color Temperature · Demographic Shift · Peak Hour Crowd Data
4. **Where To?:** Walkability Score · Transit Frequency Analysis · Peak Hour Commute Data · School District Quality · Delivery Zone Coverage
5. **Build Plans:** MEP Specifications · Structural Calculations · Renovation History · Internet Routing · Backup Power
6. **Records:** Development Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive · Precise Room Dimensions · Finish & Material Schedule

### STR
1. **The Stay:** ADR Projections · Occupancy Rate History · HOA Airbnb Rules · Cleaning Fee Average · Property Mgmt Split
2. **Getting There:** Tourist Hub Proximity · Seasonality Metrics · Guest Parking Logistics · Solar Orientation · Zoning Classification
3. **The Experience:** Cleaning Turnover Time · Noise Decibel Readings · Lighting Color Temperature · Visual Privacy Rating · Guest Demographic Bias
4. **The Radius:** Walkability Score · Airport/Transit Routing · Delivery Zone Coverage · Luggage Drop Logistics · Nightlife Proximity
5. **Operating Context:** Keyless Entry System · WiFi Speed & Reliability · Fixed Equipment Specs · Finish & Material Schedule · MEP Specifications
6. **Records:** Precise Room Dimensions · Competitor Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive

### Hospitality
1. **The Grounds:** Baseline RevPAR · GOPPAR Projections · FF&E Transfer Value · Star Rating Equivalent · Franchise Viability
2. **The Transfer:** Tourist Hub Proximity · Seasonality Metrics · Coach/Bus Logistics · Solar Orientation · Zoning Classification
3. **Guest Experience:** Cleaning Turnover Time · Noise Decibel Readings · Lighting Color Temperature · Visual Privacy Rating · Guest Demographic Bias
4. **The Radius:** Walkability Score · Airport/Transit Routing · Delivery Zone Coverage · Supply Chain Logistics · MICE Proximity
5. **The Operational Shell:** PMS Integration Specs · Backup Power · Commercial Kitchen Specs · Finish & Material Schedule · MEP Specifications
6. **Records:** Precise Room Dimensions · Competitor Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive

### Restaurants
1. **Kitchen & Dining:** CAMS (CUSA) · Fit-out Allowance · Kitchen-to-Dining Ratio · Table Turnover Projections · Liquor License Status
2. **How Guests Arrive:** Solar Orientation · Pedestrian Flow Metrics · Signage & Visibility · Zoning Classification · Valet/Parking Logistics
3. **The Vibe:** Acoustic Baseline Score · Ambient Light Temperature · Ventilation Capacity · Table Privacy Rating · Noise Level Score
4. **Around the Table:** Delivery Radius Coverage · Foot Traffic Peak Hours · Competitor Proximity · Supply Delivery Logistics · Walkability Score
5. **The Engine Room:** Grease Trap Specs · Extraction Ducting · Gas Line Specs · Electrical Load Capacity · Water & Drainage Routing
6. **Records:** Precise Room Dimensions · Development Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive

### Venues
1. **Production Capacity:** Baseline Hire Fee · Max Standing/Seated pax detail · Overtime/Egress Rates · Catering/Corkage Buyouts · Noise Curfew Constraints
2. **Guest Logistics:** Truck/Rigging Logistics · Event Parking Logistics · Solar Orientation · Zoning Classification · VIP Ingress Routing
3. **Event Atmosphere:** Acoustic Treatment Grade · Sound Isolation Rating · Lighting Rig Capability · Event AC Capacity · External Noise Penetration
4. **Guest Radius:** Transport Node Coverage · Post-Event Crowd Routing · Hotel Proximity · Security Perimeter · Walkability Score
5. **Back of House:** Rigging Load Ratings · Floor Load Limit · Power Drops & Distro · Data/Broadcast Lines · Structural Calculations
6. **Records:** Precise Room Dimensions · Clear Ceiling Height detail · Historical Event Roster · Provenance & Ownership Lineage · Original Permit & Blueprint Archive

---

## 3. The Space chapter's spec block (CategorySpecBlock — Airtable-backed rows)

Free rows (white) vs the locked minor list (folds into the same section's Deep Intelligence box):

| Category | FREE rows | LOCKED minor rows |
|---|---|---|
| Commercial | Published Rent · Total GLA · Floor Plate · Building Grade · Hand-over · Availability · Min Lease Term · Certification · PEZA | CAMC (CUSA) · A/C Charges · AC System · Reserved Parking · Escalation · Fit-out · Rent-free · Parking Ratio · Backup Power · Floor Loading · Internet Providers · Available Units · Towers/Zones · Cap Rate · NOI |
| Residential | Floor Level · View · Turnover · Pet Policy · Studio flag | Price/sqm · Payment Terms |
| STR | Max Guests · Avg Rating (public — owner 2026-07-02) · Beds · Baths · Min Stay · Check-in/out | Weekend Rate · Bed Config · Self Check-in · House Rules · Cancellation Policy · Permit/Accreditation · WiFi Speed |
| Restaurants | Floor Area · Seating · Kitchen Condition · Foot Traffic · Frontage · Indoor/Outdoor · Previous Use | Hood/Exhaust · Grease Trap · Gas Line · Power Capacity · Delivery Access · Liquor License · F&B Zoning Permit · Ceiling detail · Turnover Condition · Parking |
| Hospitality | Rooms · Stars · F&B Outlets · Function Rooms · Operator · Room Types · Built/Renovated | ADR · Occupancy · RevPAR · Cap Rate · GFA · Land Area |
| Venues | Seated/Standing Capacity · Floor Area · Min Booking · Indoor/Outdoor · A/C · Catering Policy | Layout Configs · Ceiling detail · AV Equipment · Power Capacity · Parking · Accessibility · Noise Curfew |

**The live code already implements this table exactly — no visibility code changes are needed.**

---

## 4. Universal buckets (Airtable `PROPERTIES_CMS`)

**PUBLIC:** Title · Slug · Hook · City · Location · Region · SpaceCategory · Tenure · YearBuilt · Furnishing ·
Beds · Baths · FloorSqm · LotSqm · Parking · Floors · CeilingHeight(+`_M`) · OutdoorDescription · StreetType ·
TitleStatus · Amenities · AestheticTag · LifestyleVibe · BestFor · ScoutItVerdict · SpaceStory · natural
Photos/Image · DeveloperName · PublicTransport · NearestHighway · **FloodZoneStatus/FloodRiskScore (never
gated)** · Units_JSON · Last_Verified_Date

**HIDDEN INTEL (Solar+):** the §2 panel fields (stored today in `details`/`deepIntel` JSON + the tagged
Airtable columns: CM_Cap_Rate, CM_NOI, HOSP_ADR/Occupancy/RevPAR/Cap_Rate, CM_Internet_Providers,
CM_Floor_Loading, VEN_Power_Capacity, HOSP_GFA, HOSP_Land_Area) · assessed NoiseLevel/Ventilation ·
feel scores (ComfortLevel/NaturalLight/Privacy/SpaceFeel) · ConvenienceScore + future heatmap scores ·
Commute*/SafetyPerception/CommunityFeel/Zoning*/StructuralNotes/ExpansionPotential/UniverseSummary/
ArchitectDesigner/BuildingStyle/DeveloperNotes/Price_Notes (§8 universal MINOR) · Enhanced_Photos (Solar+)

**VAULT (Cluster+):** Virtual_Tour_URL · Video_URL · Floor_Plans · Luma/drone media

**INTERNAL (never served):** PriceRange_Internal · Vision_Uploads · AI_* fields · AI_Draft_Notes ·
Broker_Input_Notes · Pipeline_Status · Verification_Status (derive a public "Verified ✓" badge only) ·
Approved_For_ScoutIt · Photos_Status · Listing_Visibility · Deep_Intel_Gate · Source_Citations · Owner_Ref ·
Inquiry_Count · Latitude/Longitude (power the map only) · link fields · Last Modified Time

---

## 4a. Unit Delegation fields (2026-07-03 addendum — NOT yet an explicit owner ruling)

`property_units.operator_id` / `operator_display_name` and `availability_status` are new
(`SCOUTIT_MASTER_BUILD_SPEC.md §9.2`). They were classified **PUBLIC** by analogy to two
already-signed-off precedents, not by asking the owner directly for this specific case — flagging
that distinction honestly rather than presenting it as ruled-on:

- **Operator identity → PUBLIC**, same footing as `broker_name` in the existing "Assigned
  Representative" block (§1 row 10, Your Move) — a buyer/seeker needs to know *who* they'd be
  contacting for "Your Move" to function at all; this is acquirability+need, not premium
  intelligence.
- **`availability_status` → PUBLIC**, same footing as `CM_Availability_Status`, which is already a
  FREE row in §3's spec-block table — availability is exactly the kind of fact a buyer needs
  before spending a Connect to make contact.
- `property_units.id` (serialized into `Units_JSON` as `id`) is plumbing, not a "fact" — treated
  like `Latitude`/`Longitude` in §4 (public only insofar as it powers a feature, never displayed
  as content).

**If this reasoning is wrong, say so and it gets fixed** — this section exists so a future session
doesn't mistake "reasoned by analogy" for "explicitly signed off," the way the 2026-07-01 draft's
unreviewed assumptions caused a real correction on 2026-07-02.

## 5. Owner rulings log

- **2026-07-02:** map must be per-section × per-category (some sections have hidden intel, some don't) —
  this rewrite. The 7/1 "un-hide operator facts" proposal REJECTED.
- **2026-07-02:** `STR_Avg_Rating` → PUBLIC. CM_Internet_Providers / CM_Floor_Loading / VEN_Power_Capacity /
  HOSP_GFA / HOSP_Land_Area → HIDDEN. Assessed Ventilation/Noise → HIDDEN (Deep Intelligence panel);
  raw CeilingHeight → PUBLIC.
- **CAMC / A/C charges:** stay HIDDEN — the owner's deepIntelSchema design lists CAMS (CUSA) + A/C Charges
  as Commercial deep intel, superseding the older §8 "MAJOR" note. (Question withdrawn 2026-07-02.)
- **June 2026 (§8 final calls, still standing):** STR permit → paid · RS pet policy → free ·
  CM backup power → paid.

## 6. What actually needs doing (Batch 0, revised)

1. ~~Code changes~~ — **NONE.** The live components already implement this map.
2. **Airtable hygiene (owner OK pending):** un-approve the 2 live-approved "E2E Test Property" records,
   delete the 2 empty rows, optionally fill `Deep_Intel_Gate` as a Mission Control label.
3. **Docs:** `PROPERTY_CATEGORY_SOP.md §8` and `CATEGORY_FIELD_SOP.md` should point here; note that
   deepIntelSchema.js supersedes §8 where they differ.
4. **Mission Control (later):** label every editor field Public / Hidden / Internal from THIS map.
