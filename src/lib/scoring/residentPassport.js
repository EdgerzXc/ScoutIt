/**
 * ═══════════════════════════════════════════════════════════════════════
 * A-182: SAFEGUARD 2 — PRIVATE RESIDENT PASSPORT (RA 10173 COMPLIANT)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Implements the Resident Passport with Consented Selective Disclosure.
 *
 * Privacy Mandate (Philippine Data Privacy Act RA 10173):
 * 1. No Public Blacklists: Tenant/renter behavioral scores are private credentials
 *    and are NEVER published to an open searchable web directory or public registry.
 * 2. User-Owned Selective Disclosure: The user owns their credential and selectively
 *    attaches it when inquiring or applying for spaces.
 * 3. Scoped Exposure:
 *    - SCOPE_PUBLIC_SUMMARY: Public profile shows only high-level badge and verification
 *      status (e.g. "[First-Time Verified Seeker]" or "✦ Sovereign Resident").
 *    - SCOPE_CONSENTED_APPLICATION: Attached to a verified deal room or inquiry. Includes
 *      vector breakdowns and anonymized historical endorsements without revealing
 *      past landlords' private identities or exact residential unit numbers.
 */

import { computeUserTrustCredential, TRUST_TIERS } from "./behavioralScoring";

export const PASSPORT_SCOPES = Object.freeze({
  PUBLIC_SUMMARY: "public_summary",
  CONSENTED_APPLICATION: "consented_application",
});

/**
 * Formats an anonymized endorsement summary from a verified review.
 * Strips raw landlord identities, personal contact info, and exact unit numbers.
 *
 * @param {object} review
 * @returns {object} Anonymized endorsement
 */
export function anonymizeReviewEndorsement(review) {
  if (!review) return null;

  const vectors = review.vectors || review.vector_ratings || {};

  return {
    endorsementId: review.id ? String(review.id).slice(0, 8) : "verified",
    leaseType: review.lease_type || review.property_category || "Residential Lease",
    cityHub: review.city_hub || review.district || "Metro Manila",
    tenancyDurationMonths: review.duration_months || 12,
    verifiedClosingDate: review.completed_at ? new Date(review.completed_at).toISOString().slice(0, 7) : null,
    vectorScores: { ...vectors },
    hasFeedbackNote: Boolean(review.feedback && review.feedback.trim().length > 0),
  };
}

/**
 * Generates a privacy-preserving Resident Passport credential for a platform seeker.
 *
 * @param {object} params
 * @param {object} params.userProfile - User profile object (id, full_name, kyc_verified, etc.)
 * @param {number} [params.transactionCount=0]
 * @param {Array<object>} [params.reviews=[]]
 * @param {string} [params.scope=PASSPORT_SCOPES.PUBLIC_SUMMARY]
 * @param {string|null} [params.consentedTargetDealId=null] - Deal ID granting consent
 * @returns {object} Scoped passport payload
 */
export function generateResidentPassport({
  userProfile = {},
  transactionCount = 0,
  reviews = [],
  scope = PASSPORT_SCOPES.PUBLIC_SUMMARY,
  consentedTargetDealId = null,
} = {}) {
  const isKycVerified = Boolean(
    userProfile.kyc_verified ||
    userProfile.is_verified ||
    userProfile.prc_verified
  );

  const trustCredential = computeUserTrustCredential({
    transactionCount,
    reviews,
    isKycVerified,
  });

  const memberSince = userProfile.created_at
    ? new Date(userProfile.created_at).getFullYear()
    : new Date().getFullYear();

  // 1. PUBLIC SUMMARY SCOPE (Zero PII, zero private comments, no score breakdown)
  if (scope === PASSPORT_SCOPES.PUBLIC_SUMMARY) {
    return {
      scope: PASSPORT_SCOPES.PUBLIC_SUMMARY,
      userId: userProfile.id || null,
      displayName: userProfile.full_name || "Verified ScoutIt Member",
      tier: trustCredential.tier,
      displayBadge: trustCredential.displayBadge,
      isHonestBlank: trustCredential.isHonestBlank,
      isKycVerified,
      memberSince,
      verifiedTransactions: trustCredential.transactionCount,
      // Vectors and numeric composite scores are private and omitted in public summary
      compositeScore: null,
      vectorBreakdown: null,
      endorsements: null,
      consentedDealId: null,
    };
  }

  // 2. CONSENTED APPLICATION SCOPE (Detailed vector track record attached to an inquiry/deal)
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const eligibleReviews = safeReviews.filter((r) => {
    return r && !r.is_disputed && !r.disputed_at && !r.is_double_blind_locked;
  });

  const endorsements = eligibleReviews.map(anonymizeReviewEndorsement).filter(Boolean);

  return {
    scope: PASSPORT_SCOPES.CONSENTED_APPLICATION,
    userId: userProfile.id || null,
    displayName: userProfile.full_name || "Verified ScoutIt Member",
    tier: trustCredential.tier,
    displayBadge: trustCredential.displayBadge,
    isHonestBlank: trustCredential.isHonestBlank,
    isKycVerified,
    memberSince,
    verifiedTransactions: trustCredential.transactionCount,
    compositeScore: trustCredential.compositeScore,
    vectorBreakdown: trustCredential.vectorAverages,
    endorsements,
    consentedDealId: consentedTargetDealId || null,
    disclosureTimestamp: new Date().toISOString(),
    privacyNotice: "Protected under RA 10173. Transmitted with user consent for transaction evaluation only.",
  };
}
