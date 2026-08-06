// ═══════════════════════════════════════════════════════════════
// AI COUNTER-OFFER ASSISTANT API (Inspired by awesome-llm-apps)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to generate AI counter-offers" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      propertyTitle = "BGC Penthouse",
      askingPrice = "₱ 185,000 / mo",
      offerType = "lease", // 'lease' | 'buy'
      targetPrice = "",
      moveInDate = "Flexible / Next Month",
      role = "buyer",
    } = body;

    // Smart Taglish Counter-Offer generator template engine
    let suggestion = "";
    if (offerType === "lease") {
      suggestion = `Good day! Regarding ${propertyTitle} (asking ${askingPrice}), I would like to propose a 1-year lease at ${targetPrice || "a 5-10% preferred rate"} with 2 months advance and 2 months security deposit. We are ready to execute the contract for move-in around ${moveInDate}. Please let me know if the owner is open to this structure.`;
    } else {
      suggestion = `Hi! In reference to ${propertyTitle} (${askingPrice}), we are prepared to issue a formal Letter of Intent (LOI) at ${targetPrice || "a competitive net valuation"}. Please confirm if seller handles CGT (6%) while buyer shoulders DST (1.5%) & Transfer Tax per RESA guidelines. Looking forward to your response.`;
    }

    return NextResponse.json({
      success: true,
      suggestion,
      offerType,
      propertyTitle,
      meta: {
        generatedAt: new Date().toISOString(),
        aiEngine: "ScoutIt Deal Intelligence v1",
      },
    });
  } catch (err) {
    console.error("[AI COUNTER OFFER API] POST failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not generate counter offer.") },
      { status: 500 }
    );
  }
}
