// ═══════════════════════════════════════════════════════════════
// ScoutIt Airtable CMS Helper
// Central fetch utility for all 4 Airtable tables.
// All field name mappings live here — update field names here only.
// ═══════════════════════════════════════════════════════════════

import { cityToRegion } from "./regions";
import { DEEP_INTEL_SCHEMA } from "./deepIntelSchema";

const BASE_URL = "https://api.airtable.com/v0";

// ── Deep Intelligence values (Airtable `DeepIntel_JSON` column) ─
// Stored as a JSON object keyed by the DI_* keys in deepIntelSchema.js
// (label-keyed extras allowed). The per-chapter DeepIntelWidget looks
// values up by DI_ key while CategorySpecBlock's locked section looks
// up by label — so we expand each DI_ key into a label alias too.
// Mirrors the Units_JSON / WhereTo JSON-column pattern.
export function expandDeepIntel(jsonStr) {
  let raw;
  try { raw = JSON.parse(jsonStr || "{}") || {}; } catch { raw = {}; }
  const out = { ...raw };
  for (const category of Object.values(DEEP_INTEL_SCHEMA)) {
    for (const fields of Object.values(category)) {
      for (const field of fields) {
        if (raw[field.key] !== undefined && out[field.label] === undefined) {
          out[field.label] = raw[field.key];
        }
      }
    }
  }
  return out;
}

// SpaceCategory (Airtable select) → DEEP_INTEL_SCHEMA key
function deepIntelCategoryFor(spaceCategory) {
  const c = (spaceCategory || "").toLowerCase();
  if (c.includes("commercial")) return "commercial";
  if (c.includes("str") || c.includes("short")) return "str";
  if (c.includes("hospitality")) return "hospitality";
  if (c.includes("restaurant") || c.includes("culinary")) return "restaurants";
  if (c.includes("venue") || c.includes("event")) return "venues";
  if (c.includes("residential")) return "residential";
  return "";
}

// ── Tier label → number conversion ──────────────────────────────
// Airtable stores SubscriptionLabel as text (Gold, Silver, etc.)
// The UI uses numbers (1–5) for sorting and styling
const TIER_LABEL_TO_NUM = {
  Diamond:  1,
  Platinum: 2,
  Gold:     3,
  Silver:   4,
  Bronze:   5,
};

// ── Base fetch with auth and ISR cache ──────────────────────────
async function fetchTable(tableId, apiKey, baseId, params = "") {
  const url = `${BASE_URL}/${baseId}/${encodeURIComponent(tableId)}${params ? `?${params}` : ""}`;
  
  const fetchOptions = {
    headers: { Authorization: `Bearer ${apiKey}` },
  };
  
  if (process.env.NODE_ENV !== 'production') {
    fetchOptions.cache = 'no-store';
  } else {
    fetchOptions.next = { revalidate: 60 };
  }

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    throw new Error(`Airtable fetch failed for table "${tableId}": ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.records || [];
}

// ═══════════════════════════════════════════════════════════════
// BROKERS_CMS → normalized broker objects
// ═══════════════════════════════════════════════════════════════
export async function fetchBrokers(apiKey, baseId) {
  const records = await fetchTable("BROKERS_CMS", apiKey, baseId);

  return records
    .filter((r) => r.fields.Approved_For_Live_Site && r.fields.Name) // only published brokers with a name
    .map((r) => {
      const f = r.fields;
      const labelRaw = f.SubscriptionLabel || "Bronze";
      const subscriptionTier = TIER_LABEL_TO_NUM[labelRaw] ?? 5;

      // Niche: Airtable returns comma-separated string for multi-select
      const niche = f.Niche
        ? (Array.isArray(f.Niche) ? f.Niche : f.Niche.split(",").map((n) => n.trim()))
        : [];

      return {
        id:               f.BrokerID        || r.id,
        name:             f.Name            || "Unnamed Advisor",
        title:            f.Title           || "",
        specialty:        f.Specialty       || "",
        location:         f.Location        || "",
        bio:              f.Bio             || "",
        image:            f.Image           || "",
        license:          f.License         || "",
        closures:         f.Closures        || "",
        rating:           Number(f.Rating)  || 0,
        subscriptionTier: subscriptionTier,
        subscriptionLabel: labelRaw,
        clearanceTier:    f.ClearanceTier   || "",
        rosterRank:       f.RosterRank      || "",
        rosterStatus:     f.RosterStatus    || "Active",
        niche:            niche,
        // managedProperties is a linked record — returns record IDs only from Airtable
        // We resolve this via PROPERTIES_CMS slug matching on the frontend
        managedProperties: [],
        metrics: [
          { label: "Roster Rank",   value: f.RosterRank   || "Advisor"  },
          { label: "Clearance",     value: f.ClearanceTier || "Tier 3"  },
          { label: "Roster Status", value: f.RosterStatus  || "Active"  },
        ],
      };
    });
}

// ═══════════════════════════════════════════════════════════════
// PROPERTIES_CMS → normalized property objects
// ═══════════════════════════════════════════════════════════════
export async function fetchProperties(apiKey, baseId) {
  const records = await fetchTable("PROPERTIES_CMS", apiKey, baseId);

  return records
    .filter((r) => r.fields.Approved_For_ScoutIt && r.fields.Title && r.fields.Slug) // only approved properties with a title and slug
    .map((r) => {
      const f = r.fields;

      // BestFor: multi-select returns array in Airtable
      const bestFor = f.BestFor
        ? (Array.isArray(f.BestFor) ? f.BestFor : f.BestFor.split(",").map((b) => b.trim()))
        : [];

      return {
        id:              r.id,
        slug:            f.Slug            || "",
        title:           f.Title           || "Untitled Property",
        hook:            f.Hook            || "",
        city:            f.City            || "",
        region:          f.Region          || cityToRegion(f.City || ""),
        location:        f.Location        || "",
        spaceCategory:   f.SpaceCategory   || "",
        property_type:   f.SpaceTypography || "",
        tenure:          f.Tenure          || "",
        year_built:      f.YearBuilt       || "",
        furnishing:      f.Furnishing      || "",
        beds:            Number(f.Beds)    || 0,
        baths:           Number(f.Baths)   || 0,
        floor_sqm:       Number(f.FloorSqm) || 0,
        lot_sqm:         Number(f.LotSqm)  || 0,
        parking:         Number(f.Parking) || 0,
        floors:          f.Floors          || "",
        // PriceRange_Internal is deliberately excluded from frontend output
        aestheticTag:    f.AestheticTag    || "",
        spatialDensity:  f.SpatialDensity  || "",
        lifestyle_vibe:  f.LifestyleVibe   || "",
        best_for:        bestFor.join(" · "),
        bestForTags:     bestFor,
        comfort_level:   Number(f.ComfortLevel) || 0,
        natural_light:   Number(f.NaturalLight) || 0,
        privacy:         Number(f.Privacy)      || 0,
        space_feel:      Number(f.SpaceFeel)    || 0,
        noise_level_text:     f.NoiseLevel           || "",
        ventilation:          f.Ventilation          || "",
        ceiling_height_text:  f.CeilingHeight        || "",
        outdoor_description:  f.OutdoorDescription   || "",
        street_type:          f.StreetType           || "",
        flood_risk_score:     Number(f.FloodRiskScore)   || 0,
        convenience_score:    Number(f.ConvenienceScore) || 0,
        title_status:         f.TitleStatus  || "",
        scoutit_verdict:      f.ScoutItVerdict || "",
        accordion_3_text:     f.SpaceStory   || "",
        // ── Chapter-redesign CMS fields (blank-safe) ──────────────
        aesthetic_tag:          f.AestheticTag         || "",
        flood_zone_status:      f.FloodZoneStatus      || "",
        zoning_classification:  f.ZoningClassification || "",
        nearest_highway:        f.NearestHighway       || "",
        commute_bgc:            f.CommuteBGC           || "",
        commute_makati:         f.CommuteMakati        || "",
        commute_ortigas:        f.CommuteOrtigas       || "",
        public_transport:       f.PublicTransport      || "",
        safety_perception:      f.SafetyPerception     || "",
        community_feel:         f.CommunityFeel        || "",
        expansion_potential:    f.ExpansionPotential   || "",
        zoning_type:            f.ZoningType           || "",
        developer_name:         f.DeveloperName        || "",
        developer_notes:        f.DeveloperNotes       || "",
        structural_notes:       f.StructuralNotes      || "",
        architect_designer:     f.ArchitectDesigner    || "",
        building_style:         f.BuildingStyle        || "",
        universe_summary:       f.UniverseSummary      || "",
        listed_price:           f.Listed_Price         || "",
        price_status:           f.Price_Status         || "",
        price_verified_by:      f.Price_Verified_By    || "",
        price_source:           f.Price_Source         || "",
        price_notes:            f.Price_Notes          || "",
        image:                f.Image        || "",
        gradient:             f.Gradient     || "linear-gradient(135deg, #1f1c18 0%, #100f0d 100%)",
        latitude:             f.Latitude ? Number(f.Latitude) : null,
        longitude:            f.Longitude ? Number(f.Longitude) : null,
        // WhereTo stored as JSON string in Airtable
        whereTo: (() => {
          try { return JSON.parse(f.WhereTo || "[]"); } catch { return []; }
        })(),
        // Units inventory stored as JSON string in Airtable (embedded units model)
        units_inventory: (() => {
          try { return JSON.parse(f.Units_JSON || "[]"); } catch { return []; }
        })(),
        // Deep Intelligence panel values (HIDDEN INTEL, Solar+) — JSON column,
        // expanded so both DI_-key and label lookups resolve (see helper above)
        deepIntel: expandDeepIntel(f.DeepIntel_JSON),
        // Schema key for DEEP_INTEL_SCHEMA[...] lookups in the flows
        category: deepIntelCategoryFor(f.SpaceCategory),
        // Photos stored as comma-separated URLs
        photos: f.Photos
          ? f.Photos.split(",").map((u) => u.trim()).filter(Boolean)
          : (f.Image ? [f.Image] : []),

        // ── Shared media + amenities (per-category SOP) ───────────
        amenities: f.Amenities
          ? (Array.isArray(f.Amenities) ? f.Amenities : f.Amenities.split(",").map((a) => a.trim()))
          : [],
        enhanced_photos: f.Enhanced_Photos
          ? f.Enhanced_Photos.split(",").map((u) => u.trim()).filter(Boolean)
          : [],
        video_url:        f.Video_URL        || "",
        virtual_tour_url: f.Virtual_Tour_URL || "",
        // camelCase aliases consumed by SpatialVaultWidget in CommercialFlow / ResidentialFlow
        matterportTourUrl: f.Virtual_Tour_URL || "",
        luma3dMapUrl:      f.Luma_3D_Map_URL  || "",
        droneHeatmapUrl:   f.Drone_Heatmap_URL || "",

        // ── Category bridge keys (feed the existing stat-pills) ───
        seating_capacity:  f.RST_Seating_Capacity || f.VEN_Capacity_Seated || "",
        standing_capacity: f.VEN_Capacity_Standing || "",
        cover_count:       f.RST_Seating_Capacity || "",
        kitchen_grade:     f.RST_Kitchen_Condition || "",
        accommodations:    f.HOSP_Room_Types || (f.HOSP_Room_Count ? `${f.HOSP_Room_Count} rooms` : "") || f.STR_Bed_Config || "",
        hosting_capacity:  f.HOSP_Room_Count || (f.STR_Max_Guests ? `${f.STR_Max_Guests} Guests` : "") || "",
        setup_grade:       f.VEN_AV_Equipment || "",

        // ── Per-category field groups (SOP §2). `cat.<type>` powers
        //    the category Spec Block. Paywalled (MINOR) keys per SOP §8
        //    are gated at render once the subscription layer is live. ──
        cat: {
          commercial: {
            rentFrom: f.CM_Rent_From ?? null, rentPerSqm: f.CM_Rent_Per_Sqm || "",
            handOver: f.CM_Hand_Over_Condition || "", availability: f.CM_Availability_Status || "",
            buildingGrade: f.CM_Building_Grade || "", totalGLA: f.CM_Total_GLA ?? null,
            floorPlate: f.CM_Floor_Plate_Sqm || "", floorPlateFrom: f.CM_Floor_Plate_From ?? null,
            peza: !!f.CM_PEZA,
            certification: f.CM_Certification || "", minLeaseTerm: f.CM_Min_Lease_Term || "",
            camc: f.CM_CAMC_Per_Sqm || "", camcFrom: f.CM_CAMC_From ?? null,
            acCharges: f.CM_AC_Charges || "", acChargeFrom: f.CM_AC_Charge_From ?? null,
            acSystem: f.CM_AC_System || "", reservedParking: f.CM_Reserved_Parking || "",
            escalation: f.CM_Escalation_Rate || "", fitOut: f.CM_Fit_Out_Allowance || "",
            rentFree: f.CM_Rent_Free_Period || "", parkingRatio: f.CM_Parking_Ratio || "",
            backupPower: f.CM_Backup_Power || "", floorLoading: f.CM_Floor_Loading || "",
            internet: f.CM_Internet_Providers || "", availableUnits: f.CM_Available_Units_Summary || "",
            towersZones: f.CM_Towers_Zones || "", capRate: f.CM_Cap_Rate ?? null, noi: f.CM_NOI ?? null,
          },
          residential: {
            price: f.RS_Price ?? null, floorLevel: f.RS_Floor_Level || "", view: f.RS_View || "",
            assocDues: f.RS_Assoc_Dues ?? null, turnoverDate: f.RS_Turnover_Date || "",
            studio: !!f.RS_Studio_Flag, petPolicy: f.RS_Pet_Policy || "",
            pricePerSqm: f.RS_Price_Per_Sqm ?? null, paymentTerms: f.RS_Payment_Terms || "",
          },
          str: {
            nightlyRate: f.STR_Nightly_Rate ?? null, cleaningFee: f.STR_Cleaning_Fee ?? null,
            maxGuests: f.STR_Max_Guests ?? null, bedrooms: f.Beds ?? null,
            bathrooms: f.Baths ?? null, minStay: f.STR_Min_Stay_Nights ?? null,
            rating: f.STR_Avg_Rating ?? null, checkInOut: f.STR_Check_In_Out || "",
            weekendRate: f.STR_Weekend_Rate ?? null, bedConfig: f.STR_Bed_Config || "",
            selfCheckIn: !!f.STR_Self_Check_In, houseRules: f.STR_House_Rules || "",
            cancellation: f.STR_Cancellation_Policy || "", permit: f.STR_Permit_Accreditation || "",
            wifiSpeed: f.STR_WiFi_Speed || "",
          },
          restaurant: {
            floorArea: f.FloorSqm ?? null, seating: f.RST_Seating_Capacity ?? null,
            rent: f.RST_Rent ?? null, dues: f.RST_Dues_CUSA ?? null,
            kitchen: f.RST_Kitchen_Condition || "", footTraffic: f.RST_Foot_Traffic || "",
            frontage: f.RST_Frontage || "", indoorOutdoor: f.Indoor_Outdoor || "",
            previousUse: f.RST_Previous_Use || "",
            hoodExhaust: !!f.RST_Hood_Exhaust, greaseTrap: !!f.RST_Grease_Trap, gasLine: !!f.RST_Gas_Line,
            power: f.RST_Power_Capacity || "", delivery: !!f.RST_Delivery_Access,
            liquor: !!f.RST_Liquor_License, zoning: f.RST_FB_Zoning_Permit || "",
            ceiling: f.CeilingHeight || "", ceilingM: f.CeilingHeight_M ?? null,
            turnover: f.RST_Turnover_Condition || "",
            parking: f.Guest_Parking || "",
          },
          hospitality: {
            rooms: f.HOSP_Room_Count ?? null, stars: f.HOSP_Star_Rating ?? null,
            operator: f.HOSP_Operator_Brand || "", roomTypes: f.HOSP_Room_Types || "",
            fbOutlets: f.HOSP_FB_Outlets ?? null, functionRooms: f.HOSP_Function_Rooms ?? null,
            yearRenovated: f.HOSP_Year_Built_Renovated || "",
            adr: f.HOSP_ADR ?? null, occupancy: f.HOSP_Occupancy_Rate ?? null,
            revpar: f.HOSP_RevPAR ?? null, capRate: f.HOSP_Cap_Rate ?? null,
            gfa: f.HOSP_GFA ?? null, landArea: f.HOSP_Land_Area ?? null,
          },
          venue: {
            seated: f.VEN_Capacity_Seated ?? null, standing: f.VEN_Capacity_Standing ?? null,
            floorArea: f.FloorSqm ?? null, rentalRate: f.VEN_Rental_Rate ?? null,
            rateBasis: f.VEN_Rate_Basis || "", minHours: f.VEN_Min_Booking_Hours ?? null,
            indoorOutdoor: f.Indoor_Outdoor || "", aircon: !!f.VEN_Air_Conditioning,
            catering: f.VEN_Catering_Policy || "",
            layouts: f.VEN_Layout_Configs || "", ceiling: f.CeilingHeight || "",
            ceilingM: f.CeilingHeight_M ?? null,
            av: f.VEN_AV_Equipment || "", power: f.VEN_Power_Capacity || "",
            parking: f.Guest_Parking || "", accessibility: f.VEN_Accessibility || "",
            noiseCurfew: f.VEN_Noise_Curfew || "",
          },
        },
      };
    });
}

// ═══════════════════════════════════════════════════════════════
// PROPERTIES_CMS → verification lifecycle only (Slug + Last_Verified_Date)
// Lightweight sibling of fetchProperties, used by the stale-listing cron
// (Track 1, PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md) so that route
// doesn't have to pull every field of every approved property just to check
// one date.
// ═══════════════════════════════════════════════════════════════
export async function fetchPropertyVerificationDates(apiKey, baseId) {
  const records = await fetchTable(
    "PROPERTIES_CMS",
    apiKey,
    baseId,
    "fields%5B%5D=Slug&fields%5B%5D=Title&fields%5B%5D=Last_Verified_Date&fields%5B%5D=Approved_For_ScoutIt"
  );
  return records
    .filter((r) => r.fields.Approved_For_ScoutIt && r.fields.Slug)
    .map((r) => ({
      slug: r.fields.Slug,
      title: r.fields.Title || "Untitled Property",
      lastVerifiedDate: r.fields.Last_Verified_Date || null,
    }));
}

// ═══════════════════════════════════════════════════════════════
// INTEL_CMS → normalized article objects
// ═══════════════════════════════════════════════════════════════
export async function fetchIntel(apiKey, baseId) {
  const records = await fetchTable("INTEL_CMS", apiKey, baseId);

  return records
    .filter((r) => r.fields.Approved_For_Live_Site && r.fields.Title && r.fields.Slug)
    .map((r) => {
      const f = r.fields;
      return {
        id:           r.id,
        slug:         f.Slug             || "",
        title:        f.Title            || "Untitled Intel",
        category:     f.SpaceCategory    || "General",
        intelType:    f.IntelType        || "BRIEFING",
        date:         f.Date             || "",
        city:         f.City             || "",
        region:       f.Region           || cityToRegion(f.City || ""),
        image:        f.Image            || "",
        excerpt:      f.Excerpt          || "",
        lead:         f.Lead             || "",
        body: [
          f.BodyParagraph1 || "",
          f.BodyParagraph2 || "",
          f.BodyParagraph3 || "",
        ].filter(Boolean),
        recommendation: f.Recommendation || "",
      };
    });
}

// ═══════════════════════════════════════════════════════════════
// HOMEPAGE_CMS → active config object
// ═══════════════════════════════════════════════════════════════
export async function fetchHomepageConfig(apiKey, baseId) {
  const records = await fetchTable("HOMEPAGE_CMS", apiKey, baseId);
  // Return the first active config record
  const active = records.find((r) => r.fields.Is_Active_Config);
  if (!active) return null;

  const f = active.fields;
  return {
    configName:          f.Config_Name             || "default",
    heroHeadline:        f.Hero_Headline            || "",
    heroSubtext:         f.Hero_Subtext             || "",
    heroBackgroundVideo: f.Hero_Background_Video    || "",
    featuredProperties:  f.Featured_Properties      || [], // linked record IDs
featuredIntel:       f.Featured_Intel           || [], // linked record IDs
    featuredBrokers:     f.Featured_Brokers         || [], // linked record IDs
  };
}

function reverseMapCategoryFields(details) {
  const map = {};
  if (!details) return map;

  // Shared
  if (details.beds !== undefined) map.Beds = Number(details.beds) || null;
  if (details.baths !== undefined) map.Baths = Number(details.baths) || null;
  if (details.floor_sqm !== undefined) map.FloorSqm = Number(details.floor_sqm) || null;
  if (details.lot_sqm !== undefined) map.LotSqm = Number(details.lot_sqm) || null;
  if (details.parking !== undefined) map.Parking = Number(details.parking) || null;
  if (details.furnishing !== undefined) map.Furnishing = details.furnishing;

  // Commercial
  if (details.rentPerSqm !== undefined) map.CM_Rent_Per_Sqm = details.rentPerSqm;
  if (details.totalGLA !== undefined) map.CM_Total_GLA = Number(details.totalGLA) || null;
  if (details.floorPlate !== undefined) map.CM_Floor_Plate_Sqm = details.floorPlate;
  if (details.buildingGrade !== undefined) map.CM_Building_Grade = details.buildingGrade;
  if (details.handOver !== undefined) map.CM_Hand_Over_Condition = details.handOver;
  if (details.availability !== undefined) map.CM_Availability_Status = details.availability;
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
  if (details.towersZones !== undefined) map.CM_Towers_Zones = details.towersZones;
  if (details.capRate !== undefined) map.CM_Cap_Rate = Number(details.capRate) || null;
  if (details.noi !== undefined) map.CM_NOI = Number(details.noi) || null;

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

  return map;
}

// ═══════════════════════════════════════════════════
// EXPORTED CMS METHODS
// ═══════════════════════════════════════════════════════════════

// Insert a new property into Airtable. Returns the created record — its fields
// include the Slug Airtable computed, so callers persist/display that as the
// canonical public URL.
//
// Slug used to be writable and was generated + de-duplicated here
// (slugifyText + buildUniqueSlug against existing PROPERTIES_CMS records).
// It's now a computed/formula field in the live base — writing to it fails
// with a 422 ("Field \"Slug\" cannot accept a value because the field is
// computed"), which was silently breaking every first-time property insert
// (found while verifying the units_inventory→property_units migration).
// Removed the write; the slug Airtable computes comes back on `fields.Slug`.
export async function insertProperty(apiKey, baseId, data, unitsOverride = null) {
  const url = `${BASE_URL}/${baseId}/PROPERTIES_CMS`;

  // unitsOverride (real property_units rows, including id/operator_id) takes
  // precedence over the legacy details.units_inventory blob when provided —
  // see src/app/api/dashboard/units/route.js.
  const unitsJson = JSON.stringify(unitsOverride || data.details?.units_inventory || []);
  const categoryFields = reverseMapCategoryFields(data.details);

  const payload = {
    records: [
      {
        fields: {
          Title: data.title,
          Location: data.location || "",
          SpaceTypography: data.type ? (data.type.charAt(0).toUpperCase() + data.type.slice(1)) : "Unknown",
          SpaceCategory: (data.space_category || data.category || data.type) ? 
            ((data.space_category || data.category || data.type).charAt(0).toUpperCase() + (data.space_category || data.category || data.type).slice(1)) : 
            "Unknown",
          Units_JSON: unitsJson,
          Approved_For_ScoutIt: true,
          ...categoryFields
        }
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Airtable insert failed: ${res.status} ${errText}`);
  }

  const result = await res.json();
  return result.records[0];
}

export async function updateProperty(apiKey, baseId, slug, data, unitsOverride = null) {
  // 1. Find the Airtable Record ID using the slug
  const params = `filterByFormula=${encodeURIComponent(`{Slug}='${slug}'`)}&maxRecords=1`;
  const urlGet = `${BASE_URL}/${baseId}/PROPERTIES_CMS?${params}`;
  
  const resGet = await fetch(urlGet, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  if (!resGet.ok) {
    throw new Error(`Airtable fetch for update failed: ${resGet.status}`);
  }
  
  const getResult = await resGet.json();
  if (!getResult.records || getResult.records.length === 0) {
    throw new Error(`Airtable record with slug '${slug}' not found.`);
  }
  
  const recordId = getResult.records[0].id;

  // 2. PATCH the record
  const urlPatch = `${BASE_URL}/${baseId}/PROPERTIES_CMS/${recordId}`;
  
  // We only update what is provided. For ScoutIt, title/location/type updates.
  const fieldsToUpdate = {};
  if (data.title) fieldsToUpdate.Title = data.title;
  if (data.location) fieldsToUpdate.Location = data.location;
  if (data.type) fieldsToUpdate.SpaceTypography = data.type.charAt(0).toUpperCase() + data.type.slice(1);
  if (unitsOverride) {
    fieldsToUpdate.Units_JSON = JSON.stringify(unitsOverride);
  } else if (data.details?.units_inventory) {
    fieldsToUpdate.Units_JSON = JSON.stringify(data.details.units_inventory);
  }
  
  const categoryFields = reverseMapCategoryFields(data.details);
  Object.assign(fieldsToUpdate, categoryFields);
  
  const payload = {
    fields: fieldsToUpdate
  };

  const resPatch = await fetch(urlPatch, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload)
  });

  if (!resPatch.ok) {
    const errText = await resPatch.text();
    throw new Error(`Airtable update failed: ${resPatch.status} ${errText}`);
  }

  return await resPatch.json();
}
