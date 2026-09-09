"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import {
  CONTRIBUTION_EVENTS,
  CONTRIBUTION_STATES,
  validateCredit,
} from "@/lib/brokerContributionPolicy.mjs";

// ═══════════════════════════════════════════════════════════════
// A-069 — the staff producer for broker contributions.
//
// The read side was fully wired and nothing wrote it, so the only way to
// credit a broker was to hand-edit Supabase. That is what the three existing
// rows are, and it is the workaround this replaces.
//
// This reaches Supabase directly rather than calling the main site's
// `/api/broker/contributions`, because that is the settled cross-app decision
// (`crossAppPolicy.mjs`, enforced by `test/cross-app-boundary.test.mjs`): the
// data lives in Supabase, so Mission Control reaches it under its own RBAC and
// its own audit trail instead of bridging two different answers to "is this
// person staff".
//
// Crediting is Ops Manager (Tier 2)+, matching the recommendations queue.
// Attaching ScoutIt's name to a claim about a licensed professional's work is
// not an Agent-tier action, and neither is withdrawing one.
// ═══════════════════════════════════════════════════════════════

/** Append the immutable social-proof audit row. A credit that cannot be
 *  audited does not happen — the audit IS the accountability for publishing
 *  a platform-backed claim about someone's work. */
async function recordContributionEvent(admin, { contributionId, staff, eventType, payload }) {
  const { error } = await admin.from("broker_social_proof_audit_events").insert({
    contribution_id: contributionId,
    actor_user_id: staff.id,
    event_type: eventType,
    event_payload: { ...payload, actor_email: staff.email, actor_tier: staff.tier },
  });

  if (error) {
    throw new Error(`The contribution could not be audited: ${error.message}`);
  }
}

/**
 * Credit one contribution against a broker. Ops Manager (Tier 2)+.
 * @param {FormData} formData
 */
export async function creditContribution(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const validated = validateCredit({
    brokerId: formData.get("brokerId")?.toString(),
    kind: formData.get("kind")?.toString(),
    title: formData.get("title")?.toString(),
    artifactPath: formData.get("artifactPath")?.toString(),
    publish: formData.get("publish") === "true",
  });
  if (!validated.ok) throw new Error(validated.error);

  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from("broker_contributions")
    .insert(validated.value)
    .select("id, status")
    .single();
  if (error) throw new Error(error.message);

  await recordContributionEvent(admin, {
    contributionId: inserted.id,
    staff,
    eventType: CONTRIBUTION_EVENTS.PUBLISHED,
    payload: {
      kind: validated.value.kind,
      artifact_path: validated.value.artifact_path,
      published: validated.value.status === CONTRIBUTION_STATES.PUBLISHED,
    },
  });

  await logActionStrict({
    staff,
    action: "contribution.credit",
    targetTable: "broker_contributions",
    targetId: inserted.id,
    metadata: { kind: validated.value.kind, brokerId: validated.value.broker_id },
  });

  revalidatePath("/dashboard/contributions");
}

/**
 * Withdraw a credit from the public dossier. Ops Manager (Tier 2)+.
 *
 * Retraction, not deletion: the credit stops being published while the record
 * of having made it survives. There is no delete in this file.
 * @param {FormData} formData
 */
export async function retractContribution(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const id = formData.get("contributionId")?.toString().trim();
  const reason = formData.get("reason")?.toString().trim() || null;
  if (!id) throw new Error("Missing contribution id.");
  if (!reason) throw new Error("A reason is required to retract a credit.");

  const admin = createAdminClient();
  const { data: retracted, error } = await admin
    .from("broker_contributions")
    .update({ status: CONTRIBUTION_STATES.RETRACTED, updated_at: new Date().toISOString() })
    .eq("id", id)
    .neq("status", CONTRIBUTION_STATES.RETRACTED)
    .select("id, status")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!retracted) throw new Error("That contribution is not there, or is already retracted.");

  await recordContributionEvent(admin, {
    contributionId: retracted.id,
    staff,
    eventType: CONTRIBUTION_EVENTS.RETRACTED,
    payload: { reason },
  });

  await logActionStrict({
    staff,
    action: "contribution.retract",
    targetTable: "broker_contributions",
    targetId: retracted.id,
    reason,
  });

  revalidatePath("/dashboard/contributions");
}
