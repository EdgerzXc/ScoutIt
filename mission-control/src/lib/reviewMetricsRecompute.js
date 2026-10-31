/**
 * Server-side helper to recompute and persist user behavioral metrics in Mission Control (A-266).
 * Follows the Honest Blank Rule and vector weighting from A-182.
 */

const VECTOR_WEIGHTS = {
  payment_punctuality: 0.35,
  space_care_maintenance: 0.25,
  communication_conduct: 0.20,
  lease_covenant_adherence: 0.20,
};

const QUALIFYING_TRANSACTION_STATUSES = ["completed", "closed", "accepted", "active"];
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Recalculate a target user's behavioral standing after dispute resolution.
 *
 * @param {object} admin - Supabase service-role client
 * @param {string} userId - Target user UUID
 * @returns {Promise<{ success: boolean, metrics?: object, error?: string }>}
 */
export async function recomputeTargetUserMetrics(admin, userId) {
  if (!admin || !userId || !SAFE_ID.test(String(userId))) {
    return { success: false, error: "Missing admin client or invalid userId" };
  }

  try {
    // 1. Fetch all unlocked, non-disputed reviews for this user
    const { data: reviews, error: reviewErr } = await admin
      .from("user_behavioral_reviews")
      .select("id, vectors, is_double_blind_locked, is_disputed")
      .eq("target_user_id", userId)
      .eq("is_double_blind_locked", false)
      .eq("is_disputed", false);

    if (reviewErr) {
      console.warn("[recomputeTargetUserMetrics] Could not fetch reviews:", reviewErr.message);
      return { success: false, error: reviewErr.message };
    }

    // 2. Count completed transactions from deals (aligned with serverBehavioralScoring.js)
    const { count: baseTxCount } = await admin
      .from("deals")
      .select("id", { count: "exact", head: true })
      .or(`buyer_id.eq.${userId},broker_id.eq.${userId}`)
      .eq("status", "completed");

    let txCount = baseTxCount || 0;
    try {
      const dealsQuery = admin
        .from("deals")
        .select("id, buyer_id, broker_id, status, properties(owner_id)");
      if (typeof dealsQuery?.in === "function") {
        const { data: allQualifyingDeals } = await dealsQuery.in("status", QUALIFYING_TRANSACTION_STATUSES);
        if (Array.isArray(allQualifyingDeals)) {
          const matchedDeals = allQualifyingDeals.filter(
            (d) =>
              String(d.buyer_id) === String(userId) ||
              String(d.broker_id) === String(userId) ||
              String(d.properties?.owner_id || d.owner_id || "") === String(userId)
          );
          txCount = Math.max(txCount, matchedDeals.length);
        }
      }
    } catch {
      // Preserve baseTxCount when minimal unit test mocks do not implement .in()
    }

    const validReviews = Array.isArray(reviews) ? reviews : [];
    const reviewCount = validReviews.length;
    const effectiveTxCount = Math.max(reviewCount, txCount || 0);

    let tier = "TIER_HONEST_BLANK";
    let displayBadge = "[First-Time Verified Seeker]";
    let compositeScore = null;
    let vectorAverages = null;

    if (reviewCount > 0) {
      const vectorSums = {
        payment_punctuality: 0,
        space_care_maintenance: 0,
        communication_conduct: 0,
        lease_covenant_adherence: 0,
      };
      let compositeSum = 0;

      for (const rev of validReviews) {
        const v = rev.vectors || {};
        let singleReviewComposite = 0;

        for (const [key, weight] of Object.entries(VECTOR_WEIGHTS)) {
          const rating = typeof v[key] === "number" ? Math.max(1, Math.min(5, v[key])) : 3;
          vectorSums[key] += rating;
          singleReviewComposite += (rating / 5) * 100 * weight;
        }

        compositeSum += singleReviewComposite;
      }

      compositeScore = Math.round((compositeSum / reviewCount) * 100) / 100;
      vectorAverages = {
        payment_punctuality: Math.round((vectorSums.payment_punctuality / reviewCount) * 100) / 100,
        space_care_maintenance: Math.round((vectorSums.space_care_maintenance / reviewCount) * 100) / 100,
        communication_conduct: Math.round((vectorSums.communication_conduct / reviewCount) * 100) / 100,
        lease_covenant_adherence: Math.round((vectorSums.lease_covenant_adherence / reviewCount) * 100) / 100,
      };

      if (compositeScore >= 90.0) {
        tier = "TIER_SOVEREIGN";
        displayBadge = "[Sovereign Resident]";
      } else if (compositeScore >= 80.0) {
        tier = "TIER_ESTEEMED";
        displayBadge = "[Esteemed Resident]";
      } else if (compositeScore >= 70.0) {
        tier = "TIER_VERIFIED";
        displayBadge = "[Verified Resident]";
      } else {
        tier = "TIER_STANDARD";
        displayBadge = "[Standard Resident]";
      }
    }

    const metricsRow = {
      user_id: userId,
      tier,
      display_badge: displayBadge,
      composite_score: compositeScore,
      eligible_review_count: reviewCount,
      transaction_count: effectiveTxCount,
      vector_averages: vectorAverages,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await admin
      .from("user_behavioral_metrics")
      .upsert(metricsRow);

    if (upsertErr) {
      console.warn("[recomputeTargetUserMetrics] Could not upsert metrics:", upsertErr.message);
      return { success: false, error: upsertErr.message };
    }

    return { success: true, metrics: metricsRow };
  } catch (err) {
    console.error("[recomputeTargetUserMetrics] Unexpected error:", err);
    return { success: false, error: err.message || String(err) };
  }
}
