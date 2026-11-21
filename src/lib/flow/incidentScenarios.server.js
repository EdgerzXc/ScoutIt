import "server-only";

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
