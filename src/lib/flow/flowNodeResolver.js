import { MASTER_FLOW_NODES } from "@/data/masterFlowGraphData";

// Pre-index nodes by ID
const nodeById = new Map();
// Pre-index exact routes
const exactRouteMap = new Map();
// Parameterized routes compiled to regex
const paramRouteList = [];

function routeToRegex(route) {
  // e.g. "/property/[id]" -> /^\/property\/([^/]+)$/
  // Handle optional query string in route pattern
  const [basePath, query] = route.split("?");
  const escaped = basePath
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\[[a-zA-Z0-9_-]+\\\]/g, "([^/]+)");
  return {
    regex: new RegExp(`^${escaped}$`),
    query,
  };
}

for (const node of MASTER_FLOW_NODES) {
  if (node.id) {
    nodeById.set(node.id, node);
  }
  if (node.route) {
    const cleanRoute = node.route.trim();
    if (!cleanRoute.includes("[")) {
      if (!exactRouteMap.has(cleanRoute)) {
        exactRouteMap.set(cleanRoute, node);
      }
    } else {
      paramRouteList.push({
        node,
        ...routeToRegex(cleanRoute),
      });
    }
  }
}

function formatNodeResult(node) {
  if (!node) return null;
  return {
    nodeId: node.id,
    canonicalId: node.canonicalId || null,
    name: node.name,
    domain: node.domain || "core",
    roles: node.actorRoles || node.roles || [],
    evidencePath: node.evidence?.[0]?.path || node.systems?.[0] || null,
    exceptions: node.exceptions || [],
    recovery: node.recovery || [],
  };
}

/**
 * Resolves a runtime path (or explicit nodeId) to a Master Flow Graph node.
 * Used for error tagging, telemetry localization, and incident blast radius lookup.
 *
 * @param {string} [pathname] - e.g. "/property/the-ridgeline" or "/api/cms"
 * @param {string} [explicitNodeId] - e.g. "deal_room"
 * @returns {object|null}
 */
export function resolveFlowNode(pathname, explicitNodeId) {
  if (explicitNodeId && nodeById.has(explicitNodeId)) {
    return formatNodeResult(nodeById.get(explicitNodeId));
  }

  if (!pathname || typeof pathname !== "string") {
    return null;
  }

  const clean = pathname.trim();
  const [basePath] = clean.split("?");
  const normalized = basePath === "/" ? "/" : basePath.replace(/\/+$/, "");

  // 1. Exact match with original clean path
  if (exactRouteMap.has(clean)) {
    return formatNodeResult(exactRouteMap.get(clean));
  }

  // 2. Exact match with normalized path
  if (exactRouteMap.has(normalized)) {
    return formatNodeResult(exactRouteMap.get(normalized));
  }

  // 3. Match parameterized route patterns (e.g. /property/[id])
  for (const item of paramRouteList) {
    if (item.regex.test(normalized)) {
      return formatNodeResult(item.node);
    }
  }

  // 4. Domain route fallbacks for sub-routes, newly added APIs, and secondary journeys
  for (const fallback of ROUTE_FALLBACKS) {
    if (fallback.regex.test(normalized)) {
      const node = nodeById.get(fallback.targetNodeId);
      if (node) return formatNodeResult(node);
    }
  }

  return null;
}

// Domain-level fallback route matchers
const ROUTE_FALLBACKS = [
  // VIA Attribution & Priority Routing (A-186)
  { regex: /^\/property\/[^/]+\/via(\/[^/]+)?$/, targetNodeId: "direct_slug" },
  { regex: /^\/api\/property\/[^/]+\/via(\/.*)?$/, targetNodeId: "direct_slug" },
  { regex: /^\/api\/broker\/via-metrics$/, targetNodeId: "brokers_roster" },
  // Behavioral Scoring & Reviews (A-182)
  { regex: /^\/api\/deals\/[^/]+\/review$/, targetNodeId: "deal_room" },
  { regex: /^\/api\/reviews(\/.*)?$/, targetNodeId: "deal_room" },
  { regex: /^\/api\/user\/resident-passport$/, targetNodeId: "auth_onboarding_flow" },
  // Master Flow Graph & Incident Dispatcher (A-185, A-187)
  { regex: /^\/admin\/flow$/, targetNodeId: "mission_control" },
  // Layer & Exploration
  { regex: /^\/layer\/metropolis$/, targetNodeId: "metropolis" },
  { regex: /^\/layer\/orbit$/, targetNodeId: "orbit" },
  { regex: /^\/layer\/stratosphere$/, targetNodeId: "stratosphere" },
  { regex: /^\/layer\/crust$/, targetNodeId: "crust" },
  { regex: /^\/layer\/mantle$/, targetNodeId: "mantle" },
  { regex: /^\/layer\/core$/, targetNodeId: "core" },
  // Generic domain API fallbacks
  { regex: /^\/api\/deals\b/, targetNodeId: "deal_room" },
  { regex: /^\/api\/calendar\b/, targetNodeId: "calendar_sync" },
  { regex: /^\/api\/admin\b/, targetNodeId: "mission_control" },
  { regex: /^\/api\/ai\b/, targetNodeId: "ai_listing_engine" },
  { regex: /^\/api\/dashboard\b/, targetNodeId: "owner_listings" },
  { regex: /^\/api\/property\b/, targetNodeId: "direct_slug" },
  { regex: /^\/api\/broker\b/, targetNodeId: "brokers_roster" },
  { regex: /^\/profile\b/, targetNodeId: "auth_onboarding_flow" },
  { regex: /^\/pricing\b/, targetNodeId: "orbit" },
];

/**
 * Direct lookup of a Master Flow Graph node by ID.
 * @param {string} nodeId
 * @returns {object|null}
 */
export function getFlowNode(nodeId) {
  if (!nodeId) return null;
  return formatNodeResult(nodeById.get(nodeId));
}
