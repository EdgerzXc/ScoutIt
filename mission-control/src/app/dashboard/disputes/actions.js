"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";
import {
  PARTY_REASON_LABELS,
  mirrorStatusFor,
  partyStatusForTransition,
  releasesHold,
  titleForFiling,
} from "@/lib/partyDisputePolicy.mjs";

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
 * A-061. Write a console transition back to the party's own dispute row.
 *
 * `deal_disputes` stays the authority for the retention hold — the nightly
 * purge reads it, not `disputes` — so every status the console decides has to
 * reach it. Silence here is not a stale badge: it is a conversation either
 * purged while it is still under mediation, or held forever after it closed.
 *
 * Returns what happened so the caller records the real outcome in the thread
 * and the audit entry rather than asserting the one it intended.
 */
async function syncPartyDispute(admin, { dealDisputeId, transition }) {
  if (!dealDisputeId) return null;

  const status = partyStatusForTransition(transition);
  const holdReleased = releasesHold(transition);
  const now = new Date().toISOString();

  const patch = { status, updated_at: now };
  if (holdReleased) patch.resolved_at = now;

  const { error } = await admin.from("deal_disputes").update(patch).eq("id", dealDisputeId);
  if (error) throw new Error(`Could not update the party's dispute: ${error.message}`);

  return { status, holdReleased };
}

/** Load the mirror link for a console dispute, so a transition knows whether a party is behind it. */
async function loadDisputeLink(admin, disputeId) {
  const { data, error } = await admin
    .from("disputes")
    .select("id, deal_dispute_id, source, title")
    .eq("id", disputeId)
    .single();
  if (error) throw new Error(error.message);
  return data;
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
      source: "staff",
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
    metadata: { kind, priority, source: "staff" },
  });

  revalidatePath("/dashboard/disputes");
  revalidatePath("/dashboard/inbox");
}

/**
 * A-061. Take a dispute a party filed on the main site into mediation.
 *
 * This is the connector that was missing. A filing lands in `deal_disputes`
 * with a retention hold and no staff surface at all; adopting it creates the
 * mirror `disputes` row so the existing thread, assignment and closure
 * workflow apply unchanged, and moves the party's own row to `under_review` —
 * still a hold, because picking a dispute up must never be the act that
 * exposes the conversation to the purge.
 *
 * Idempotent by construction: `idx_disputes_deal_dispute_unique` means two
 * staff adopting the same filing produce one thread, not two writers for one
 * hold.
 *
 * @param {FormData} formData
 */
export async function adoptPartyDispute(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const dealDisputeId = formData.get("dealDisputeId")?.toString();
  if (!dealDisputeId) throw new Error("Missing dispute id.");

  const admin = createAdminClient();

  const { data: filing, error: filingError } = await admin
    .from("deal_disputes")
    .select("id, deal_id, reporter_id, reason, details, status, hold_placed_at, created_at")
    .eq("id", dealDisputeId)
    .single();
  if (filingError || !filing) throw new Error("That dispute filing no longer exists.");

  const { data: already } = await admin
    .from("disputes")
    .select("id")
    .eq("deal_dispute_id", dealDisputeId)
    .maybeSingle();

  if (already) {
    revalidatePath("/dashboard/disputes");
    return;
  }

  // The party chose a ground from a fixed list and wrote their own account of
  // the other person. Both are carried across verbatim: a mediator reading a
  // summary written by this console instead of the words that were filed is
  // reading something the complainant never said.
  const { data: mirror, error: mirrorError } = await admin
    .from("disputes")
    .insert({
      kind: "other",
      title: titleForFiling({ reason: filing.reason, dealId: filing.deal_id }),
      description: filing.details,
      property_ref: filing.deal_id,
      complainant: filing.reporter_id,
      respondent: null,
      priority: filing.reason === "abuse_or_threat" ? "critical" : "high",
      status: mirrorStatusFor("under_review"),
      source: "party",
      deal_dispute_id: filing.id,
      assignee_id: staff.id,
      opened_by: staff.email,
    })
    .select("id")
    .single();
  if (mirrorError) throw new Error(mirrorError.message);

  const synced = await syncPartyDispute(admin, {
    dealDisputeId: filing.id,
    transition: "claim",
  });

  await addEvent(admin, {
    disputeId: mirror.id,
    staff,
    eventType: "assignment",
    body:
      `${staff.email} took a dispute filed by a party on ` +
      `${new Date(filing.created_at).toISOString()}. ` +
      `Ground: ${PARTY_REASON_LABELS[filing.reason] || filing.reason}. ` +
      `The conversation stays protected from deletion (${synced.status}).`,
  });

  await logAction({
    staff,
    action: "dispute.adopt",
    targetTable: "deal_disputes",
    targetId: filing.id,
    metadata: {
      dispute_id: mirror.id,
      deal_id: filing.deal_id,
      reason: filing.reason,
      party_status: synced.status,
      hold_released: synced.holdReleased,
    },
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
  const link = await loadDisputeLink(admin, disputeId);

  const { error } = await admin
    .from("disputes")
    .update({
      assignee_id: staff.id,
      status: "investigating",
      updated_at: new Date().toISOString(),
    })
    .eq("id", disputeId);
  if (error) throw new Error(error.message);

  const synced = await syncPartyDispute(admin, {
    dealDisputeId: link.deal_dispute_id,
    transition: "claim",
  });

  await addEvent(admin, {
    disputeId,
    staff,
    eventType: "assignment",
    body:
      `${staff.email} took this dispute (→ investigating).` +
      (synced ? ` The party's filing is now ${synced.status} and still protected.` : ""),
  });

  await logAction({
    staff,
    action: "dispute.claim",
    targetTable: "disputes",
    targetId: disputeId,
    metadata: synced ? { deal_dispute_id: link.deal_dispute_id, party_status: synced.status } : {},
  });

  revalidatePath("/dashboard/disputes");
}

/**
 * Resolve or dismiss a dispute. Ops Manager (Tier 2)+ — closing a conflict is
 * a heavier call than logging a note. A resolution summary is required.
 *
 * A-061: when a party filed it, closing also releases the retention hold, so
 * the conversation becomes purgeable seven days after the deal closed. That
 * consequence is written into the thread and the audit entry rather than left
 * to be discovered later by the record's absence.
 *
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
  const link = await loadDisputeLink(admin, disputeId);

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

  const synced = await syncPartyDispute(admin, {
    dealDisputeId: link.deal_dispute_id,
    transition: outcome,
  });

  await addEvent(admin, {
    disputeId,
    staff,
    eventType: "resolution",
    body:
      `${outcome === "resolved" ? "Resolved" : "Dismissed"}: ${resolution}` +
      (synced?.holdReleased
        ? " · The party's filing is closed, so the retention hold on that conversation is released."
        : ""),
  });

  await logAction({
    staff,
    action: `dispute.${outcome}`,
    targetTable: "disputes",
    targetId: disputeId,
    reason: resolution,
    metadata: synced
      ? {
          deal_dispute_id: link.deal_dispute_id,
          party_status: synced.status,
          hold_released: synced.holdReleased,
        }
      : {},
  });

  revalidatePath("/dashboard/disputes");
  revalidatePath("/dashboard/inbox");
}
