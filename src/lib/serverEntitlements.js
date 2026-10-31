import { isEntitledOffMarketViewer } from "@/lib/propertyLifecycle";
import { MONETIZATION_PHASES, PIONEER_ACCESS_BADGE_TEXT } from "@/lib/monetizationGate";
import { resolveServerMonetizationPhase, recordServerConversionIntent } from "@/lib/serverMonetizationGate";

export async function canReadOffMarket({ supabaseAdmin, userId, propertyOwnerId = null } = {}) {
  if (!supabaseAdmin || !userId) return { allowed: false, reason: "authentication_required", profile: null };
  if (propertyOwnerId && propertyOwnerId === userId) {
    return { allowed: true, reason: "owner", profile: null };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, role, active_roles, subscription_tier")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return { allowed: false, reason: "entitlement_unavailable", profile: null };
  }

  const monetizationPhase = await resolveServerMonetizationPhase({ client: supabaseAdmin });
  let lockerOpen =
    process.env.SCOUTIT_PRE_200_PREMIUM_LOCKER === "true" ||
    monetizationPhase === MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;
  if (!lockerOpen && process.env.NEXT_PUBLIC_MONETIZATION_PHASE !== MONETIZATION_PHASES.PRODUCTION_ENFORCED) {
    const { data: flags } = await supabaseAdmin
      .from("feature_flags")
      .select("id, is_enabled")
      .in("id", ["premium_features_unlocked", "pre_200_premium_access", "pilot_zero_paywall"]);
    lockerOpen = (flags || []).some((flag) => flag.is_enabled === true);
  }

  if (lockerOpen && String(profile.subscription_tier || "").toLowerCase() !== "universe") {
    await recordServerConversionIntent({
      client: supabaseAdmin,
      userId,
      phase: MONETIZATION_PHASES.PILOT_ZERO_PAYWALL,
      feature: "off_market_vault",
      role: "seeker",
      tier: "universe",
      source: "serverEntitlements:canReadOffMarket",
    });
  }

  const allowed = isEntitledOffMarketViewer({
    tier: profile.subscription_tier,
    lockerOpen,
  });
  return {
    allowed,
    reason: allowed ? (lockerOpen ? "pre_200_locker" : "tier") : "universe_required",
    monetizationPhase,
    badgeText: lockerOpen ? PIONEER_ACCESS_BADGE_TEXT : null,
    profile,
  };
}
