// ═══════════════════════════════════════════════════════════════
// LOCATION HUBS API (SEO-03 & Wave 3 Launch)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";

export const LOCATION_HUBS = [
  {
    slug: "bgc-taguig",
    name: "Bonifacio Global City (BGC)",
    city: "Taguig",
    region: "BGC",
    lat: 14.5494,
    lng: 121.048,
    tagline: "Metro Manila's premier master-planned commercial and residential grid.",
    featuredCategories: ["Commercial Office", "High-Rise Condo", "Retail Space"],
  },
  {
    slug: "makati-cbd",
    name: "Makati Central Business District",
    city: "Makati",
    region: "Makati",
    lat: 14.5547,
    lng: 121.0244,
    tagline: "The financial heart of the Philippines with corporate headquarters and luxury residences.",
    featuredCategories: ["Corporate HQ", "Luxury Condo", "Commercial Suite"],
  },
  {
    slug: "quezon-city-hub",
    name: "Quezon City Commercial Hub",
    city: "Quezon City",
    region: "Quezon City",
    lat: 14.6488,
    lng: 121.0509,
    tagline: "The largest city in Metro Manila with tech hubs, media networks, and residential estates.",
    featuredCategories: ["Tech Office", "Residential Compound", "Commercial Lot"],
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      hubs: LOCATION_HUBS,
      count: LOCATION_HUBS.length,
    });
  } catch (err) {
    console.error("[LOCATION HUBS API] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not load location hubs.") },
      { status: 500 }
    );
  }
}
