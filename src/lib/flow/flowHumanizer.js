/**
 * SCOUTIT FLOW HUMANIZER ENGINE
 *
 * Translates dense architectural flow metadata and technical contracts
 * into crystal-clear, friendly, human-understandable explanations and
 * structured logic stages for interactive diagrams.
 *
 * Adheres strictly to the humanizer & antislop guidelines:
 * - Plain, direct, human language.
 * - No robotic jargon, inflated symbolism, or sterile technical soup.
 * - Explains what it actually does, why it matters, and how to fix it if broken.
 */

/**
 * Friendly descriptions for system domains
 */
const DOMAIN_LABELS = {
  core: "Platform Core & Navigation",
  catalog: "Public Property Catalog",
  descent: "3D Space Descent & Exploration",
  property: "Property Dossier & Insights",
  deals: "Private Deal Rooms & Inquiries",
  owner: "Owner Listing & Management",
  broker: "Broker Tools & Client Routing",
  admin: "Mission Control & Staff Tools",
  intelligence: "Spatial & Market Intelligence",
  publishing: "Listing Publishing Pipeline",
  infrastructure: "System Infrastructure & Security",
  operations: "Scheduled Jobs & Background Tasks"
};

/**
 * Friendly labels for actor roles
 */
const ROLE_LABELS = {
  visitor: "Anyone browsing the web (no account needed)",
  seeker: "Renters, buyers, and tenants looking for space",
  owner: "Property owners and landlords",
  broker: "Licensed real estate brokers",
  provider: "Photographers, designers, and service partners",
  enterprise: "Corporate real estate teams",
  admin: "ScoutIt staff and operations team",
  system: "Automated background services"
};

/**
 * Friendly labels for node types
 */
const TYPE_HUMAN_LABELS = {
  ENTRY: "Front Door / Starting Point",
  LAYER: "Altitude / Exploration Level",
  PAGE: "Web Page",
  SECTION: "Page Section or Interactive Tab",
  ACTION: "User or System Action",
  DECISION: "Choice or Automatic Check",
  GATE: "Security or Permission Check",
  SYSTEM: "Background Engine or API",
  EXCEPTION: "Known Problem or Warning",
  RECOVERY: "Step-by-Step Fix or Fallback",
  OUTCOME: "Milestone Reached",
  TERMINAL: "Journey Completed"
};

/**
 * Cleans robotic phrases and LLM jargon from text.
 * Strips overly ceremonial phrases and makes it sound natural.
 *
 * @param {string} text
 * @returns {string}
 */
export function humanizeText(text) {
  if (!text || typeof text !== "string") return "";

  let cleaned = text
    .replace(/^Serves as the root landing environment\./i, "This is the main landing page.")
    .replace(/primary platform launchpad with interactive black hole canvas/i, "main welcome page with an interactive space view")
    .replace(/6-layer altitude descent/i, "interactive 6-layer exploration guide")
    .replace(/6-layer spatial descent doorways/i, "doorways into each layer of the platform")
    .replace(/curated showcase leaderboard/i, "featured spaces and trending listings")
    .replace(/searchable directory/i, "searchable property catalog")
    .replace(/double-blind 14-day anti-retaliation reviews/i, "fair reviews where neither side sees the other's feedback until both have submitted (or 14 days pass)")
    .replace(/zero-hallucination deterministic compiler/i, "rule-based search engine that answers strictly from verified database records")
    .replace(/topological blast radius down the directed acyclic graph/i, "chain of other features that stop working if this step fails")
    .replace(/BFS DAG cascade traversal/i, "tracing downstream dependencies")
    .replace(/soft-quarantined from public directories/i, "temporarily hidden from public search until verified")
    .replace(/Sentinel velocity radar flagged anomalous traffic spikes/i, "automated security noticed unusually fast repeated requests")
    .replace(/Airtable monthly API budget exhaustion/i, "monthly Airtable API request allowance reached")
    .replace(/Directs visitors to/i, "Guides visitors to")
    .replace(/Facilitates/i, "Helps with")
    .replace(/Encompasses/i, "Includes")
    .replace(/Utilizes/i, "Uses")
    .replace(/Leverages/i, "Uses")
    .replace(/Robust/i, "Reliable")
    .replace(/Seamless/i, "Smooth")
    .replace(/Seamlessly/i, "Smoothly")
    .trim();

  return cleaned;
}

/**
 * Translates a database string into plain human language explaining
 * where the data lives and how privacy is maintained.
 *
 * @param {string} db - Database name from node
 * @param {string} auth - Auth requirement
 * @returns {string}
 */
export function humanizeDataContract(db, auth) {
  const normDb = String(db || "").toLowerCase();
  const isPublicAuth = !auth || String(auth).toLowerCase().includes("public") || String(auth).toLowerCase().includes("none");

  if (normDb.includes("airtable")) {
    return "Reads public property information directly from Airtable. No private personal data or passwords are ever stored here.";
  }
  if (normDb.includes("supabase")) {
    return "Securely stored in Supabase with strict privacy rules. Only authenticated owners, authorized brokers, or staff can access this record.";
  }
  if (normDb.includes("redis")) {
    return "Stored in fast temporary memory cache for quick page loading.";
  }
  if (normDb.includes("none") || !db) {
    if (isPublicAuth) {
      return "Runs entirely in your web browser without saving anything to the database.";
    }
    return "Checks current login status in the browser session.";
  }
  return `Uses ${db} under ${auth || "standard security"} rules.`;
}

/**
 * Builds the interactive 5-stage logic diagram model for any node.
 * Every stage contains a friendly title, status, explanation, and interactive details.
 *
 * @param {object} node - Flow node from MASTER_FLOW_NODES
 * @param {Map<string, object>} [nodeMap] - Map of nodeId -> node
 * @returns {Array<object>} Array of diagram stages
 */
export function buildNodeLogicStages(node, nodeMap = new Map()) {
  if (!node) return [];

  const parents = (node.parents || []).map(pid => nodeMap.get(pid) || { id: pid, name: pid });
  const children = (node.children || []).map(cid => nodeMap.get(cid) || { id: cid, name: cid });
  const exceptions = node.exceptions || [];
  const recovery = node.recovery || [];
  const actions = node.actions || [];
  const conditions = node.conditions || [];

  // Stage 1: Trigger / Upstream
  const triggerSummary = parents.length > 0
    ? `Started by ${parents.length} previous step${parents.length > 1 ? "s" : ""}: ${parents.slice(0, 3).map(p => p.name).join(", ")}${parents.length > 3 ? "..." : ""}.`
    : "This is a root entry point. Visitors can start here directly by opening the page or clicking a direct link.";

  // Stage 2: Rules & Conditions
  const conditionSummary = conditions.length > 0
    ? conditions.map(c => humanizeText(c)).join(" • ")
    : node.auth && !node.auth.toLowerCase().includes("public")
    ? `Requires ${node.auth} before proceeding.`
    : "No special requirements. Open to everyone.";

  // Stage 3: Core Action & Systems
  const actionSummary = actions.length > 0
    ? actions.map(a => humanizeText(a)).join(" • ")
    : humanizeText(node.purpose || node.description || "Processes user request.");

  // Stage 4: Next Steps / Destinations
  const destinationSummary = children.length > 0
    ? `Leads into ${children.length} next step${children.length > 1 ? "s" : ""}: ${children.slice(0, 3).map(c => pName(c)).join(", ")}${children.length > 3 ? "..." : ""}.`
    : "This is a completed goal or terminal step in the user journey.";

  // Stage 5: Exceptions & Failures
  const exceptionSummary = exceptions.length > 0
    ? exceptions.map(e => humanizeText(e)).join(" • ")
    : "No known failure conditions recorded for this step.";

  // Stage 6: Recovery Protocol
  const recoverySummary = recovery.length > 0
    ? recovery.map(r => humanizeText(r)).join(" • ")
    : "If an issue occurs, reload the page or contact the ScoutIt support team.";

  return [
    {
      id: "trigger",
      stepNumber: 1,
      title: "How You Get Here",
      badge: parents.length > 0 ? `${parents.length} Incoming` : "Starting Point",
      type: "INPUT",
      iconKind: "trigger",
      simpleExplanation: triggerSummary,
      technicalDetails: {
        parentCount: parents.length,
        parentNodes: parents.map(p => ({ id: p.id, name: p.name || p.id })),
        route: node.route || "N/A"
      }
    },
    {
      id: "rules",
      stepNumber: 2,
      title: "Rules & Permissions",
      badge: node.auth || "Public",
      type: "CHECK",
      iconKind: "rules",
      simpleExplanation: conditionSummary,
      technicalDetails: {
        authGate: node.auth || "Public access",
        visibility: node.visibility || ["PUBLIC"],
        conditions
      }
    },
    {
      id: "execution",
      stepNumber: 3,
      title: "What Happens Here",
      badge: "Core Logic",
      type: "PROCESS",
      iconKind: "execution",
      simpleExplanation: actionSummary,
      technicalDetails: {
        actions,
        systems: node.systems || [],
        database: node.database || "None",
        telemetry: node.telemetry?.eventName || "None"
      }
    },
    {
      id: "output",
      stepNumber: 4,
      title: "Where It Leads Next",
      badge: children.length > 0 ? `${children.length} Destinations` : "Completed",
      type: "OUTPUT",
      iconKind: "output",
      simpleExplanation: destinationSummary,
      technicalDetails: {
        childCount: children.length,
        childNodes: children.map(c => ({ id: c.id, name: c.name || c.id })),
        goals: node.goals || []
      }
    },
    {
      id: "recovery",
      stepNumber: 5,
      title: "If Something Breaks",
      badge: exceptions.length > 0 ? "Fallback Ready" : "Nominal",
      type: "FALLBACK",
      iconKind: "recovery",
      simpleExplanation: exceptions.length > 0
        ? `Known issue: ${exceptionSummary} -> Solution: ${recoverySummary}`
        : "Runs smoothly without active alerts.",
      technicalDetails: {
        exceptions,
        recoveryProtocols: recovery
      }
    }
  ];
}

function pName(item) {
  return item?.name || item?.id || "Next step";
}

/**
 * Creates a complete, human-friendly dossier for any clicked node.
 * Combines plain language, role context, data safety rules, and the interactive logic diagram.
 *
 * @param {object} node - Flow node object
 * @param {Map<string, object>} [nodeMap] - Map of all nodes
 * @returns {object} Humanized node dossier
 */
export function humanizeNode(node, nodeMap = new Map()) {
  if (!node) return null;

  const typeHuman = TYPE_HUMAN_LABELS[node.nodeType || node.type] || "Feature";
  const domainHuman = DOMAIN_LABELS[node.domain] || node.domain || "General";

  // Friendly role breakdown
  const humanRoles = (node.roles || []).map(r => ROLE_LABELS[r] || r);
  const primaryRole = humanRoles[0] || "Everyone";

  // Friendly plain-language summary
  let plainSummary = humanizeText(node.purpose || node.description || "");
  if (!plainSummary || plainSummary.length < 10) {
    plainSummary = `${node.name} is part of the ${domainHuman.toLowerCase()} in ScoutIt.`;
  }

  // Why it matters
  let whyItMatters = "";
  if (node.category === "architecture") {
    whyItMatters = "Helps people navigate between different sections of the website effortlessly.";
  } else if (node.domain === "deals") {
    whyItMatters = "Ensures renters and property owners can negotiate securely without leaking personal phone numbers or spam.";
  } else if (node.domain === "catalog" || node.domain === "publishing") {
    whyItMatters = "Keeps public property information fresh and up to date while respecting Airtable rate limits.";
  } else if (node.domain === "intelligence") {
    whyItMatters = "Gives users real safety data like flood zones, transit walk times, and fault line proximity before they visit.";
  } else {
    whyItMatters = "Connects this step into the complete ScoutIt user journey.";
  }

  const logicStages = buildNodeLogicStages(node, nodeMap);
  const dataSafety = humanizeDataContract(node.database, node.auth);

  return {
    id: node.id,
    canonicalId: node.canonicalId || node.id,
    name: node.name,
    route: node.route || "N/A",
    typeLabel: typeHuman,
    domainLabel: domainHuman,
    primaryAudience: primaryRole,
    allAudiences: humanRoles,
    plainSummary,
    whyItMatters,
    dataSafety,
    logicStages,
    hasExceptions: Boolean(node.exceptions && node.exceptions.length > 0),
    hasRecovery: Boolean(node.recovery && node.recovery.length > 0),
    sourceFiles: (node.systems || []).concat(
      (node.evidence || []).map(e => e.path).filter(Boolean)
    ).filter((v, i, a) => a.indexOf(v) === i)
  };
}
