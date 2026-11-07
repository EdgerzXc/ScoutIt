export const DEFAULT_POLICY = {
  auto_approve_bounties_under: 0,
  max_daily_bounties: 5,
  allowed_provider_tiers: ["starry", "solar", "cluster", "universe"],
  require_guild_membership: false,
  max_bounty_connects: 500,
};

export const VALID_QUEST_SCOPES = Object.freeze([
  "pricing",
  "floorplan",
  "photos",
  "coordinates",
  "parking",
  "amenities",
  "zoning",
  "availability",
  "contact",
  "sqm",
]);

export function canRaiseQuest(policy, questRequest, currentUsage) {
  const activePolicy = { ...DEFAULT_POLICY, ...(policy || {}) };

  const todayCount = currentUsage?.dailyBountiesRaised || 0;
  if (todayCount >= activePolicy.max_daily_bounties) {
    return {
      allowed: false,
      reason: `Policy Violation: Exceeded maximum daily bounties (${activePolicy.max_daily_bounties}).`,
    };
  }

  const bounty = questRequest?.bounty_connects;
  if (typeof bounty !== "number" || !Number.isFinite(bounty) || bounty < 1) {
    return {
      allowed: false,
      reason: "Policy Violation: Bounty must be at least 1 Connect.",
    };
  }

  const maxCap = activePolicy.max_bounty_connects || 500;
  if (bounty > maxCap) {
    return {
      allowed: false,
      reason: `Policy Violation: Bounty (${bounty} Connects) exceeds maximum allowed cap (${maxCap} Connects).`,
    };
  }

  // Tier check: if a provider tier is specified, it must be in allowed_provider_tiers (A-312)
  if (questRequest?.provider_tier) {
    const tier = String(questRequest.provider_tier).toLowerCase();
    if (!activePolicy.allowed_provider_tiers.includes(tier)) {
      return {
        allowed: false,
        reason: `Policy Violation: Provider tier '${questRequest.provider_tier}' is not eligible for this quest.`,
      };
    }
  }

  // Scope check: if target_field / quest_scope is provided, check against allowlist (A-312)
  const scope = questRequest?.target_field || questRequest?.quest_scope;
  if (scope) {
    const normalizedScope = String(scope).toLowerCase();
    if (!VALID_QUEST_SCOPES.includes(normalizedScope)) {
      return {
        allowed: false,
        reason: `Policy Violation: Target field '${scope}' is not an authorized quest scope.`,
      };
    }
  }

  return { allowed: true };
}
