// ═══════════════════════════════════════════════════════════════
// ScoutIt Airtable CMS Helper
// Central fetch utility for all 4 Airtable tables.
// All field name mappings live here — update field names here only.
// ═══════════════════════════════════════════════════════════════

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
        image:                f.Image        || "",
        gradient:             f.Gradient     || "linear-gradient(135deg, #1f1c18 0%, #100f0d 100%)",
        // WhereTo stored as JSON string in Airtable
        whereTo: (() => {
          try { return JSON.parse(f.WhereTo || "[]"); } catch { return []; }
        })(),
        // Photos stored as comma-separated URLs
        photos: f.Photos
          ? f.Photos.split(",").map((u) => u.trim()).filter(Boolean)
          : (f.Image ? [f.Image] : []),
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
