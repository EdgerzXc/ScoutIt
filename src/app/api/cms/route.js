import { NextResponse } from "next/server";

// Mock collections to fallback on if Airtable parameters are absent
const MOCK_PROPERTIES = [
  {
    id: "rec1",
    title: "Batasan Hills Architectural Estate",
    city: "Quezon City",
    location: "Quezon City, Metro Manila",
    specs: ["360 sqm Lot", "4 Bedrooms", "Smart Home Integration"],
    gradient: "linear-gradient(135deg, #1f1c18 0%, #100f0d 100%)"
  },
  {
    id: "rec2",
    title: "Aura Premium Sky Penthouse",
    city: "Bonifacio Global City",
    location: "Taguig, Metro Manila",
    specs: ["240 sqm Living", "3 Bedrooms", "Panoramic Views"],
    gradient: "linear-gradient(135deg, #181d1f 0%, #0d0f10 100%)"
  },
  {
    id: "rec3",
    title: "Legaspi Executive Loft Residences",
    city: "Makati",
    location: "Makati City, Metro Manila",
    specs: ["120 sqm Studio", "1 Bedroom", "Near Greenbelt"],
    gradient: "linear-gradient(135deg, #19181f 0%, #0e0d10 100%)"
  },
  {
    id: "rec4",
    title: "Versailles Luxury Courtyard Villa",
    city: "Alabang",
    location: "Muntinlupa, Metro Manila",
    specs: ["450 sqm Lot", "5 Bedrooms", "Private Pool"],
    gradient: "linear-gradient(135deg, #1f1818 0%, #100d0d 100%)"
  },
  {
    id: "rec5",
    title: "Sierra Madre Urban Sanctuary",
    city: "Mandaluyong",
    location: "Mandaluyong, Metro Manila",
    specs: ["95 sqm Condo", "2 Bedrooms", "BGC Skyline Views"],
    gradient: "linear-gradient(135deg, #181f19 0%, #0d100d 100%)"
  },
  {
    id: "rec6",
    title: "Marina Bay High-Rise Suite",
    city: "Pasay",
    location: "Pasay City, Metro Manila",
    specs: ["180 sqm Suite", "2 Bedrooms", "Manila Bay Sunset"],
    gradient: "linear-gradient(135deg, #1f1c1f 0%, #100e10 100%)"
  }
];

const MOCK_INTEL = [
  {
    id: "intel1",
    title: "Batasan Hills Infrastructure Expansion Set for Q4",
    city: "Quezon City",
    category: "Infrastructure Briefing",
    snippet: "Proposed MRT-7 feeder routes will enhance transit connectivity to major Quezon City hubs, boosting value projections.",
    date: "June 2026"
  },
  {
    id: "intel2",
    title: "Quezon City Commercial Hub Reaches Record Valuation",
    city: "Quezon City",
    category: "Market Pulse",
    snippet: "BPO expansion drives massive leasing volume across East Triangle zones, signaling tight premium supply.",
    date: "May 2026"
  },
  {
    id: "intel3",
    title: "BGC Commercial Zoning Reforms Announced",
    city: "Bonifacio Global City",
    category: "Regulatory Shift",
    snippet: "Local government relaxes FAR limitations for select mixed-use complexes, allowing vertical extensions.",
    date: "June 2026"
  },
  {
    id: "intel4",
    title: "Makati Office Space Demand Shifts to Green Buildings",
    city: "Makati",
    category: "Sustainability Review",
    snippet: "Over 80% of new MNC tenants mandate LEED Gold certifications for office leasing in Legaspi and Salcedo villages.",
    date: "June 2026"
  },
  {
    id: "intel5",
    title: "Alabang Residential Tax Revisions Approved",
    city: "Alabang",
    category: "Fiscal Intel",
    snippet: "Property tax concessions for gated enclaves are set to expire, shifting developer focus toward boutique smart-estates.",
    date: "May 2026"
  },
  {
    id: "intel6",
    title: "Mandaluyong Infrastructure Project Enters Phase 3",
    city: "Mandaluyong",
    category: "Infrastructure Briefing",
    snippet: "The new bridge project linking Pioneer District to Pasig river developments is now 75% complete.",
    date: "June 2026"
  },
  {
    id: "intel7",
    title: "Pasay Entertainment City Licensing Adjustments",
    city: "Pasay",
    category: "Regulatory Shift",
    snippet: "Integrated resort spaces secure flexible operations frameworks, stimulating secondary luxury residential markets.",
    date: "April 2026"
  }
];

export async function GET(request) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  console.log("┌────────────────────────────────────────────────────────┐");
  console.log("│ SCOUTIT SPACE INTELLIGENCE CMS PROXY INTEGRATION       │");
  console.log("└────────────────────────────────────────────────────────┘");

  if (!apiKey || !baseId) {
    console.warn("[CMS API] AIRTABLE_API_KEY or AIRTABLE_BASE_ID missing from system env.");
    console.log("[CMS API] Ingestion initiated using local mock databases...");

    // Perform Schema Mapping and City bridges dynamically
    const mappedProperties = MOCK_PROPERTIES.map((prop) => {
      // String-matched many-to-many relationship bridge based on City
      const matchedIntelIds = MOCK_INTEL
        .filter((intel) => intel.city.toLowerCase() === prop.city.toLowerCase())
        .map((intel) => intel.id);

      console.log(
        `[CMS API] Bridge Match: "${prop.title}" (${prop.city}) <-> Mapped Intel: [${matchedIntelIds.join(", ")}]`
      );

      return {
        ...prop,
        intelBridges: matchedIntelIds
      };
    });

    console.log(`[CMS API] Mapping finalized. Total Properties: ${mappedProperties.length} | Intel articles: ${MOCK_INTEL.length}`);
    console.log("──────────────────────────────────────────────────────────");

    return NextResponse.json({
      properties: mappedProperties,
      intel: MOCK_INTEL,
      source: "mock_fallback"
    });
  }

  try {
    console.log(`[CMS API] Live Airtable integration active. Fetching from Base: ${baseId}`);

    // Fetch Table A (PROPERTIES_CMS)
    const propsRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/PROPERTIES_CMS`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 60 } // cache for 60 seconds
      }
    );

    // Fetch Table B (INTEL_CMS)
    const intelRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/INTEL_CMS`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 60 }
      }
    );

    if (!propsRes.ok || !intelRes.ok) {
      throw new Error(`Airtable response failure: Props status ${propsRes.status}, Intel status ${intelRes.status}`);
    }

    const rawProps = await propsRes.json();
    const rawIntel = await intelRes.json();

    // Map Airtable response schemas
    const cleanIntel = rawIntel.records.map((rec) => ({
      id: rec.id,
      title: rec.fields.Title || "Untitled Intel",
      city: rec.fields.City || "",
      category: rec.fields.Category || "General Intel",
      snippet: rec.fields.Snippet || "",
      date: rec.fields.Date || ""
    }));

    const cleanProperties = rawProps.records.map((rec) => {
      const city = rec.fields.City || "";
      const matchedIntelIds = cleanIntel
        .filter((intel) => intel.city.toLowerCase() === city.toLowerCase())
        .map((intel) => intel.id);

      console.log(
        `[CMS API] Live Bridge Match: "${rec.fields.Title}" (${city}) <-> Mapped Intel: [${matchedIntelIds.join(", ")}]`
      );

      return {
        id: rec.id,
        title: rec.fields.Title || "Untitled Property",
        city: city,
        location: rec.fields.Location || "",
        specs: rec.fields.Specs ? rec.fields.Specs.split(",") : [],
        gradient: rec.fields.Gradient || "linear-gradient(135deg, #1f1c18 0%, #100f0d 100%)",
        intelBridges: matchedIntelIds
      };
    });

    console.log(`[CMS API] Live Database processing finished successfully. Loaded: ${cleanProperties.length} properties.`);
    console.log("──────────────────────────────────────────────────────────");

    return NextResponse.json({
      properties: cleanProperties,
      intel: cleanIntel,
      source: "airtable"
    });
  } catch (error) {
    console.error("[CMS API] Error fetching from live Airtable:", error.message);
    console.log("[CMS API] Recovering from error: Falling back to local mock payload.");

    return NextResponse.json({
      properties: MOCK_PROPERTIES.map((prop) => ({
        ...prop,
        intelBridges: MOCK_INTEL
          .filter((intel) => intel.city.toLowerCase() === prop.city.toLowerCase())
          .map((intel) => intel.id)
      })),
      intel: MOCK_INTEL,
      source: "mock_fallback_on_error",
      error: error.message
    });
  }
}
