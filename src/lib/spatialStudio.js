// ═══════════════════════════════════════════════════════════════════════════
// ScoutIt Spatial Studio — 3D Generation Queue & Fast-Track Revision Architecture
//
// Encodes the locked specification (A-196 per Master Action Plan & VAULT_LISTING_LIFECYCLE.md):
//   1. Concierge Queue Model over raw instant APIs (human-curated luxury twin generation)
//   2. Pre-Flight Style & Palette Selector (Minimalist Organic, Modern Executive, Tropical Luxury)
//   3. Interactive In-Viewer Material Swapper (zero turnaround wait time)
//   4. Express Revision Queue (4 to 12 hour SLA for existing scene geometry tweaks)
//   5. Subscription Entitlements (Solar 2/mo, Cluster 8/mo, Universe 25/mo) + 3 Connects overflow
// ═══════════════════════════════════════════════════════════════════════════

export const SPATIAL_STATUSES = Object.freeze([
  "NONE",
  "REQUESTED",
  "QUEUED",
  "IN_PRODUCTION",
  "REVISION_REQUESTED",
  "LIVE",
]);

export const VALID_STATUS_TRANSITIONS = Object.freeze({
  NONE: Object.freeze(["REQUESTED"]),
  REQUESTED: Object.freeze(["QUEUED", "NONE"]),
  QUEUED: Object.freeze(["IN_PRODUCTION", "NONE"]),
  IN_PRODUCTION: Object.freeze(["LIVE", "QUEUED"]),
  LIVE: Object.freeze(["REVISION_REQUESTED", "NONE"]),
  REVISION_REQUESTED: Object.freeze(["QUEUED", "LIVE", "NONE"]),
});

export function isValidSpatialTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false;
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(nextStatus);
}

// ── 1. Pre-Flight Style & Palette Presets ──────────────────────────────────
export const SPATIAL_STYLE_PRESETS = Object.freeze({
  minimalist_organic: Object.freeze({
    id: "minimalist_organic",
    name: "Minimalist Organic",
    subtitle: "Mediterranean Warmth & Pure Daylight",
    description: "Honed Italian travertine marble, pale European oak woodwork, warm linen accents, floor-to-ceiling glass.",
    materials: Object.freeze(["Italian Travertine", "Light European Oak", "Warm Linen"]),
    lighting: "Neutral Architectural Daylight (5000K)",
    recommendedFor: "Penthouses, coastal estates, high-end residential lofts",
  }),
  modern_executive: Object.freeze({
    id: "modern_executive",
    name: "Modern Executive",
    subtitle: "Corporate Obsidian & Architectural Depth",
    description: "Acoustic slatted walnut paneling, matte obsidian steel trim, clean architectural recessed linear LEDs.",
    materials: Object.freeze(["Slatted Walnut", "Matte Obsidian Trim", "Polished Concrete"]),
    lighting: "Architectural Recessed (3500K)",
    recommendedFor: "Grade-A corporate headquarters, tech executive suites, law chambers",
  }),
  tropical_luxury: Object.freeze({
    id: "tropical_luxury",
    name: "Tropical Luxury",
    subtitle: "Philippine Narra & Evening Amber Glow",
    description: "Native Philippine Narra hardwood, capiz and brushed brass detailing, hand-cut volcanic stone textures.",
    materials: Object.freeze(["Philippine Narra", "Capiz & Brushed Brass", "Earthy Stone"]),
    lighting: "Twilight Luxury Amber Glow (2700K)",
    recommendedFor: "Resort villas, heritage estates, flagship hospitality and dining venues",
  }),
});

// ── 2. Interactive In-Viewer Material Swapper Options ─────────────────────
export const MATERIAL_SWAP_OPTIONS = Object.freeze({
  flooring: Object.freeze([
    { id: "travertine", label: "Italian Travertine", hexHint: "#E4DCCF" },
    { id: "oak", label: "Light European Oak", hexHint: "#D2B48C" },
    { id: "concrete", label: "Polished Concrete", hexHint: "#8A8D8F" },
  ]),
  partitions: Object.freeze([
    { id: "fluted_glass", label: "Frameless Fluted Glass", opacityHint: 0.6 },
    { id: "slatted_timber", label: "Slatted Acoustic Timber", opacityHint: 0.95 },
    { id: "bronze_aluminum", label: "Bronze Aluminum", opacityHint: 1.0 },
  ]),
  lighting: Object.freeze([
    { id: "daylight", label: "Daytime Sun (5000K)", kelvin: 5000, tone: "neutral" },
    { id: "twilight", label: "Twilight Luxury (2700K)", kelvin: 2700, tone: "amber" },
  ]),
});

export const DEFAULT_MATERIAL_CONFIG = Object.freeze({
  flooring: "travertine",
  partitions: "fluted_glass",
  lighting: "daylight",
});

// ── 3. Subscription Entitlements & Connect Overflow ──────────────────────
export const SPATIAL_TIER_ALLOWANCES = Object.freeze({
  starry: 0,
  solar: 2,
  cluster: 8,
  universe: 25,
});

export const SPATIAL_OVERFLOW_CONNECT_COST = 3;

/**
 * Resolves whether a user can submit a 3D generation request, whether it is
 * covered by their tier allowance, or whether 3 Connects are required.
 */
export function resolveSpatialEntitlement({
  tier = "starry",
  monthlyGenerationsUsed = 0,
  currentConnects = 0,
} = {}) {
  const normTier = String(tier || "starry").toLowerCase();
  const allowance = SPATIAL_TIER_ALLOWANCES[normTier] ?? 0;
  const remainingAllowance = Math.max(0, allowance - Math.max(0, monthlyGenerationsUsed));

  if (remainingAllowance > 0) {
    return {
      coveredByTier: true,
      tier: normTier,
      remainingAllowance,
      connectCostRequired: 0,
      canProceed: true,
      reason: `Included in ${normTier.toUpperCase()} tier (${remainingAllowance} of ${allowance} remaining this month).`,
    };
  }

  // Tier allowance exhausted or Starry (0 allowance)
  const canAffordConnects = currentConnects >= SPATIAL_OVERFLOW_CONNECT_COST;
  return {
    coveredByTier: false,
    tier: normTier,
    remainingAllowance: 0,
    connectCostRequired: SPATIAL_OVERFLOW_CONNECT_COST,
    canProceed: canAffordConnects,
    reason: canAffordConnects
      ? `Tier allowance reached. Requires ${SPATIAL_OVERFLOW_CONNECT_COST} Connects (~₱60) from wallet.`
      : `Insufficient Connects. Requires ${SPATIAL_OVERFLOW_CONNECT_COST} Connects, but wallet has ${currentConnects}.`,
  };
}

// ── 4. SLA Timelines ─────────────────────────────────────────────────────
export const SPATIAL_SLA_HOURS = Object.freeze({
  standard: 48,  // 24–48 hours for initial blueprint/walkthrough generation
  express: 12,   // 4–12 hours for fast-track tweak on pre-built scene geometry
});

export function calculateTargetSlaDate({ isExpress = false, fromDate = new Date() } = {}) {
  const hours = isExpress ? SPATIAL_SLA_HOURS.express : SPATIAL_SLA_HOURS.standard;
  const target = new Date(fromDate.getTime());
  target.setHours(target.getHours() + hours);
  return {
    hours,
    targetDate: target,
    slaLabel: isExpress ? "4–12 Hours (Express Priority)" : "24–48 Hours (Standard Queue)",
  };
}
