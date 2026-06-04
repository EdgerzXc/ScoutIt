import { NextResponse } from "next/server";
import {
  fetchBrokers,
  fetchProperties,
  fetchIntel,
  fetchHomepageConfig,
} from "@/lib/airtable";
import { getProperties, getArticles, getBrokers } from "@/data/mockDb";

// ── Mock fallback builders ───────────────────────────────────────
function buildMockPayload() {
  const mockProperties = getProperties().map((p) => ({
    id:        p.slug,
    slug:      p.slug,
    title:     p.title,
    city:      p.city,
    location:  p.location,
    property_type: p.property_type,
    spaceCategory: p.spaceCategory || "",
    seating_capacity: p.seating_capacity || "",
    kitchen_grade: p.kitchen_grade || "",
    accommodations: p.accommodations || "",
    hosting_capacity: p.hosting_capacity || "",
    setup_grade: p.setup_grade || "",
    tenure:    p.tenure,
    beds:      p.beds,
    baths:     p.baths,
    floor_sqm: p.floor_sqm,
    furnishing: p.furnishing,
    gradient:  "linear-gradient(135deg, #1f1c18 0%, #100f0d 100%)",
    image:     p.photos?.[0] || "",
  }));

  const mockIntel = getArticles().map((art, idx) => ({
    id:        `intel${idx + 1}`,
    slug:      art.slug || `article-${idx + 1}`,
    title:     art.title,
    city:      "",
    category:  art.category,
    intelType: "BRIEFING",
    excerpt:   art.excerpt,
    date:      art.date,
    image:     art.image || "",
  }));

  const mockBrokers = getBrokers().map((b) => ({
    id:               b.id,
    name:             b.name,
    title:            b.title,
    specialty:        b.specialty,
    location:         b.location,
    bio:              b.bio,
    image:            b.image,
    license:          b.license,
    closures:         b.closures,
    rating:           b.rating,
    subscriptionTier: b.subscriptionTier,
    subscriptionLabel: ["Diamond","Platinum","Gold","Silver","Bronze"][b.subscriptionTier - 1] || "Bronze",
    niche:            b.niche || [],
    clearanceTier:    b.clearanceTier || "",
    rosterRank:       b.metrics?.[0]?.value || "",
    rosterStatus:     b.metrics?.[2]?.value || "Active",
    managedProperties: [],
    metrics:          b.metrics || [],
  }));

  return { properties: mockProperties, intel: mockIntel, brokers: mockBrokers, homepage: null };
}

// ── Main handler ─────────────────────────────────────────────────
export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  console.log("┌──────────────────────────────────────────────────────────┐");
  console.log("│  SCOUTIT SPACE INTELLIGENCE  ·  CMS PROXY               │");
  console.log("└──────────────────────────────────────────────────────────┘");

  // ── No env vars → serve mock data ────────────────────────────
  if (!apiKey || !baseId) {
    console.warn("[CMS] Env vars missing — serving local mock data.");
    return NextResponse.json({ ...buildMockPayload(), source: "mock_fallback" });
  }

  // ── Live Airtable fetch ───────────────────────────────────────
  try {
    console.log(`[CMS] Live Airtable fetch — Base: ${baseId}`);

    const [properties, intel, brokers, homepage] = await Promise.all([
      fetchProperties(apiKey, baseId),
      fetchIntel(apiKey, baseId),
      fetchBrokers(apiKey, baseId),
      fetchHomepageConfig(apiKey, baseId),
    ]);

    console.log(`[CMS] Loaded → Properties: ${properties.length} | Intel: ${intel.length} | Brokers: ${brokers.length}`);

    return NextResponse.json({
      properties,
      intel,
      brokers,
      homepage,
      source: "airtable",
    });
  } catch (error) {
    console.error("[CMS] Airtable fetch failed:", error.message);
    console.log("[CMS] Falling back to local mock data.");

    return NextResponse.json({
      ...buildMockPayload(),
      source: "mock_fallback_on_error",
      error: error.message,
    });
  }
}
