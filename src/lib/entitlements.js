// ═══════════════════════════════════════════════════════════════
// ScoutIt Entitlements — the single source of truth for tier gating.
//
// Encodes the locked Tier Distinction spec (_SCOUTIT_BRAIN/06_MONETIZATION/
// TIER_DISTINCTION.md): which features each tier unlocks + the monthly free
// Connects ladder.
//
// ⚠️ SECURITY (deferred, by design): this reads the tier from the client
// (localStorage mock user) so tiers are FUNCTIONAL now but not yet
// tamper-proof. The server-authoritative enforcement (real auth + service
// role + entitlement-filtered API responses) is the later hardening pass.
// Until then, treat client-side gating as cosmetic — never the sole guard
// for premium DATA. See OPTION3_BACKEND_HARDENING_PLAN.md.
// ═══════════════════════════════════════════════════════════════

export const TIERS = ["starry", "solar", "cluster", "universe"];

export const TIER_LABELS = {
  starry: "Starry",
  solar: "Solar",
  cluster: "Cluster",
  universe: "Universe",
};

export function tierRank(tier) {
  const i = TIERS.indexOf(String(tier || "starry").toLowerCase());
  return i < 0 ? 0 : i;
}

// Feature key → minimum tier that unlocks it.
export const FEATURE_MIN_TIER = {
  // Seeker / buyer-facing
  deepIntel: "solar",        // cap rate, yield, noise/quiet level, verdict
  enhancedPhotos: "solar",
  brokerContact: "solar",    // anonymous proxy contact (also spends a Connect)
  guideWizard: "solar",
  conciergeBasic: "solar",
  vault: "cluster",          // Luma 3D maps, 360 tours, drone heatmaps
  marketIntel: "cluster",    // market/investment panel: txn history, cap-rate benchmark, appreciation modelling
  offMarket: "cluster",
  compare: "cluster",        // side-by-side comparison
  identityReveal: "cluster",
  conciergeDeep: "cluster",  // vector / "vibe" search
  bounties: "cluster",
  universeListings: "universe",
  customBriefings: "universe",
  dedicatedCurator: "universe",
  conciergeAutodraft: "universe",
  ownAiMcp: "universe",      // plug your own AI into ScoutIt (MCP)
};

// True if a viewer on `tier` can access `feature`.
export function canSee(feature, tier) {
  const min = FEATURE_MIN_TIER[feature];
  if (!min) return true; // unknown / ungated feature is free
  return tierRank(tier) >= tierRank(min);
}

// Monthly free Connects allowance by role + tier (the locked ladder).
export const CONNECTS_ALLOWANCE = {
  seeker: { starry: 1, solar: 6, cluster: 15, universe: 40 },
  owner: { starry: 1, solar: 6, cluster: 18, universe: 40 },
  broker: { starry: 1, solar: 8, cluster: 20, universe: 50 },
  photographer: { starry: 1, solar: 5, cluster: 12, universe: 25 },
  researcher: { starry: 1, solar: 5, cluster: 12, universe: 25 },
};

export function monthlyAllowance(role, tier) {
  const r = CONNECTS_ALLOWANCE[String(role || "seeker").toLowerCase()] || CONNECTS_ALLOWANCE.seeker;
  return r[String(tier || "starry").toLowerCase()] ?? 1;
}

// ── Reading the current (mock) user — SSR-safe ──────────────────
// Returns "starry"/"seeker" defaults on the server and when no user is set.
function readUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("scoutit_user") || "null");
  } catch {
    return null;
  }
}

export function getCurrentTier() {
  const u = readUser();
  return (u && (u.subscription_tier || u.tier)) || "starry";
}

export function getCurrentRole() {
  const u = readUser();
  const roles = u && (u.active_roles || u.tags);
  return (Array.isArray(roles) && roles[0]) || "seeker";
}
