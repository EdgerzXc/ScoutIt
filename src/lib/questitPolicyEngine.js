export const DEFAULT_POLICY = {
  auto_approve_bounties_under: 0,
  max_daily_bounties: 5,
  allowed_provider_tiers: ["starry", "solar", "cluster", "universe"],
  require_guild_membership: false
};

export function canRaiseQuest(policy, questRequest, currentUsage) {
  const activePolicy = { ...DEFAULT_POLICY, ...(policy || {}) };

  const todayCount = currentUsage.dailyBountiesRaised || 0;
  if (todayCount >= activePolicy.max_daily_bounties) {
    return {
      allowed: false,
      reason: `Policy Violation: Exceeded maximum daily bounties (${activePolicy.max_daily_bounties}).`
    };
  }

  if (questRequest.bounty_connects < 1) {
    return {
      allowed: false,
      reason: "Policy Violation: Bounty must be at least 1 Connect."
    };
  }

  return { allowed: true };
}
