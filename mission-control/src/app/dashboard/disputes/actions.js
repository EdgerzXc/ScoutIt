"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";

const VALID_KINDS = ["broker_vs_broker", "broker_vs_owner", "listing_conflict", "other"];
const VALID_PRIORITIES = ["low", "normal", "high", "critical"];

/** Append one row to the mediation thread. Internal helper. */
async function addEvent(admin, { disputeId, staff, eventType, body }) {
  await admin.from("dispute_events").insert({
    dispute_id: disputeId,
    author_id: staff.id,
    author_email: staff.email,
    event_type: eventType,
    body,
  });
}

/**
 * Open a new dispute. Agent (Tier 1)+.
 * @param {FormData} formData
 */
export async function openDispute(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const kind = formData.get("kind")?.toString() || "other";
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const propertyRef = formData.get("propertyRef")?.toString().trim() || null;
  const complainant = formData.get("complainant")?.toString().trim() || null;
  const respondent = formData.get("respondent")?.toString().trim() || null;
  const priority = formData.get("priority")?.toString() || "normal";

  if (!title) throw new Error("A title is required.");
  if (!VALID_KINDS.includes(kind)) throw new Error("Unknown dispute kind.");
  if (!VALID_PRIORITIES.includes(priority)) throw new Error("Invalid priority.");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("disputes")
    .insert({
      kind,
      title,
      description,
      property_ref: propertyRef,
      complainant,
      respondent,
      priority,
      status: "open",
      opened_by: staff.email,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await addEvent(admin, {
    disputeId: data.id,
    staff,
    eventType: "note",
    body: `Opened: ${title}`,
  });

  await logAction({
    staff,
    action: "dispute.open",
    targetTable: "disputes",
    targetId: data.id,
    metadata: { kind, priority },
  });

  revalidatePath("/dashboard/disputes");
  revalidatePath("/dashboard/inbox");
}

/**
 * Add a mediation note to an existing dispute. Agent (Tier 1)+.
 * @param {FormData} formData
 */
export async function addDisputeNote(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const disputeId = formData.get("disputeId")?.toString();
  const body = formData.get("body")?.toString().trim();
  if (!disputeId) throw new Error("Missing dispute id.");
  if (!body) throw new Error("Note cannot be empty.");

  const admin = createAdminClient();
  await addEvent(admin, { disputeId, staff, eventType: "note", body });
  await admin
    .from("disputes")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", disputeId);

  await logAction({
    staff,
    action: "dispute.note",
    targetTable: "disputes",
    targetId: disputeId,
  });

  revalidatePath("/dashboard/disputes");
}

/**
 * Assign a dispute to yourself (take mediation). Agent (Tier 1)+.
 * @param {FormData} formData
 */
export async function claimDispute(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const disputeId = formData.get("disputeId")?.toString();
  if (!disputeId) throw new Error("Missing dispute id.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("disputes")
    .update({
      assignee_id: staff.id,
      status: "investigating",
      updated_at: new Date().toISOString(),
    })
    .eq("id", disputeId);
  if (error) throw new Error(error.message);

  await addEvent(admin, {
    disputeId,
    staff,
    eventType: "assignment",
    body: `${staff.email} took this dispute (→ investigating).`,
  });

  await logAction({
    staff,
    action: "dispute.claim",
    targetTable: "disputes",
    targetId: disputeId,
  });

  revalidatePath("/dashboard/disputes");
}

/**
 * Resolve or dismiss a dispute. Ops Manager (Tier 2)+ — closing a conflict is
 * a heavier call than logging a note. A resolution summary is required.
 * @param {FormData} formData
 */
export async function closeDispute(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const disputeId = formData.get("disputeId")?.toString();
  const outcome = formData.get("outcome")?.toString(); // resolved | dismissed
  const resolution = formData.get("resolution")?.toString().trim();
  if (!disputeId) throw new Error("Missing dispute id.");
  if (!["resolved", "dismissed"].includes(outcome)) throw new Error("Invalid outcome.");
  if (!resolution) throw new Error("A resolution summary is required.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("disputes")
    .update({
      status: outcome,
      resolution,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", disputeId);
  if (error) throw new Error(error.message);

  await addEvent(admin, {
    disputeId,
    staff,
    eventType: "resolution",
    body: `${outcome === "resolved" ? "Resolved" : "Dismissed"}: ${resolution}`,
  });

  await logAction({
    staff,
    action: `dispute.${outcome}`,
    targetTable: "disputes",
    targetId: disputeId,
    reason: resolution,
  });

  revalidatePath("/dashboard/disputes");
  revalidatePath("/dashboard/inbox");
}
