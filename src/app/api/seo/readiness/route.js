// ═══════════════════════════════════════════════════════════════
// PROPERTY SEO READINESS AUDIT API (SEO-01 / Wave 2)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { computeListingStrength } from "@/lib/listingStrength";
import { sanitizeError } from "@/lib/sanitizeError";

/**
 * GET /api/seo/readiness?propertyId=<slug_or_uuid>
 * Audits a property's index readiness score, missing items, and index_eligible state.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "Missing required propertyId parameter" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    // Fetch property from Supabase
    const { data: prop, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("*")
      .or(`id.eq.${propertyId},slug.eq.${propertyId}`)
      .maybeSingle();

    if (propErr || !prop) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Map database model to UI listing model for strength check
    const listingModel = {
      title: prop.title,
      location: prop.city || prop.address,
      loc: prop.address,
      price: prop.price,
      desc: prop.description,
      hasMedia: Array.isArray(prop.photos) && prop.photos.length > 0,
      mediaLink: prop.photos?.[0],
      coordinates: prop.lat && prop.lng ? { lat: prop.lat, lng: prop.lng } : null,
      spaceCategory: prop.category || prop.property_type,
      details: prop.metadata || {},
    };

    const strength = computeListingStrength(listingModel);

    // Additional SEO Indexing Checks
    const seoChecks = {
      canonicalSlugPresent: !!prop.slug,
      photosCount: Array.isArray(prop.photos) ? prop.photos.length : 0,
      minPhotosPassed: (Array.isArray(prop.photos) ? prop.photos.length : 0) >= 3,
      geocoded: !!(prop.lat && prop.lng),
      descriptionSubstantial: !!(prop.description && prop.description.trim().length >= 100),
      isIndexEligible: prop.status === "LIVE" && strength.score >= 70,
    };

    return NextResponse.json({
      success: true,
      propertyId: prop.id,
      slug: prop.slug,
      status: prop.status,
      strength,
      seoChecks,
      readinessScore: strength.score,
      indexEligible: seoChecks.isIndexEligible,
    });
  } catch (err) {
    console.error("[SEO READINESS API] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not audit SEO readiness.") },
      { status: 500 }
    );
  }
}
