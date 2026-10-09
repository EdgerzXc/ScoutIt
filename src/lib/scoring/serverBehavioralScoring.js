/**
 * ═══════════════════════════════════════════════════════════════════════
 * A-182 PHASE 2: SERVER BEHAVIORAL SCORING & PERSISTENCE SERVICE
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Implements the backend transaction lifecycle for tenant/buyer reviews,
 * 14-day double-blind review locking, dispute quarantine, and automatic
 * metric aggregation to Supabase tables:
 * - public.user_behavioral_reviews
 * - public.user_behavioral_metrics
 *
 * Invariants Enforced:
 * 1. Dual-CMS Rule: Zero behavioral data synced to Airtable. All private
 *    records persist strictly in Supabase under RLS.
 * 2. Handshake Gating: Only completed transaction handshakes permit reviews.
 * 3. 14-Day Anti-Retaliation Window: Blind until both submit or window elapses.
 * 4. Honest Blank Rule: New seekers default to [First-Time Verified Seeker].
 * 5. RA 10173 Scoped Resident Passports: Selective disclosure only.
 */

import {
  isValidVectorRatings,
  computeUserTrustCredential,
  validateReviewAuthority,
} from "./behavioralScoring";
import {
  isSubmissionWindowOpen,
  REVIEW_WINDOW_MS,
} from "./doubleBlindReview";
import {
  generateResidentPassport,
  PASSPORT_SCOPES,
} from "./residentPassport";

/**
 * Submits a behavioral review for a transaction counterparty.
 *
 * @param {object} supabaseAdmin - Privileged Supabase client
 * @param {object} params
 * @param {string} params.dealId - Deal UUID
 * @param {string} params.reviewerId - Authenticated caller UUID
 * @param {object} params.vectors - 4-vector ratings object (1-5 each)
 * @param {string} [params.feedback=""] - Qualitative feedback
 * @param {string} [params.leaseType="Residential Lease"] - Category
 * @param {number} [params.durationMonths=12] - Tenancy duration
 * @returns {Promise<{ success: boolean, state?: string, reviewId?: string, error?: string, message?: string }>}
 */
export async function submitBehavioralReview(supabaseAdmin, {
  dealId,
  reviewerId,
  vectors,
  feedback = "",
  leaseType = "Residential Lease",
  durationMonths = 12,
}) {
  if (!supabaseAdmin) {
    return { success: false, error: "SERVICE_UNAVAILABLE: Database connection missing." };
  }

  if (!dealId || !reviewerId) {
    return { success: false, error: "MISSING_IDENTITIES: Both dealId and reviewerId are required." };
  }

  if (!isValidVectorRatings(vectors)) {
    return {
      success: false,
      error: "INVALID_VECTORS: All 4 evaluation vectors (payment_punctuality, space_care_maintenance, communication_conduct, lease_covenant_adherence) must be rated 1 to 5.",
    };
  }

  // 1. Fetch the deal record
  const { data: deal, error: dealError } = await supabaseAdmin
    .from("deals")
    .select("id, buyer_id, broker_id, property_id, status, closed_at, updated_at")
    .eq("id", dealId)
    .maybeSingle();

  if (dealError || !deal) {
    return { success: false, error: "DEAL_NOT_FOUND: The requested deal was not found." };
  }

  // 2. Validate reviewer participation and resolve target user ID
  const isBuyer = String(deal.buyer_id) === String(reviewerId);
  const isBroker = String(deal.broker_id) === String(reviewerId);

  if (!isBuyer && !isBroker) {
    return { success: false, error: "UNAUTHORIZED_PARTY: You are not a registered participant in this deal." };
  }

  const targetUserId = isBuyer ? deal.broker_id : deal.buyer_id;

  if (!targetUserId || targetUserId === reviewerId) {
    return { success: false, error: "INVALID_COUNTERPARTY: Counterparty identity is invalid or self-dealing." };
  }

  // 3. Find the completed transaction handshake
  const { data: handshakes, error: hsError } = await supabaseAdmin
    .from("deal_handshakes")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });

  if (hsError) {
    return { success: false, error: "HANDSHAKE_LOOKUP_FAILED: Failed to verify deal handshakes." };
  }

  // Find a qualifying transaction handshake that is completed or signed by both parties
  const qualifyingHandshake = (handshakes || []).find((h) => (
    h.status === "completed" ||
    Boolean(h.party_a_signed_at && h.party_b_signed_at)
  ));

  if (!qualifyingHandshake) {
    return {
      success: false,
      error: "NO_QUALIFYING_HANDSHAKE: Review authority requires a completed, two-sided transaction handshake.",
    };
  }

  // 4. Validate Review Authority & Anti-Self-Dealing
  const authorityCheck = validateReviewAuthority({
    reviewerId,
    targetUserId,
    qualifyingHandshakeId: qualifyingHandshake.id,
    handshake: qualifyingHandshake,
  });

  if (!authorityCheck.valid) {
    return { success: false, error: authorityCheck.error };
  }

  // 5. Verify 14-Day Anti-Retaliation Window
  const closedAt = qualifyingHandshake.updated_at ||
    qualifyingHandshake.party_b_signed_at ||
    deal.closed_at ||
    qualifyingHandshake.created_at;

  if (!isSubmissionWindowOpen(closedAt)) {
    return {
      success: false,
      error: "EXPIRED_WINDOW: The 14-day review window for this transaction has closed.",
    };
  }

  // 6. Immutability Check: Prevent duplicate reviews for the same handshake
  const { data: existingReview } = await supabaseAdmin
    .from("user_behavioral_reviews")
    .select("id")
    .eq("qualifying_handshake_id", qualifyingHandshake.id)
    .eq("reviewer_id", reviewerId)
    .maybeSingle();

  if (existingReview) {
    return {
      success: false,
      error: "ALREADY_SUBMITTED: You have already submitted an immutable review for this transaction.",
    };
  }

  // 7. Check if counterparty has already submitted
  const { data: counterpartyReview } = await supabaseAdmin
    .from("user_behavioral_reviews")
    .select("id, is_double_blind_locked, submitted_at")
    .eq("qualifying_handshake_id", qualifyingHandshake.id)
    .eq("reviewer_id", targetUserId)
    .maybeSingle();

  const isCounterpartySubmitted = Boolean(counterpartyReview && counterpartyReview.id);

  if (isCounterpartySubmitted) {
    // Both parties have submitted -> SIMULTANEOUS UNLOCK!
    const { data: newReview, error: insertError } = await supabaseAdmin
      .from("user_behavioral_reviews")
      .insert({
        qualifying_handshake_id: qualifyingHandshake.id,
        property_id: String(deal.property_id || qualifyingHandshake.property_id || ""),
        reviewer_id: reviewerId,
        target_user_id: targetUserId,
        lease_type: leaseType,
        duration_months: Number(durationMonths) || 12,
        vectors,
        feedback: feedback ? String(feedback).trim() : "",
        is_double_blind_locked: false,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: `INSERT_FAILED: ${insertError.message}` };
    }

    // Unlock counterparty's review
    await supabaseAdmin
      .from("user_behavioral_reviews")
      .update({ is_double_blind_locked: false })
      .eq("id", counterpartyReview.id);

    // Refresh metrics for both parties
    await refreshUserMetrics(supabaseAdmin, reviewerId);
    await refreshUserMetrics(supabaseAdmin, targetUserId);

    return {
      success: true,
      state: "SIMULTANEOUSLY_UNLOCKED",
      reviewId: newReview.id,
      message: "Mutual review submitted. Both reviews are now unlocked and resident trust credentials updated.",
    };
  }

  // Counterparty has not submitted -> SINGLE SUBMITTED (Double-Blind Lock Active)
  const { data: newReview, error: insertError } = await supabaseAdmin
    .from("user_behavioral_reviews")
    .insert({
      qualifying_handshake_id: qualifyingHandshake.id,
      property_id: String(deal.property_id || qualifyingHandshake.property_id || ""),
      reviewer_id: reviewerId,
      target_user_id: targetUserId,
      lease_type: leaseType,
      duration_months: Number(durationMonths) || 12,
      vectors,
      feedback: feedback ? String(feedback).trim() : "",
      is_double_blind_locked: true,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: `INSERT_FAILED: ${insertError.message}` };
  }

  // Target user's metrics stay clean / honest blank until unlock
  await refreshUserMetrics(supabaseAdmin, targetUserId);

  return {
    success: true,
    state: "SINGLE_SUBMITTED",
    reviewId: newReview.id,
    message: "Review recorded secretly under double-blind lock. Counterparty has 14 days to submit their evaluation.",
  };
}

/**
 * Re-evaluates a user's behavioral standing, unlocks expired 14-day reviews,
 * and upserts their composite score into public.user_behavioral_metrics.
 *
 * @param {object} supabaseAdmin - Privileged Supabase client
 * @param {string} userId - User UUID
 * @returns {Promise<{ credential: object, metrics: object, profile: object }>}
 */
export async function refreshUserMetrics(supabaseAdmin, userId) {
  if (!supabaseAdmin || !userId) return null;

  // 1. Auto-unlock reviews whose 14-day anti-retaliation window has elapsed
  const fourteenDaysAgo = new Date(Date.now() - REVIEW_WINDOW_MS).toISOString();
  await supabaseAdmin
    .from("user_behavioral_reviews")
    .update({ is_double_blind_locked: false })
    .eq("target_user_id", userId)
    .eq("is_double_blind_locked", true)
    .lte("submitted_at", fourteenDaysAgo);

  // 2. Fetch all unlocked, non-disputed reviews where this user is the target
  const { data: unlockedReviews } = await supabaseAdmin
    .from("user_behavioral_reviews")
    .select("id, lease_type, duration_months, vectors, feedback, submitted_at, is_double_blind_locked, is_disputed")
    .eq("target_user_id", userId)
    .eq("is_double_blind_locked", false)
    .eq("is_disputed", false);

  // 3. Count completed transactions from deals
  const { count: txCount } = await supabaseAdmin
    .from("deals")
    .select("id", { count: "exact", head: true })
    .or(`buyer_id.eq.${userId},broker_id.eq.${userId}`)
    .eq("status", "completed");

  // 4. Fetch user profile for verification metadata
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id, kyc_verified, is_verified, prc_verified, full_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  const isKycVerified = Boolean(
    profile?.kyc_verified ||
    profile?.is_verified ||
    profile?.prc_verified
  );

  // 5. Compute deterministic trust credential (Honest Blank Rule applied)
  const credential = computeUserTrustCredential({
    transactionCount: txCount || 0,
    reviews: unlockedReviews || [],
    isKycVerified,
  });

  // 6. Upsert into public.user_behavioral_metrics
  const metricsRow = {
    user_id: userId,
    tier: credential.tier,
    display_badge: credential.displayBadge,
    composite_score: credential.compositeScore,
    eligible_review_count: credential.eligibleReviewCount,
    transaction_count: credential.transactionCount,
    vector_averages: credential.vectorAverages,
    updated_at: new Date().toISOString(),
  };

  await supabaseAdmin
    .from("user_behavioral_metrics")
    .upsert(metricsRow);

  return { credential, metrics: metricsRow, profile: profile || {} };
}

/**
 * Retrieves the user's private Resident Passport with selective disclosure scoping.
 *
 * @param {object} supabaseAdmin - Privileged Supabase client
 * @param {string} userId - User UUID
 * @param {string} [scope=PASSPORT_SCOPES.PUBLIC_SUMMARY] - Disclosure scope
 * @param {string|null} [activeDealId=null] - Optional deal context
 * @returns {Promise<{ passport: object, metrics: object }>}
 */
export async function getUserResidentPassport(
  supabaseAdmin,
  userId,
  scope = PASSPORT_SCOPES.PUBLIC_SUMMARY,
  activeDealId = null,
) {
  if (!supabaseAdmin || !userId) {
    return { passport: null, metrics: null };
  }

  // Refresh to ensure any elapsed 14-day locks are unlocked
  const { credential, metrics, profile } = await refreshUserMetrics(supabaseAdmin, userId);

  // Fetch unlocked reviews for endorsement formatting
  const { data: unlockedReviews } = await supabaseAdmin
    .from("user_behavioral_reviews")
    .select("id, lease_type, duration_months, vectors, feedback, submitted_at, is_double_blind_locked, is_disputed")
    .eq("target_user_id", userId)
    .eq("is_double_blind_locked", false)
    .eq("is_disputed", false);

  const passport = generateResidentPassport({
    userProfile: profile,
    transactionCount: metrics.transaction_count,
    reviews: unlockedReviews || [],
    scope,
    consentedTargetDealId: activeDealId,
  });

  return { passport, metrics };
}

/**
 * Places an active review on DISPUTED_HOLD quarantine for Trust & Safety review.
 * Quarantines review from composite score calculation immediately.
 *
 * @param {object} supabaseAdmin
 * @param {object} params
 * @param {string} params.reviewId
 * @param {string} params.userId
 * @param {string} params.reason
 * @returns {Promise<{ success: boolean, error?: string, message?: string }>}
 */
export async function flagReviewDispute(supabaseAdmin, { reviewId, userId, reason }) {
  if (!supabaseAdmin || !reviewId || !userId) {
    return { success: false, error: "MISSING_PARAMS: Review ID and user ID are required." };
  }

  const { data: review, error: findError } = await supabaseAdmin
    .from("user_behavioral_reviews")
    .select("id, reviewer_id, target_user_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (findError || !review) {
    return { success: false, error: "REVIEW_NOT_FOUND: The review does not exist." };
  }

  if (review.reviewer_id !== userId && review.target_user_id !== userId) {
    return { success: false, error: "UNAUTHORIZED: You are not a party to this review." };
  }

  const { error: updateError } = await supabaseAdmin
    .from("user_behavioral_reviews")
    .update({
      is_disputed: true,
      dispute_reason: String(reason || "Party flagged review for Trust & Safety arbitration").slice(0, 500),
      disputed_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (updateError) {
    return { success: false, error: `DISPUTE_FAILED: ${updateError.message}` };
  }

  // Recalculate target user's metrics with review excluded
  await refreshUserMetrics(supabaseAdmin, review.target_user_id);

  return {
    success: true,
    message: "Review placed under DISPUTED_HOLD. Quarantined from behavioral standing.",
  };
}
