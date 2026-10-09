import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from "@/data/masterFlowGraphData";

/**
 * Predefined incident scenarios grounded in ScoutIt operational failure modes.
 */
export const INCIDENT_SCENARIOS = {
  NOMINAL: {
    id: "NOMINAL",
    name: "All Systems Nominal",
    faultedNodeIds: [],
    severity: "LOW",
    badge: "100% HEALTHY",
    description: "All 131 nodes and 252 edges operate nominally. No active incidents or degraded pathways.",
    triagePlaybook: "System operational. Monitor Sentry & MMC telemetry for emerging spikes."
  },
  CMS_BRIDGE_OUTAGE: {
    id: "CMS_BRIDGE_OUTAGE",
    name: "Dual-CMS Bridge / Airtable 429 Outage",
    faultedNodeIds: ["api_publish_listing"],
    severity: "CRITICAL",
    badge: "CRITICAL OUTAGE",
    description: "Airtable monthly API budget exhaustion (U-042) or sync rate limit blocking live listing publication.",
    triagePlaybook: "Inspect src/app/api/dashboard/publish/route.js and src/lib/airtableBudget.js. Verify Redis last-good cache fallback."
  },
  AUTH_SESSION_QUARANTINE: {
    id: "AUTH_SESSION_QUARANTINE",
    name: "Sentinel Velocity Quarantine",
    faultedNodeIds: ["exc_bot_quarantine"],
    severity: "HIGH",
    badge: "HIGH DEGRADATION",
    description: "Sentinel velocity radar flagged anomalous traffic spikes; automated edge session quarantine triggered.",
    triagePlaybook: "Inspect src/middleware.js and Cloudflare Turnstile verification challenge (rec_turnstile_challenge)."
  },
  CONNECTS_DEPLETED: {
    id: "CONNECTS_DEPLETED",
    name: "Connects Wallet Exhaustion",
    faultedNodeIds: ["exc_insufficient_connects"],
    severity: "MEDIUM",
    badge: "FUNCTIONAL BLOCK",
    description: "Zero Connects balance encountered when initiating private deal room or inquiry modal.",
    triagePlaybook: "Direct user to top-up checkout (rec_topup_connects) or grant pre-launch promo connects."
  },
  VIEWING_SCHEDULE_CONFLICT: {
    id: "VIEWING_SCHEDULE_CONFLICT",
    name: "Viewing Schedule Slot Conflict",
    faultedNodeIds: ["exc_slot_conflict"],
    severity: "MEDIUM",
    badge: "FLOW CONFLICT",
    description: "Simultaneous booking collision detected on viewing schedule calendar slots.",
    triagePlaybook: "Present alternative open calendar slots (rec_propose_alt_slot) and check availabilityService.js."
  },
  AI_COUNCIL_DEADLOCK: {
    id: "AI_COUNCIL_DEADLOCK",
    name: "AI Listing Arbiter Loop Deadlock",
    faultedNodeIds: ["exc_ai_deadlock"],
    severity: "HIGH",
    badge: "LOOP ESCALATION",
    description: "Listing auto-enrichment exceeded retry loop cap without consensus among arbiter voices.",
    triagePlaybook: "Route listing draft to Mission Control staff approval queue (rec_manual_approval_queue)."
  },
  ENTERPRISE_SSO_MISMATCH: {
    id: "ENTERPRISE_SSO_MISMATCH",
    name: "Enterprise SAML 2.0 Domain Mismatch",
    faultedNodeIds: ["exc_sso_domain_mismatch"],
    severity: "HIGH",
    badge: "SSO BLOCKED",
    description: "Inbound corporate user domain not mapped in Enterprise Okta/Azure AD gateway.",
    triagePlaybook: "Guide user to corporate IdP re-authentication portal (rec_sso_idp_reauth) and verify enterprise tenant domain."
  },
  STALE_LISTING_EXHAUSTION: {
    id: "STALE_LISTING_EXHAUSTION",
    name: "90-Day Freshness Staleness Quarantine",
    faultedNodeIds: ["exc_stale_listing_quarantine"],
    severity: "LOW",
    badge: "SOFT QUARANTINE",
    description: "Listing inactivity exceeded 90-day staleness threshold; soft-quarantined from public directories.",
    triagePlaybook: "Prompt owner for one-click re-verification (rec_confirm_freshness_click)."
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Manual Node Fault Injection",
    faultedNodeIds: [],
    severity: "VARIABLE",
    badge: "SIMULATOR ACTIVE",
    description: "Operator-selected custom node fault injection to test blast radius and severed journeys.",
    triagePlaybook: "Targeted topological diagnostic based on injected node."
  }
};

/**
 * Calculates the topological blast radius down the directed acyclic graph.
 * Traverses node children recursively via BFS.
 *
 * @param {string[]|Set<string>} faultedNodeIds - IDs of the root faulted nodes
 * @param {Map<string, object>} [nodeMap] - Map of nodeId -> node definition
 * @returns {object} Blast radius telemetry and metrics
 */
export function calculateBlastRadius(faultedNodeIds, nodeMap) {
  const map = nodeMap || new Map(MASTER_FLOW_NODES.map(n => [n.id, n]));
  const rootFaults = Array.from(faultedNodeIds || []).filter(id => map.has(id));

  if (rootFaults.length === 0) {
    return {
      faultedNodeIds: [],
      impactedNodeIds: [],
      blastRadiusSet: new Set(),
      severedEdgeSet: new Set(),
      severedRoles: [],
      depthMap: {},
      severedTerminals: [],
      totalAffectedCount: 0
    };
  }

  const faultedSet = new Set(rootFaults);
  const impactedSet = new Set();
  const blastRadiusSet = new Set(rootFaults);
  const severedEdgeSet = new Set();
  const depthMap = {};
  const severedRolesSet = new Set();
  const severedTerminals = [];

  // Queue of [nodeId, currentDepth]
  const queue = [];
  rootFaults.forEach(id => {
    depthMap[id] = 0;
    queue.push([id, 0]);
    const node = map.get(id);
    if (node?.roles) {
      node.roles.forEach(r => severedRolesSet.add(r));
    }
    if (node?.nodeType === "TERMINAL" || node?.type === "TERMINAL") {
      severedTerminals.push(id);
    }
  });

  const visited = new Set(rootFaults);

  while (queue.length > 0) {
    const [currId, currDepth] = queue.shift();
    const currNode = map.get(currId);
    if (!currNode) continue;

    const children = currNode.children || [];
    for (const childId of children) {
      severedEdgeSet.add(`${currId}→${childId}`);

      if (!visited.has(childId)) {
        visited.add(childId);
        impactedSet.add(childId);
        blastRadiusSet.add(childId);
        depthMap[childId] = currDepth + 1;

        const childNode = map.get(childId);
        if (childNode?.roles) {
          childNode.roles.forEach(r => severedRolesSet.add(r));
        }
        if (childNode?.nodeType === "TERMINAL" || childNode?.type === "TERMINAL") {
          severedTerminals.push(childId);
        }

        queue.push([childId, currDepth + 1]);
      }
    }
  }

  return {
    faultedNodeIds: rootFaults,
    impactedNodeIds: Array.from(impactedSet),
    blastRadiusSet,
    severedEdgeSet,
    severedRoles: Array.from(severedRolesSet),
    depthMap,
    severedTerminals,
    totalAffectedCount: blastRadiusSet.size
  };
}

/**
 * Returns the health classification for a specific node given the current fault state.
 *
 * @param {string} nodeId
 * @param {Set<string>} faultedNodeSet
 * @param {Set<string>} blastRadiusSet
 * @returns {"FAULTED" | "BLAST_RADIUS" | "NOMINAL"}
 */
export function getNodeHealthStatus(nodeId, faultedNodeSet, blastRadiusSet) {
  if (faultedNodeSet && faultedNodeSet.has(nodeId)) {
    return "FAULTED";
  }
  if (blastRadiusSet && blastRadiusSet.has(nodeId)) {
    return "BLAST_RADIUS";
  }
  return "NOMINAL";
}

/**
 * Extracts a complete, actionable incident dossier for a given node.
 * Surfacing source evidence files, exceptions, recovery protocols, and downstream impact.
 *
 * @param {object} node - Master flow node object
 * @param {Map<string, object>} nodeMap - Map of nodeId -> node definition
 * @param {object} [blastRadiusInfo] - Calculated blast radius from calculateBlastRadius
 * @returns {object} Formatted incident dossier
 */
export function getIncidentDossier(node, nodeMap, blastRadiusInfo) {
  if (!node) return null;

  const map = nodeMap || new Map(MASTER_FLOW_NODES.map(n => [n.id, n]));
  const faultedSet = new Set(blastRadiusInfo?.faultedNodeIds || []);
  const blastSet = blastRadiusInfo?.blastRadiusSet || new Set();

  const healthStatus = getNodeHealthStatus(node.id, faultedSet, blastSet);

  // Extract direct child recovery nodes
  const recoveryChildren = (node.children || [])
    .map(cid => map.get(cid))
    .filter(cn => cn && (cn.type === "RECOVERY" || cn.nodeType === "RECOVERY"));

  // Triage file locations from evidence and systems
  const triageFiles = [];
  if (node.evidence && Array.isArray(node.evidence)) {
    node.evidence.forEach(ev => {
      if (ev.path && !triageFiles.includes(ev.path)) {
        triageFiles.push(ev.path);
      }
    });
  }
  if (node.systems && Array.isArray(node.systems)) {
    node.systems.forEach(sys => {
      if (!triageFiles.includes(sys)) {
        triageFiles.push(sys);
      }
    });
  }

  // Calculate local downstream impact from this specific node
  const localBlast = calculateBlastRadius([node.id], map);

  return {
    nodeId: node.id,
    canonicalId: node.canonicalId || node.id,
    name: node.name,
    route: node.route || "N/A",
    domain: node.domain || "core",
    type: node.nodeType || node.type,
    implementationStatus: node.implementationStatus,
    healthStatus,
    depthInIncident: blastRadiusInfo?.depthMap?.[node.id] ?? 0,
    exceptions: node.exceptions || [],
    recoveryProtocols: node.recovery || [],
    connectedRecoveryNodes: recoveryChildren.map(r => ({
      id: r.id,
      name: r.name,
      canonicalId: r.canonicalId || r.id,
      route: r.route
    })),
    triageFiles,
    directChildrenCount: node.children?.length || 0,
    downstreamImpactCount: localBlast.impactedNodeIds.length,
    impactedRoles: node.roles || [],
    database: node.database || "None",
    auth: node.auth || "Public",
    telemetry: node.telemetry || null
  };
}
