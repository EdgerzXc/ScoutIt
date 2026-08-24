import { MASTER_FLOW_NODES } from "@/data/masterFlowGraphData";
import { LINEAR_GUIDE_DEFINITIONS } from "@/lib/flow/subgraphExtractor";

const SHIPPED_STEPS = Object.freeze({
  seeker: [
    { nodeId: "hero", route: "/", target: "scoutit-home-launchpad" },
    { nodeId: "discover_directory", route: "/discover", target: "scoutit-discover-search" },
    { nodeId: "pep", route: "/property", target: "scoutit-property-directory" },
    { nodeId: "deal_room", route: "/dashboard/inbox", target: "deal-room-negotiation-panel" },
  ],
  owner: [
    { nodeId: "dashboard_owner", route: "/dashboard", target: "owner-portfolio-table" },
    { nodeId: "owner_creation_pipeline", route: "/dashboard", target: "owner-claim-submit-btn" },
    { nodeId: "deal_room", route: "/dashboard/inbox", target: "deal-room-negotiation-panel" },
  ],
  broker: [
    { nodeId: "dashboard_broker", route: "/dashboard", target: "broker-lead-roster-view" },
    { nodeId: "brokers_roster", route: "/brokers", target: "broker-prc-license-form" },
    { nodeId: "deal_room", route: "/dashboard/inbox", target: "deal-room-negotiation-panel" },
  ],
});
const GUIDE_BY_ROLE = Object.freeze({ seeker: "buyer_guide", owner: "owner_guide", broker: "broker_guide" });
const nodeById = new Map(MASTER_FLOW_NODES.map((node) => [node.id, node]));

export function normalizeJourneyRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (value === "buyer" || value === "seeker") return "seeker";
  if (value === "owner" || value === "broker") return value;
  return null;
}

function buildJourney(role) {
  const definition = LINEAR_GUIDE_DEFINITIONS[GUIDE_BY_ROLE[role]];
  const authoredByNode = new Map(definition.steps.map((step) => [step.nodeId, step]));
  const steps = SHIPPED_STEPS[role].flatMap((surface) => {
    const graphNode = nodeById.get(surface.nodeId);
    const authored = authoredByNode.get(surface.nodeId);
    if (!graphNode || graphNode.implementationStatus !== "VERIFIED" || !authored) return [];
    if (!surface.route.startsWith("/") || surface.route.startsWith("/api/") || surface.route.includes("[")) return [];
    return [{ ...surface, title: authored.title, body: authored.action, tip: authored.tip, graphName: graphNode.name }];
  });
  return Object.freeze({
    id: definition.id,
    role,
    title: definition.title,
    description: definition.description,
    steps: Object.freeze(steps),
  });
}

export const PUBLIC_JOURNEYS = Object.freeze({
  seeker: buildJourney("seeker"), owner: buildJourney("owner"), broker: buildJourney("broker"),
});

export function guideForVerifiedRole(role) {
  const normalized = normalizeJourneyRole(role);
  return normalized ? PUBLIC_JOURNEYS[normalized] : null;
}
