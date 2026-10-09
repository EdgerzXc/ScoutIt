/**
 * JEV DETERMINISTIC AI ENGINE (SLM Architecture)
 * ─────────────────────────────────────────────────────────────────────────────
 * Task A-183: In-Database Deterministic AI Engine for ScoutIt Second Brain
 * and Specific Databases (Supabase, Airtable, Spatial/GIS).
 *
 * Replaces external generative LLM API churn, rate limits (503s), and model rot
 * with a zero-hallucination, deterministic semantic compiler and rule-based
 * query router.
 *
 * Guarantees:
 * 1. 0% Data Egress: 100% in-process execution. No private data leaves the host.
 * 2. Zero Hallucination: Verbatim canonical rule matching with line/rule citations.
 * 3. Sub-10ms Routing: Instant classification and parameter compilation.
 * 4. High-Fidelity Multi-Database Synthesis:
 *    - Database 1: Supabase (Postgres RPC / PostgREST queries for operational data)
 *    - Database 2: Airtable (Public property taxonomy & formula generation)
 *    - Database 3: Spatial / GIS (Hazard, NOAH flood, seismic fault, PEZA, transit)
 * 5. Pre-flight Concierge Intent Filtering (<50ms) for QuestIT.
 * 6. RESA RA 9646 Philippine Real Estate Service Act Listing Compliance Linter.
 */

export const JEV_INTENTS = Object.freeze({
  INTERNAL_POLICY_RULE: "INTERNAL_POLICY_RULE",
  DATABASE_QUERY_SUPABASE: "DATABASE_QUERY_SUPABASE",
  DATABASE_QUERY_AIRTABLE: "DATABASE_QUERY_AIRTABLE",
  DATABASE_QUERY_SPATIAL: "DATABASE_QUERY_SPATIAL",
  CONCIERGE_PREFLIGHT: "CONCIERGE_PREFLIGHT",
  COMPLIANCE_LINT_RESA: "COMPLIANCE_LINT_RESA",
});

/**
 * Canonical Knowledge Base: Immutable ground truths from _SCOUTIT_BRAIN
 */
export const CANONICAL_POLICIES = Object.freeze([
  {
    id: "DUAL_CMS_INVARIANT",
    ruleNumber: "AGENTS §2",
    title: "Dual-CMS Separation Rule",
    doc: "_SCOUTIT_BRAIN/02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE.md",
    keywords: ["dual-cms", "airtable", "supabase", "database separation", "write to airtable", "public catalog"],
    summary:
      "Airtable is public read-only content. Supabase is private user data, deals, and submissions. Never write private data, user reviews, or inquiries directly to Airtable.",
    verbatim:
      "Dual-CMS Rule: 1. AIRTABLE = Public Read-Only Content. All public properties, articles, and brokers displayed on the website are fetched from Airtable via the central proxy src/app/api/cms/route.js. 2. SUPABASE = Private User Data & Submissions. Supabase handles User Authentication and stores private dashboard state. When an Owner submits a new property via the Dashboard, it goes to Supabase, NOT Airtable.",
  },
  {
    id: "HONEST_BLANK_RULE",
    ruleNumber: "A-182",
    title: "Honest Blank Cold-Start Rule",
    doc: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_BEHAVIORAL_SCORING_AND_DOUBLE_BLIND_REVIEWS.md",
    keywords: ["honest blank", "cold start", "zero reviews", "initial score", "0%", "new seeker"],
    summary:
      "New platform seekers or listings with no transactions must never be branded with an artificial 0% or 0/5 rating. They must render as an unrated neutral cold-start state.",
    verbatim:
      "Honest Blank Rule: New seekers or users with 0 completed transactions must display an honest cold-start state ('[First-Time Verified Seeker]') with zero numerical score penalty rather than an artificial 0% or 0/5 rating.",
  },
  {
    id: "SURFACE_LOCK_GATE",
    ruleNumber: "AGENTS §5",
    title: "Owner-Approved Surface Locks",
    doc: "scripts/approved-surfaces.json",
    keywords: ["surface lock", "checksum", "approved surfaces", "manifest", "verify:surfaces"],
    summary:
      "Locked public surfaces recorded in scripts/approved-surfaces.json must never have their checksum refreshed without explicit owner authorization.",
    verbatim:
      "Run npm run verify:surfaces before and after edits. A failed lock is a stop signal, not an invitation to refresh the checksum. Restore the approved file unless the owner explicitly authorized that exact surface change.",
  },
  {
    id: "DOUBLE_BLIND_REVIEWS",
    ruleNumber: "A-182",
    title: "Double-Blind Simultaneous Review Protocol",
    doc: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_BEHAVIORAL_SCORING_AND_DOUBLE_BLIND_REVIEWS.md",
    keywords: ["double-blind", "review", "retaliation", "disputed hold", "14-day window", "rating lock"],
    summary:
      "Reviews between tenants and property owners remain locked and invisible until both parties submit or the 14-day window elapses, preventing retaliatory scores.",
    verbatim:
      "Double-Blind Review: 14-day anti-retaliation window. Mutual review submission remains locked and undisclosed until both counterparties submit or the 14-day window expires. Contested reviews enter DISPUTED_HOLD.",
  },
  {
    id: "DATA_PRIVACY_ACT_RA10173",
    ruleNumber: "RA 10173",
    title: "Philippine Data Privacy Act Compliance & Resident Passport",
    doc: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_BEHAVIORAL_SCORING_AND_DOUBLE_BLIND_REVIEWS.md",
    keywords: ["data privacy", "ra 10173", "blacklist", "passport", "consent", "pii"],
    summary:
      "ScoutIt strictly adheres to RA 10173. Behavioral metrics are scoped to private user consent (CONSENTED_APPLICATION). Zero public blacklists or public negative dossiers are permitted.",
    verbatim:
      "RA 10173 Mandate: Private Resident Passport enforces scoped disclosure. PUBLIC_SUMMARY exposes only high-level verification badges. Detailed behavioral scores require explicit seeker consent per transaction. Public blacklist creation is strictly prohibited.",
  },
  {
    id: "RESA_RA9646_COMPLIANCE",
    ruleNumber: "RA 9646",
    title: "Real Estate Service Act of the Philippines (RESA)",
    doc: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/REPRESENTATION_AND_DISCLOSURE_RULES.md",
    keywords: ["resa", "ra 9646", "prc", "license", "broker accreditation", "unlicensed", "commission claim"],
    summary:
      "All real estate practitioners representing listings must disclose a valid 7 to 8-digit PRC license and accredited brokerage affiliation. Misleading commission-free or guaranteed yield claims are prohibited.",
    verbatim:
      "RESA RA 9646 Compliance: Real estate advisory requires registered PRC license numbers (7-8 digits) and verified broker affiliation. Listings may not advertise guaranteed fixed ROI yields or deceptive zero-commission representations without full disclosures.",
  },
  {
    id: "VIA_CONTACT_ATTRIBUTION",
    ruleNumber: "A-186",
    title: "VIA Contact Attribution & Priority Routing",
    doc: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/VIA_CONTACT_ATTRIBUTION_AND_ROUTING.md",
    keywords: ["via", "attribution", "position zero", "routing cascade", "promoter slug", "deal continuity"],
    summary:
      "Promoters share listings via /property/[slug]/via/[contactSlug]. Routing priority follows: User Selection > Active Relationship > VIA Attribution > Algorithmic Ranking.",
    verbatim:
      "VIA Contact Attribution: Decouples ranking from routing. Promoters gain session Position Zero attribution without polluting global catalog ranking. Inbound inquiries prioritize the attributed promoter while respecting existing client handshakes.",
  },
  {
    id: "DARK_MODE_DNA",
    ruleNumber: "AGENTS §1",
    title: "ScoutIt Dark Mode DNA & Token System",
    doc: "AGENTS.md §1",
    keywords: ["dark mode", "dna", "gold", "css variables", "#0d0d0d", "accent", "tokens"],
    summary:
      "95% deep black and 5% glowing amber gold (var(--accent), var(--accent-bright)). Always use CSS variables, never raw hex.",
    verbatim:
      "The visual aesthetic is 95% deep black and 5% glowing gold accents: primary gold (--accent), interactive gold (--accent-bright), muted gold (--accent-muted). Always use CSS variables, never raw hex.",
  },
]);

/**
 * Classify user or staff natural language query into deterministic intent
 * @param {string} query
 * @returns {string} Intent from JEV_INTENTS
 */
export function classifyIntent(query) {
  if (!query || typeof query !== "string") return JEV_INTENTS.CONCIERGE_PREFLIGHT;
  const q = query.trim().toLowerCase();

  // 1. RESA Compliance checks
  if (
    q.includes("compliance check") ||
    q.includes("lint listing") ||
    q.includes("ra 9646") ||
    q.includes("prc license check") ||
    q.includes("verify resa")
  ) {
    return JEV_INTENTS.COMPLIANCE_LINT_RESA;
  }

  // 2. Spatial / GIS queries
  if (
    q.includes("flood") ||
    q.includes("noah") ||
    q.includes("hazard") ||
    q.includes("fault line") ||
    q.includes("seismic") ||
    q.includes("walk time") ||
    q.includes("isochrone") ||
    q.includes("mrt") ||
    q.includes("lrt") ||
    q.includes("subway") ||
    q.includes("peza") ||
    q.includes("elevation")
  ) {
    return JEV_INTENTS.DATABASE_QUERY_SPATIAL;
  }

  // 3. Internal Policy / Rule Questions
  if (
    q.includes("what is rule") ||
    q.includes("policy on") ||
    q.includes("dual-cms") ||
    q.includes("honest blank") ||
    q.includes("surface lock") ||
    q.includes("double blind") ||
    q.includes("privacy act") ||
    q.includes("ra 10173") ||
    q.includes("how does via work") ||
    q.includes("what does agent say") ||
    q.includes("can staff") ||
    q.includes("can anonymous") ||
    q.includes("citation for") ||
    q.includes("standing rule")
  ) {
    return JEV_INTENTS.INTERNAL_POLICY_RULE;
  }

  // 4. Supabase Operational Data Queries (Private / Staff / Deals / Audits)
  if (
    q.includes("audit log") ||
    q.includes("system event") ||
    q.includes("deal status") ||
    q.includes("user profile") ||
    q.includes("owner submission") ||
    q.includes("brain document") ||
    q.includes("inbox transaction") ||
    q.includes("connect balance") ||
    q.includes("dispute record")
  ) {
    return JEV_INTENTS.DATABASE_QUERY_SUPABASE;
  }

  // 5. Airtable Catalog Queries (Public Listings / Inventory Specs)
  if (
    q.includes("how many commercial") ||
    q.includes("how many residential") ||
    q.includes("available spaces in") ||
    q.includes("filter by category") ||
    q.includes("catalog count") ||
    q.includes("public listings") ||
    q.includes("square meter") ||
    q.includes("sqm range")
  ) {
    return JEV_INTENTS.DATABASE_QUERY_AIRTABLE;
  }

  // Default to Concierge Pre-flight Router
  return JEV_INTENTS.CONCIERGE_PREFLIGHT;
}

/**
 * Answer an internal policy question with exact citations and zero hallucination.
 * @param {string} query
 * @returns {object} Deterministic policy response
 */
export function parsePolicyQuestion(query) {
  const q = (query || "").toLowerCase();
  let bestMatch = null;
  let maxScore = 0;

  for (const policy of CANONICAL_POLICIES) {
    let score = 0;
    for (const kw of policy.keywords) {
      if (q.includes(kw)) score += 10;
    }
    if (q.includes(policy.id.toLowerCase())) score += 20;
    if (q.includes(policy.title.toLowerCase())) score += 15;

    if (score > maxScore) {
      maxScore = score;
      bestMatch = policy;
    }
  }

  if (!bestMatch || maxScore === 0) {
    return {
      answered: false,
      message: "No exact canonical policy match found in ScoutIt Brain knowledge vault.",
      citation: null,
      verbatim: null,
    };
  }

  return {
    answered: true,
    policyId: bestMatch.id,
    ruleNumber: bestMatch.ruleNumber,
    title: bestMatch.title,
    doc: bestMatch.doc,
    summary: bestMatch.summary,
    verbatim: bestMatch.verbatim,
    citation: `${bestMatch.title} [${bestMatch.ruleNumber} — ${bestMatch.doc}]`,
  };
}

/**
 * Compile a natural language query into a typed Supabase PostgREST query descriptor
 * @param {string} query
 * @returns {object} Typed Supabase query specification
 */
export function compileSupabaseQuery(query) {
  const q = (query || "").toLowerCase();
  let table = "properties";
  const filters = [];
  let order = { column: "created_at", ascending: false };
  let limit = 20;

  if (q.includes("deal") || q.includes("inquiry") || q.includes("handshake")) {
    table = "deals";
    if (q.includes("accepted")) filters.push({ column: "status", op: "eq", value: "accepted" });
    else if (q.includes("pending")) filters.push({ column: "status", op: "eq", value: "pending" });
    else if (q.includes("closed")) filters.push({ column: "status", op: "eq", value: "closed" });
  } else if (q.includes("audit") || q.includes("action") || q.includes("log")) {
    table = "mission_control_actions";
  } else if (q.includes("event") || q.includes("system event")) {
    table = "system_events";
  } else if (q.includes("profile") || q.includes("user")) {
    table = "user_profiles";
  } else if (q.includes("brain") || q.includes("document") || q.includes("vault")) {
    table = "brain_documents";
  } else {
    // Default properties
    if (q.includes("draft")) filters.push({ column: "lifecycle_state", op: "eq", value: "draft" });
    else if (q.includes("verified")) filters.push({ column: "lifecycle_state", op: "eq", value: "verified" });
  }

  return {
    target: "supabase",
    table,
    filters,
    order,
    limit,
    zeroEgress: true,
  };
}

/**
 * Compile a query into an exact Airtable filter formula string
 * @param {string} query
 * @returns {object} Airtable query descriptor
 */
export function compileAirtableFormula(query) {
  const q = (query || "").toLowerCase();
  const conditions = ["{Status} = 'Published'"];

  // Category matching
  if (q.includes("residential") || q.includes("condo") || q.includes("apartment")) {
    conditions.push("{SpaceCategory} = 'Residential'");
  } else if (q.includes("commercial") || q.includes("office") || q.includes("bpo")) {
    conditions.push("{SpaceCategory} = 'Commercial'");
  } else if (q.includes("str") || q.includes("short-term") || q.includes("airbnb")) {
    conditions.push("{SpaceCategory} = 'STR'");
  } else if (q.includes("hospitality") || q.includes("hotel") || q.includes("resort")) {
    conditions.push("{SpaceCategory} = 'Hospitality'");
  } else if (q.includes("restaurant") || q.includes("culinary") || q.includes("f&b")) {
    conditions.push("{SpaceCategory} = 'Restaurants'");
  } else if (q.includes("venue") || q.includes("event space")) {
    conditions.push("{SpaceCategory} = 'Venues'");
  }

  // Location matching
  const cities = ["bgc", "taguig", "makati", "pasig", "ortigas", "quezon city", "muntinlupa", "alabang", "cebu"];
  for (const city of cities) {
    if (q.includes(city)) {
      conditions.push(`FIND('${city.toUpperCase()}', UPPER({City}))`);
      break;
    }
  }

  // SQM floor area matching
  const sqmMatch = q.match(/(\d+)\s*(?:sqm|sq m|square meter)/);
  if (sqmMatch) {
    const sqm = parseInt(sqmMatch[1], 10);
    if (q.includes("at least") || q.includes("min") || q.includes("above")) {
      conditions.push(`{Floor_Area_SQM} >= ${sqm}`);
    } else if (q.includes("under") || q.includes("max") || q.includes("below")) {
      conditions.push(`{Floor_Area_SQM} <= ${sqm}`);
    }
  }

  const formula = conditions.length === 1 ? conditions[0] : `AND(${conditions.join(", ")})`;

  return {
    target: "airtable",
    table: "Properties",
    formula,
    conditions,
    zeroEgress: true,
  };
}

/**
 * Compile a query into GIS/Spatial Vault filters
 * @param {string} query
 * @returns {object} Spatial GIS query descriptor
 */
export function compileSpatialFilter(query) {
  const q = (query || "").toLowerCase();
  const filter = {
    target: "spatial_vault",
    floodRiskCeiling: null, // "LOW" | "MODERATE" | "HIGH" | "SEVERE"
    maxFaultDistanceMeters: null,
    transitProximityMeters: null,
    requirePeza: false,
    district: null,
  };

  if (q.includes("no flood") || q.includes("low flood") || q.includes("flood safe")) {
    filter.floodRiskCeiling = "LOW";
  } else if (q.includes("moderate flood")) {
    filter.floodRiskCeiling = "MODERATE";
  }

  if (q.includes("fault line") || q.includes("earthquake") || q.includes("seismic")) {
    filter.maxFaultDistanceMeters = 5000; // 5km safety envelope
  }

  if (q.includes("transit") || q.includes("train") || q.includes("mrt") || q.includes("lrt") || q.includes("walk to")) {
    filter.transitProximityMeters = 800; // 10 min walk radius
  }

  if (q.includes("peza") || q.includes("tax incentive")) {
    filter.requirePeza = true;
  }

  if (q.includes("bgc")) filter.district = "BGC";
  else if (q.includes("makati")) filter.district = "Makati CBD";
  else if (q.includes("ortigas")) filter.district = "Ortigas Center";

  return filter;
}

/**
 * Concierge (QuestIT) Pre-flight Intent & Parameter Extractor (< 50ms)
 * Extracts structured parameters from natural language search queries
 * without invoking external LLMs.
 * @param {string} query
 * @returns {object} Structured search parameters
 */
export function compileConciergePreflight(query) {
  const q = (query || "").toLowerCase();
  const startTime = Date.now();

  let category = null;
  if (q.includes("condo") || q.includes("apartment") || q.includes("residential") || q.includes("house")) {
    category = "Residential";
  } else if (q.includes("office") || q.includes("commercial") || q.includes("bpo") || q.includes("retail")) {
    category = "Commercial";
  } else if (q.includes("airbnb") || q.includes("str") || q.includes("short-term") || q.includes("stay")) {
    category = "STR";
  } else if (q.includes("hotel") || q.includes("resort") || q.includes("hospitality")) {
    category = "Hospitality";
  } else if (q.includes("restaurant") || q.includes("cafe") || q.includes("food") || q.includes("dining")) {
    category = "Restaurants";
  } else if (q.includes("venue") || q.includes("events") || q.includes("studio")) {
    category = "Venues";
  }

  let location = null;
  const knownLocations = [
    { key: "bgc", label: "BGC, Taguig" },
    { key: "bonifacio global city", label: "BGC, Taguig" },
    { key: "makati", label: "Makati" },
    { key: "ortigas", label: "Ortigas, Pasig" },
    { key: "alabang", label: "Alabang, Muntinlupa" },
    { key: "quezon city", label: "Quezon City" },
    { key: "qc", label: "Quezon City" },
    { key: "cebu", label: "Cebu IT Park" },
  ];
  for (const loc of knownLocations) {
    if (q.includes(loc.key)) {
      location = loc.label;
      break;
    }
  }

  // Budget detection (e.g. "under 50k", "50,000", "50k/month", "3,500/night", "10M")
  let maxBudget = null;
  let budgetPeriod = "monthly"; // monthly | nightly | purchase

  if (q.includes("night") || q.includes("per day") || category === "STR") {
    budgetPeriod = "nightly";
  } else if (q.includes("buy") || q.includes("for sale") || q.includes("purchase")) {
    budgetPeriod = "purchase";
  }

  const kMatch = q.match(/(?:under|max|below|up to)?\s*(?:₱|p|php)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  const mMatch = q.match(/(?:under|max|below|up to)?\s*(?:₱|p|php)?\s*(\d+(?:\.\d+)?)\s*m\b/i);
  const numMatch = q.match(/(?:under|max|below|up to)?\s*(?:₱|p|php)?\s*(\d{1,3}(?:,\d{3})+|\d{4,9})\b/i);

  if (mMatch) {
    maxBudget = parseFloat(mMatch[1]) * 1000000;
  } else if (kMatch) {
    maxBudget = parseFloat(kMatch[1]) * 1000;
  } else if (numMatch) {
    maxBudget = parseInt(numMatch[1].replace(/,/g, ""), 10);
  }

  // Bedrooms
  let bedrooms = null;
  const brMatch = q.match(/(\d+)\s*(?:br|bedroom|bed)\b/i);
  if (brMatch) bedrooms = parseInt(brMatch[1], 10);
  else if (q.includes("studio")) bedrooms = 0;

  // Transit oriented
  const transitOriented = q.includes("train") || q.includes("mrt") || q.includes("lrt") || q.includes("transit");

  return {
    category,
    location,
    maxBudget,
    budgetPeriod,
    bedrooms,
    transitOriented,
    executionTimeMs: Date.now() - startTime,
    preflightValid: !!(category || location || maxBudget),
  };
}

/**
 * Lint real estate listing and broker metadata for Philippine RESA RA 9646 compliance.
 * @param {object} listing
 * @returns {object} Compliance audit outcome
 */
export function lintResaCompliance(listing = {}) {
  const violations = [];
  const warnings = [];

  const prcLicense = listing.prcLicense || listing.prc_license || "";
  const cleanedPrc = String(prcLicense).replace(/\D/g, "");

  // Rule 1: Valid PRC license must be 7 to 8 digits
  if (!cleanedPrc) {
    violations.push("RESA RA 9646 Violation: Missing required Professional Regulation Commission (PRC) license number.");
  } else if (cleanedPrc.length < 7 || cleanedPrc.length > 8) {
    violations.push(`RESA RA 9646 Violation: Invalid PRC license length (${cleanedPrc.length} digits). Must be 7-8 digits.`);
  }

  // Rule 2: Brokerage affiliation disclosure
  if (!listing.brokerage && !listing.agency_name && !listing.independent_practitioner_attestation) {
    warnings.push("Disclosure Warning: No registered brokerage or independent practitioner attestation declared.");
  }

  // Rule 3: Deceptive price / commission guarantees
  const desc = (listing.description || "").toLowerCase();
  if (desc.includes("guaranteed 0% commission") || desc.includes("free broker forever")) {
    violations.push("Deceptive Practice: Misleading 'free broker' / '0% commission' representations violate RESA ethical standards.");
  }

  if (desc.includes("guaranteed roi") || desc.includes("guaranteed 15% return")) {
    violations.push("Deceptive Practice: Advertising guaranteed speculative investment yields is prohibited.");
  }

  return {
    compliant: violations.length === 0,
    prcVerified: violations.length === 0 && cleanedPrc.length >= 7,
    violations,
    warnings,
    auditTimestamp: new Date().toISOString(),
  };
}

/**
 * Universal Jev SLM Query Orchestrator
 * Routes query to the exact deterministic subsystem with zero external API calls.
 * @param {string} query
 * @returns {object} Final evaluated outcome
 */
export function processJevQuery(query) {
  const intent = classifyIntent(query);

  switch (intent) {
    case JEV_INTENTS.INTERNAL_POLICY_RULE:
      return {
        intent,
        mode: "deterministic_policy_vault",
        result: parsePolicyQuestion(query),
      };

    case JEV_INTENTS.DATABASE_QUERY_SUPABASE:
      return {
        intent,
        mode: "supabase_operational_sql",
        result: compileSupabaseQuery(query),
      };

    case JEV_INTENTS.DATABASE_QUERY_AIRTABLE:
      return {
        intent,
        mode: "airtable_formula_compiler",
        result: compileAirtableFormula(query),
      };

    case JEV_INTENTS.DATABASE_QUERY_SPATIAL:
      return {
        intent,
        mode: "spatial_gis_vault",
        result: compileSpatialFilter(query),
      };

    case JEV_INTENTS.COMPLIANCE_LINT_RESA:
      return {
        intent,
        mode: "resa_ra9646_linter",
        result: lintResaCompliance({ description: query }),
      };

    case JEV_INTENTS.CONCIERGE_PREFLIGHT:
    default:
      return {
        intent: JEV_INTENTS.CONCIERGE_PREFLIGHT,
        mode: "concierge_preflight_router",
        result: compileConciergePreflight(query),
      };
  }
}
