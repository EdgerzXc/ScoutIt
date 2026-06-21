# ScoutIT — Per-Category Field SOP (current, wizard-ready)

> The single, current source for **what data each property category needs**, mapped to the
> **live** `PROPERTIES_CMS` field names (base `appWFRqR0wy6hSR6h`). The owner wizard, directory
> cards, and property page all branch from this. Supersedes drift in the older
> `SCOUTIT_AIRTABLE_SOP.md` / `PROPERTY_CATEGORY_SOP.md` (kept as background); when they conflict,
> **this file + the live schema win.** Last verified against live schema: June 2026.

## Golden rules (all categories)
- **Honest blank:** no data → leave empty. Never 0 / N/A / a guess. Wrong data is worse than none.
- **needed = free tier** (hard diligence facts, shown to everyone). **extra = paid tier**
  (judgment/feel scores, deep financials) — gated via `Deep_Intel_Gate`, blurred until unlocked.
- **Price** (`Listed_Price`, `RS_Price`, `CM_Rent_*`, `STR_Nightly_Rate`, `RST_Rent`,
  `VEN_Rental_Rate`) renders **only in "Your Move"**, **only** when `Price_Status` = Published AND
  `Price_Verified_By` ∈ {Owner, Property Manager, Broker}. Else "Price on request" / nothing.
- **Legally-adjacent fields** (STR legality, F&B/health/fire permits) → flag `[UNVERIFIED]` until a
  human asserts; STR legality re-verified quarterly.
- **Shared physical facts** use shared columns; **category-unique** facts keep the prefix
  (`RS_ CM_ STR_ RST_ HOSP_ VEN_`). Don't recreate a shared fact per category.
- The wizard saves to Supabase `properties` (`space_category` + `details` JSON); on approval it
  maps `details` → these Airtable columns.

## Shared fields (every category asks these)
`Title` · `SpaceCategory` · `City` · `Location` · `Hook` (one-line) · `Photos` · `Tenure`
(For Sale/Rent) · `BestFor` (tags) · price block (`Listed_Price` + `Price_Status` +
`Price_Verified_By`) · `Amenities`. Map page/master extras when known: `DeveloperName`,
`ArchitectDesigner`, `BuildingStyle`, `ZoningClassification`, `FloodZoneStatus`, `YearBuilt`.

---

## 1. RESIDENTIAL
**Needed (free):** `Beds` · `Baths` · `FloorSqm` · `LotSqm` · `Parking` · `Furnishing` ·
`RS_Floor_Level` · `RS_View` · `RS_Turnover_Date` · `RS_Assoc_Dues` · `RS_Pet_Policy` ·
`RS_Studio_Flag` · `RS_Price` / `RS_Price_Per_Sqm` (Your Move) · `RS_Payment_Terms` (pre-selling).
**Extra (paid):** `ComfortLevel` · `NaturalLight` · `Privacy` · `SpaceFeel` · `NoiseLevel` · `CeilingHeight`.

## 2. COMMERCIAL  *(SM Offices pattern)*
**Needed (free) — the all-in occupancy cost is the point:** `CM_Rent_Per_Sqm` (+`CM_Rent_From`) ·
`CM_CAMC_Per_Sqm` (+`CM_CAMC_From`) · `CM_AC_System` · `CM_AC_Charges` (+`CM_AC_Charge_From`) ·
`CM_Reserved_Parking` · `CM_Floor_Plate_Sqm` (+`CM_Floor_Plate_From`) · `CM_Total_GLA` ·
`CM_Building_Grade` · `CM_Hand_Over_Condition` · `CM_Availability_Status` ·
`CM_Available_Units_Summary` · `CM_Towers_Zones` · `CM_PEZA` / `CM_Certification` ·
`CM_Min_Lease_Term` · `CM_Parking_Ratio` · `CM_Backup_Power` · `CM_Escalation_Rate` ·
`CM_Fit_Out_Allowance` · `CM_Rent_Free_Period`.
**Extra (paid):** `CM_Cap_Rate` · `CM_NOI` · `CM_Internet_Providers` · `CM_Floor_Loading`.

## 3. STR (Short-Term Rental)
**Needed (free):** `STR_Max_Guests` · `Beds` · `STR_Bed_Config` · `Baths` · `STR_Nightly_Rate` ·
`STR_Weekend_Rate` · `STR_Cleaning_Fee` · `STR_Min_Stay_Nights` · `STR_Check_In_Out` ·
`STR_Self_Check_In` · `STR_House_Rules` · `STR_Cancellation_Policy` · `STR_WiFi_Speed` ·
**`STR_Permit_Accreditation` (legality — `[UNVERIFIED]` + re-verify quarterly).**
**Extra (paid):** `STR_Avg_Rating` · feel scores.

## 4. HOSPITALITY
**Needed (free):** `HOSP_Room_Count` · `HOSP_Star_Rating` · `HOSP_Room_Types` · `HOSP_FB_Outlets` ·
`HOSP_Function_Rooms` · `HOSP_Operator_Brand` · `HOSP_Year_Built_Renovated` · `HOSP_GFA` ·
`HOSP_Land_Area`.
**Extra (paid):** `HOSP_ADR` · `HOSP_Occupancy_Rate` · `HOSP_RevPAR` · `HOSP_Cap_Rate`.

## 5. RESTAURANTS
**Needed (free):** `RST_Seating_Capacity` · `RST_Kitchen_Condition` · `RST_Hood_Exhaust` ·
`RST_Grease_Trap` · `RST_Gas_Line` · `RST_Power_Capacity` · `RST_Delivery_Access` ·
`RST_Frontage` · `RST_Foot_Traffic` · `RST_Previous_Use` · `RST_Rent` · `RST_Dues_CUSA` ·
`RST_Turnover_Condition` · `Indoor_Outdoor` · `Guest_Parking` ·
**`RST_Liquor_License` / `RST_FB_Zoning_Permit` (legality — `[UNVERIFIED]`).**
**Extra (paid):** acoustic/lighting/intimacy feel scores.

## 6. VENUES / EVENT SPACES
**Needed (free):** `VEN_Capacity_Seated` · `VEN_Capacity_Standing` · `VEN_Layout_Configs` ·
`VEN_Min_Booking_Hours` · `VEN_AV_Equipment` · `VEN_Catering_Policy` · `VEN_Air_Conditioning` ·
`VEN_Accessibility` · `VEN_Noise_Curfew` · `VEN_Rental_Rate` · `VEN_Rate_Basis` ·
`Indoor_Outdoor` · `Guest_Parking` · `CeilingHeight`. **Fire-safety cert (legality — `[UNVERIFIED]`).**
**Extra (paid):** `VEN_Power_Capacity` · production/acoustic feel scores.

---

## Wizard build contract (task 18 reads this)
1. Step 1 picks `SpaceCategory` → the wizard then renders **only that category's needed fields**
   (extra fields shown as optional/"adds completeness").
2. Save to Supabase `properties.details` keyed by the Airtable field names above (lowercased ok),
   `space_category` set, `pipeline_status='pending'`, `owner_id = current user`.
3. The price step writes `Price_Status` + `Price_Verified_By` per the compliance rule.
4. Completeness score = % of that category's **needed** fields filled.
5. Order of any future change: **this SOP → Airtable fields → wizard code.**
