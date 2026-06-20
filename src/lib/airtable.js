// ═══════════════════════════════════════════════════════════════
// ScoutIt Airtable CMS Helper
// Central fetch utility for all 4 Airtable tables.
// All field name mappings live here — update field names here only.
// ═══════════════════════════════════════════════════════════════

import { cityToRegion } from "./regions";

const BASE_URL = "https://api.airtable.com/v0";

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
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  });

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

        // ── Category bridge keys (feed the existing stat-pills) ───
        seating_capacity:  f.RST_Seating_Capacity || f.VEN_Capacity_Seated || "",
        standing_capacity: f.VEN_Capacity_Standing || "",
        cover_count:       f.RST_Seating_Capacity || "",
        kitchen_grade:     f.RST_Kitchen_Condition || "",
        accommodations:    f.HOSP_Room_Types || (f.HOSP_Room_Count ? `${f.HOSP_Room_Count} rooms` : ""),
        hosting_capacity:  f.HOSP_Room_Count || "",
        setup_grade:       f.VEN_AV_Equipment || "",

        // ── Per-category field groups (SOP §2). `cat.<type>` powers
        //    the category Spec Block. Paywalled (MINOR) keys per SOP §8
        //    are gated at render once the subscription layer is live. ──
        cat: {
          commercial: {
            rentFrom: f.CM_Rent_From ?? null, rentPerSqm: f.CM_Rent_Per_Sqm || "",
            handOver: f.CM_Hand_Over_Condition || "", availability: f.CM_Availability_Status || "",
            buildingGrade: f.CM_Building_Grade || "", totalGLA: f.CM_Total_GLA ?? null,
            floorPlate: f.CM_Floor_Plate_Sqm || "", peza: !!f.CM_PEZA,
            certification: f.CM_Certification || "", minLeaseTerm: f.CM_Min_Lease_Term || "",
            camc: f.CM_CAMC_Per_Sqm || "", acCharges: f.CM_AC_Charges || "",
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
            maxGuests: f.STR_Max_Guests ?? null, bedrooms: f.STR_Bedrooms ?? null,
            bathrooms: f.STR_Bathrooms ?? null, minStay: f.STR_Min_Stay_Nights ?? null,
            rating: f.STR_Avg_Rating ?? null, checkInOut: f.STR_Check_In_Out || "",
            weekendRate: f.STR_Weekend_Rate ?? null, bedConfig: f.STR_Bed_Config || "",
            selfCheckIn: !!f.STR_Self_Check_In, houseRules: f.STR_House_Rules || "",
            cancellation: f.STR_Cancellation_Policy || "", permit: f.STR_Permit_Accreditation || "",
            wifiSpeed: f.STR_WiFi_Speed || "",
          },
          restaurant: {
            floorArea: f.RST_Floor_Area_Sqm ?? null, seating: f.RST_Seating_Capacity ?? null,
            rent: f.RST_Rent ?? null, dues: f.RST_Dues_CUSA ?? null,
            kitchen: f.RST_Kitchen_Condition || "", footTraffic: f.RST_Foot_Traffic || "",
            frontage: f.RST_Frontage || "", indoorOutdoor: f.RST_Indoor_Outdoor || "",
            previousUse: f.RST_Previous_Use || "",
            hoodExhaust: !!f.RST_Hood_Exhaust, greaseTrap: !!f.RST_Grease_Trap, gasLine: !!f.RST_Gas_Line,
            power: f.RST_Power_Capacity || "", delivery: !!f.RST_Delivery_Access,
            liquor: !!f.RST_Liquor_License, zoning: f.RST_FB_Zoning_Permit || "",
            ceiling: f.RST_Ceiling_Height || "", turnover: f.RST_Turnover_Condition || "",
            parking: f.RST_Parking || "",
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
            floorArea: f.VEN_Floor_Area_Sqm ?? null, rentalRate: f.VEN_Rental_Rate ?? null,
            rateBasis: f.VEN_Rate_Basis || "", minHours: f.VEN_Min_Booking_Hours ?? null,
            indoorOutdoor: f.VEN_Indoor_Outdoor || "", aircon: !!f.VEN_Air_Conditioning,
            catering: f.VEN_Catering_Policy || "",
            layouts: f.VEN_Layout_Configs || "", ceiling: f.VEN_Ceiling_Height || "",
            av: f.VEN_AV_Equipment || "", power: f.VEN_Power_Capacity || "",
            parking: f.VEN_Parking || "", accessibility: f.VEN_Accessibility || "",
            noiseCurfew: f.VEN_Noise_Curfew || "",
          },
        },
      };
    });
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
