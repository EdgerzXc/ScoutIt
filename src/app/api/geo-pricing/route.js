import { NextResponse } from 'next/server';
import { sanitizeError } from "@/lib/sanitizeError";
import { getServerMapboxToken } from "@/lib/mapboxToken";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

// ── SPEND CEILING (A-012) ────────────────────────────────────────────────────
// U-009 made this route reject malformed input cheaply. It did not stop a
// caller sending WELL-FORMED requests in a loop, and each accepted request is
// one Mapbox geocode plus one Airtable read, both billed, with no account
// required. 20/minute comfortably covers a person adjusting a price slider.
const GEO_PRICING_LIMIT_PER_MINUTE = 20;
const checkGeoPricingRate = createRateLimiter({
  limit: GEO_PRICING_LIMIT_PER_MINUTE,
  windowMs: 60_000,
  maxKeys: 20_000,
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

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
  residential: 'RS_Price',
  commercial: 'CM_Rent_Per_Sqm',
  str: 'STR_Nightly_Rate',
  hospitality: 'Listed_Price',
  restaurants: 'RST_Rent',
  venues: 'VEN_Rental_Rate',
});

/**
 * @param {unknown} category
 * @returns {{ key: string, priceField: string } | null} null when unknown
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

    // 2. Fetch properties from Airtable
    // `resolved.key` came out of CATEGORY_PRICE_FIELD, not off the wire, so it
    // cannot carry a quote. It is still encoded, because "the value is safe" is
    // a property that decays the moment someone edits this line.
    const formula = `AND(Approved_For_ScoutIt=TRUE(), LOWER(SpaceCategory)='${resolved.key}')`;
    const airtableUrl =
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/PROPERTIES_CMS` +
      `?filterByFormula=${encodeURIComponent(formula)}`;
    
    const airtableRes = await fetchWithRetry(
      airtableUrl,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` } },
      { circuit: "airtable-geo-pricing" }
    );

    if (!airtableRes.ok) {
      throw new Error('Failed to fetch from Airtable');
    }

    const airtableData = await airtableRes.json();

    // 3. Filter by radius and calculate average
    let totalPriceSum = 0;
    let compsCount = 0;

    airtableData.records.forEach((record) => {
      const compLat = record.fields.Latitude;
      const compLon = record.fields.Longitude;
      const compPrice = record.fields[priceField];

      if (compLat && compLon && compPrice) {
        const dist = calculateDistance(lat, lon, compLat, compLon);
        if (dist <= COMP_RADIUS_KM) {
          totalPriceSum += parseFloat(compPrice);
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
      priceField: priceField
    });

  } catch (error) {
    console.error('Geo-Pricing API Error:', error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
