// ═══════════════════════════════════════════════════════════════
// PROPERTY FIELD MAPPING — editor details → Airtable field names
//
// ⚠️⚠️  THIS FILE IS VENDORED INTO TWO PROJECTS. ⚠️⚠️
//        src/lib/propertyFieldMapping.js                  (main app)
//        mission-control/src/lib/propertyFieldMapping.js  (staff app)
//
// They are SEPARATE Next.js deployments and cannot import across project
// roots, so the file is duplicated on purpose. `propertyFieldMapping.drift.test.js`
// hashes both copies and FAILS if they differ — edit one, copy to the other.
//
// WHY THIS EXISTS (finding W3, 2026-07-30)
// The staff app had its own 140-line Airtable client whose listingFields()
// wrote SIX fields: Title, Location, SpaceTypography, SpaceCategory,
// Approved_For_ScoutIt, Units_JSON, Photos. The main app wrote ~90.
//
// So a staff publish left rent, GLA, building grade, seating capacity, room
// count and every other category spec STALE in Airtable — silently. It is a
// PATCH, so nothing was erased; the values simply stopped tracking Supabase,
// with no error and a listing that still looked published.
//
// Extracting the mapping here and vendoring it means both write paths emit the
// same ~90 fields from the same code.
// ═══════════════════════════════════════════════════════════════

import { EDITOR_DETAIL_ALIASES } from "./detailKeyAliases";
import { deriveNumericTwins } from "./numericTwins";

export function reverseMapCategoryFields(details) {
  const map = {};
  if (!details) return map;

  // Normalize editor-sourced keys onto the camelCase keys read below. Only
  // fills a camelCase key when it isn't already present, so any existing
  // camelCase writer keeps precedence and nothing regresses.
  const aliased = { ...details };
  for (const editorKey in EDITOR_DETAIL_ALIASES) {
    const camelKey = EDITOR_DETAIL_ALIASES[editorKey];
    if (aliased[editorKey] !== undefined && aliased[camelKey] === undefined) {
      aliased[camelKey] = aliased[editorKey];
    }
  }
  details = aliased;

  // Comma-safe numeric coercion — an owner typing "25,000" must not become null.
  const toNum = (v) => {
    const n = Number(String(v).replace(/[,\s]/g, ""));
    return Number.isFinite(n) && String(v).trim() !== "" ? n : null;
  };

  const cleanStr = (v) => (typeof v === "string" ? v.trim() : v);

  // Shared
  if (details.beds !== undefined) map.Beds = toNum(details.beds);
  if (details.baths !== undefined) map.Baths = toNum(details.baths);
  if (details.floor_sqm !== undefined) map.FloorSqm = toNum(details.floor_sqm);
  if (details.lot_sqm !== undefined) map.LotSqm = toNum(details.lot_sqm);
  if (details.parking !== undefined) map.Parking = toNum(details.parking);
  if (details.furnishing !== undefined) map.Furnishing = cleanStr(details.furnishing);
  if (details.titleStatus !== undefined) map.TitleStatus = cleanStr(details.titleStatus);
  if (details.amenities !== undefined) {
    // Airtable Amenities is multipleSelects -> needs an array; typecast:true on
    // the write auto-creates any option the owner typed that doesn't exist yet.
    map.Amenities = Array.isArray(details.amenities)
      ? details.amenities.map(cleanStr).filter(Boolean)
      : String(details.amenities).split(",").map((s) => s.trim()).filter(Boolean);
  }

  // Commercial
  if (details.rentPerSqm !== undefined) map.CM_Rent_Per_Sqm = cleanStr(details.rentPerSqm);
  if (details.totalGLA !== undefined) map.CM_Total_GLA = Number(details.totalGLA) || null;
  if (details.floorPlate !== undefined) map.CM_Floor_Plate_Sqm = cleanStr(details.floorPlate);
  if (details.buildingGrade !== undefined) map.CM_Building_Grade = cleanStr(details.buildingGrade);
  if (details.handOver !== undefined) map.CM_Hand_Over_Condition = cleanStr(details.handOver);
  if (details.availability !== undefined) map.CM_Availability_Status = cleanStr(details.availability);
  if (details.minLeaseTerm !== undefined) map.CM_Min_Lease_Term = details.minLeaseTerm;
  if (details.certification !== undefined) map.CM_Certification = details.certification;
  if (details.peza !== undefined) map.CM_PEZA = !!details.peza;
  if (details.camc !== undefined) map.CM_CAMC_Per_Sqm = details.camc;
  if (details.acCharges !== undefined) map.CM_AC_Charges = details.acCharges;
  if (details.acSystem !== undefined) map.CM_AC_System = details.acSystem;
  if (details.reservedParking !== undefined) map.CM_Reserved_Parking = details.reservedParking;
  if (details.escalation !== undefined) map.CM_Escalation_Rate = details.escalation;
  if (details.fitOut !== undefined) map.CM_Fit_Out_Allowance = details.fitOut;
  if (details.rentFree !== undefined) map.CM_Rent_Free_Period = details.rentFree;
  if (details.parkingRatio !== undefined) map.CM_Parking_Ratio = details.parkingRatio;
  if (details.backupPower !== undefined) map.CM_Backup_Power = details.backupPower;
  if (details.floorLoading !== undefined) map.CM_Floor_Loading = details.floorLoading;
  if (details.internet !== undefined) map.CM_Internet_Providers = details.internet;
  if (details.availableUnits !== undefined) map.CM_Available_Units_Summary = details.availableUnits;

  // Keep the filterable numbers in step with the display strings above.
  // Without this, editing "Php 850/sqm/mo" to "Php 1,200/sqm/mo" updated the
  // page but left CM_Rent_From at 850, so the listing kept matching a
  // "under ₱1,000" filter. See numericTwins.js for the parsing traps.
  Object.assign(map, deriveNumericTwins(details));
  if (details.towersZones !== undefined) map.CM_Towers_Zones = details.towersZones;
  if (details.capRate !== undefined) map.CM_Cap_Rate = toNum(details.capRate);
  if (details.noi !== undefined) map.CM_NOI = toNum(details.noi);
  if (details.listedPrice !== undefined) map.Listed_Price = details.listedPrice;

  // Residential
  if (details.price !== undefined) map.RS_Price = Number(details.price) || null;
  if (details.floorLevel !== undefined) map.RS_Floor_Level = details.floorLevel;
  if (details.view !== undefined) map.RS_View = details.view;
  if (details.assocDues !== undefined) map.RS_Assoc_Dues = Number(details.assocDues) || null;
  if (details.turnoverDate !== undefined) map.RS_Turnover_Date = details.turnoverDate;
  if (details.studio !== undefined) map.RS_Studio_Flag = !!details.studio;
  if (details.petPolicy !== undefined) map.RS_Pet_Policy = details.petPolicy;
  if (details.pricePerSqm !== undefined) map.RS_Price_Per_Sqm = Number(details.pricePerSqm) || null;
  if (details.paymentTerms !== undefined) map.RS_Payment_Terms = details.paymentTerms;

  // STR
  if (details.nightlyRate !== undefined) map.STR_Nightly_Rate = Number(details.nightlyRate) || null;
  if (details.maxGuests !== undefined) map.STR_Max_Guests = Number(details.maxGuests) || null;
  if (details.rating !== undefined) map.STR_Avg_Rating = Number(details.rating) || null;
  if (details.bedrooms !== undefined) map.Beds = Number(details.bedrooms) || null;
  if (details.bathrooms !== undefined) map.Baths = Number(details.bathrooms) || null;
  if (details.minStay !== undefined) map.STR_Min_Stay_Nights = Number(details.minStay) || null;
  if (details.checkInOut !== undefined) map.STR_Check_In_Out = details.checkInOut;
  if (details.weekendRate !== undefined) map.STR_Weekend_Rate = Number(details.weekendRate) || null;
  if (details.bedConfig !== undefined) map.STR_Bed_Config = details.bedConfig;
  if (details.selfCheckIn !== undefined) map.STR_Self_Check_In = !!details.selfCheckIn;
  if (details.houseRules !== undefined) map.STR_House_Rules = details.houseRules;
  if (details.cancellation !== undefined) map.STR_Cancellation_Policy = details.cancellation;
  if (details.permit !== undefined) map.STR_Permit_Accreditation = details.permit;
  if (details.wifiSpeed !== undefined) map.STR_WiFi_Speed = details.wifiSpeed;
  if (details.cleaningFee !== undefined) map.STR_Cleaning_Fee = toNum(details.cleaningFee);

  // Restaurant
  if (details.floorArea !== undefined) map.FloorSqm = Number(details.floorArea) || null;
  if (details.seating !== undefined) map.RST_Seating_Capacity = Number(details.seating) || null;
  if (details.kitchen !== undefined) map.RST_Kitchen_Condition = details.kitchen;
  if (details.footTraffic !== undefined) map.RST_Foot_Traffic = details.footTraffic;
  if (details.frontage !== undefined) map.RST_Frontage = details.frontage;
  if (details.indoorOutdoor !== undefined) map.Indoor_Outdoor = details.indoorOutdoor;
  if (details.previousUse !== undefined) map.RST_Previous_Use = details.previousUse;
  if (details.hoodExhaust !== undefined) map.RST_Hood_Exhaust = !!details.hoodExhaust;
  if (details.greaseTrap !== undefined) map.RST_Grease_Trap = !!details.greaseTrap;
  if (details.gasLine !== undefined) map.RST_Gas_Line = !!details.gasLine;
  if (details.power !== undefined) map.RST_Power_Capacity = details.power;
  if (details.delivery !== undefined) map.RST_Delivery_Access = !!details.delivery;
  if (details.liquor !== undefined) map.RST_Liquor_License = !!details.liquor;
  if (details.zoning !== undefined) map.RST_FB_Zoning_Permit = details.zoning;
  if (details.ceiling !== undefined) map.CeilingHeight = details.ceiling;
  if (details.turnover !== undefined) map.RST_Turnover_Condition = details.turnover;
  // parking already mapped above, but we can also set Guest_Parking
  if (details.parking !== undefined) map.Guest_Parking = details.parking;
  if (details.rstRent !== undefined) map.RST_Rent = toNum(details.rstRent);
  if (details.rstDues !== undefined) map.RST_Dues_CUSA = toNum(details.rstDues);

  // Hospitality
  if (details.rooms !== undefined) map.HOSP_Room_Count = Number(details.rooms) || null;
  if (details.stars !== undefined) map.HOSP_Star_Rating = Number(details.stars) || null;
  if (details.operator !== undefined) map.HOSP_Operator_Brand = details.operator;
  if (details.roomTypes !== undefined) map.HOSP_Room_Types = details.roomTypes;
  if (details.fbOutlets !== undefined) map.HOSP_FB_Outlets = Number(details.fbOutlets) || null;
  if (details.functionRooms !== undefined) map.HOSP_Function_Rooms = Number(details.functionRooms) || null;
  if (details.yearRenovated !== undefined) map.HOSP_Year_Built_Renovated = details.yearRenovated;
  if (details.adr !== undefined) map.HOSP_ADR = Number(details.adr) || null;
  if (details.occupancy !== undefined) map.HOSP_Occupancy_Rate = Number(details.occupancy) || null;
  if (details.revpar !== undefined) map.HOSP_RevPAR = Number(details.revpar) || null;
  if (details.capRate !== undefined) map.HOSP_Cap_Rate = Number(details.capRate) || null;
  if (details.gfa !== undefined) map.HOSP_GFA = Number(details.gfa) || null;
  if (details.landArea !== undefined) map.HOSP_Land_Area = Number(details.landArea) || null;

  // Venue
  if (details.seated !== undefined) map.VEN_Capacity_Seated = Number(details.seated) || null;
  if (details.standing !== undefined) map.VEN_Capacity_Standing = Number(details.standing) || null;
  if (details.floorArea !== undefined && !map.FloorSqm) map.FloorSqm = Number(details.floorArea) || null;
  if (details.rentalRate !== undefined) map.VEN_Rental_Rate = Number(details.rentalRate) || null;
  if (details.minHours !== undefined) map.VEN_Min_Booking_Hours = Number(details.minHours) || null;
  if (details.aircon !== undefined) map.VEN_Air_Conditioning = !!details.aircon;
  if (details.catering !== undefined) map.VEN_Catering_Policy = details.catering;
  if (details.layouts !== undefined) map.VEN_Layout_Configs = details.layouts;
  if (details.av !== undefined) map.VEN_AV_Equipment = details.av;
  if (details.power !== undefined) map.VEN_Power_Capacity = details.power;
  if (details.accessibility !== undefined) map.VEN_Accessibility = details.accessibility;
  if (details.noiseCurfew !== undefined) map.VEN_Noise_Curfew = details.noiseCurfew;
  if (details.venRateBasis !== undefined) map.VEN_Rate_Basis = details.venRateBasis;

  return map;
}
