// ═══════════════════════════════════════════════════════════════
// LOCATION HUBS API (SEO-03 & Wave 3 Launch)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { LOCATION_HUBS as HUBS } from "@/lib/locationHubs";
import { sanitizeError } from "@/lib/sanitizeError";

// NOTE: LOCATION_HUBS is deliberately NOT re-exported from here. Next
// validates route module exports and rejects anything that is not a
// handler — and more importantly, a page importing a route handler just to
// read three objects pulls the whole server route into the page graph.
// Import from "@/lib/locationHubs" instead.

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      hubs: HUBS,
      count: HUBS.length,
    });
  } catch (err) {
    console.error("[LOCATION HUBS API] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not load location hubs.") },
      { status: 500 }
    );
  }
}
