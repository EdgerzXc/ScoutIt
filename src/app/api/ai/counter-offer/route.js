// ═══════════════════════════════════════════════════════════════
// AI COUNTER-OFFER ASSISTANT API (Inspired by awesome-llm-apps)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { stripAllTags } from "@/lib/sanitize";

export const checkCounterOfferRate = createRateLimiter({
  limit: 30,
  windowMs: 60_000,
  maxKeys: 10_000,
});

const MAX_INPUT_CHARS = 200;

function sanitizeInput(val, fallback = "") {
  if (typeof val !== "string") return fallback;
  return stripAllTags(val).trim().slice(0, MAX_INPUT_CHARS) || fallback;
}

export async function POST(request) {
  try {
    const rate = checkCounterOfferRate(clientIp(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many counter-offer requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to generate AI counter-offers" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const propertyTitle = sanitizeInput(body.propertyTitle, "BGC Penthouse");
    const askingPrice = sanitizeInput(body.askingPrice, "₱ 185,000 / mo");
    const offerType = body.offerType === "buy" ? "buy" : "lease";
    const targetPrice = sanitizeInput(body.targetPrice, "");
    const moveInDate = sanitizeInput(body.moveInDate, "Flexible / Next Month");
    const role = sanitizeInput(body.role, "buyer");

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
        templateEngine: "ScoutIt Deal Intelligence v1",
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
