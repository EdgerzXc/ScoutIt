// ═══════════════════════════════════════════════════════════════
// TWO-SIDED TRANSACTION HANDSHAKE & RATINGS API (ACQ-03 & Wave 3)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId, assertAdultEligibility } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";

/**
 * POST /api/deals/handshake
 * Executes or updates a two-sided transaction handshake on a deal.
 */
export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to complete deal handshake" },
        { status: 401 }
      );
    }

    // ── 18+ legal capacity (§34.2, §48) ──
    // A handshake exchanges real contact details between two parties. Of
    // everything ScoutIt does, this is the one that most needs a capacitated
    // adult on both ends.
    if (!(await assertAdultEligibility(userId))) {
      return NextResponse.json(
        { error: "You must confirm you are 18 or older before exchanging contact details." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { dealId, action = "sign" } = body;

    if (!dealId || typeof dealId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid dealId" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    if (action === "sign") {
      const { data, error } = await supabaseAdmin.rpc(
        "complete_transaction_handshake",
        {
          p_deal_id: dealId,
          p_user_id: userId,
        }
      );

      if (error) {
        return NextResponse.json(
          { error: sanitizeError(error, "Could not complete handshake.") },
          { status: 500 }
        );
      }

      const result = Array.isArray(data) ? data[0] : data;
      return NextResponse.json({
        success: result?.success ?? true,
        status: result?.handshake_status || "pending",
        ratingUpdated: result?.rating_updated ?? false,
        message: result?.rating_updated
          ? "Handshake completed! Scout Rating incremented."
          : "Handshake signature recorded. Awaiting second party.",
      });
    }

    if (action === "decline") {
      const { error } = await supabaseAdmin
        .from("deal_handshakes")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("deal_id", dealId);

      if (error) {
        return NextResponse.json(
          { error: sanitizeError(error, "Could not decline handshake.") },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        status: "declined",
        message: "Deal handshake declined.",
      });
    }

    return NextResponse.json(
      { error: "Invalid handshake action" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[DEAL HANDSHAKE API] POST failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not process handshake request.") },
      { status: 500 }
    );
  }
}
