import { NextResponse } from 'next/server';
import { sanitizeError } from "@/lib/sanitizeError";
import { getServerMapboxToken } from "@/lib/mapboxToken";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { getCmsBundle } from "@/lib/cmsCache";
import { distanceKm } from "@/lib/geo";

// ── SPEND CEILING (A-012) ────────────────────────────────────────────────────
// U-009 made this route reject malformed input cheaply. It did not stop a
// caller sending WELL-FORMED requests in a loop. Mapbox remains metered; the
// published comparables now come from the shared CMS bundle.
const GEO_PRICING_LIMIT_PER_MINUTE = 20;
const checkGeoPricingRate = createRateLimiter({
  limit: GEO_PRICING_LIMIT_PER_MINUTE,
  windowMs: 60_000,
  maxKeys: 20_000,
});

// ---------------------------------------------------------------------------
// U-009 -- CATEGORY IS AN ALLOWLIST, NOT A STRING
//
// This used to be an if-chain that fell through to 'Listed_Price' for anything
// it did not recognise, and the caller's raw `category` was then interpolated
// into an Airtable filterByFormula. A single quote closed the string literal,
// which let an unauthenticated caller rewrite the filter -- including deleting
// the Approved_For_ScoutIt=TRUE() condition that is the only thing keeping
// withheld listings out of a public response.
//
// The map below is now the whole contract: a category is either a key in it or
// the request is refused. Nothing derived from user input is ever concatenated
// into a formula again -- the formula is built from CATEGORY_PRICE_FIELD's own
// values, and the field name comes from our constant, not from the wire.
// ---------------------------------------------------------------------------
const CATEGORY_PRICE_FIELD = Object.freeze({
  residential: (p) => p.cat?.residential?.price,
  commercial: (p) => p.cat?.commercial?.rentFrom ?? p.cat?.commercial?.rentPerSqm,
  str: (p) => p.cat?.str?.nightlyRate,
  hospitality: (p) => p.listed_price,
  restaurants: (p) => p.cat?.restaurant?.rent,
  venues: (p) => p.cat?.venue?.rentalRate,
});

/**
 * @param {unknown} category
 * @returns {{ key: string, priceField: Function } | null} null when unknown
 */
function resolveCategory(category) {
  if (typeof category !== 'string') return null;
  const key = category.trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(CATEGORY_PRICE_FIELD, key)) return null;
  return { key, priceField: CATEGORY_PRICE_FIELD[key] };
}

const COMP_RADIUS_KM = 1.5;

export async function POST(request) {
  const rate = checkGeoPricingRate(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many pricing requests' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'private, no-store',
          'Retry-After': String(rate.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { location, category, price } = body;

    if (!location || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Every check that can reject this request runs BEFORE the first paid call.
    // The route is unauthenticated and each accepted request costs one Mapbox
    // geocode plus one Airtable read, so a refusal must not spend anything.
    const resolved = resolveCategory(category);
    if (!resolved) {
      return NextResponse.json(
        { error: 'Unknown category', allowed: Object.keys(CATEGORY_PRICE_FIELD) },
        { status: 400 }
      );
    }
    const { priceField } = resolved;

    const targetPrice = parseFloat(price);
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 });
    }

    if (typeof location !== 'string' || location.length > 200) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }

    // A public pricing request must not perform its own Airtable query. The
    // shared snapshot already contains only approved listings and all fields
    // needed for comparable selection.
    const bundle = await getCmsBundle();
    if (bundle.source === "empty_fallback_on_error") {
      return NextResponse.json({ error: "Catalog unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    // 1. Geocode the location
    const mapboxToken = getServerMapboxToken();
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}&limit=1`;
    
    // A-013: a bare fetch has no timeout. A SLOW Mapbox (not a dead one)
    // used to hold this request open until the platform killed the function.
    const geocodeRes = await fetchWithRetry(geocodeUrl, {}, { circuit: "mapbox-geocode" });
    if (!geocodeRes.ok) {
      throw new Error('Failed to geocode location');
    }
    const geocodeData = await geocodeRes.json();
    
    if (!geocodeData.features || geocodeData.features.length === 0) {
      return NextResponse.json({ compsFound: 0, error: 'Location not found' });
    }

    const [lon, lat] = geocodeData.features[0].center;

    // 2. Filter the approved snapshot by radius and calculate average.
    let totalPriceSum = 0;
    let compsCount = 0;

    (bundle.properties || []).forEach((property) => {
      if (property.is_sample) return;
      if (String(property.spaceCategory || "").toLowerCase() !== resolved.key) return;
      // Do not treat a city-centroid fallback as an address-level comparable.
      const compLat = property.latitude;
      const compLon = property.longitude;
      const compPrice = Number.parseFloat(priceField(property));

      if (compLat && compLon && Number.isFinite(compPrice) && compPrice > 0) {
        const dist = distanceKm(lat, lon, compLat, compLon);
        if (dist <= COMP_RADIUS_KM) {
          totalPriceSum += compPrice;
          compsCount++;
        }
      }
    });

    if (compsCount === 0) {
      return NextResponse.json({ compsFound: 0 });
    }

    const averagePrice = totalPriceSum / compsCount;
    const percentageDiff = ((targetPrice - averagePrice) / averagePrice) * 100;

    return NextResponse.json({
      compsFound: compsCount,
      averagePrice: averagePrice,
      percentageDiff: percentageDiff,
      radiusKm: COMP_RADIUS_KM,
      priceField: resolved.key
    });

  } catch (error) {
    console.error('Geo-Pricing API Error:', error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
