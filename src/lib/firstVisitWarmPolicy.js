export const MAX_ROUTE_PREFETCHES = 2;
export const MAX_PUBLIC_DATA_REQUESTS = 1;
export const MAX_PUBLIC_DATA_BYTES = 32 * 1024;
export const FIRST_VISIT_MARKER_TTL_MS = 6 * 60 * 60 * 1000;
export const FIRST_VISIT_MARKER_KEY = "scoutit_public_warm_v1";

const PUBLIC_ROUTES = new Set([
  "/", "/about", "/brokers", "/descent", "/discover",
  "/layer/crust", "/photographers", "/pricing", "/property",
]);

// Dynamic directories already use Next's own visible-Link prefetch. Repeating
// that work produced canceled RSC requests in the A-022 browser trace. The
// custom idle budget therefore stays on stable static surfaces only.
const WARMABLE_STATIC_ROUTES = new Set([
  "/", "/about", "/descent", "/layer/crust", "/pricing",
]);

const ROUTE_HINTS = Object.freeze({
  "/": ["/descent", "/about"],
  "/about": ["/descent", "/layer/crust"],
  "/brokers": ["/layer/crust", "/about"],
  "/descent": ["/about", "/layer/crust"],
  "/discover": ["/layer/crust", "/about"],
  "/layer/crust": ["/about", "/descent"],
  "/photographers": ["/layer/crust", "/about"],
  "/pricing": ["/about", "/descent"],
  "/property": ["/layer/crust", "/about"],
});

export const GUIDE_ROUTE_HINTS = Object.freeze({
  buyer_guide: ["/", "/discover", "/property"],
  owner_guide: [],
  broker_guide: ["/brokers"],
});

function exactPublicRoute(candidate) {
  if (typeof candidate !== "string" || !candidate.startsWith("/")) return null;
  if (candidate.includes("?") || candidate.includes("#") || candidate.startsWith("//")) return null;
  return PUBLIC_ROUTES.has(candidate) && WARMABLE_STATIC_ROUTES.has(candidate) ? candidate : null;
}

export function canWarmFirstVisit({
  online,
  saveData,
  effectiveType,
  deviceMemory,
  hardwareConcurrency,
  liteMode,
  reducedMotion,
} = {}) {
  if (online === false || saveData || liteMode || reducedMotion) return false;
  if (["slow-2g", "2g"].includes(String(effectiveType || "").toLowerCase())) return false;
  if (Number.isFinite(deviceMemory) && deviceMemory < 4) return false;
  if (Number.isFinite(hardwareConcurrency) && hardwareConcurrency < 4) return false;
  return true;
}

export function selectWarmRoutes(pathname, preferredRoutes = []) {
  const current = PUBLIC_ROUTES.has(pathname) ? pathname : null;
  const candidates = [...preferredRoutes, ...(ROUTE_HINTS[current] || ["/about"])]
    .map(exactPublicRoute)
    .filter(Boolean)
    .filter((route) => route !== current);
  return [...new Set(candidates)].slice(0, MAX_ROUTE_PREFETCHES);
}

export function nextGuideRouteHint(savedProgress) {
  const routes = GUIDE_ROUTE_HINTS[savedProgress?.journeyId] || [];
  if (savedProgress?.completed || !Number.isInteger(savedProgress?.step)) return null;
  return routes[savedProgress.step + 1] || routes[savedProgress.step] || null;
}

export function isFreshWarmMarker(marker, now = Date.now()) {
  return marker?.version === 1 && Number.isFinite(marker?.expiresAt) && marker.expiresAt > now;
}
