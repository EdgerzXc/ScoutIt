// ═══════════════════════════════════════════════════════════════
// MAPBOX TOKENS — which token belongs on which side of the wire
//
// THE BUG THIS EXISTS TO PREVENT (found 2026-08-15)
// -------------------------------------------------
// Every Mapbox call from the server was returning 403 Forbidden, silently,
// for weeks. Not a quota problem and not a dead account — the account is
// healthy and inside the free tier. The cause was that server code was using
// NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN, and that token has URL restrictions.
//
// Mapbox enforces URL restrictions against the Referer header. A browser
// sends one; a fetch() from a Node process does not. So a URL-restricted
// token can never work server-side, no matter which URLs are on the list.
//
// Measured against the live token:
//
//   Referer: (none, i.e. server-side)   -> 403
//   Referer: http://localhost:3000/     -> 200
//   Referer: https://scout-it.vercel.app/ -> 200
//   Referer: https://www.scoutit.space/ -> 403   <- the production domain
//
// The damage was invisible because every caller degrades quietly: geocoding
// returned nothing so listings silently got no coordinates, isochrones
// returned nothing so the reach never rendered, and the maps fell back to a
// hardcoded Makati coordinate — which is how a listing ended up displaying a
// confident, detailed map of the wrong part of the city.
//
// THE RULE
// --------
// - Browser code uses NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN. It is exposed to the
//   client, so it SHOULD carry URL restrictions — that restriction is the
//   only thing stopping someone else's site from spending your quota.
// - Server code uses MAPBOX_SERVER_TOKEN, which must NOT be URL-restricted
//   and must NOT be prefixed NEXT_PUBLIC_ (that prefix ships it to the
//   browser, which would defeat the point of having two).
// ═══════════════════════════════════════════════════════════════

let warned = false;

/**
 * The token for calls made from the server (route handlers, lib code running
 * during SSR/ISR). Falls back to the public token so a missing env var
 * degrades to today's behaviour rather than to nothing — but says so once,
 * because that fallback is the exact silent failure described above.
 *
 * @returns {string} token, or "" when none is configured
 */
export function getServerMapboxToken() {
  const dedicated = process.env.MAPBOX_SERVER_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;
  if (dedicated) return dedicated;

  const publicToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
  if (publicToken && !warned) {
    warned = true;
    console.warn(
      "[mapbox] MAPBOX_SERVER_TOKEN is not set, so server-side Mapbox calls are " +
        "using the public token. If that token has URL restrictions every call " +
        "will return 403, because server requests send no Referer. Geocoding, " +
        "isochrones and routing will fail silently. Set MAPBOX_SERVER_TOKEN to " +
        "an unrestricted token."
    );
  }
  return publicToken;
}

/**
 * True when a dedicated server token is configured. Used by health checks so
 * this misconfiguration is visible rather than something that has to be
 * rediscovered by noticing a map is wrong.
 */
export function hasDedicatedServerToken() {
  return Boolean(process.env.MAPBOX_SERVER_TOKEN || process.env.MAPBOX_ACCESS_TOKEN);
}
