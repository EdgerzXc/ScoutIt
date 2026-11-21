/**
 * Calculates the topological blast radius down the directed acyclic graph.
 * Traverses node children recursively via BFS.
 *
 * @param {string[]|Set<string>} faultedNodeIds - IDs of the root faulted nodes
 * @param {Map<string, object>} [nodeMap] - Map of nodeId -> node definition
 * @returns {object} Blast radius telemetry and metrics
 */
export function calculateBlastRadius(faultedNodeIds, nodeMap) {
  const map = nodeMap;
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

  const map = nodeMap;
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
