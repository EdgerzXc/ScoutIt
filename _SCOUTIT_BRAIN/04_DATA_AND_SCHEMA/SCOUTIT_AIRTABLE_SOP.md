# ScoutIT Airtable Data Entry SOP — Property Page by Category

**Golden Rule:** If you don't have the data, leave the field empty. Never enter 0, N/A, or placeholder text. Empty fields do not render on the page. Wrong data is worse than no data.

---

## RESIDENTIAL — Required fields (free tier)
- Bedrooms, Bathrooms, Floor_sqm, Parking, Lot_sqm
- Aesthetic_Style, Furnishing, Tenure (For Sale / For Rent)
- Year_Built, Title_Status, Zoning
- City, District, Barangay, Latitude, Longitude
- Flood_Zone, Structural_Notes
- Architect (if known), Developer (if known)
- Expansion_Notes, Outdoor_Space
- Listed_Price (only if owner authorized), Price_Source, Price_Notes

Optional paid tier (enter only if verified):
- Comfort_Level, Noise_Level, Natural_Light, Privacy_Score, Ceiling_Height

---

## COMMERCIAL — Required fields
- Floor_sqm, Ceiling_Height, Frontage_sqm, Parking_Ratio
- Floor_Plate_Notes, MEP_Capacity, Subdivision_Potential
- Zoning_Classification, Title_Status
- Nearest_Offices, Nearest_Suppliers, Demand_Anchors
- After_Hours_Feel (text)

---

## STR — Required fields
- Max_Guests, Bedrooms, Beds, Bathrooms
- Short_Let_Legal ("Permitted" / "Permitted with conditions" / "Not permitted" / "Unverified")
- Short_Let_Verified_Date (format: Mon YYYY e.g. "Mar 2026")
- HOA_Rules_Notes, Permit_Notes
- Nearest_Airport, Airport_Travel_Time
- Screenshot_Moments (text)

Verification rule: Short_Let_Legal must be re-verified every quarter. Add "— verify by [date]" when entering.

---

## HOSPITALITY — Required fields
- Total_Keys, Amenity_Footprint_sqm, Architectural_Style
- Service_Ratio (staff per room if known)
- Nearest_Airport, Airport_Transfer_Time
- BOH_Notes, Expansion_Notes
- Room_Types (each type: Standard/Deluxe/Suite/Villa + sqm)

---

## RESTAURANTS — Required fields
- Cover_Count (total seats)
- Seating_Breakdown (indoor/outdoor/bar/private room split)
- Kitchen_Grade (A / B / C — see guide below)
- Kitchen_to_Dining_Ratio (percentage if known)
- Acoustic_Profile (e.g. "Intimate, low ambient noise")
- Lighting_Temperature (e.g. "Warm 2700K, candlelit accents")
- Demand_Anchors (offices, malls, churches feeding foot traffic)
- Health_Permit_History (clean / with notes)

Kitchen Grade guide:
- **A** — Full commercial fit-out, proper exhaust, grease trap, industrial electrical
- **B** — Semi-commercial, adequate for current use, some limitations
- **C** — Residential-grade kitchen, limited to light food prep

---

## VENUES / EVENT SPACES — Required fields
- Standing_Capacity, Seated_Capacity
- Setup_Grade (A / B / C — see guide below)
- Floor_Load_Limit (kg/sqm if known)
- Rigging_Points (yes/no + notes)
- Sound_Isolation_Rating (text)
- Acoustic_Treatment (yes/no + notes)
- Green_Room_Count, Green_Room_sqm
- Loading_Dock (yes/no)
- Vendor_Exclusivity (yes/no + notes)
- Fire_Safety_Cert (current / expired / unverified)

Setup Grade guide:
- **A** — Full production capability: rigging, in-house AV, blackout, loading dock
- **B** — Semi-equipped: basic AV, partial blackout, street-level load-in
- **C** — Raw space: blank canvas, no built-in production capability

---

## Universal Rules (all categories)
- Always enter Latitude + Longitude (required for map)
- Always enter at least 3 photos minimum before publishing
- Never publish without City, District, and Space_Category filled
- Slug: lowercase, hyphenated, no spaces (e.g. `batasan-hills-house-lot`)
- Is_Published: only tick when all required fields are complete
- Add `[UNVERIFIED]` prefix to any legally adjacent field (STR legality, health permits, fire certs) until a human asserts it
