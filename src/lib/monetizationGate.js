import { canSee, FEATURE_MIN_TIER } from "./entitlements";

export const MONETIZATION_PHASES = Object.freeze({
  PILOT_ZERO_PAYWALL: "pilot_zero_paywall",
  PRODUCTION_ENFORCED: "production_enforced",
});

export const PIONEER_ACCESS_BADGE_TEXT = "PIONEER ACCESS // FREE FOR LAUNCH";
export const PAYWALL_CONVERSION_INTENT_EVENT = "telemetry:paywall-conversion-intent";
export const UNIVERSE_MONTHLY_PRICE_PHP = 2499;
export const UNIVERSE_MONTHLY_PRICE_LABEL = "₱2,499/mo";

export const ACTIVE_LISTING_QUOTAS = Object.freeze({
  starry: 1,
  solar: 5,
  cluster: 20,
  universe: Infinity,
});

const ROLE_LISTING_CAPS = Object.freeze({
  owner: ACTIVE_LISTING_QUOTAS,
  broker: Object.freeze({ starry: 3, solar: 15, cluster: 50, universe: Infinity }),
});

const ROLE_MONTHLY_PRICES_PHP = Object.freeze({
  seeker: Object.freeze({ starry: 0, solar: 399, cluster: 999, universe: 2499 }),
  owner: Object.freeze({ starry: 0, solar: 799, cluster: 1999, universe: 4999 }),
  broker: Object.freeze({ starry: 0, solar: 599, cluster: 1499, universe: 3499 }),
  photographer: Object.freeze({ starry: 0, solar: 299, cluster: 799, universe: 1999 }),
  researcher: Object.freeze({ starry: 0, solar: 299, cluster: 799, universe: 1999 }),
  designer: Object.freeze({ starry: 0, solar: 299, cluster: 799, universe: 1999 }),
  "event-planner": Object.freeze({ starry: 0, solar: 299, cluster: 799, universe: 1999 }),
});

function resolveListingCap(role, tier) {
  const normRole = String(role || "owner").toLowerCase();
  const table = ROLE_LISTING_CAPS[normRole] || ROLE_LISTING_CAPS.owner;
  return table[String(tier || "starry").toLowerCase()] ?? 1;
}

function resolveMonthlyPricePhp(role, tier) {
  const normRole = String(role || "seeker").toLowerCase();
  const table = ROLE_MONTHLY_PRICES_PHP[normRole] || ROLE_MONTHLY_PRICES_PHP.seeker;
  return table[String(tier || "starry").toLowerCase()] ?? UNIVERSE_MONTHLY_PRICE_PHP;
}

const MAX_CONVERSION_INTENT_LOG = 250;
const conversionIntentRingBuffer = [];

function normalizePhaseToken(raw) {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().toLowerCase();
  if (
    cleaned === MONETIZATION_PHASES.PRODUCTION_ENFORCED ||
    cleaned === "production" ||
    cleaned === "enforced" ||
    cleaned === "monetized"
  ) {
    return MONETIZATION_PHASES.PRODUCTION_ENFORCED;
  }
  if (
    cleaned === MONETIZATION_PHASES.PILOT_ZERO_PAYWALL ||
    cleaned === "pilot" ||
    cleaned === "zero_paywall" ||
    cleaned === "north_star"
  ) {
    return MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;
  }
  return null;
}

export function resolveMonetizationPhase({
  envPhase,
  dbFlags,
  defaultPhase = MONETIZATION_PHASES.PILOT_ZERO_PAYWALL,
} = {}) {
  const explicit = normalizePhaseToken(envPhase);
  if (explicit) return explicit;

  if (typeof process !== "undefined" && process.env) {
    const publicEnv = normalizePhaseToken(process.env.NEXT_PUBLIC_MONETIZATION_PHASE);
    if (publicEnv) return publicEnv;

    const serverEnv = normalizePhaseToken(process.env.SCOUTIT_MONETIZATION_PHASE);
    if (serverEnv) return serverEnv;

    const lockerEnv = process.env.SCOUTIT_PRE_200_PREMIUM_LOCKER;
    if (lockerEnv === "true" || lockerEnv === "1") {
      return MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;
    }
    if (lockerEnv === "false" || lockerEnv === "0") {
      return MONETIZATION_PHASES.PRODUCTION_ENFORCED;
    }
  }

  if (dbFlags && typeof dbFlags === "object") {
    const dbPhase = normalizePhaseToken(dbFlags.monetization_phase);
    if (dbPhase) return dbPhase;
    if (dbFlags.monetization_enforced === true || dbFlags.production_enforced === true) {
      return MONETIZATION_PHASES.PRODUCTION_ENFORCED;
    }
    if (dbFlags.pilot_zero_paywall === true || dbFlags.pre_200_premium_access === true) {
      return MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;
    }
    if (dbFlags.pre_launch_free_mode === false) {
      return MONETIZATION_PHASES.PRODUCTION_ENFORCED;
    }
    if (dbFlags.pre_launch_free_mode === true) {
      return MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;
    }
  }

  return normalizePhaseToken(defaultPhase) || MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;
}

export function evaluateMonetizationGate({
  phase,
  dbFlags,
  defaultPhase,
  feature = "off_market_vault",
  role = "seeker",
  tier = "starry",
  activePublishedCount = 0,
  swapWithPropertyId = null,
  connectsBalance = 0,
  requiredConnects = 1,
} = {}) {
  const mode = resolveMonetizationPhase({ envPhase: phase, dbFlags, defaultPhase });
  const isPilotZeroPaywall = mode === MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;
  const isProductionEnforced = mode === MONETIZATION_PHASES.PRODUCTION_ENFORCED;
  const normalizedTier = String(tier || "starry").toLowerCase();
  const normalizedRole = String(role || "seeker").toLowerCase();
  const normalizedFeature = String(feature || "off_market_vault");

  if (isPilotZeroPaywall) {
    const quotaCap = resolveListingCap(normalizedRole, normalizedTier);
    return {
      mode,
      isPilotZeroPaywall: true,
      isProductionEnforced: false,
      allowed: true,
      blocked: false,
      badgeText: PIONEER_ACCESS_BADGE_TEXT,
      conversionIntentEvent: PAYWALL_CONVERSION_INTENT_EVENT,
      requiresUpgrade: false,
      requiresQuotaSwap: false,
      requiresConnectSpend: false,
      effectiveTier: "universe",
      requiredTier: "universe",
      pricePhp: UNIVERSE_MONTHLY_PRICE_PHP,
      priceLabel: UNIVERSE_MONTHLY_PRICE_LABEL,
      quotaCap,
      activePublishedCount: Number(activePublishedCount || 0),
      atomicSwapTargetId: swapWithPropertyId || null,
      cloudStorageUnlimited: true,
      reason: null,
    };
  }

  if (normalizedFeature === "off_market_vault" || normalizedFeature === "offMarketVault") {
    const allowed = normalizedTier === "universe";
    return {
      mode,
      isPilotZeroPaywall: false,
      isProductionEnforced: true,
      allowed,
      blocked: !allowed,
      badgeText: null,
      conversionIntentEvent: PAYWALL_CONVERSION_INTENT_EVENT,
      requiresUpgrade: !allowed,
      requiresQuotaSwap: false,
      requiresConnectSpend: false,
      effectiveTier: normalizedTier,
      requiredTier: "universe",
      pricePhp: UNIVERSE_MONTHLY_PRICE_PHP,
      priceLabel: UNIVERSE_MONTHLY_PRICE_LABEL,
      cloudStorageUnlimited: true,
      reason: allowed
        ? null
        : `Off-Market Vault access requires Universe tier membership (${UNIVERSE_MONTHLY_PRICE_LABEL}).`,
    };
  }

  if (normalizedFeature === "listing_quota" || normalizedFeature === "active_listing_quota") {
    const quotaCap = resolveListingCap(normalizedRole === "seeker" ? "owner" : normalizedRole, normalizedTier);
    const currentCount = Number(activePublishedCount || 0);
    const hasSwapTarget = Boolean(swapWithPropertyId && String(swapWithPropertyId).trim());
    const withinQuota = currentCount < quotaCap || hasSwapTarget;

    return {
      mode,
      isPilotZeroPaywall: false,
      isProductionEnforced: true,
      allowed: withinQuota,
      blocked: !withinQuota,
      badgeText: null,
      conversionIntentEvent: PAYWALL_CONVERSION_INTENT_EVENT,
      requiresUpgrade: !withinQuota,
      requiresQuotaSwap: !withinQuota,
      requiresConnectSpend: false,
      effectiveTier: normalizedTier,
      requiredTier: normalizedTier === "starry" ? "solar" : normalizedTier === "solar" ? "cluster" : "universe",
      pricePhp: UNIVERSE_MONTHLY_PRICE_PHP,
      priceLabel: UNIVERSE_MONTHLY_PRICE_LABEL,
      quotaCap,
      activePublishedCount: currentCount,
      atomicSwapTargetId: hasSwapTarget ? String(swapWithPropertyId).trim() : null,
      cloudStorageUnlimited: true,
      reason: withinQuota
        ? null
        : `Active listing quota reached (${currentCount}/${quotaCap}). Select a live listing to swap to off-market storage or upgrade your plan.`,
    };
  }

  if (normalizedFeature === "connects_spend") {
    const balance = Number(connectsBalance ?? 0);
    const needed = Math.max(0, Number(requiredConnects ?? 1));
    const allowed = balance >= needed;

    return {
      mode,
      isPilotZeroPaywall: false,
      isProductionEnforced: true,
      allowed,
      blocked: !allowed,
      badgeText: null,
      conversionIntentEvent: PAYWALL_CONVERSION_INTENT_EVENT,
      requiresUpgrade: !allowed,
      requiresQuotaSwap: false,
      requiresConnectSpend: !allowed,
      effectiveTier: normalizedTier,
      requiredConnects: needed,
      connectsBalance: balance,
      pricePhp: UNIVERSE_MONTHLY_PRICE_PHP,
      priceLabel: UNIVERSE_MONTHLY_PRICE_LABEL,
      cloudStorageUnlimited: true,
      reason: allowed ? null : "Insufficient Connects balance for this action.",
    };
  }

  if (normalizedFeature === "owner_cloud_storage") {
    return {
      mode,
      isPilotZeroPaywall: false,
      isProductionEnforced: true,
      allowed: true,
      blocked: false,
      badgeText: null,
      conversionIntentEvent: PAYWALL_CONVERSION_INTENT_EVENT,
      requiresUpgrade: false,
      requiresQuotaSwap: false,
      requiresConnectSpend: false,
      effectiveTier: normalizedTier,
      cloudStorageUnlimited: true,
      reason: null,
    };
  }

  const requiredTier = FEATURE_MIN_TIER[normalizedFeature] || "universe";
  const allowed = FEATURE_MIN_TIER[normalizedFeature]
    ? canSee(normalizedFeature, normalizedTier)
    : normalizedTier === "universe";
  const resolvedPrice = resolveMonthlyPricePhp(normalizedRole, requiredTier);

  return {
    mode,
    isPilotZeroPaywall: false,
    isProductionEnforced: true,
    allowed,
    blocked: !allowed,
    badgeText: null,
    conversionIntentEvent: PAYWALL_CONVERSION_INTENT_EVENT,
    requiresUpgrade: !allowed,
    requiresQuotaSwap: false,
    requiresConnectSpend: false,
    effectiveTier: normalizedTier,
    requiredTier,
    pricePhp: resolvedPrice,
    priceLabel: `₱${resolvedPrice.toLocaleString("en-PH")}/mo`,
    cloudStorageUnlimited: true,
    reason: allowed ? null : `Requires ${requiredTier.toUpperCase()} tier membership.`,
  };
}

export function logPaywallConversionIntent(payload = {}) {
  const phase = resolveMonetizationPhase({
    envPhase: payload.phase,
    dbFlags: payload.dbFlags,
  });
  const tier = String(payload.tier || "universe").toLowerCase();
  const role = String(payload.role || "seeker").toLowerCase();
  const pricePhp =
    typeof payload.pricePhp === "number"
      ? payload.pricePhp
      : resolveMonthlyPricePhp(role, tier);

  const record = {
    event: PAYWALL_CONVERSION_INTENT_EVENT,
    phase,
    feature: String(payload.feature || "plan_upgrade"),
    role,
    tier,
    source: String(payload.source || "pricing"),
    pricePhp,
    blocked: false,
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  conversionIntentRingBuffer.push(record);
  if (conversionIntentRingBuffer.length > MAX_CONVERSION_INTENT_LOG) {
    conversionIntentRingBuffer.shift();
  }

  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent(PAYWALL_CONVERSION_INTENT_EVENT, { detail: record })
      );
    } catch {
      // CustomEvent dispatch is non-blocking in restricted browser environments
    }
  }

  return record;
}

export function getConversionIntentLog() {
  return [...conversionIntentRingBuffer];
}

export function clearConversionIntentLog() {
  conversionIntentRingBuffer.length = 0;
}
