"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, TIERS } from "@/lib/rbac";
import { maskUserId, calculateSlaStatus, DSR_STATUSES } from "@/lib/privacyPolicy.mjs";

const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const VALID_DECISIONS = new Set([DSR_STATUSES.UNDER_REVIEW, DSR_STATUSES.FULFILLED, DSR_STATUSES.REJECTED]);
const ERRORS = {
  changed: "This request changed. Refresh the queue before submitting a new decision.",
  identity_unavailable: "Verify the requester through their signed-in Contact submission or an authorized closure review.",
  identity_required: "Verify the requester’s identity before recording fulfillment.",
  erasure_evidence_required: "Record and verify the erasure separately before closing this request.",
  denied: "This staff account cannot review privacy requests.",
  unavailable: "This privacy request is unavailable.",
};

export async function loadPrivacyConsoleData() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);
  const admin = createAdminClient();
  const [deletionAudit, reviewList] = await Promise.all([
    admin.from("audit_logs")
      .select("id, record_id, user_id, metadata, created_at")
      .eq("action", "ACCOUNT_DELETED_RIGHT_TO_ERASURE")
      .order("created_at", { ascending: false }).limit(100),
    admin.rpc("list_privacy_requests"),
  ]);

  const deletionLogs = (deletionAudit.data || []).map((row) => {
    const metadata = row.metadata || {};
    const authRemoved = metadata.auth_user_removed === true;
    return {
      id: row.id,
      maskedUser: maskUserId(row.record_id || row.user_id),
      timestamp: row.created_at,
      legalBasis: metadata.law || "",
      erasedSubsystems: Array.isArray(metadata.erased) ? metadata.erased : [],
      status: authRemoved ? "Sign-in closed" : "Sign-in closure unconfirmed",
      authRemoved,
    };
  });

  const dsrQueue = (reviewList.data || []).map((row) => {
    const sla = calculateSlaStatus(row.created_at);
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      subject: row.subject || "Data subject request",
      message: row.message,
      requestType: row.request_kind,
      status: row.review_status,
      revision: row.revision,
      signedIn: row.signed_in === true,
      subjectVerified: row.subject_verified === true,
      createdAt: row.created_at,
      slaDeadline: sla.deadline,
      daysRemaining: sla.daysRemaining,
      isBreached: sla.isBreached,
      isUrgent: sla.isUrgent,
    };
  });

  return {
    deletionLogs, dsrQueue,
    deletionError: deletionAudit.error ? "Could not load account deletion audit entries." : null,
    reviewError: reviewList.error ? "The privacy review queue is unavailable. Check the review migration before retrying." : null,
  };
}

export async function updateDsrResolution({ requestId, revision, status, resolutionNotes, verifySubject, closedAccountEvent } = {}) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);
  const notes = typeof resolutionNotes === "string" ? resolutionNotes.trim() : "";
  if (typeof requestId !== "string" || !UUID.test(requestId) || !Number.isSafeInteger(revision) || revision < 0 ||
      !VALID_DECISIONS.has(status) || notes.length < 10 || notes.length > 1000 || typeof verifySubject !== "boolean" ||
      (closedAccountEvent != null && (!verifySubject || staff.tier < TIERS.SUPER_ADMIN ||
        typeof closedAccountEvent !== "string" || !UUID.test(closedAccountEvent)))) {
    return { success: false, error: "Check the request and enter a review note between 10 and 1,000 characters." };
  }
  const { data, error } = await createAdminClient().rpc("review_privacy_request", {
    p_request: requestId, p_actor: staff.id, p_revision: revision, p_status: status,
    p_notes: notes, p_verify_subject: verifySubject, p_closed_account_event: closedAccountEvent || null,
  });
  if (error || data?.state !== "saved") {
    return { success: false, error: ERRORS[data?.state] || "Could not confirm the privacy review. Refresh before retrying." };
  }
  return { success: true, requestId, status: data.status, revision: data.revision, subjectVerified: data.subjectVerified };
}
