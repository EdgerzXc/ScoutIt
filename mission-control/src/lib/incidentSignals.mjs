/**
 * A-185 Phase 3 — Topological Incident Signal Extraction & Provenance Resolver.
 *
 * Extracts Master Flow Graph node provenance and on-call recovery runbooks
 * from system event logs and client/server error signals, enabling 1-click
 * triage from Master Mission Control directly into the Master Flow Graph.
 */

export const KNOWN_EVENT_FLOW_FALLBACKS = Object.freeze({
  "airtable.publish.failed": {
    nodeId: "owner_publish",
    domain: "publishing",
    role: "owner",
    blastRadius: "HIGH (LISTING PIPELINE)",
    recoveryPlaybook: "Inspect Airtable API rate limits, schema write permissions, and bridge sync status.",
    evidencePath: "src/app/api/dashboard/publish/route.js",
  },
  "airtable.sync.failed": {
    nodeId: "cms_airtable",
    domain: "catalog",
    role: "public",
    blastRadius: "HIGH (PUBLIC CATALOG DEGRADATION)",
    recoveryPlaybook: "Inspect Airtable PAT status, monthly API usage quota, and CMS fallback bundle.",
    evidencePath: "src/app/api/cms/route.js",
  },
  "cms.bundle.budget_guarded": {
    nodeId: "cms_airtable",
    domain: "catalog",
    role: "public",
    blastRadius: "MODERATE (SERVING CACHED CATALOG)",
    recoveryPlaybook: "Airtable monthly call budget reached; serving cached snapshot until reset or quota upgrade.",
    evidencePath: "src/lib/airtableBudget.js",
  },
  "cache.catalogue.purge_failed": {
    nodeId: "cms_airtable",
    domain: "infrastructure",
    role: "admin",
    blastRadius: "LOW (STALE PUBLIC CACHE)",
    recoveryPlaybook: "Purge Upstash Redis catalog key manually in Mission Control or verify REDIS credentials.",
    evidencePath: "src/lib/cmsCache.js",
  },
  "cron.failed": {
    nodeId: "cron_scheduler",
    domain: "operations",
    role: "system",
    blastRadius: "MODERATE (BACKGROUND SCHEDULE DELAY)",
    recoveryPlaybook: "Inspect Vercel cron invocation logs and verify cron handler status.",
    evidencePath: "src/app/api/cron/",
  },
});

/**
 * Extracts topological node provenance from a system event.
 *
 * @param {object} event - System event row from system_events
 * @returns {object|null} Topological incident signal or null if not applicable
 */
export function extractIncidentSignal(event) {
  if (!event || typeof event !== "object") return null;

  const detail = event.detail && typeof event.detail === "object" ? event.detail : {};
  const explicitNodeId = detail.flowNodeId || detail.flow_node_id || detail.nodeId || detail.node_id;

  if (explicitNodeId && typeof explicitNodeId === "string") {
    const rawRole = detail.flowRole || detail.flow_role || detail.role || detail.roles;
    const role = Array.isArray(rawRole) ? rawRole.join(", ") : (rawRole || "system");
    const blastRadius =
      detail.blastRadius ||
      detail.blast_radius ||
      (event.severity === "error" ? "CRITICAL (TIER 1)" : "MODERATE (TIER 2)");

    return {
      nodeId: explicitNodeId.trim(),
      domain: String(detail.flowDomain || detail.flow_domain || detail.domain || "core"),
      role: String(role),
      blastRadius: String(blastRadius),
      recoveryPlaybook: detail.recoveryPlaybook || detail.recovery_playbook || detail.recovery || detail.playbook || null,
      evidencePath: detail.evidencePath || detail.evidence_path || null,
      triageUrl: `https://www.scoutit.space/admin/flow?node=${encodeURIComponent(explicitNodeId.trim())}&mode=incident`,
    };
  }

  // Fallback for known machinery events when status indicates a failure or warning
  if (
    (event.severity === "error" || event.severity === "warning") &&
    event.event &&
    KNOWN_EVENT_FLOW_FALLBACKS[event.event]
  ) {
    const fallback = KNOWN_EVENT_FLOW_FALLBACKS[event.event];
    return {
      ...fallback,
      triageUrl: `https://www.scoutit.space/admin/flow?node=${encodeURIComponent(fallback.nodeId)}&mode=incident`,
    };
  }

  return null;
}
