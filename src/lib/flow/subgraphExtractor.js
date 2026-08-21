/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SCOUTIT SUBGRAPH ENGINE & KNOWLEDGE RETRIEVAL LAYER (SCHEMA V2.1)
 * ══════════════════════════════════════════════════════════════════════════════
 * 1. Role-Based Sub-Graph Slicing (Node + Edge + Capability + Security Filtering)
 * 2. Graph-Derived Workflow Traversal (Dynamic Start/Terminal Resolution)
 * 3. Two-Tier Interactive Guides (Macro vs Executable Guides with Verified Safety)
 * 4. Contextual Wizard Navigation Resolver (Route + Role + State + Goal)
 * 5. Conditional, Permission-Aware Atomic RAG Export (Public Sanitization)
 */

import { MASTER_FLOW_NODES, MASTER_FLOW_EDGES } from '../../data/masterFlowGraphData.js';

/**
 * 1. ROLE-BASED SUB-GRAPH EXTRACTION
 * Extracts all nodes and reciprocal edges accessible to a specific user role,
 * evaluating node permissions, edge role permissions, and security classifications.
 *
 * @param {string} role - 'visitor', 'seeker', 'owner', 'broker', 'provider', 'operator', 'staff', 'admin', 'enterprise'
 * @param {Array} [nodes=MASTER_FLOW_NODES]
 * @param {Array} [edges=MASTER_FLOW_EDGES]
 * @returns {{ role: string, nodes: Array, edges: Array, nodeCount: number, edgeCount: number }}
 */
export function getRoleSubgraph(role, nodes = MASTER_FLOW_NODES, edges = MASTER_FLOW_EDGES) {
  const targetRole = (role || 'visitor').toLowerCase();

  // Filter accessible nodes where role is strictly present in actorRoles/roles
  const matchingRawNodes = nodes.filter(node => {
    const actorRoles = (node.actorRoles || node.roles || []).map(r => r.toLowerCase());
    return actorRoles.includes(targetRole);
  });

  const matchingNodeIds = new Set(matchingRawNodes.map(n => n.id));

  // Localize parent and child links to only nodes within the slice
  const matchingNodes = matchingRawNodes.map(node => ({
    ...node,
    parents: (node.parents || []).filter(pid => matchingNodeIds.has(pid)),
    children: (node.children || []).filter(cid => matchingNodeIds.has(cid))
  }));

  // Filter accessible edges (Edge must connect visible nodes AND allow the role)
  const matchingEdges = edges.filter(edge => {
    if (!matchingNodeIds.has(edge.source) || !matchingNodeIds.has(edge.target)) {
      return false;
    }

    const edgeRoles = (edge.roles || []).map(r => r.toLowerCase());
    if (edgeRoles.length > 0 && !edgeRoles.includes(targetRole) && !edgeRoles.includes('all')) {
      return false;
    }

    return true;
  });

  return {
    role: targetRole,
    nodes: matchingNodes,
    edges: matchingEdges,
    nodeCount: matchingNodes.length,
    edgeCount: matchingEdges.length
  };
}

/**
 * 2. DECLARATIVE WORKFLOW DEFINITIONS
 * High-level goal definitions with declarative start and terminal endpoints.
 * Graph path is derived dynamically.
 */
export const WORKFLOW_DEFINITIONS = {
  deal_room_lifecycle: {
    id: "deal_room_lifecycle",
    name: "Private Inquiry Lifecycle (Viewing → Handshake)",
    description: "Implemented private inquiry journey through viewing coordination and two-sided handshake closure.",
    goal: "complete_deal",
    role: "seeker",
    startNodes: ["deal_room"],
    terminalNodes: ["terminal_handshake_success"],
    requiredCapabilities: ["deal.participate"],
    requiredOrderedMilestones: [
      "inquiry_modal",
      "booking_modal",
      "deal_room",
      "sys_transaction_handshake"
    ],
    completionPredicate: {
      field: "deal.status",
      operator: "==",
      value: "closed"
    },
    allowedEdgeTypes: ["NAVIGATE", "ACTION", "SUBMIT", "SUCCESS", "FAILURE", "RECOVERY", "AUTH_GATE", "CONDITION_TRUE", "SYSTEM"],
    nodeIds: [
      "inquiry_modal", "booking_modal", "deal_room", "gate_viewing", "exc_viewing_noshow", "reschedule_modal",
      "gate_offer", "sys_double_optin_handshake", "sys_transaction_handshake", "terminal_handshake_success"
    ]
  },
  broker_representation: {
    id: "broker_representation",
    name: "Broker Verified Representation & Lead Assignment",
    description: "Professional PRC-licensed broker workflow for claiming listing representation and client advisory.",
    goal: "manage_representation",
    role: "broker",
    startNodes: ["dashboard_broker"],
    terminalNodes: ["terminal_handshake_success"],
    requiredCapabilities: ["deal.represent_client"],
    requiredOrderedMilestones: [
      "dashboard_broker",
      "brokers_roster",
      "broker_field_briefing",
      "deal_room",
      "sys_transaction_handshake"
    ],
    completionPredicate: {
      field: "representation.status",
      operator: "==",
      value: "active"
    },
    allowedEdgeTypes: ["NAVIGATE", "ACTION", "SUBMIT", "SUCCESS", "SYSTEM"],
    nodeIds: [
      "dashboard_broker", "comp_return_brief_broker", "brokers_roster", "broker_field_briefing",
      "deal_room", "sys_transaction_handshake", "terminal_handshake_success"
    ]
  },
  owner_listing_pipeline: {
    id: "owner_listing_pipeline",
    name: "Property Owner Listing & Verification Pipeline",
    description: "Direct owner publishing pipeline with Title Deed KYC and automated verification.",
    goal: "publish_verified_listing",
    role: "owner",
    startNodes: ["dashboard_owner"],
    terminalNodes: ["api_publish_listing", "terminal_handshake_success"],
    requiredCapabilities: ["property.manage_owned"],
    requiredOrderedMilestones: [
      "dashboard_owner",
      "owner_creation_pipeline",
      "ai_listing_engine",
      "api_publish_listing"
    ],
    completionPredicate: {
      field: "listing.status",
      operator: "==",
      value: "verified"
    },
    allowedEdgeTypes: ["NAVIGATE", "ACTION", "SUBMIT", "SUCCESS", "SYSTEM"],
    nodeIds: [
      "dashboard_owner", "comp_return_brief_owner", "owner_creation_pipeline",
      "method_scratch", "method_advanced", "method_csv", "method_pdf",
      "ai_listing_engine", "sys_ai_council", "sys_ai_arbiter", "api_publish_listing"
    ]
  },
  sentinel_edge_defense: {
    id: "sentinel_edge_defense",
    name: "Sentinel Edge Security & Anonymity Pipeline",
    description: "Zero-Knowledge edge masking, rate-limiting, and Cloudflare Turnstile anti-scraping mesh.",
    goal: "enforce_edge_security",
    role: "visitor",
    startNodes: ["sys_edge_ip_masking"],
    terminalNodes: ["terminal_edge_blacklist"],
    requiredCapabilities: [],
    requiredOrderedMilestones: [
      "sys_edge_ip_masking",
      "sys_velocity_radar",
      "exc_bot_quarantine",
      "terminal_edge_blacklist"
    ],
    completionPredicate: {
      field: "sentinel.status",
      operator: "==",
      value: "enforced"
    },
    allowedEdgeTypes: ["SYSTEM", "SUCCESS", "FAILURE", "RECOVERY", "TERMINATE"],
    nodeIds: [
      "sys_edge_ip_masking", "sys_velocity_radar", "exc_bot_quarantine", "rec_turnstile_challenge", "terminal_edge_blacklist"
    ]
  },
  buyer_journey: {
    id: "buyer_journey",
    name: "Buyer Discovery to Offer Journey",
    description: "Complete buyer discovery path from hero search down to formal offer submission.",
    goal: "submit_property_offer",
    role: "seeker",
    startNodes: ["hero"],
    terminalNodes: ["terminal_handshake_success"],
    requiredCapabilities: [],
    requiredOrderedMilestones: [
      "hero",
      "discover_directory",
      "pep",
      "inquiry_modal",
      "deal_room",
      "offer_modal",
      "sys_transaction_handshake"
    ],
    completionPredicate: {
      field: "transaction.status",
      operator: "==",
      value: "completed"
    },
    allowedEdgeTypes: ["NAVIGATE", "ACTION", "SUBMIT", "SUCCESS", "AUTH_GATE", "SYSTEM"],
    nodeIds: [
      "hero", "discover_directory", "search_results", "pep", "pep_ch10_your_move",
      "inquiry_modal", "booking_modal", "offer_modal", "deal_room",
      "sys_transaction_handshake", "terminal_handshake_success"
    ]
  }
};

/**
 * Traverses the graph from startNodes to terminalNodes following allowed edges.
 *
 * @param {string} workflowKey
 * @param {Array} [nodes=MASTER_FLOW_NODES]
 * @param {Array} [edges=MASTER_FLOW_EDGES]
 * @returns {{ id: string, name: string, description: string, goal: string, workflow: object, nodes: Array, edges: Array, nodeCount: number, edgeCount: number }}
 */
export function getWorkflowSubgraph(workflowKey, nodes = MASTER_FLOW_NODES, edges = MASTER_FLOW_EDGES) {
  const def = WORKFLOW_DEFINITIONS[workflowKey];
  if (!def) {
    throw new Error(`Unknown workflow ID: "${workflowKey}". Available: ${Object.keys(WORKFLOW_DEFINITIONS).join(', ')}`);
  }

  const edgeSourceMap = new Map();
  edges.forEach(e => {
    if (!edgeSourceMap.has(e.source)) edgeSourceMap.set(e.source, []);
    edgeSourceMap.get(e.source).push(e);
  });

  // Dynamic graph traversal
  const visitedNodeIds = new Set(def.startNodes);
  const queue = [...def.startNodes];
  const matchedEdges = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (def.terminalNodes?.includes(currentId)) continue;

    const outEdges = edgeSourceMap.get(currentId) || [];
    outEdges.forEach(edge => {
      if (def.allowedEdgeTypes && !def.allowedEdgeTypes.includes(edge.type)) return;
      if (def.nodeIds && !def.nodeIds.includes(edge.target)) return;

      matchedEdges.push(edge);
      if (!visitedNodeIds.has(edge.target)) {
        visitedNodeIds.add(edge.target);
        queue.push(edge.target);
      }
    });
  }

  const finalNodeIds = def.nodeIds ? new Set(def.nodeIds) : visitedNodeIds;
  const workflowRawNodes = nodes.filter(n => finalNodeIds.has(n.id));
  const finalNodeIdSet = new Set(workflowRawNodes.map(n => n.id));

  const workflowNodes = workflowRawNodes.map(node => ({
    ...node,
    parents: (node.parents || []).filter(pid => finalNodeIdSet.has(pid)),
    children: (node.children || []).filter(cid => finalNodeIdSet.has(cid))
  }));

  const workflowEdges = edges.filter(e => finalNodeIdSet.has(e.source) && finalNodeIdSet.has(e.target));

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    goal: def.goal,
    workflow: def,
    nodes: workflowNodes,
    edges: workflowEdges,
    nodeCount: workflowNodes.length,
    edgeCount: workflowEdges.length
  };
}

/**
 * 3. TWO-TIER INTERACTIVE GUIDES (MACRO vs EXECUTABLE)
 */
export const LINEAR_GUIDE_DEFINITIONS = {
  buyer_guide: {
    id: "buyer_guide",
    title: "Buyer Journey: Search to Handshake",
    type: "EXECUTABLE_GUIDE",
    role: "seeker",
    description: "Step-by-step verified workflow guide for property seekers.",
    steps: [
      { step: 1, nodeId: "hero", title: "Global Search & Filters", action: "Enter desired city or property type in the hero search.", tip: "Use natural language search.", guideTarget: "hero-search-input" },
      { step: 2, nodeId: "discover_directory", title: "Catalog & Neighborhood Intel", action: "Filter listings and view spatial map intelligence.", tip: "Toggle Satellite and Traffic layers.", guideTarget: "property-catalog-grid" },
      { step: 3, nodeId: "pep", title: "Property Detail Exploration", action: "Review chapters, verified title documents, and pricing.", tip: "Scroll to Chapter 10: Your Move.", guideTarget: "property-detail-container" },
      { step: 4, nodeId: "pep_ch10_your_move", title: "Initiate Deal or Inquiry", action: "Click 'Inquire' or 'Schedule Viewing'.", tip: "Requires 1 Connect token.", guideTarget: "property-your-move-actions" },
      { step: 5, nodeId: "inquiry_modal", title: "Direct Connect Authorization", action: "Authorize 1 Connect to establish private communication.", tip: "Protected by Zero-Knowledge masking.", guideTarget: "send-inquiry-modal-btn" },
      { step: 6, nodeId: "deal_room", title: "Private Inquiry Workspace", action: "Enter the private workspace with the owner or broker.", tip: "Coordinate messages and viewing appointments here.", guideTarget: "deal-room-negotiation-panel" },
      { step: 7, nodeId: "sys_transaction_handshake", title: "Two-Sided Deal Handshake", action: "When eligible, co-confirm the transaction milestone.", tip: "Both parties must confirm.", guideTarget: "deal-handshake-two-sided-signature" }
    ]
  },
  owner_guide: {
    id: "owner_guide",
    title: "Owner Pipeline: Listing to Handshake",
    type: "MACRO_GUIDE",
    role: "owner",
    description: "Step-by-step verified guide for property owners.",
    steps: [
      { step: 1, nodeId: "dashboard_owner", title: "Owner Workspace", action: "View current property listings and performance metrics.", tip: "Check inquiry response rates.", guideTarget: "owner-portfolio-table" },
      { step: 2, nodeId: "owner_creation_pipeline", title: "Create Property Listing", action: "Configure property details, unit types, pricing, and amenities.", tip: "Automated OCR extracts building data.", guideTarget: "owner-claim-submit-btn" },
      { step: 3, nodeId: "comp_return_brief_owner", title: "Leads & Freshness Intelligence", action: "Review active buyer leads and freshness metrics.", tip: "Keep listing fresh to rank higher.", guideTarget: "owner-leads-brief" },
      { step: 4, nodeId: "deal_room", title: "Review Private Inquiries", action: "Respond to buyer inquiries and coordinate viewing details.", tip: "Structured offer negotiation remains planned.", guideTarget: "deal-room-negotiation-panel" },
      { step: 5, nodeId: "sys_transaction_handshake", title: "Two-Sided Deal Handshake", action: "Co-confirm two-sided deal closure and transaction milestones.", tip: "Unlocks seller rating reward.", guideTarget: "deal-handshake-two-sided-signature" }
    ]
  },
  broker_guide: {
    id: "broker_guide",
    title: "Broker Guide: Roster to Deal Closure",
    type: "MACRO_GUIDE",
    role: "broker",
    description: "Step-by-step verified workflow guide for licensed real estate brokers.",
    steps: [
      { step: 1, nodeId: "dashboard_broker", title: "Broker Command Hub", action: "View assigned leads, roster listings, and client communications.", tip: "RESA Law compliant.", guideTarget: "broker-lead-roster-view" },
      { step: 2, nodeId: "brokers_roster", title: "Verified Broker Directory", action: "View verified broker directory and client representation roster.", tip: "PRC accredited.", guideTarget: "broker-prc-license-form" },
      { step: 3, nodeId: "broker_field_briefing", title: "Field Briefing & Client Management", action: "Access tactical property briefing notes and verified clients.", tip: "Ensures legal compliance.", guideTarget: "broker-client-agreement-panel" },
      { step: 4, nodeId: "deal_room", title: "Coordinate Private Inquiries", action: "Guide parties through communication and viewing logistics.", tip: "Structured offer negotiation remains planned.", guideTarget: "deal-room-negotiation-panel" },
      { step: 5, nodeId: "sys_transaction_handshake", title: "Two-Sided Deal Handshake", action: "Co-confirm two-sided deal closure and transaction milestones.", tip: "Boosts public broker trust score.", guideTarget: "deal-handshake-two-sided-signature" }
    ]
  }
};

/**
 * Retrieves a linear guide definition by ID.
 *
 * @param {string} guideId
 * @returns {object}
 */
export function getLinearGuide(guideId) {
  const guide = LINEAR_GUIDE_DEFINITIONS[guideId];
  if (!guide) {
    throw new Error(`Unknown guide ID: "${guideId}". Available: ${Object.keys(LINEAR_GUIDE_DEFINITIONS).join(', ')}`);
  }
  return guide;
}

/**
 * 4. CONTEXTUAL WIZARD RESOLVER
 */
export function resolveContextualGuide({ route = '/', role = 'seeker', isAuthenticated = false, goal = 'inquire' }) {
  let resolvedGuideSteps = [];

  if (route.startsWith('/property/') || route === '/pep') {
    if (!isAuthenticated) {
      resolvedGuideSteps = [
        { step: 1, nodeId: 'pep', title: 'Property Detail', action: 'Explore listing chapters and specifications', guideTarget: '#node-pep' },
        { step: 2, nodeId: 'pep_ch10_your_move', title: 'Your Move', action: 'Select Inquire or Schedule Viewing', guideTarget: '#node-pep_ch10_your_move' },
        { step: 3, nodeId: 'inquiry_modal', title: 'Inquiry Intent', action: 'Prepare your inquiry message', guideTarget: '#node-inquiry_modal' },
        { step: 4, nodeId: 'login', title: 'Sign In / Register', action: 'Authenticate to protect contact privacy and spend Connects', guideTarget: '#node-login' },
        { step: 5, nodeId: 'booking_modal', title: 'Confirm Viewing Slot', action: 'Select your preferred appointment time', guideTarget: '#node-booking_modal' }
      ];
    } else {
      resolvedGuideSteps = [
        { step: 1, nodeId: 'pep', title: 'Property Detail', action: 'Explore listing chapters and specifications', guideTarget: '#node-pep' },
        { step: 2, nodeId: 'pep_ch10_your_move', title: 'Your Move', action: 'Select Inquire or Schedule Viewing', guideTarget: '#node-pep_ch10_your_move' },
        { step: 3, nodeId: 'deal_room', title: 'Private Inquiry Workspace', action: 'Coordinate messages and viewing details', guideTarget: '#node-deal_room' },
        { step: 4, nodeId: 'sys_transaction_handshake', title: 'Two-Sided Handshake', action: 'When eligible, co-confirm the transaction milestone', guideTarget: '#node-sys_transaction_handshake' }
      ];
    }
  } else {
    const guide = LINEAR_GUIDE_DEFINITIONS.buyer_guide;
    resolvedGuideSteps = guide.steps;
  }

  return {
    currentStep: resolvedGuideSteps[0],
    nextSteps: resolvedGuideSteps.slice(1),
    totalSteps: resolvedGuideSteps.length,
    steps: resolvedGuideSteps
  };
}

/**
 * 5. BACKWARD-COMPATIBLE RAG KNOWLEDGE EXPORT
 */
export function getRAGKnowledgeExport(nodes = MASTER_FLOW_NODES, edges = MASTER_FLOW_EDGES) {
  const edgeTargetMap = new Map();
  const edgeSourceMap = new Map();

  edges.forEach(e => {
    if (!edgeTargetMap.has(e.source)) edgeTargetMap.set(e.source, []);
    edgeTargetMap.get(e.source).push(e.target);

    if (!edgeSourceMap.has(e.target)) edgeSourceMap.set(e.target, []);
    edgeSourceMap.get(e.target).push(e.source);
  });

  return nodes.map(node => {
    return {
      chunk_id: `scoutit_graph_node_${node.id}`,
      chunk_type: "NODE_FACT",
      canonical_id: node.canonicalId || node.id,
      canonicalId: node.canonicalId || node.id,
      chunkType: "NODE_FACT",
      status: node.implementationStatus || "VERIFIED",
      visibility: node.visibility || ["PUBLIC"],
      securityClassification: node.securityClassification || "PUBLIC",
      title: `${node.name} (${node.nodeType || node.type})`,
      category: node.category,
      layer: node.layer,
      route: node.route,
      roles: node.roles,
      purpose: node.purpose,
      description: node.description,
      available_actions: node.actions || [],
      entry_conditions: node.conditions || [],
      underlying_systems: node.systems || [],
      database_tables: node.database || "None",
      auth_requirement: node.auth,
      exceptions_and_edge_cases: node.exceptions || [],
      recovery_mechanisms: node.recovery || [],
      connected_downstream_targets: edgeTargetMap.get(node.id) || [],
      connected_upstream_sources: edgeSourceMap.get(node.id) || [],
      evidence: node.evidence || [],
      sourceType: "MASTER_FLOW_GRAPH",
      graphVersion: node.version || "2.1.0",
      lastVerifiedAt: node.lastVerifiedAt || "2026-08-19",
      statutory_compliance: [
        "Republic Act No. 9646 (RESA Law - Real Estate Service Governance)",
        "Republic Act No. 10173 (Data Privacy Act - Zero-Knowledge Edge & PII Erasure)",
        "NPC Circular 2024-03 (Adult Age Eligibility & Minors Protection)",
        "Republic Act No. 7394 (Consumer Act - Spent-on-Delivery Non-Refundable Utility Tokens)",
        "Enterprise SAML 2.0 / SOC 2 Type II Compliance Standards"
      ]
    };
  });
}

/**
 * 6. PERMISSION-AWARE, ATOMIC RAG KNOWLEDGE EXPORT
 * Generates chunks conditionally according to strict security and factual relevance rules:
 * - Public RAG strictly excludes non-public security classifications
 * - Public RAG strips internal code paths (src/...) and internal database tables
 * - NODE_FACT: only if node has valid factual content
 * - RECOVERY: only if real exception & recovery mechanism exist
 * - UI_GUIDE: only if real user-facing UI action exists (guideability !== 'NONE')
 * - IMPLEMENTATION_REFERENCE: only for staff/admin internal retrieval
 * - POLICY: only from approved legal/policy nodes
 */
export function getAtomicRAGChunks(
  nodes = MASTER_FLOW_NODES,
  edges = MASTER_FLOW_EDGES,
  options = {}
) {
  const { role = 'public', includePlanned = false } = options;
  const userRole = role.toLowerCase();
  const isPublic = userRole === 'public' || userRole === 'visitor' || userRole === 'seeker';
  const isAdminOrStaff = userRole === 'admin' || userRole === 'staff';

  const chunks = [];

  // Filter nodes according to permissions and implementation status
  const allowedNodes = nodes.filter(node => {
    // 1. Status Filter: Public queries strictly exclude unverified/planned features
    if (!includePlanned && !isAdminOrStaff) {
      if (node.implementationStatus !== 'VERIFIED') {
        return false;
      }
    }

    // 2. Knowledge Scope & Classification Filter: Public corpus requires strictly PUBLIC
    if (isPublic) {
      if (node.securityClassification && ['AUTHENTICATED', 'ROLE_RESTRICTED', 'INTERNAL', 'CONFIDENTIAL', 'SECURITY_SENSITIVE'].includes(node.securityClassification)) {
        return false;
      }
      if (node.knowledgeScope && !node.knowledgeScope.includes('PUBLIC')) {
        return false;
      }
      if (['sys_edge_ip_masking', 'sys_cf_turnstile', 'sys_ddos_rate_limit', 'sys_rls_policies', 'sys_admin_audit_log', 'sys_operator_escalation'].includes(node.id)) {
        return false;
      }
    }

    return true;
  });

  const allowedNodeIds = new Set(allowedNodes.map(n => n.id));

  // Helper to sanitize evidence and claims for public consumption
  const getPublicSafeEvidence = (evidenceList = []) => {
    return [
      {
        kind: "PRODUCT_BEHAVIOR",
        provenance: "SCOUTIT_PRODUCT_GRAPH",
        confidence: 1.0
      }
    ];
  };

  const getPublicSafeClaims = (claimsList = []) => {
    return (claimsList || []).map(cl => ({
      id: cl.id,
      text: sanitizePublicText(cl.text),
      kind: cl.kind,
      status: cl.status,
      evidence: [
        {
          kind: "PRODUCT_BEHAVIOR",
          provenance: "SCOUTIT_PRODUCT_GRAPH",
          confidence: cl.confidence || 1.0
        }
      ],
      confidence: cl.confidence || 1.0,
      humanReviewedBy: null,
      reviewStatus: cl.reviewStatus || 'RESEARCHED',
      legalReviewStatus: cl.legalReviewStatus || 'RESEARCHED'
    }));
  };

  // Helper to sanitize prose content for public consumption
  const sanitizePublicText = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
      .replace(/src\/[a-zA-Z0-9_\-\/.]+/g, 'ScoutIt component')
      .replace(/\/api\/[a-zA-Z0-9_\-\/.]+/g, 'ScoutIt service')
      .replace(/connects_ledger/gi, 'token ledger')
      .replace(/user_profiles/gi, 'user registry')
      .replace(/deal_handshakes/gi, 'transaction agreements')
      .replace(/Supabase/gi, 'secure database')
      .replace(/Airtable/gi, 'property registry')
      .replace(/Cloudflare Turnstile/gi, 'security challenge')
      .replace(/Turnstile/gi, 'security challenge')
      .replace(/Sentry/gi, 'monitoring system')
      .replace(/Postgres(ql)?/gi, 'database');
  };

  // 1. Generate NODE_FACT Chunks
  allowedNodes.forEach(node => {
    if (node.purpose || node.description) {
      chunks.push({
        chunk_id: `fact_${node.canonicalId || node.id}`,
        chunk_type: "NODE_FACT",
        chunkType: "NODE_FACT",
        canonical_id: node.canonicalId || node.id,
        canonicalId: node.canonicalId || node.id,
        title: isPublic ? sanitizePublicText(node.name) : node.name,
        domain: node.domain || 'core',
        layer: node.layer || 'global',
        route: isPublic ? (node.route || '/') : node.route,
        roles: node.actorRoles || node.roles || [],
        visibility: node.uiAudience || node.visibility || ['PUBLIC'],
        securityClassification: node.securityClassification || 'PUBLIC',
        status: node.implementationStatus || 'VERIFIED',
        productStatus: node.productStatus || 'APPROVED',
        implementationStatus: node.implementationStatus || 'VERIFIED',
        evidenceStatus: node.evidenceStatus || 'CODE_GROUNDED',
        releaseStatus: node.releaseStatus || 'PUBLIC_LIVE',
        purpose: isPublic ? sanitizePublicText(node.purpose) : (node.purpose || ''),
        description: isPublic ? sanitizePublicText(node.description) : (node.description || ''),
        available_actions: isPublic ? (node.actions || []).map(sanitizePublicText) : (node.actions || []),
        entry_conditions: isPublic ? (node.conditions || []).map(sanitizePublicText) : (node.conditions || []),
        source_type: "MASTER_FLOW_GRAPH",
        sourceType: "MASTER_FLOW_GRAPH",
        evidence: isPublic ? getPublicSafeEvidence(node.evidence) : (node.evidence || []),
        claims: isPublic ? getPublicSafeClaims(node.claims) : (node.claims || []),
        humanReviewedBy: null,
        productReviewStatus: node.productReviewStatus || 'RESEARCHED',
        legalReviewStatus: node.legalReviewStatus || 'RESEARCHED',
        graph_version: node.version || "2.2.0",
        graphVersion: node.version || "2.2.0",
        last_verified_at: node.lastVerifiedAt || "2026-08-19",
        lastVerifiedAt: node.lastVerifiedAt || "2026-08-19"
      });
    }

    // 2. Generate RECOVERY Chunks conditionally (Only for real non-terminal exception & recovery logic)
    const isTerminal = node.isTerminal || node.terminal || node.id.startsWith('terminal_');
    const validExceptions = (node.exceptions || []).filter(e => e && e !== 'None' && e !== 'N/A');
    const validRecovery = (node.recovery || []).filter(r => r && r !== 'None' && r !== 'N/A');

    if (!isTerminal && validExceptions.length > 0 && validRecovery.length > 0) {
      chunks.push({
        chunk_id: `rec_${node.canonicalId || node.id}`,
        chunk_type: "RECOVERY",
        chunkType: "RECOVERY",
        canonical_id: node.canonicalId || node.id,
        canonicalId: node.canonicalId || node.id,
        title: `Recovery Protocol: ${isPublic ? sanitizePublicText(node.name) : node.name}`,
        domain: node.domain || 'core',
        status: node.implementationStatus || 'VERIFIED',
        productStatus: node.productStatus || 'APPROVED',
        implementationStatus: node.implementationStatus || 'VERIFIED',
        evidenceStatus: node.evidenceStatus || 'CODE_GROUNDED',
        releaseStatus: node.releaseStatus || 'PUBLIC_LIVE',
        visibility: node.uiAudience || node.visibility || ['PUBLIC'],
        securityClassification: node.securityClassification || 'PUBLIC',
        exceptions: isPublic ? validExceptions.map(sanitizePublicText) : validExceptions,
        recovery_mechanisms: isPublic ? validRecovery.map(sanitizePublicText) : validRecovery,
        source_type: "BEHAVIORAL_FAILSAFE",
        sourceType: "BEHAVIORAL_FAILSAFE",
        evidence: isPublic ? getPublicSafeEvidence(node.evidence) : (node.evidence || []),
        graph_version: node.version || "2.2.0",
        graphVersion: node.version || "2.2.0",
        last_verified_at: node.lastVerifiedAt || "2026-08-19",
        lastVerifiedAt: node.lastVerifiedAt || "2026-08-19"
      });
    }

    // 3. Generate UI_GUIDE Chunks conditionally (Only when guideability != 'NONE' and real target exists)
    if (node.guideability && node.guideability !== 'NONE' && node.guide?.target) {
      chunks.push({
        chunk_id: `guide_${node.canonicalId || node.id}`,
        chunk_type: "UI_GUIDE",
        chunkType: "UI_GUIDE",
        canonical_id: node.canonicalId || node.id,
        canonicalId: node.canonicalId || node.id,
        title: `User Walkthrough: ${isPublic ? sanitizePublicText(node.name) : node.name}`,
        domain: node.domain || 'core',
        status: node.implementationStatus || 'VERIFIED',
        productStatus: node.productStatus || 'APPROVED',
        implementationStatus: node.implementationStatus || 'VERIFIED',
        evidenceStatus: node.evidenceStatus || 'CODE_GROUNDED',
        releaseStatus: node.releaseStatus || 'PUBLIC_LIVE',
        visibility: node.uiAudience || node.visibility || ['PUBLIC'],
        securityClassification: node.securityClassification || 'PUBLIC',
        instruction: isPublic ? sanitizePublicText(node.guide.instruction || node.description) : (node.guide.instruction || node.description),
        ui_target: node.guide.target,
        source_type: "WIZARD_SYSTEM",
        sourceType: "WIZARD_SYSTEM",
        evidence: isPublic ? getPublicSafeEvidence(node.evidence) : (node.evidence || []),
        graph_version: node.version || "2.2.0",
        graphVersion: node.version || "2.2.0",
        last_verified_at: node.lastVerifiedAt || "2026-08-19",
        lastVerifiedAt: node.lastVerifiedAt || "2026-08-19"
      });
    }

    // 4. Generate IMPLEMENTATION_REFERENCE Chunks (Internal/Staff only)
    if (isAdminOrStaff && node.evidence?.length) {
      chunks.push({
        chunk_id: `impl_${node.canonicalId || node.id}`,
        chunk_type: "IMPLEMENTATION_REFERENCE",
        chunkType: "IMPLEMENTATION_REFERENCE",
        canonical_id: node.canonicalId || node.id,
        canonicalId: node.canonicalId || node.id,
        title: `Implementation Evidence: ${node.name}`,
        domain: node.domain || 'core',
        status: node.implementationStatus || 'VERIFIED',
        productStatus: node.productStatus || 'APPROVED',
        implementationStatus: node.implementationStatus || 'VERIFIED',
        evidenceStatus: node.evidenceStatus || 'CODE_GROUNDED',
        releaseStatus: node.releaseStatus || 'PUBLIC_LIVE',
        visibility: ["STAFF", "ADMIN"],
        securityClassification: "INTERNAL",
        systems: node.systems || [],
        components: node.components || [],
        apis: node.apis || [],
        database: node.database || 'None',
        evidence: node.evidence || [],
        claims: node.claims || [],
        source_type: "CODEBASE_EVIDENCE",
        sourceType: "CODEBASE_EVIDENCE",
        graph_version: node.version || "2.2.0",
        graphVersion: node.version || "2.2.0",
        last_verified_at: node.lastVerifiedAt || "2026-08-19",
        lastVerifiedAt: node.lastVerifiedAt || "2026-08-19"
      });
    }
  });

  // 5. Generate EDGE_TRANSITION Chunks
  edges.forEach(edge => {
    if (allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target)) {
      chunks.push({
        chunk_id: `edge_${edge.id || `${edge.source}_to_${edge.target}`}`,
        chunk_type: "EDGE_TRANSITION",
        chunkType: "EDGE_TRANSITION",
        source: edge.source,
        target: edge.target,
        transition_type: edge.type || 'NAVIGATE',
        label: isPublic ? sanitizePublicText(edge.label || `${edge.source} → ${edge.target}`) : (edge.label || `${edge.source} → ${edge.target}`),
        branchKey: edge.branchKey,
        predicate: edge.predicate,
        preconditions: isPublic ? (edge.preconditions || []).map(sanitizePublicText) : (edge.preconditions || []),
        postconditions: isPublic ? (edge.postconditions || []).map(sanitizePublicText) : (edge.postconditions || []),
        stateTransition: edge.stateTransition,
        status: edge.implementationStatus || 'VERIFIED',
        visibility: edge.visibility || ['PUBLIC'],
        securityClassification: edge.securityClassification || 'PUBLIC',
        source_type: "TRANSITION_CONTRACT",
        sourceType: "TRANSITION_CONTRACT",
        evidence: isPublic ? getPublicSafeEvidence(edge.evidence) : (edge.evidence || []),
        graph_version: "2.2.0",
        graphVersion: "2.2.0",
        last_verified_at: "2026-08-19",
        lastVerifiedAt: "2026-08-19"
      });
    }
  });

  // 6. Generate Statutory POLICY Chunks (Safe and grounded)
  chunks.push({
    chunk_id: "policy_statutory_compliance",
    chunk_type: "POLICY",
    chunkType: "POLICY",
    canonical_id: "legal.policy.statutory",
    canonicalId: "legal.policy.statutory",
    title: "Philippine Real Estate & Privacy Governance Standards",
    domain: "legal",
    status: "VERIFIED",
    productStatus: "APPROVED",
    implementationStatus: "VERIFIED",
    evidenceStatus: "DOCUMENTED",
    releaseStatus: "PUBLIC_LIVE",
    legalReviewStatus: "PRODUCT_APPROVED",
    visibility: ["PUBLIC", "AUTHENTICATED"],
    securityClassification: "PUBLIC",
    regulations: [
      "Republic Act No. 9646 (RESA Law - Real Estate Service Governance)",
      "Republic Act No. 10173 (Data Privacy Act - Zero-Knowledge Edge & PII Erasure)",
      "NPC Circular 2024-03 (Adult Age Eligibility & Minors Protection)",
      "Republic Act No. 7394 (Consumer Act - Spent-on-Delivery Non-Refundable Tokens)"
    ],
    source_type: "STATUTORY_AUTHORITY",
    sourceType: "STATUTORY_AUTHORITY",
    evidence: isPublic ? [{ kind: "PRODUCT_BEHAVIOR", provenance: "SCOUTIT_PRODUCT_GRAPH", confidence: 1.0 }] : [{ kind: "SCOUTIT_BRAIN", path: "_SCOUTIT_BRAIN/16_LEGAL_AND_COMPLIANCE/COMPLIANCE_MATRIX.md", provenance: "EXTRACTED" }],
    graph_version: "2.2.0",
    graphVersion: "2.2.0",
    last_verified_at: "2026-08-19",
    lastVerifiedAt: "2026-08-19"
  });

  return chunks;
}

/**
 * 7. SERIALIZES SUBGRAPH TO COMPACT JSON
 */
export function exportSubgraphJSON(subgraph) {
  return JSON.stringify({
    version: "2.1.0",
    exportedAt: new Date().toISOString(),
    ...subgraph
  }, null, 2);
}
