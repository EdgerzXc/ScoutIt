// ═══════════════════════════════════════════════════════════════
// ScoutIt Airtable CMS Helper
// Central fetch utility for all 4 Airtable tables.
// All field name mappings live here — update field names here only.
// ═══════════════════════════════════════════════════════════════

import { cityToRegion } from "./regions";
import { fetchWithRetry } from "./fetchWithRetry";
import { DEEP_INTEL_SCHEMA } from "./deepIntelSchema";
import { reverseMapCategoryFields } from "./propertyFieldMapping";
import { imageMediaUrl, safeFloorPlans, spatialEmbedUrl, videoEmbedUrl } from "./propertyMedia";
import { isSamplePropertySlug } from "./sampleInventory";


export class AirtableRecordNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "AirtableRecordNotFoundError";
    this.code = "AIRTABLE_RECORD_NOT_FOUND";
  }
}

export function isAirtableRecordNotFoundError(error) {
  return error?.code === "AIRTABLE_RECORD_NOT_FOUND";
}
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

  // Retried + circuit-broken (NEW_IDEAS.md §17.1/§17.2). Airtable rate-limits
  // at 5 req/s per base, and ONE breach used to throw here and serve the whole
  // site empty — see the header of cmsCache.js.
  //
  // GET, so retries are safe. Budget is deliberately tight: a CMS bundle fans
  // out to 4 of these in parallel plus Mapbox geocoding, all inside Vercel's
  // ~10s function ceiling.
  const res = await fetchWithRetry(url, fetchOptions, {
    circuit: "airtable",
    budgetMs: 5000,
    attemptTimeoutMs: 2500, // §17.2's latency threshold
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
        // Seed/demo rows must never pass as real advisors. Primary signal is
        // the Is_Example checkbox; the Title regex is the fallback for when
        // the Airtable token can't create that field (data-only scope).
        isExample:        !!f.Is_Example || /\bexample\b/i.test(f.Title || ""),
        name:             f.Name            || "Unnamed Advisor",
        title:            f.Title           || "",
        specialty:        f.Specialty       || "",
        location:         f.Location        || "",
        bio:              f.Bio             || "",
        image:            f.Image           || "",
        license:          f.License         || "",
        // RA 9646 trust badge — true only when staff ticked License_Verified
        // in Airtable after checking the PRC registry. Never assume.
        licenseVerified:  !!f.License_Verified,
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
        // ── SAMPLE / DEMO FLAG (ACTION 01_NOW A4, 2026-08-08) ──────────
        // Samples are deliberately PUBLIC and badged — badges work on people.
        // Google does not read badges. An indexed sample creates two problems
        // that only appear later and cannot be undone quickly:
        //   1. Removing samples after human testing 404s them in bulk.
        //   2. A real owner's first contact with ScoutIt could be a search
        //      result for an invented listing in their own building.
        // Reading `Is_Sample` from Airtable; absent field → `false`, so this is
        // inert until the column exists and nothing changes for real listings.
        is_sample:       f.Is_Sample === true || f.Is_Sample === "true" || isSamplePropertySlug(f.Slug),
        property_type:   f.SpaceTypography || "",
        tenure:          f.Tenure          || "",
        // Freshness Engine (NEW_IDEAS.md §21). Without this the public
        // staleness notice can never render — FreshnessBadge would always
        // see undefined and bail. Null (not a date) when never verified:
        // missing data must read as "unverified", never as "fresh".
        last_verified_date: f.Last_Verified_Date || null,
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
        // Card surfaces read `image`; fall back to the first Photos entry so a
        // property with a populated gallery but no dedicated Image column still
        // shows a real photo instead of the gradient placeholder.
        image:                f.Image || (f.Photos ? f.Photos.split(",")[0].trim() : "") || "",
        gradient:             f.Gradient     || "linear-gradient(135deg, #1f1c18 0%, #100f0d 100%)",
        latitude:             f.Latitude ? Number(f.Latitude) : null,
        longitude:            f.Longitude ? Number(f.Longitude) : null,
        seo_title:            f.SEO_Title    || "",
        seo_description:      f.SEO_Description || "",
        seo_json_ld:          f.SEO_JSON_LD  || "",
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
        // Provider-aware classification happens at the public CMS boundary.
        // A photo in Video_URL/Luma/Matterport must never become an iframe.
        video_url:        videoEmbedUrl(f.Video_URL),
        virtual_tour_url: spatialEmbedUrl(f.Virtual_Tour_URL, "matterport"),
        // camelCase aliases consumed by SpatialVaultWidget in CommercialFlow / ResidentialFlow
        matterportTourUrl: spatialEmbedUrl(f.Virtual_Tour_URL, "matterport"),
        luma3dMapUrl:      spatialEmbedUrl(f.Luma_3D_Map_URL, "luma"),
        droneHeatmapUrl:   imageMediaUrl(f.Drone_Heatmap_URL),
        // Floor_Plans is a multipleAttachments field, so Airtable returns an
        // ARRAY of {url, filename, type} — not a URL string like the other
        // Vault fields. It was the only VAULT field never mapped here (finding
        // F2, 2026-07-30): specced as a Cluster+ benefit, uploadable by owners,
        // and impossible for the site to display. A subscriber was being billed
        // for something the page could not render.
        floorPlans: safeFloorPlans(
          Array.isArray(f.Floor_Plans)
            ? f.Floor_Plans.map((a) => ({ url: a?.url, name: a?.filename || "Floor plan", type: a?.type || "" }))
            : [],
        ),

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
        // Universal block body (see src/lib/articleSchema.js) — raw JSON string;
        // the article page parses+validates it and falls back to `body` above.
        bodyJson:       f.Body_JSON       || "",
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

// The owner editor (LiveEditorWorkspace.js) stores category-spec values in
// details under Airtable-style keys (its CATEGORY_FIELDS `f.key` values, e.g.
// "CM_Rent_Per_Sqm", "Beds", "RS_Price"). This mapper, however, reads
// camelCase keys ("rentPerSqm", "beds", "price"). The two conventions have
// zero overlap, so before this table every spec field a real owner typed in
// the wizard was silently dropped on publish -> the public master page showed
// "Not listed yet" for rent, GLA, grade, beds, etc. even though the owner
// filled them in.
//
// MOVED OUT of this file (2026-07-30), in two steps:
//   • the alias table   → src/lib/detailKeyAliases.js
//   • the mapper itself → src/lib/propertyFieldMapping.js  (imported above)
// The mapper moved because the staff app (`mission-control/`) needs the exact
// same mapping and was writing only 6 fields without it — see finding W3 in
// _SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/AIRTABLE_COMPRESSION_PLAN.md.



// Photos are stored in Supabase Storage; their URLs travel in details.photos
// (the owner editor's photo array). Mirror them into Airtable's Photos/Image
// columns so the public page — which reads photos from Airtable — displays the
// Supabase-hosted images. Falls back to media_link when no array is present.
function photoFields(data) {
  const fromDetails = Array.isArray(data?.details?.photos)
    ? data.details.photos.filter(Boolean)
    : [];
  const list = fromDetails.length ? fromDetails : (data?.media_link ? [data.media_link] : []);
  if (!list.length) return {};
  return { Photos: list.join(","), Image: list[0] };
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
          ...photoFields(data),
          ...categoryFields
        }
      }
    ],
    // Auto-create singleSelect options (Building Grade, Hand-over, Furnishing,
    // etc.) instead of rejecting the whole record when an owner picks a value
    // that isn't already an Airtable choice.
    typecast: true
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
    throw new AirtableRecordNotFoundError(`Airtable record with slug '${slug}' not found.`);
  }
  
  const recordId = getResult.records[0].id;

  // 2. PATCH the record
  const urlPatch = `${BASE_URL}/${baseId}/PROPERTIES_CMS/${recordId}`;
  
  // We only update what is provided. For ScoutIt, title/location/type updates.
  const fieldsToUpdate = {};
  if (data.title) fieldsToUpdate.Title = data.title;
  if (data.location) fieldsToUpdate.Location = data.location;
  if (data.type) fieldsToUpdate.SpaceTypography = data.type.charAt(0).toUpperCase() + data.type.slice(1);
  if (data.seo_title) fieldsToUpdate.SEO_Title = data.seo_title;
  if (data.seo_description) fieldsToUpdate.SEO_Description = data.seo_description;
  if (data.seo_json_ld) fieldsToUpdate.SEO_JSON_LD = data.seo_json_ld;
  if (typeof data.approved_for_scoutit === "boolean") {
    fieldsToUpdate.Approved_For_ScoutIt = data.approved_for_scoutit;
  }
  if (unitsOverride) {
    fieldsToUpdate.Units_JSON = JSON.stringify(unitsOverride);
  } else if (data.details?.units_inventory) {
    fieldsToUpdate.Units_JSON = JSON.stringify(data.details.units_inventory);
  }
  
  const categoryFields = reverseMapCategoryFields(data.details);
  Object.assign(fieldsToUpdate, categoryFields);
  
  Object.assign(fieldsToUpdate, photoFields(data));

  const payload = {
    fields: fieldsToUpdate,
    // Same rationale as insertProperty — let singleSelect choices auto-create.
    typecast: true
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

export async function deletePropertyById(apiKey, baseId, recordId) {
  const url = `${BASE_URL}/${baseId}/PROPERTIES_CMS/${recordId}`;
  
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Airtable delete by ID failed: ${res.status} ${errText}`);
  }

  return await res.json();
}

export async function deleteProperty(apiKey, baseId, slug) {
  // 1. Find the Airtable Record ID using the slug
  const params = `filterByFormula=${encodeURIComponent(`{Slug}='${slug}'`)}&maxRecords=1`;
  const urlGet = `${BASE_URL}/${baseId}/PROPERTIES_CMS?${params}`;
  
  const resGet = await fetch(urlGet, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  
  if (!resGet.ok) {
    throw new Error(`Airtable fetch for delete failed: ${resGet.status}`);
  }
  
  const getResult = await resGet.json();
  if (!getResult.records || getResult.records.length === 0) {
    // Record not found, might have been already deleted
    return { deleted: true, id: null };
  }
  
  const recordId = getResult.records[0].id;

  // 2. DELETE the record
  return await deletePropertyById(apiKey, baseId, recordId);
}
