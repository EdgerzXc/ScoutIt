import { NextResponse } from "next/server";
import { resolveUserId, assertAdultEligibility } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { submitBehavioralReview } from "@/lib/scoring/serverBehavioralScoring";
import { sanitizeError } from "@/lib/sanitizeError";

/**
 * POST /api/deals/[id]/review
 * Submits a behavioral evaluation for a counterparty on a completed deal.
 * Enforces:
 * - Counterparty transaction handshake completion
 * - 14-day anti-retaliation double-blind window
 * - Immutability (no editing existing reviews)
 * - Anti-self-dealing
 */
export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to submit a transaction review." },
        { status: 401 }
      );
    }

    if (!dealId || typeof dealId !== "string") {
      return NextResponse.json(
        { error: "Invalid dealId parameter." },
        { status: 400 }
      );
    }

    // Assert legal adult capacity (18+)
    if (!(await assertAdultEligibility(userId))) {
      return NextResponse.json(
        { error: "You must confirm you are 18 or older before submitting resident reviews." },
        { status: 403 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { vectors, feedback, leaseType, durationMonths } = body;

    if (!vectors || typeof vectors !== "object") {
      return NextResponse.json(
        { error: "Missing required vectors object containing ratings (1 to 5) for all evaluation vectors." },
        { status: 400 }
      );
    }

    const result = await submitBehavioralReview(supabaseAdmin, {
      dealId,
      reviewerId: userId,
      vectors,
      feedback: typeof feedback === "string" ? feedback : "",
      leaseType: typeof leaseType === "string" ? leaseType : "Residential Lease",
      durationMonths: typeof durationMonths === "number" ? durationMonths : 12,
    });

    if (!result.success) {
      const isBadInput = result.error?.startsWith("INVALID_VECTORS") ||
        result.error?.startsWith("MISSING_IDENTITIES");
      const isNotFound = result.error?.startsWith("DEAL_NOT_FOUND");
      const isForbidden = result.error?.startsWith("UNAUTHORIZED_PARTY") ||
        result.error?.startsWith("SELF_DEALING") ||
        result.error?.startsWith("PARTY_MISMATCH");
      const isConflict = result.error?.startsWith("ALREADY_SUBMITTED") ||
        result.error?.startsWith("EXPIRED_WINDOW") ||
        result.error?.startsWith("NO_QUALIFYING_HANDSHAKE");

      let statusCode = 400;
      if (isNotFound) statusCode = 404;
      else if (isForbidden) statusCode = 403;
      else if (isConflict) statusCode = 409;

      return NextResponse.json({ error: result.error, message: result.message }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      state: result.state,
      reviewId: result.reviewId,
      message: result.message,
    });
  } catch (err) {
    return NextResponse.json(
      { error: sanitizeError(err, "Internal review submission failure.") },
      { status: 500 }
    );
  }
}
