/**
 * ═══════════════════════════════════════════════════════════════════════
 * A-182: BEHAVIORAL SCORING ENGINE & HONEST BLANK TRUST CREDENTIALS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Implements deterministic behavioral scoring for tenants, renters, and buyers
 * on the ScoutIt Space Intelligence Platform.
 *
 * Core Principles:
 * 1. Honest Blank Rule: A new seeker with 0 transactions is NEVER given 0% or 0/5.
 *    They receive the neutral "[First-Time Verified Seeker]" credential.
 * 2. Vector-Weighted Scoring: Evaluates 4 distinct real estate vectors:
 *    - Payment Punctuality (weight: 0.35)
 *    - Space Care & Maintenance (weight: 0.25)
 *    - Communication & Conduct (weight: 0.20)
 *    - Lease Covenant Adherence (weight: 0.20)
 * 3. Anti-Self-Dealing & Handshake Gating: Review authority is strictly gated
 *    behind a completed two-sided transaction handshake (Handshake #2).
 * 4. Dual-CMS Boundary: Private tenant evaluations are stored strictly in
 *    Supabase user state, NEVER in Airtable's public catalog.
 */

export const EVALUATION_VECTORS = Object.freeze({
  PAYMENT_PUNCTUALITY: "payment_punctuality",
  SPACE_CARE_MAINTENANCE: "space_care_maintenance",
  COMMUNICATION_CONDUCT: "communication_conduct",
  LEASE_COVENANT_ADHERENCE: "lease_covenant_adherence",
});

export const VECTOR_WEIGHTS = Object.freeze({
  [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 0.35,
  [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 0.25,
  [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 0.20,
  [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 0.20,
});

export const TRUST_TIERS = Object.freeze({
  HONEST_BLANK: {
    id: "TIER_HONEST_BLANK",
    label: "First-Time Verified Seeker",
    displayBadge: "[First-Time Verified Seeker]",
    minScore: null,
  },
  SOVEREIGN: {
    id: "TIER_SOVEREIGN",
    label: "Sovereign Standing",
    displayBadge: "[Sovereign Resident]",
    minScore: 90.0,
  },
  ESTEEMED: {
    id: "TIER_ESTEEMED",
    label: "Esteemed Resident",
    displayBadge: "[Esteemed Resident]",
    minScore: 80.0,
  },
  VERIFIED: {
    id: "TIER_VERIFIED",
    label: "Verified Good Standing",
    displayBadge: "[Verified Resident]",
    minScore: 70.0,
  },
  STANDARD: {
    id: "TIER_STANDARD",
    label: "Standard Resident",
    displayBadge: "[Standard Resident]",
    minScore: 0.0,
  },
});

/**
 * Validates that all vector ratings are within the valid [1, 5] numerical range.
 * @param {object} vectorRatings
 * @returns {boolean}
 */
export function isValidVectorRatings(vectorRatings) {
  if (!vectorRatings || typeof vectorRatings !== "object") return false;

  for (const vectorKey of Object.values(EVALUATION_VECTORS)) {
    const val = vectorRatings[vectorKey];
    if (typeof val !== "number" || !Number.isFinite(val) || val < 1 || val > 5) {
      return false;
    }
  }
  return true;
}

/**
 * Calculates a single review's weighted composite score (0.00 – 100.00).
 * @param {object} vectorRatings - Object containing ratings for each EVALUATION_VECTOR
 * @returns {number} Score from 20.00 to 100.00
 */
export function calculateReviewCompositeScore(vectorRatings) {
  if (!isValidVectorRatings(vectorRatings)) {
    throw new Error("Invalid vector ratings provided. Each vector must be rated 1 to 5.");
  }

  let weightedSum = 0;
  for (const [vectorKey, weight] of Object.entries(VECTOR_WEIGHTS)) {
    const rating = vectorRatings[vectorKey];
    // Normalize 1-5 to a 0-100 scale: rating / 5 * 100
    const normalized = (rating / 5) * 100;
    weightedSum += normalized * weight;
  }

  return Math.round(weightedSum * 100) / 100;
}

/**
 * Resolves a numerical composite score into a luxury platform trust tier.
 * @param {number|null} score
 * @returns {object} Tier definition
 */
export function resolveTrustTier(score) {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return TRUST_TIERS.HONEST_BLANK;
  }

  if (score >= TRUST_TIERS.SOVEREIGN.minScore) return TRUST_TIERS.SOVEREIGN;
  if (score >= TRUST_TIERS.ESTEEMED.minScore) return TRUST_TIERS.ESTEEMED;
  if (score >= TRUST_TIERS.VERIFIED.minScore) return TRUST_TIERS.VERIFIED;
  return TRUST_TIERS.STANDARD;
}

/**
 * Computes the aggregate user behavioral trust credentials from a list of reviews.
 * Adheres strictly to the Honest Blank Rule and filters out active disputes / double-blind locked reviews.
 *
 * @param {object} params
 * @param {number} [params.transactionCount=0]
 * @param {Array<object>} [params.reviews=[]]
 * @param {boolean} [params.isKycVerified=false]
 * @returns {object} Trust credential object
 */
export function computeUserTrustCredential({
  transactionCount = 0,
  reviews = [],
  isKycVerified = false,
} = {}) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  // Filter for unlocked, non-disputed reviews only
  const eligibleReviews = safeReviews.filter((r) => {
    if (!r) return false;
    // Disputed reviews are quarantined
    if (r.is_disputed || r.disputed_at) return false;
    // Locked double-blind reviews cannot be read or aggregated
    if (r.is_double_blind_locked || r.status === "locked" || r.status === "pending_counterparty") return false;
    return isValidVectorRatings(r.vectors || r.vector_ratings);
  });

  // Honest Blank Cold-Start Rule:
  // If user has 0 transactions or 0 unlocked reviews, return honest neutral badge without penalties
  if (transactionCount === 0 || eligibleReviews.length === 0) {
    return {
      tier: TRUST_TIERS.HONEST_BLANK.id,
      label: TRUST_TIERS.HONEST_BLANK.label,
      displayBadge: TRUST_TIERS.HONEST_BLANK.displayBadge,
      compositeScore: null,
      isHonestBlank: true,
      transactionCount: Math.max(0, transactionCount),
      eligibleReviewCount: 0,
      isKycVerified: Boolean(isKycVerified),
      vectorAverages: null,
    };
  }

  // Calculate vector averages and overall composite score
  const vectorSums = {
    [EVALUATION_VECTORS.PAYMENT_PUNCTUALITY]: 0,
    [EVALUATION_VECTORS.SPACE_CARE_MAINTENANCE]: 0,
    [EVALUATION_VECTORS.COMMUNICATION_CONDUCT]: 0,
    [EVALUATION_VECTORS.LEASE_COVENANT_ADHERENCE]: 0,
  };

  let totalScoreSum = 0;
  for (const r of eligibleReviews) {
    const vectors = r.vectors || r.vector_ratings;
    const reviewScore = calculateReviewCompositeScore(vectors);
    totalScoreSum += reviewScore;

    for (const vKey of Object.values(EVALUATION_VECTORS)) {
      vectorSums[vKey] += vectors[vKey];
    }
  }

  const count = eligibleReviews.length;
  const compositeScore = Math.round((totalScoreSum / count) * 100) / 100;

  const vectorAverages = {};
  for (const vKey of Object.values(EVALUATION_VECTORS)) {
    vectorAverages[vKey] = Math.round((vectorSums[vKey] / count) * 10) / 10;
  }

  const tier = resolveTrustTier(compositeScore);

  return {
    tier: tier.id,
    label: tier.label,
    displayBadge: tier.displayBadge,
    compositeScore,
    isHonestBlank: false,
    transactionCount: Math.max(count, transactionCount),
    eligibleReviewCount: count,
    isKycVerified: Boolean(isKycVerified),
    vectorAverages,
  };
}

/**
 * Validates authority to create a review between two platform parties.
 * Enforces anti-self-dealing and Handshake #2 completion.
 *
 * @param {object} params
 * @param {string} params.reviewerId
 * @param {string} params.targetUserId
 * @param {string} params.qualifyingHandshakeId
 * @param {object} params.handshake - The qualifying handshake record
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateReviewAuthority({
  reviewerId,
  targetUserId,
  qualifyingHandshakeId,
  handshake,
}) {
  if (!reviewerId || !targetUserId) {
    return { valid: false, error: "MISSING_IDENTITIES: Both reviewer and target user IDs are required." };
  }

  // Anti-Self-Dealing Check
  if (reviewerId === targetUserId) {
    return { valid: false, error: "SELF_DEALING_PROHIBITED: You cannot review yourself." };
  }

  if (!qualifyingHandshakeId || !handshake) {
    return { valid: false, error: "UNVERIFIED_TRANSACTION: A verified qualifying deal handshake is required." };
  }

  // Handshake #2 must be completed/co-confirmed
  const isCompleted =
    handshake.status === "completed" ||
    Boolean(handshake.party_a_signed_at && handshake.party_b_signed_at);

  if (!isCompleted) {
    return { valid: false, error: "HANDSHAKE_INCOMPLETE: Handshake #2 transaction closing is not completed." };
  }

  // Reviewer and target must be the authorized counterparties in the handshake
  const parties = [
    handshake.party_a_user_id || handshake.party_a_id || handshake.owner_id || handshake.buyer_id,
    handshake.party_b_user_id || handshake.party_b_id || handshake.broker_id || handshake.tenant_id,
  ].filter(Boolean);

  if (parties.length >= 2) {
    const hasReviewer = parties.includes(reviewerId);
    const hasTarget = parties.includes(targetUserId);
    if (!hasReviewer || !hasTarget) {
      return { valid: false, error: "PARTY_MISMATCH: Parties do not match the authorized transaction participants." };
    }
  }

  return { valid: true };
}
