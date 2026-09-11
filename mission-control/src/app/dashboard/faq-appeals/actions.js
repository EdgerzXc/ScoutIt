"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import {
  APPEAL_ACTIONS,
  expectedStatusFor,
  nextStatusFor,
} from "@/lib/faqAppealReviewPolicy.mjs";

// ═══════════════════════════════════════════════════════════════
// A-133 — the staff half of the FAQ block-appeal loop.
//
// The main site accepts an appeal only with fresh block evidence and always
// lands it `pending`. Before this screen the only way out of `pending` was
// hand-editing Supabase. This action calls the same
// review_faq_block_appeal RPC the main-site PATCH route calls, so there is
// exactly one writer of an appeal's state.
//
// Two rules are enforced here and not left to a careful reviewer:
//
//   1. Stale views lose. The rendered status travels as p_expected_status;
//      a row that moved since render raises APPEAL_CONFLICT in the RPC and
//      surfaces as "reload before reviewing" — never a silent overwrite.
//   2. A refusal carries a reason. Rejection without reviewer notes does not
//      happen. Rejection retains the row; there is no delete in this file.
//
// What approve does NOT do: the RPC sets status + reviewed_at only. It does
// not publish the blocked answer anywhere. Button copy says "Record
// approval" for exactly this reason.
// ═══════════════════════════════════════════════════════════════

const VALID_ACTIONS = new Set(Object.values(APPEAL_ACTIONS));

/**
 * Start review, record approval, or record rejection on one FAQ block
 * appeal. Ops Manager (Tier 2)+.
 *
 * @param {FormData} formData
 */
export async function reviewFaqAppeal(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const appealId = formData.get("appealId")?.toString().trim();
  const action = formData.get("action")?.toString().trim();
  const renderedStatus = formData.get("renderedStatus")?.toString().trim();
  const notes = formData.get("notes")?.toString().trim() || "";

  if (!appealId) throw new Error("An appeal is required.");
  if (!VALID_ACTIONS.has(action)) throw new Error("Unknown review action.");
  if (action === APPEAL_ACTIONS.REJECT && !notes) {
    throw new Error("A rejection requires a reason.");
  }

  // The expected status is the one the screen rendered, not a fresh read —
  // the RPC compares it against the stored row, which is what makes a stale
  // view fail instead of overwriting a colleague's decision.
  const expectedStatus = renderedStatus || expectedStatusFor(action);
  if (!nextStatusFor(expectedStatus, action)) {
    throw new Error("This appeal already moved — reload before reviewing.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("review_faq_block_appeal", {
    p_appeal_id: appealId,
    p_reviewer_id: staff.id,
    p_expected_status: expectedStatus,
    p_action: action,
    p_reviewer_notes: notes || null,
  });

  if (error) {
    if ((error.message || "").includes("APPEAL_CONFLICT")) {
      throw new Error("This appeal already moved — reload before reviewing.");
    }
    throw new Error(`Could not record the review: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;

  // The audit IS the accountability for deciding another person's words, so
  // a failure to write it fails the decision — same contract as
  // recommendations (broker_social_proof_audit_events) and disputes.
  await logActionStrict({
    staff,
    action: `faq_appeal.${action}`,
    targetTable: "faq_block_appeals",
    targetId: appealId,
    reason: notes || null,
    metadata: {
      previous_status: expectedStatus,
      resulting_status: result?.appeal_status,
      publishes_answer: false,
    },
  });

  revalidatePath("/dashboard/faq-appeals");
}
