// Browser code uses NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN (URL-restricted by Referer).
// Server code uses MAPBOX_SERVER_TOKEN (unrestricted, because Node fetch sends no
// Referer header and a URL-restricted token returns 403 Forbidden server-side).

let warned = false;

/**
 * Returns the token for server-side Mapbox calls (route handlers, SSR/ISR).
 * Falls back to NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN with a one-time warning when
 * MAPBOX_SERVER_TOKEN is unset.
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
