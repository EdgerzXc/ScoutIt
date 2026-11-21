"use server";

import { getCurrentStaff, assertTier, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CLAIM_EVIDENCE_CONFIRMATION, CLAIM_EVIDENCE_UUID, reviewClaimEvidence,
} from "@/lib/claimEvidenceDisposition.mjs";

const DECISIONS = new Set(["hold", "release", "remove"]);
const ERRORS = {
  changed: "The evidence changed. Reload it before recording another decision.",
  identity_required: "Reopen the request and verify the requester’s identity before reviewing evidence.",
  held: "An active claim, dispute, or staff hold requires you to keep this file.",
  busy: "Removal is awaiting confirmation. Wait two minutes and reload the evidence before retrying.",
  ambiguous: "This file is shared by multiple evidence records. Keep it until staff reconcile those records.",
  retention_required: "Keep this file while the listing is live and the account remains open.",
  storage_unconfirmed: "Storage removal is unconfirmed. Reload the evidence and retry after checking its status.",
};

export async function loadClaimEvidence(requestId, after = null) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  if (typeof requestId !== "string" || !CLAIM_EVIDENCE_UUID.test(requestId) ||
      (after !== null && (typeof after !== "string" || !CLAIM_EVIDENCE_UUID.test(after)))) {
    return { error: "This privacy request is unavailable." };
  }
  const { data, error } = await createAdminClient().rpc("list_claim_evidence_for_erasure", {
    p_request: requestId, p_actor: staff.id, p_after: after,
  });
  if (error || !Array.isArray(data)) return { error: "Could not load claim evidence for this request." };
  return {
    evidence: data.slice(0, 20).map((row) => ({
      id: row.document_id, claimId: row.claim_id, propertyId: row.property_id, status: row.status, revision: row.revision,
    })),
    next: data.length > 20 ? data[19].document_id : null,
  };
}

export async function changeClaimEvidence({ requestId, documentId, revision, decision, note, confirmation } = {}) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const reason = typeof note === "string" ? note.trim() : "";
  if (![requestId, documentId].every((id) => typeof id === "string" && CLAIM_EVIDENCE_UUID.test(id)) ||
      !Number.isSafeInteger(revision) || revision < 0 || revision > 2_147_483_647 || !DECISIONS.has(decision) ||
      reason.length < 12 || reason.length > 1000 || (decision === "remove" && confirmation !== CLAIM_EVIDENCE_CONFIRMATION)) {
    return { error: "Check the decision, enter a review note of 12 to 1,000 characters and confirm any removal." };
  }
  const state = await reviewClaimEvidence(createAdminClient(), {
    requestId, documentId, actorId: staff.id, revision, decision, note: reason,
  });
  if (state === "saved") return { saved: true };
  return { error: ERRORS[state] || "Could not record this claim evidence decision." };
}
