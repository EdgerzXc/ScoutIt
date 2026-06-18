import { NextResponse } from "next/server";
import {
  fetchBrokers,
  fetchProperties,
  fetchIntel,
  fetchHomepageConfig,
} from "@/lib/airtable";
import { getProperties } from "@/data/mockProperties";
import { getArticles } from "@/data/mockArticles";
import { getBrokers } from "@/data/mockBrokers";
import { cityToRegion } from "@/lib/regions";

// ── Mock fallback builders ───────────────────────────────────────
function buildMockPayload() {
  const mockProperties = getProperties().map((p) => ({
    id:        p.slug,
    slug:      p.slug,
    title:     p.title,
    city:      p.city,
    region:    p.region || cityToRegion(p.city || ""),
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
    lat:       p.lat,
    lng:       p.lng,
  }));

  const mockIntel = getArticles().map((art, idx) => ({
    id:        `intel${idx + 1}`,
    slug:      art.slug || `article-${idx + 1}`,
    title:     art.title,
    city:      art.city || "",
    region:    art.region || cityToRegion(art.city || ""),
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
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const radius = searchParams.get("radius");
  const lngParam = searchParams.get("lng");
  const latParam = searchParams.get("lat");

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  console.log("┌──────────────────────────────────────────────────────────┐");
  console.log("│  SCOUTIT SPACE INTELLIGENCE  ·  CMS PROXY               │");
  console.log("└──────────────────────────────────────────────────────────┘");

  let properties = [];
  let intel = [];
  let brokers = [];
  let homepage = null;
  let source = "";

  // ── 1. Fetch Data (Live Airtable or Mock Fallback) ────────────
  if (!apiKey || !baseId) {
    console.warn("[CMS] Env vars missing — serving local mock data.");
    const fallback = buildMockPayload();
    properties = fallback.properties;
    intel = fallback.intel;
    brokers = fallback.brokers;
    homepage = fallback.homepage;
    source = "mock_fallback";
  } else {
    try {
      console.log(`[CMS] Live Airtable fetch — Base: ${baseId}`);
      [properties, intel, brokers, homepage] = await Promise.all([
        fetchProperties(apiKey, baseId),
        fetchIntel(apiKey, baseId),
        fetchBrokers(apiKey, baseId),
        fetchHomepageConfig(apiKey, baseId),
      ]);
      source = "airtable";
    } catch (error) {
      console.error("[CMS] Airtable fetch failed:", error.message);
      const fallback = buildMockPayload();
      properties = fallback.properties;
      intel = fallback.intel;
      brokers = fallback.brokers;
      homepage = fallback.homepage;
      source = "mock_fallback_on_error";
    }
  }

  // ── 2. Dynamic Geocoding (Mapbox) for Missing Coordinates ──────
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  
  const propertiesWithCoords = await Promise.all(properties.map(async (p) => {
    let propLat = p.lat || p.latitude;
    let propLng = p.lng || p.longitude;
    
    // If the property has a location string but no exact coordinates, geocode it!
    if ((!propLat || !propLng) && p.location && mapboxToken) {
      try {
        console.log(`[CMS] Geocoding location on the fly: ${p.location}`);
        const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(p.location)}.json?country=ph&limit=1&access_token=${mapboxToken}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        
        if (geoData.features && geoData.features.length > 0) {
          propLng = geoData.features[0].center[0];
          propLat = geoData.features[0].center[1];
        }
      } catch (err) {
        console.error(`[CMS] Geocoding failed for ${p.location}`, err);
      }
    }
    
    return { ...p, lat: propLat, lng: propLng };
  }));

  // ── 3. Apply Radius Filter ────────────────────────────────────
  if (radius && radius !== "any") {
    console.log(`[CMS] Applying Javascript Radius Search: ${radius}km`);
    
    const centerLng = lngParam ? parseFloat(lngParam) : 121.0215;
    const centerLat = latParam ? parseFloat(latParam) : 14.5547;
    const radiusKm = parseFloat(radius);
    
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
      var R = 6371; 
      var dLat = (lat2 - lat1) * Math.PI / 180;  
      var dLon = (lon2 - lon1) * Math.PI / 180; 
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2); 
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    }

    properties = propertiesWithCoords.filter(p => {
      if (!p.lat || !p.lng) return false;
      const dist = getDistanceFromLatLonInKm(centerLat, centerLng, p.lat, p.lng);
      return dist <= radiusKm;
    });

    // Make sure frontend knows this is a radius search so it drops the un-filtered local merge fallback
    source = source.includes("airtable") ? "supabase_radius" : "supabase_radius"; // Using same tag for UI merge logic
  } else {
    properties = propertiesWithCoords;
  }

  // ── 4. Return Payload ─────────────────────────────────────────
  return NextResponse.json({
    properties,
    intel,
    brokers,
    homepage,
    source,
  });
}
