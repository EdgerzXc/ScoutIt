import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { flagReviewDispute } from "@/lib/scoring/serverBehavioralScoring";
import { sanitizeError } from "@/lib/sanitizeError";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { stripAllTags } from "@/lib/sanitize";

export const checkReviewDisputeRate = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
  maxKeys: 5000,
});

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

    const rate = checkReviewDisputeRate(clientIp(request) + ":" + userId);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many dispute requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }
    const rawReason = typeof body.reason === "string" ? body.reason : "Disputed by party";
    const reason = stripAllTags(rawReason.slice(0, 500));

    const result = await flagReviewDispute(supabaseAdmin, {
      reviewId,
      userId,
      reason,
    });

    if (!result.success) {
      const isNotFound = result.error?.startsWith("REVIEW_NOT_FOUND");
      const isForbidden = result.error?.startsWith("UNAUTHORIZED");
      const isConflict = result.error?.startsWith("ALREADY_DISPUTED");
      let statusCode = 400;
      if (isNotFound) statusCode = 404;
      else if (isForbidden) statusCode = 403;
      else if (isConflict) statusCode = 409;

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
