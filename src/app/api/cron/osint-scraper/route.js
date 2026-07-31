import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Sample RSS / Public Disclosures feeds for Philippine Real Estate OSINT
const PUBLIC_FEEDS = [
  {
    sourceName: "PSE EDGE Disclosure",
    sourceUrl: "https://edge.pse.com.ph",
    rawTitle: "Megaworld Corporation Allocates ₱350M for BGC Commercial District Expansion",
    rawContent: "Megaworld Corporation today disclosed to the Philippine Stock Exchange its capital expenditure plan for Q3/Q4, allocating ₱350 million to expand its prime BGC commercial footprint and green building retrofits.",
    city: "BGC, Taguig",
    region: "Metro Manila",
    lat: 14.5494,
    lng: 121.0509,
  },
  {
    sourceName: "DENR Environmental Gazette",
    sourceUrl: "https://emb.gov.ph",
    rawTitle: "DENR Approves Environmental Compliance Certificate for General Luna Eco-Resort",
    rawContent: "The Department of Environment and Natural Resources has officially issued ECC approval for the General Luna Sustainable Eco-Resort & Marine Sanctuary project in Siargao Island.",
    city: "Siargao, Surigao del Norte",
    region: "Visayas / Mindanao",
    lat: 9.7794,
    lng: 126.1594,
  },
  {
    sourceName: "Makati LGU Urban Planning Board",
    sourceUrl: "https://makati.gov.ph",
    rawTitle: "Makati City Zoning Board Approves Density Bonus for Poblacion Adaptive Reuse Projects",
    rawContent: "Makati City Urban Planning Board has enacted Resolution 2026-08 offering FAR density bonuses for heritage restoration and culinary adaptive reuse developments in Barangay Poblacion.",
    city: "Poblacion, Makati",
    region: "Metro Manila",
    lat: 14.5624,
    lng: 121.0304,
  },
];

// GET /api/cron/osint-scraper — Scheduled background scraper job
export async function GET(req) {
  try {
    const supabase = supabaseAdmin;
    let insertedCount = 0;

    for (const item of PUBLIC_FEEDS) {
      // Avoid duplicate entries by rawTitle
      const { data: existing } = await supabase
        .from("intel_sources")
        .select("id")
        .eq("raw_title", item.rawTitle)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("intel_sources").insert({
          source_name: item.sourceName,
          source_url: item.sourceUrl,
          raw_title: item.rawTitle,
          raw_content: item.rawContent,
          city: item.city,
          region: item.region,
          lat: item.lat,
          lng: item.lng,
          status: "pending",
        });

        if (!error) insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      scrapedCount: PUBLIC_FEEDS.length,
      insertedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
