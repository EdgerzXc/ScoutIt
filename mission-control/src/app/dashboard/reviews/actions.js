"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { notifyUser } from "@/lib/notifications";
import {
  REVIEW_DISPUTE_OUTCOMES,
  validateDisputeResolution,
  formatDisputeNotification,
} from "@/lib/reviewDisputePolicy.mjs";
import { recomputeTargetUserMetrics } from "@/lib/reviewMetricsRecompute";

/**
 * Resolve a behavioral review dispute (A-266).
 * Gated strictly to Ops Manager (Tier 2)+.
 *
 * @param {object} params
 * @param {string} params.reviewId
 * @param {string} params.outcome - "uphold_review" (dismiss dispute) or "remove_review" (uphold dispute)
 * @param {string} params.reason - Substantive explanation for staff audit and user notice
 */
export async function resolveReviewDispute({ reviewId, outcome, reason }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const validation = validateDisputeResolution({ outcome, reason });
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const admin = createAdminClient();

  // 1. Fetch review record
  const { data: review, error: fetchErr } = await admin
    .from("user_behavioral_reviews")
    .select("id, reviewer_id, target_user_id, is_disputed, dispute_reason, feedback, vectors")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchErr || !review) {
    throw new Error(`Review record not found: ${fetchErr?.message || "Invalid review ID"}`);
  }

  const isUphold = outcome === REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW;
  const now = new Date().toISOString();

  // 2. Update user_behavioral_reviews
  // When upholding review: is_disputed becomes false so it counts toward score
  // When removing review: is_disputed remains true so it is excluded from score
  const { error: updateErr } = await admin
    .from("user_behavioral_reviews")
    .update({
      is_disputed: !isUphold,
      dispute_resolution: reason,
    })
    .eq("id", reviewId);

  if (updateErr) {
    throw new Error(`Could not update review status: ${updateErr.message}`);
  }

  // 3. Recompute target user's behavioral standing
  const recomputeRes = await recomputeTargetUserMetrics(admin, review.target_user_id);

  // 4. Mirror status to disputes table if a linked record exists
  try {
    await admin
      .from("disputes")
      .update({
        status: isUphold ? "dismissed" : "resolved",
        resolution: reason,
        resolved_at: now,
        updated_at: now,
      })
      .eq("property_ref", reviewId)
      .eq("status", "open");
  } catch (mirrorErr) {
    console.warn("[resolveReviewDispute] Could not update mirror dispute:", mirrorErr?.message);
  }

  // 5. Notify both parties
  const reviewerNotice = formatDisputeNotification({ outcome, reason, isReviewer: true });
  const targetNotice = formatDisputeNotification({ outcome, reason, isReviewer: false });

  await notifyUser(admin, {
    userId: review.reviewer_id,
    title: reviewerNotice.title,
    desc: reviewerNotice.desc,
    notificationType: "review_dispute_resolved",
  });

  await notifyUser(admin, {
    userId: review.target_user_id,
    title: targetNotice.title,
    desc: targetNotice.desc,
    notificationType: "review_dispute_resolved",
  });

  // 6. Strict immutable staff action audit
  await logActionStrict({
    staff,
    action: isUphold ? "review.uphold" : "review.remove",
    targetTable: "user_behavioral_reviews",
    targetId: reviewId,
    reason,
    metadata: {
      target_user_id: review.target_user_id,
      reviewer_id: review.reviewer_id,
      outcome,
      recomputed_tier: recomputeRes.metrics?.tier || null,
      recomputed_score: recomputeRes.metrics?.composite_score || null,
    },
  });

  revalidatePath("/dashboard/reviews");
  revalidatePath("/dashboard/disputes");
  revalidatePath("/dashboard");

  return {
    success: true,
    reviewId,
    outcome,
    targetUserId: review.target_user_id,
    metrics: recomputeRes.metrics || null,
  };
}
