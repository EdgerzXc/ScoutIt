import { NextResponse } from "next/server";

import { getProperties, getArticles } from "@/data/mockDb";

const MOCK_PROPERTIES = getProperties().map(p => ({
  id: p.slug,
  title: p.title,
  city: p.city,
  location: p.location,
  specs: [p.property_type, `${p.beds} Bedrooms`, p.furnishing],
  gradient: "linear-gradient(135deg, #1f1c18 0%, #100f0d 100%)"
}));

const MOCK_INTEL = getArticles().map((art, idx) => ({
  id: `intel${idx + 1}`,
  title: art.title,
  city: art.category === "Residential" ? "Quezon City" : (art.category === "Commercial" ? "Bonifacio Global City" : "Siargao"),
  category: art.category,
  snippet: art.excerpt,
  date: art.date
}));

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
