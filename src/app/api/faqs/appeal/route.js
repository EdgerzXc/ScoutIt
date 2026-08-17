import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { requireAdmin } from "@/lib/adminGuard";
import { stripAllTags } from "@/lib/sanitize";
import { sanitizeError } from "@/lib/sanitizeError";
import { detectContactLeak } from "@/lib/contactLeakFilter";
import { isFaqAppealActive } from "@/lib/faqAppealGate";

const appealSchema = z.object({ evidenceId: z.string().uuid(), explanation: z.string().min(10).max(500) }).strict();
const reviewSchema = z.object({
  appealId: z.string().uuid(),
  expectedStatus: z.enum(["pending", "under_review"]),
  action: z.enum(["start_review", "approve", "reject"]),
  reviewerNotes: z.string().max(500).optional().nullable(),
}).strict();

function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}
function requireCapability() {
  if (!isFaqAppealActive()) return fail("FAQ appeals are currently offline.", 503, { disabled: true });
  if (!supabaseAdmin) return fail("Database service unavailable.", 503);
  return null;
}

export async function POST(req) {
  try {
    const unavailable = requireCapability();
    if (unavailable) return unavailable;
    const userId = await resolveUserId(req);
    if (!userId) return fail("Authentication required.", 401);
    const parsed = appealSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Invalid appeal evidence or explanation.", 400);
    const explanation = stripAllTags(parsed.data.explanation).trim();
    if (explanation.length < 10) return fail("Please provide a clear explanation.", 400);
    if (!detectContactLeak(explanation).clean) {
      return fail("The explanation contains contact-like details. Remove them before submitting.", 422);
    }
    const { data, error } = await supabaseAdmin.rpc("submit_faq_block_appeal", {
      p_evidence_id: parsed.data.evidenceId,
      p_user_id: userId,
      p_explanation: explanation,
    });
    if (error) {
      const message = error.message || "";
      if (message.includes("EVIDENCE_INVALID")) return fail("This block evidence is invalid, expired, or already used.", 409);
      if (message.includes("APPEAL_LIMIT")) return fail("You already have the maximum number of pending appeals.", 429);
      console.error("[api/faqs/appeal] submit RPC failed:", error);
      return fail("Failed to submit appeal.", 500);
    }
    const appeal = Array.isArray(data) ? data[0] : data;
    if (!appeal?.appeal_id) return fail("Appeal receipt was not created.", 500);
    return NextResponse.json({ success: true, appealId: appeal.appeal_id, status: appeal.appeal_status }, { status: 201 });
  } catch (error) {
    console.error("[api/faqs/appeal] POST error:", error);
    return fail(sanitizeError(error, "Internal error processing appeal."), 500);
  }
}

export async function GET(req) {
  try {
    const unavailable = requireCapability();
    if (unavailable) return unavailable;
    const gate = await requireAdmin(req, { label: "FAQ APPEALS REVIEW" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
    const { data: appeals, error } = await supabaseAdmin.from("faq_block_appeals")
      .select("id, user_id, property_id, faq_id, preflight_key, rule_code, block_context, explanation, status, reviewer_id, reviewed_at, created_at")
      .in("status", ["pending", "under_review"]).order("created_at", { ascending: true }).limit(50);
    if (error) return fail("Failed to query appeals.", 500);
    return NextResponse.json({ success: true, appeals: appeals || [] });
  } catch (error) {
    return fail(sanitizeError(error, "Internal error"), 500);
  }
}

export async function PATCH(req) {
  try {
    const unavailable = requireCapability();
    if (unavailable) return unavailable;
    const gate = await requireAdmin(req, { label: "FAQ APPEALS REVIEW" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
    const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Invalid review transition.", 400);
    const notes = stripAllTags(parsed.data.reviewerNotes || "").trim() || null;
    if (notes && !detectContactLeak(notes).clean) return fail("Reviewer notes must not contain contact details.", 422);
    const { data, error } = await supabaseAdmin.rpc("review_faq_block_appeal", {
      p_appeal_id: parsed.data.appealId,
      p_reviewer_id: gate.userId,
      p_expected_status: parsed.data.expectedStatus,
      p_action: parsed.data.action,
      p_reviewer_notes: notes,
    });
    if (error) {
      if ((error.message || "").includes("APPEAL_CONFLICT")) return fail("Appeal state changed; reload before reviewing.", 409);
      return fail("Failed to update appeal.", 500);
    }
    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, status: result?.appeal_status, reviewedAt: result?.reviewed_at });
  } catch (error) {
    return fail(sanitizeError(error, "Internal error"), 500);
  }
}