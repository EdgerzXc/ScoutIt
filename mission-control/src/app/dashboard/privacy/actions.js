"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import {
  maskUserId,
  calculateSlaStatus,
  isPrivacySubject,
  detectDsrType,
  DSR_STATUSES,
} from "@/lib/privacyPolicy.mjs";

/**
 * Load RA 10173 account deletion audit logs and data subject request queue (A-262).
 * Ops Manager (Tier 2)+.
 */
export async function loadPrivacyConsoleData() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const admin = createAdminClient();

  // 1. Fetch erasure audit logs
  let deletionLogs = [];
  try {
    const { data: auditRows } = await admin
      .from("audit_logs")
      .select("id, action, record_id, user_id, metadata, created_at")
      .eq("action", "ACCOUNT_DELETED_RIGHT_TO_ERASURE")
      .order("created_at", { ascending: false })
      .limit(100);

    if (Array.isArray(auditRows) && auditRows.length > 0) {
      deletionLogs = auditRows.map((r) => {
        const meta = r.metadata || {};
        return {
          id: r.id,
          maskedUser: maskUserId(r.record_id || r.user_id),
          timestamp: r.created_at,
          legalBasis: meta.law || "RA 10173 Sec. 16(e)",
          erasedSubsystems: Array.isArray(meta.erased)
            ? meta.erased
            : ["saved_intel", "analytics_events", "privacy_settings", "calendar_events", "crm_contacts"],
          status: "HONOURED / ANONYMIZED",
          authRemoved: Boolean(meta.auth_user_removed),
        };
      });
    } else {
      // Fallback: check anonymized user_profiles
      const { data: anonProfiles } = await admin
        .from("user_profiles")
        .select("id, archived_at, created_at, moderation_note")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false })
        .limit(100);

      deletionLogs = (anonProfiles || []).map((p) => ({
        id: p.id,
        maskedUser: maskUserId(p.id),
        timestamp: p.archived_at || p.created_at,
        legalBasis: "RA 10173 Sec. 16(e)",
        erasedSubsystems: ["saved_intel", "analytics_events", "privacy_settings", "calendar_events"],
        status: "HONOURED / ANONYMIZED",
        authRemoved: true,
      }));
    }
  } catch (err) {
    console.warn("[loadPrivacyConsoleData] Could not load deletion logs:", err?.message);
  }

  // 2. Fetch Data Subject Requests (DSRs) from contact_messages
  let dsrQueue = [];
  try {
    const { data: messages } = await admin
      .from("contact_messages")
      .select("id, name, email, subject, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(150);

    const privacyMessages = (messages || []).filter((m) =>
      isPrivacySubject(m.subject || "", m.message || "")
    );

    dsrQueue = privacyMessages.map((m) => {
      const sla = calculateSlaStatus(m.created_at);
      const reqType = detectDsrType(m.subject || "", m.message || "");

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject || "Data Subject Request",
        message: m.message,
        requestType: reqType,
        status: m.status || DSR_STATUSES.PENDING,
        createdAt: m.created_at,
        slaDeadline: sla.deadline,
        daysRemaining: sla.daysRemaining,
        isBreached: sla.isBreached,
        isUrgent: sla.isUrgent,
      };
    });
  } catch (err) {
    console.warn("[loadPrivacyConsoleData] Could not load contact_messages for DSR queue:", err?.message);
  }

  return {
    deletionLogs,
    dsrQueue,
  };
}

/**
 * Resolve or update a Data Subject Request status in Mission Control.
 * Ops Manager (Tier 2)+.
 *
 * @param {object} params
 * @param {string} params.requestId
 * @param {string} params.status - "fulfilled" | "rejected" | "under_review"
 * @param {string} params.resolutionNotes - Substantive legal/compliance explanation
 */
export async function updateDsrResolution({ requestId, status, resolutionNotes }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const trimmedNotes = typeof resolutionNotes === "string" ? resolutionNotes.trim() : "";
  if (!trimmedNotes || trimmedNotes.length < 10) {
    throw new Error("A substantive compliance reason (at least 10 characters) is required for staff audit.");
  }

  if (!Object.values(DSR_STATUSES).includes(status)) {
    throw new Error("Invalid DSR status provided.");
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("contact_messages")
    .update({
      status,
    })
    .eq("id", requestId);

  if (error) {
    throw new Error(`Could not update DSR status: ${error.message}`);
  }

  await logActionStrict({
    staff,
    action: `privacy.dsr_${status}`,
    targetTable: "contact_messages",
    targetId: requestId,
    reason: trimmedNotes,
    metadata: {
      status,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/dashboard/privacy");
  return { success: true, requestId, status };
}
