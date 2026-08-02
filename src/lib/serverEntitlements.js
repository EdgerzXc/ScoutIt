import { isEntitledOffMarketViewer } from "@/lib/propertyLifecycle";

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

  let lockerOpen = process.env.SCOUTIT_PRE_200_PREMIUM_LOCKER === "true";
  if (!lockerOpen) {
    const { data: flags } = await supabaseAdmin
      .from("feature_flags")
      .select("id, is_enabled")
      .in("id", ["premium_features_unlocked", "pre_200_premium_access"]);
    lockerOpen = (flags || []).some((flag) => flag.is_enabled === true);
  }

  const allowed = isEntitledOffMarketViewer({
    tier: profile.subscription_tier,
    lockerOpen,
  });
  return {
    allowed,
    reason: allowed ? (lockerOpen ? "pre_200_locker" : "tier") : "cluster_or_universe_required",
    profile,
  };
}
