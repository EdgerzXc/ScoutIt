import { supabaseAdmin } from "./supabaseAdmin";
import {
  MONETIZATION_PHASES,
  PIONEER_ACCESS_BADGE_TEXT,
  PAYWALL_CONVERSION_INTENT_EVENT,
  resolveMonetizationPhase,
  evaluateMonetizationGate,
  logPaywallConversionIntent,
} from "./monetizationGate";

export {
  MONETIZATION_PHASES,
  PIONEER_ACCESS_BADGE_TEXT,
  PAYWALL_CONVERSION_INTENT_EVENT,
};

export async function resolveServerMonetizationPhase({
  envPhase,
  client,
  defaultPhase = MONETIZATION_PHASES.PRODUCTION_ENFORCED,
} = {}) {
  if (envPhase) {
    return resolveMonetizationPhase({ envPhase, defaultPhase });
  }

  if (typeof process !== "undefined" && process.env) {
    if (
      process.env.NEXT_PUBLIC_MONETIZATION_PHASE ||
      process.env.SCOUTIT_MONETIZATION_PHASE ||
      process.env.SCOUTIT_PRE_200_PREMIUM_LOCKER !== undefined
    ) {
      return resolveMonetizationPhase({ defaultPhase });
    }
  }

  const db = client !== undefined ? client : supabaseAdmin;
  if (db && typeof db.from === "function") {
    try {
      const { data } = await db
        .from("feature_flags")
        .select("id, is_enabled")
        .in("id", [
          "monetization_enforced",
          "production_enforced",
          "pilot_zero_paywall",
          "pre_200_premium_access",
          "pre_launch_free_mode",
        ]);

      if (Array.isArray(data) && data.length > 0) {
        const dbFlags = {};
        for (const row of data) {
          if (row && typeof row.id === "string") {
            dbFlags[row.id] = Boolean(row.is_enabled);
          }
        }
        return resolveMonetizationPhase({ dbFlags, defaultPhase });
      }
    } catch {
      // Fall back to defaultPhase when feature_flags table is unreachable
    }
  }

  return resolveMonetizationPhase({ defaultPhase });
}

export async function evaluateServerMonetizationGate({
  phase,
  client,
  defaultPhase = MONETIZATION_PHASES.PRODUCTION_ENFORCED,
  userId = null,
  feature = "off_market_vault",
  role = "seeker",
  tier = "starry",
  activePublishedCount = 0,
  swapWithPropertyId = null,
  connectsBalance = 0,
  requiredConnects = 1,
} = {}) {
  const resolvedPhase = await resolveServerMonetizationPhase({
    envPhase: phase,
    client,
    defaultPhase,
  });

  const decision = evaluateMonetizationGate({
    phase: resolvedPhase,
    feature,
    role,
    tier,
    activePublishedCount,
    swapWithPropertyId,
    connectsBalance,
    requiredConnects,
  });

  if (decision.isPilotZeroPaywall && userId) {
    await recordServerConversionIntent({
      client,
      userId,
      phase: resolvedPhase,
      feature,
      role,
      tier: decision.requiredTier || "universe",
      source: `server:${feature}`,
    });
  }

  return decision;
}

export async function recordServerConversionIntent({
  client,
  userId = null,
  phase,
  feature = "plan_upgrade",
  role = "seeker",
  tier = "universe",
  source = "server",
} = {}) {
  const entry = logPaywallConversionIntent({
    phase: phase || MONETIZATION_PHASES.PILOT_ZERO_PAYWALL,
    feature,
    role,
    tier,
    source,
  });

  const db = client !== undefined ? client : supabaseAdmin;
  if (db && typeof db.from === "function") {
    try {
      await db.from("analytics_events").insert({
        event_name: PAYWALL_CONVERSION_INTENT_EVENT,
        user_id: userId,
        metadata: {
          phase: entry.phase,
          feature: entry.feature,
          role: entry.role,
          tier: entry.tier,
          source: entry.source,
          pricePhp: entry.pricePhp,
          blocked: false,
        },
        created_at: entry.timestamp,
      });
    } catch {
      // Telemetry persistence is non-blocking
    }
  }

  return entry;
}
