/**
 * QuestIT Side System Policy Engine
 * Evaluates rules configured per company against requested actions.
 */

export const DEFAULT_POLICY = {
  auto_approve_bounties_under: 0, // Connects limit for auto-approval
  max_daily_bounties: 5,          // Max quests raised per day
  allowed_provider_tiers: ["starry", "solar", "cluster", "universe"], // Who can claim
  require_guild_membership: false // Only allow saved "Guild" members to claim
};

/**
 * Validates if a company can raise a new quest based on their policy.
 * @param {Object} policy - The company's policy_rules JSON.
 * @param {Object} questRequest - Details of the quest being raised.
 * @param {Object} currentUsage - The company's current usage metrics.
 * @returns {Object} { allowed: boolean, reason: string }
 */
export function canRaiseQuest(policy, questRequest, currentUsage) {
  const activePolicy = { ...DEFAULT_POLICY, ...(policy || {}) };

  // Check max daily bounties limit
  const todayCount = currentUsage.dailyBountiesRaised || 0;
  if (todayCount >= activePolicy.max_daily_bounties) {
    return {
      allowed: false,
      reason: `Policy Violation: Exceeded maximum daily bounties (${activePolicy.max_daily_bounties}).`
    };
  }

  // Example: Enforce that all bounties must have a minimum payout of 1 Connect
  if (questRequest.bounty_connects < 1) {
    return {
      allowed: false,
      reason: "Policy Violation: Bounty must be at least 1 Connect."
    };
  }

  return { allowed: true };
}

/**
 * Validates if a specific provider can claim a quest based on the company's policy.
 * @param {Object} policy - The company's policy_rules JSON.
 * @param {Object} provider - The provider profile attempting to claim.
 * @param {boolean} isGuildMember - Whether the provider is in the company's Guild.
 * @returns {Object} { allowed: boolean, reason: string }
 */
export function canClaimQuest(policy, provider, isGuildMember) {
  const activePolicy = { ...DEFAULT_POLICY, ...(policy || {}) };

  // Check guild restrictions
  if (activePolicy.require_guild_membership && !isGuildMember) {
    return {
      allowed: false,
      reason: "Policy Violation: This company only allows their Guild members to claim quests."
    };
  }

  // Check allowed tiers
  if (!activePolicy.allowed_provider_tiers.includes(provider.subscription_tier)) {
    return {
      allowed: false,
      reason: `Policy Violation: Provider tier '${provider.subscription_tier}' is not authorized by the company.`
    };
  }

  return { allowed: true };
}

/**
 * Determines if a completed quest should be automatically approved/paid out.
 * @param {Object} policy - The company's policy_rules JSON.
 * @param {Object} quest - The quest details.
 * @returns {boolean}
 */
export function shouldAutoApprove(policy, quest) {
  const activePolicy = { ...DEFAULT_POLICY, ...(policy || {}) };
  return quest.bounty_connects <= activePolicy.auto_approve_bounties_under;
}
