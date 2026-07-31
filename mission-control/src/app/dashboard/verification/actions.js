"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";

const VALID_KINDS = ["prc_license", "price_verification", "identity", "business"];
const VALID_SUBJECTS = ["broker", "owner", "property"];

/**
 * File a new verification request from the console. Agent (Tier 1)+.
 * Most requests will arrive from the public site later; this lets staff
 * open one manually (e.g. a broker emailed their PRC license).
 * @param {FormData} formData
 */
export async function createVerificationRequest(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const kind = formData.get("kind")?.toString() || "prc_license";
  const subjectType = formData.get("subjectType")?.toString() || "broker";
  const subjectName = formData.get("subjectName")?.toString().trim();
  const subjectId = formData.get("subjectId")?.toString().trim() || null;
  const note = formData.get("note")?.toString().trim() || null;

  if (!VALID_KINDS.includes(kind)) throw new Error("Unknown verification kind.");
  if (!VALID_SUBJECTS.includes(subjectType)) throw new Error("Unknown subject type.");
  if (!subjectName) throw new Error("A subject name is required.");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("verification_requests")
    .insert({
      kind,
      subject_type: subjectType,
      subject_id: subjectId,
      subject_name: subjectName,
      details: note ? { note } : {},
      submitted_by: staff.email,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "verification.create",
    targetTable: "verification_requests",
    targetId: data.id,
    metadata: { kind, subjectType, subjectName },
  });

  revalidatePath("/dashboard/verification");
}

/**
 * Approve — the subject becomes verified. Agent (Tier 1)+.
 * The decision is authoritative here + audit-logged. Downstream badge sync
 * (broker_profiles.verified, property price flags) is a deliberate follow-up
 * so this action can never half-fail across two systems.
 * @param {FormData} formData
 */
export async function approveVerification(formData) {
  return decide(formData, "approved", "verification.approve");
}

/**
 * Reject — reason required. Agent (Tier 1)+.
 * @param {FormData} formData
 */
export async function rejectVerification(formData) {
  return decide(formData, "rejected", "verification.reject", true);
}

async function decide(formData, status, action, reasonRequired = false) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const id = formData.get("requestId")?.toString();
  const notes = formData.get("notes")?.toString().trim() || null;
  if (!id) throw new Error("Missing request id.");
  if (reasonRequired && !notes) throw new Error("A reason is required to reject.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("verification_requests")
    .update({
      status,
      reviewer_id: staff.id,
      review_notes: notes,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending"); // only decide things still pending
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action,
    targetTable: "verification_requests",
    targetId: id,
    reason: notes,
  });

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard/inbox");
}

/**
 * Bump priority. Ops Manager (Tier 2)+.
 * @param {FormData} formData
 */
export async function setVerificationPriority(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const id = formData.get("requestId")?.toString();
  const priority = formData.get("priority")?.toString();
  if (!id) throw new Error("Missing request id.");
  if (!["low", "normal", "high"].includes(priority)) throw new Error("Invalid priority.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("verification_requests")
    .update({ priority, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "verification.set_priority",
    targetTable: "verification_requests",
    targetId: id,
    metadata: { priority },
  });

  revalidatePath("/dashboard/verification");
}
