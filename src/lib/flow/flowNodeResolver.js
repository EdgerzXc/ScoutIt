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
  const routeCandidates = [
    ...(typeof node.route === "string" ? [node.route] : []),
    ...(Array.isArray(node.routes) ? node.routes : []),
  ];
  for (const rawRoute of routeCandidates) {
    if (typeof rawRoute !== "string") continue;
    const cleanRoute = rawRoute.trim();
    if (!cleanRoute) continue;
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
  { regex: /^\/api\/property\/[^/]+\/open-gate$/, targetNodeId: "direct_slug" },
  { regex: /^\/api\/property\/[^/]+\/units$/, targetNodeId: "direct_slug" },
  { regex: /^\/api\/broker\/via-metrics$/, targetNodeId: "brokers_roster" },
  // Behavioral Scoring & Reviews (A-182)
  { regex: /^\/api\/deals\/[^/]+\/review$/, targetNodeId: "deal_room" },
  { regex: /^\/api\/reviews(\/.*)?$/, targetNodeId: "deal_room" },
  { regex: /^\/api\/user\/resident-passport$/, targetNodeId: "auth_onboarding_flow" },
  // Master Flow Graph & Incident Dispatcher (A-185, A-187)
  { regex: /^\/admin\/flow$/, targetNodeId: "mission_control" },
  { regex: /^\/enterprise$/, targetNodeId: "mission_control" },
  // Contact, Auth & Directory Surfaces (A-368)
  { regex: /^\/contact$/, targetNodeId: "inquiry_modal" },
  { regex: /^\/api\/contact$/, targetNodeId: "inquiry_modal" },
  { regex: /^\/reset-password$/, targetNodeId: "auth_onboarding_flow" },
  { regex: /^\/auth\/callback$/, targetNodeId: "auth_onboarding_flow" },
  { regex: /^\/brokers$/, targetNodeId: "brokers_roster" },
  { regex: /^\/professionals$/, targetNodeId: "brokers_roster" },
  { regex: /^\/directory$/, targetNodeId: "discover_directory" },
  // Dashboard Sub-Routes & Units API (A-368)
  { regex: /^\/dashboard\/inbox$/, targetNodeId: "deal_room" },
  { regex: /^\/dashboard\/crm$/, targetNodeId: "sys_zero_log_ai_crm" },
  { regex: /^\/dashboard\/calendar$/, targetNodeId: "booking_modal" },
  { regex: /^\/api\/dashboard\/units(\/.*)?$/, targetNodeId: "dashboard_inventory_unit" },
  // Layer & Exploration
  { regex: /^\/layer\/metropolis$/, targetNodeId: "metropolis" },
  { regex: /^\/layer\/orbit$/, targetNodeId: "orbit" },
  { regex: /^\/layer\/stratosphere$/, targetNodeId: "stratosphere" },
  { regex: /^\/layer\/crust$/, targetNodeId: "crust" },
  { regex: /^\/layer\/mantle$/, targetNodeId: "mantle" },
  { regex: /^\/layer\/mantle\/tour$/, targetNodeId: "mantle" },
  { regex: /^\/layer\/core$/, targetNodeId: "core" },
  // Public Pages & Secondary Surfaces (A-369 Wave 2)
  { regex: /^\/about$/, targetNodeId: "hero" },
  { regex: /^\/about-you$/, targetNodeId: "auth_onboarding_flow" },
  { regex: /^\/claim\/[^/]+$/, targetNodeId: "claim_listing_modal" },
  { regex: /^\/community$/, targetNodeId: "community_signals_feed" },
  { regex: /^\/descent$/, targetNodeId: "orbit" },
  { regex: /^\/event-planners\/[^/]+$/, targetNodeId: "planners_roster" },
  { regex: /^\/intel\/[^/]+$/, targetNodeId: "intel_articles" },
  { regex: /^\/off-market$/, targetNodeId: "scenario_offmarket_pitch" },
  { regex: /^\/photographers\/[^/]+$/, targetNodeId: "photographers_roster" },
  { regex: /^\/platform-tour$/, targetNodeId: "orbit" },
  { regex: /^\/property\/[^/]+\/brokers$/, targetNodeId: "brokers_roster" },
  { regex: /^\/researchers\/[^/]+$/, targetNodeId: "researchers_roster" },
  { regex: /^\/showcase\/chatbox$/, targetNodeId: "showcase" },
  { regex: /^\/tutorials\/owner-publish$/, targetNodeId: "owner_creation_pipeline" },
  { regex: /^\/wishlist\/shared\/[^/]+$/, targetNodeId: "wishlist" },
  // Specific API Routes & Prefixes (A-369 Wave 2 — ordered before generic fallbacks)
  { regex: /^\/api\/analytics(\/.*)?$/, targetNodeId: "mission_control" },
  { regex: /^\/api\/auth(\/.*)?$/, targetNodeId: "auth_onboarding_flow" },
  { regex: /^\/api\/availability(\/.*)?$/, targetNodeId: "booking_modal" },
  { regex: /^\/api\/badges(\/.*)?$/, targetNodeId: "badges" },
  { regex: /^\/api\/cms(\/.*)?$/, targetNodeId: "discover_directory" },
  { regex: /^\/api\/community(\/.*)?$/, targetNodeId: "api_community_signals" },
  { regex: /^\/api\/crm(\/.*)?$/, targetNodeId: "sys_zero_log_ai_crm" },
  { regex: /^\/api\/cron\/check-stale-listings$/, targetNodeId: "sys_freshness_staleness_engine" },
  { regex: /^\/api\/cron\/recompute-broker-metrics$/, targetNodeId: "cron_recompute_broker_metrics" },
  { regex: /^\/api\/cron\/purge-contact-messages$/, targetNodeId: "cron_purge_contact_messages" },
  { regex: /^\/api\/cron\/purge-crm-activity$/, targetNodeId: "cron_purge_crm_activity" },
  { regex: /^\/api\/cron\/purge-analytics$/, targetNodeId: "cron_purge_analytics" },
  { regex: /^\/api\/cron\/monthly-rollover$/, targetNodeId: "cron_monthly_rollover" },
  { regex: /^\/api\/cron\/verify-prc-status$/, targetNodeId: "cron_verify_prc_status" },
  { regex: /^\/api\/cron\/process-calendar-sync-queue$/, targetNodeId: "cron_calendar_sync_queue" },
  { regex: /^\/api\/cron(\/.*)?$/, targetNodeId: "mission_control" },
  { regex: /^\/api\/faqs(\/.*)?$/, targetNodeId: "action_ask_faq" },
  { regex: /^\/api\/geo-pricing(\/.*)?$/, targetNodeId: "pep_ch6_fine_print" },
  { regex: /^\/api\/health(\/.*)?$/, targetNodeId: "mission_control" },
  { regex: /^\/api\/hubs(\/.*)?$/, targetNodeId: "hubs" },
  { regex: /^\/api\/inquiries(\/.*)?$/, targetNodeId: "inquiry_modal" },
  { regex: /^\/api\/intel(\/.*)?$/, targetNodeId: "intel_articles" },
  { regex: /^\/api\/leads(\/.*)?$/, targetNodeId: "sys_zero_log_ai_crm" },
  { regex: /^\/api\/mapbox(\/.*)?$/, targetNodeId: "spatial_canvas" },
  { regex: /^\/api\/notifications(\/.*)?$/, targetNodeId: "deal_room" },
  { regex: /^\/api\/oauth(\/.*)?$/, targetNodeId: "booking_modal" },
  { regex: /^\/api\/off-market(\/.*)?$/, targetNodeId: "scenario_offmarket_pitch" },
  { regex: /^\/api\/og(\/.*)?$/, targetNodeId: "direct_slug" },
  { regex: /^\/api\/preload(\/.*)?$/, targetNodeId: "discover_directory" },
  { regex: /^\/api\/professionals(\/.*)?$/, targetNodeId: "brokers_roster" },
  { regex: /^\/api\/profile(\/.*)?$/, targetNodeId: "auth_onboarding_flow" },
  { regex: /^\/api\/properties(\/.*)?$/, targetNodeId: "owner_creation_pipeline" },
  { regex: /^\/api\/questit(\/.*)?$/, targetNodeId: "provider_bounty_handshake" },
  { regex: /^\/api\/v1\/questit(\/.*)?$/, targetNodeId: "provider_bounty_handshake" },
  { regex: /^\/api\/seo(\/.*)?$/, targetNodeId: "discover_directory" },
  { regex: /^\/api\/showcase(\/.*)?$/, targetNodeId: "showcase" },
  { regex: /^\/api\/spatial(\/.*)?$/, targetNodeId: "pep_ch5_build_plans" },
  { regex: /^\/api\/storage(\/.*)?$/, targetNodeId: "owner_creation_pipeline" },
  { regex: /^\/api\/telemetry(\/.*)?$/, targetNodeId: "mission_control" },
  { regex: /^\/api\/user(\/.*)?$/, targetNodeId: "page_settings" },
  { regex: /^\/api\/viewing-appointments(\/.*)?$/, targetNodeId: "booking_modal" },
  { regex: /^\/api\/waitlist(\/.*)?$/, targetNodeId: "auth_onboarding_flow" },
  { regex: /^\/api\/wallet(\/.*)?$/, targetNodeId: "sys_connect_wallet" },
  { regex: /^\/api\/whereto(\/.*)?$/, targetNodeId: "pep_ch4_where_to" },
  { regex: /^\/api\/wishlist(\/.*)?$/, targetNodeId: "wishlist" },
  { regex: /^\/api\/wrap(\/.*)?$/, targetNodeId: "sys_monthly_scout_wrap" },
  { regex: /^\/api\/scan\/process$/, targetNodeId: "mc_scan_process_cron" },
  { regex: /^\/api\/admin\/pdf-verify$/, targetNodeId: "owner_creation_pipeline" },
  { regex: /^\/api\/admin\/connects-refund$/, targetNodeId: "sys_connect_wallet" },
  { regex: /^\/api\/dashboard\/representation\/revoke$/, targetNodeId: "action_owner_remove_broker" },
  { regex: /^\/api\/dashboard\/open-gate$/, targetNodeId: "dashboard_open_gate" },
  { regex: /^\/api\/property\/claim$/, targetNodeId: "claim_listing_modal" },
  // Generic domain API fallbacks
  { regex: /^\/api\/deals\b/, targetNodeId: "deal_room" },
  { regex: /^\/api\/calendar\b/, targetNodeId: "booking_modal" },
  { regex: /^\/api\/admin\b/, targetNodeId: "mission_control" },
  { regex: /^\/api\/ai\b/, targetNodeId: "ai_listing_engine" },
  { regex: /^\/api\/dashboard\b/, targetNodeId: "dashboard_owner" },
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
