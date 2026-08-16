import { NextResponse } from "next/server";

import { getServerMapboxToken } from "@/lib/mapboxToken";
import { createRateLimiter } from "@/lib/rateLimit";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

// ═══════════════════════════════════════════════════════════════════════
// MAPBOX PROXY — the browser never holds a Mapbox token
//
// WHY THIS EXISTS
// ---------------
// Three places called Mapbox directly from the browser with the public token:
// the nearest-transit readout on every property page (Matrix), the route line
// to the nearest station (Directions), and the geocode that runs when an owner
// publishes a listing (Geocoding).
//
// All three returned 403 in production. Mapbox enforces a token's URL
// restrictions against the Referer header, and the public token's allow-list
// covered localhost and the preview deployments but not www.scoutit.space. The
// owner-publish geocode failing is why newly published listings arrived with no
// coordinates.
//
// Fixing the allow-list would have patched it. Proxying removes the problem
// instead: server-side calls use the unrestricted server token, the public
// token stops being load-bearing, and no Mapbox credential is shipped to the
// browser at all — so nobody can lift it from the bundle and spend the quota.
//
// This endpoint spends real money, so it validates hard and rate-limits.
// ═══════════════════════════════════════════════════════════════════════

export const runtime = "nodejs";

// Geometry does not change quickly and neither do addresses.
const CACHE_SECONDS = 60 * 60 * 24;

const checkRateLimit = createRateLimiter({ limit: 60, windowMs: 60_000 });

const PROFILES = new Set(["driving", "walking", "cycling", "driving-traffic"]);
// Mapbox's own ceiling for the Matrix API on these profiles.
const MAX_COORDINATES = 25;

function clientKey(req) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "anonymous";
}

function bad(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

/** "lng,lat;lng,lat" -> validated string, or null. Rejects anything unparseable
 *  rather than forwarding it, so this can never be used to shape arbitrary
 *  upstream requests. */
function parseCoordinates(raw) {
  if (!raw || typeof raw !== "string") return null;
  const pairs = raw.split(";");
  if (pairs.length < 1 || pairs.length > MAX_COORDINATES) return null;

  const cleaned = [];
  for (const pair of pairs) {
    const [lngRaw, latRaw] = pair.split(",");
    const lng = Number(lngRaw);
    const lat = Number(latRaw);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
    cleaned.push(`${lng},${lat}`);
  }
  return cleaned.join(";");
}

/** Only indices, only within range — never passed through as free text. */
function parseIndexList(raw, count) {
  if (!raw) return null;
  const parts = String(raw).split(";");
  const out = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n >= count) return null;
    out.push(String(n));
  }
  return out.join(";");
}

export async function GET(req) {
  const params = new URL(req.url).searchParams;

  try {
    const limit = checkRateLimit(clientKey(req));
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds || 60) } }
      );
    }

    const token = getServerMapboxToken();
    if (!token) return bad("Mapbox is not configured", 503);

    const op = params.get("op");
    let upstream;

    if (op === "geocode") {
      const q = (params.get("q") || "").trim();
      if (!q || q.length > 256) return bad("q is required");
      upstream =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
        `?country=ph&limit=1&access_token=${token}`;
    } else if (op === "directions" || op === "matrix") {
      const profile = params.get("profile") || "driving";
      if (!PROFILES.has(profile)) return bad("Unsupported profile");

      const coords = parseCoordinates(params.get("coordinates"));
      if (!coords) return bad("Invalid coordinates");
      const count = coords.split(";").length;

      if (op === "directions") {
        if (count !== 2) return bad("Directions needs exactly two coordinates");
        upstream =
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}` +
          `?geometries=geojson&overview=full&access_token=${token}`;
      } else {
        if (count < 2) return bad("Matrix needs at least two coordinates");
        const destinations = parseIndexList(params.get("destinations"), count);
        if (!destinations) return bad("Invalid destinations");
        upstream =
          `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${coords}` +
          `?sources=0&destinations=${destinations}&annotations=duration,distance&access_token=${token}`;
      }
    } else {
      return bad("Unsupported op");
    }

    const res = await fetchWithRetry(
      upstream,
      {},
      { circuit: "mapbox", budgetMs: 6000, attemptTimeoutMs: 4500, retries: 1 }
    );

    if (!res.ok) {
      // Never echo the upstream body: the URL it came from contains the token,
      // and Mapbox errors sometimes quote the request.
      return NextResponse.json(
        { success: false, message: `Mapbox responded ${res.status}` },
        { status: res.status === 429 ? 429 : 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=604800` } }
    );
  } catch (err) {
    // A dead Mapbox must degrade to a missing overlay, never to a broken page.
    return NextResponse.json({ success: false, message: "Mapbox request failed" }, { status: 502 });
  }
}
