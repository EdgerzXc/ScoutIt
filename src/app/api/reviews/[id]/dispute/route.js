import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { flagReviewDispute } from "@/lib/scoring/serverBehavioralScoring";
import { sanitizeError } from "@/lib/sanitizeError";

/**
 * POST /api/reviews/[id]/dispute
 * Flags a behavioral review for Trust & Safety arbitration,
 * instantly quarantining it under DISPUTED_HOLD so it does not affect
 * the user's standing during investigation.
 */
export async function POST(request, { params }) {
  try {
    const { id: reviewId } = await params;
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to dispute a review." },
        { status: 401 }
      );
    }

    if (!reviewId || typeof reviewId !== "string") {
      return NextResponse.json(
        { error: "Invalid reviewId parameter." },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { reason = "Disputed by party" } = body;

    const result = await flagReviewDispute(supabaseAdmin, {
      reviewId,
      userId,
      reason,
    });

    if (!result.success) {
      const isNotFound = result.error?.startsWith("REVIEW_NOT_FOUND");
      const isForbidden = result.error?.startsWith("UNAUTHORIZED");
      let statusCode = 400;
      if (isNotFound) statusCode = 404;
      else if (isForbidden) statusCode = 403;

      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    return NextResponse.json(
      { error: sanitizeError(err, "Failed to submit dispute.") },
      { status: 500 }
    );
  }
}
