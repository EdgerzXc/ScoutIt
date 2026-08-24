"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import {
  ONBOARDING_MIGRATION,
  applyFixedOnboardingMigration,
  getOnboardingMigrationStatus,
} from "@/lib/onboardingMigrationOperation";
import {
  WISHLIST_REVOCATION_MIGRATION,
  applyFixedWishlistRevocationMigration,
  getWishlistRevocationMigrationStatus,
} from "@/lib/wishlistRevocationMigrationOperation";
import {
  PILOT_COHORT_MIGRATION,
  applyFixedPilotCohortMigration,
  getPilotCohortMigrationStatus,
} from "@/lib/pilotCohortMigrationOperation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PILOT_CONFIRMATIONS,
  changePilotCohortStatusRecord,
  confirmPilotAccountDeletionRecord,
  createPilotCohortRecord,
  enrollPilotParticipantRecord,
  offboardPilotParticipantRecord,
} from "@/lib/pilotCohortRegistry";
import {
  DEMO_AUTHORITY_TRANSFER_OPERATION,
  executeDemoAuthorityTransfer,
  getDemoAuthorityTransferStatus,
} from "@/lib/demoAuthorityTransferOperation";

export async function applyPilotCohortMigration(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const confirmation = formData.get("confirmation")?.toString().trim();
  const reason = formData.get("reason")?.toString().trim();
  const reviewedChecksum = formData.get("checksum")?.toString();
  if (confirmation !== PILOT_COHORT_MIGRATION.confirmationPhrase) return { ok: false, message: `Type ${PILOT_COHORT_MIGRATION.confirmationPhrase} exactly.` };
  if (!reason || reason.length < 12) return { ok: false, message: "Add a change reason of at least 12 characters." };
  if (reviewedChecksum !== PILOT_COHORT_MIGRATION.expectedChecksum) return { ok: false, message: "The reviewed checksum is stale. Refresh before proceeding." };
  let intentId = null;
  try {
    const before = await getPilotCohortMigrationStatus();
    if (!before.canApply) return { ok: false, message: "Preflight changed or is incomplete. Nothing was applied." };
    intentId = await logActionStrict({ staff, action: "database.pilot_cohort_migration.intent", targetTable: PILOT_COHORT_MIGRATION.affectedTable, targetId: PILOT_COHORT_MIGRATION.id, reason, metadata: { checksum: before.source.checksum, schema_state: before.schema.state, backup: before.backup } });
    await applyFixedPilotCohortMigration();
    const after = await getPilotCohortMigrationStatus();
    if (after.schema?.state !== "applied") throw new Error("The query returned, but post-verification did not reach the approved state.");
    await logActionStrict({ staff, action: "database.pilot_cohort_migration.complete", targetTable: PILOT_COHORT_MIGRATION.affectedTable, targetId: PILOT_COHORT_MIGRATION.id, reason, metadata: { intent_id: intentId, checksum: after.source.checksum, schema_state: after.schema.state } });
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
    return { ok: true, message: "Private pilot cohort registry applied and verified." };
  } catch (error) {
    if (intentId) { try { await logActionStrict({ staff, action: "database.pilot_cohort_migration.failed", targetTable: PILOT_COHORT_MIGRATION.affectedTable, targetId: PILOT_COHORT_MIGRATION.id, reason, metadata: { intent_id: intentId, error: error.message || "Unknown failure" } }); } catch (auditError) { console.error("Pilot cohort migration failure audit also failed", auditError); } }
    revalidatePath("/dashboard/operations");
    return { ok: false, message: error.message || "Pilot cohort registry migration failed." };
  }
}
export async function applyWishlistRevocationMigration(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const confirmation = formData.get("confirmation")?.toString().trim();
  const reason = formData.get("reason")?.toString().trim();
  const reviewedChecksum = formData.get("checksum")?.toString();
  if (confirmation !== WISHLIST_REVOCATION_MIGRATION.confirmationPhrase) return { ok: false, message: `Type ${WISHLIST_REVOCATION_MIGRATION.confirmationPhrase} exactly.` };
  if (!reason || reason.length < 12) return { ok: false, message: "Add a change reason of at least 12 characters." };
  if (reviewedChecksum !== WISHLIST_REVOCATION_MIGRATION.expectedChecksum) return { ok: false, message: "The reviewed checksum is stale. Refresh before proceeding." };
  let intentId = null;
  try {
    const before = await getWishlistRevocationMigrationStatus();
    if (!before.canApply) return { ok: false, message: "Preflight changed or is incomplete. Nothing was applied." };
    intentId = await logActionStrict({ staff, action: "database.wishlist_revocation_migration.intent", targetTable: WISHLIST_REVOCATION_MIGRATION.affectedTable, targetId: WISHLIST_REVOCATION_MIGRATION.id, reason, metadata: { checksum: before.source.checksum, schema_state: before.schema.state, backup: before.backup } });
    await applyFixedWishlistRevocationMigration();
    const after = await getWishlistRevocationMigrationStatus();
    if (after.schema?.state !== "applied") throw new Error("The query returned, but post-verification did not reach the approved state.");
    await logActionStrict({ staff, action: "database.wishlist_revocation_migration.complete", targetTable: WISHLIST_REVOCATION_MIGRATION.affectedTable, targetId: WISHLIST_REVOCATION_MIGRATION.id, reason, metadata: { intent_id: intentId, checksum: after.source.checksum, schema_state: after.schema.state, row_count: after.schema.raw?.row_count } });
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
    return { ok: true, message: "Wishlist share-link revocation migration applied and verified." };
  } catch (error) {
    if (intentId) { try { await logActionStrict({ staff, action: "database.wishlist_revocation_migration.failed", targetTable: WISHLIST_REVOCATION_MIGRATION.affectedTable, targetId: WISHLIST_REVOCATION_MIGRATION.id, reason, metadata: { intent_id: intentId, error: error.message || "Unknown failure" } }); } catch (auditError) { console.error("Wishlist migration failure audit also failed", auditError); } }
    revalidatePath("/dashboard/operations");
    return { ok: false, message: error.message || "Wishlist revocation migration failed." };
  }
}import {
  SAMPLE_DATA_OPERATION,
  createSampleCheckboxField,
  getSampleDataOperationStatus,
  markSevenSampleListings,
} from "@/lib/sampleDataOperation";import {
  PROPERTY_MEDIA_OPERATION,
  clearInvalidPropertyMedia,
  getPropertyMediaOperationStatus,
} from "@/lib/propertyMediaOperation";import {
  SAMPLE_CHILD_SPACE_OPERATION,
  getSampleChildSpaceOperationStatus,
  removeInvalidSampleChildSpaces,
} from "@/lib/sampleChildSpaceOperation";
import {
  LIFECYCLE_RECONCILIATION_OPERATION,
  restoreReviewedPublicLifecycle,
  unpublishReviewedAirtableRecord,
} from "@/lib/propertyLifecycleReconciliation";

export async function applyOnboardingMigration(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const confirmation = formData.get("confirmation")?.toString().trim();
  const reason = formData.get("reason")?.toString().trim();
  const reviewedChecksum = formData.get("checksum")?.toString();
  if (confirmation !== ONBOARDING_MIGRATION.confirmationPhrase) {
    return { ok: false, message: `Type ${ONBOARDING_MIGRATION.confirmationPhrase} exactly.` };
  }
  if (!reason || reason.length < 12) {
    return { ok: false, message: "Add a change reason of at least 12 characters." };
  }
  if (reviewedChecksum !== ONBOARDING_MIGRATION.expectedChecksum) {
    return { ok: false, message: "The reviewed checksum is stale. Refresh before proceeding." };
  }

  let intentId = null;
  try {
    const status = await getOnboardingMigrationStatus();
    if (!status.canApply) {
      return { ok: false, message: "Preflight changed or is incomplete. Nothing was applied." };
    }

    intentId = await logActionStrict({
      staff,
      action: "database.migration.intent",
      targetTable: ONBOARDING_MIGRATION.affectedTable,
      targetId: ONBOARDING_MIGRATION.id,
      reason,
      metadata: {
        checksum: status.source.checksum,
        schema_state: status.schema.state,
        counts_before: status.counts,
        backup: status.backup,
        privacy_safe: status.privacySafe,
      },
    });

    await applyFixedOnboardingMigration();
    const verified = await getOnboardingMigrationStatus();
    if (verified.schema?.state !== "applied" || !verified.privacySafe) {
      throw new Error("The query returned, but post-verification did not reach the approved state.");
    }

    await logActionStrict({
      staff,
      action: "database.migration.complete",
      targetTable: ONBOARDING_MIGRATION.affectedTable,
      targetId: ONBOARDING_MIGRATION.id,
      reason,
      metadata: {
        intent_id: intentId,
        checksum: verified.source.checksum,
        schema_state: verified.schema.state,
        counts_after: verified.counts,
        privacy_safe: verified.privacySafe,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/operations");
    revalidatePath("/dashboard/audit");
    return { ok: true, message: "Migration applied and post-verification passed." };
  } catch (error) {
    if (intentId) {
      try {
        await logActionStrict({
          staff,
          action: "database.migration.failed",
          targetTable: ONBOARDING_MIGRATION.affectedTable,
          targetId: ONBOARDING_MIGRATION.id,
          reason,
          metadata: { intent_id: intentId, error: error.message || "Unknown failure" },
        });
      } catch (auditError) {
        console.error("Migration failure audit also failed", auditError);
      }
    }
    revalidatePath("/dashboard/operations");
    return { ok: false, message: error.message || "Migration failed. Review the operation state." };
  }
}
function sampleInput(formData, expectedConfirmation) {
  const confirmation = formData.get("confirmation")?.toString().trim();
  const reason = formData.get("reason")?.toString().trim();
  if (confirmation !== expectedConfirmation) return { error: `Type ${expectedConfirmation} exactly.` };
  if (!reason || reason.length < 12) return { error: "Add a change reason of at least 12 characters." };
  return { reason };
}

export async function createSampleField(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const input = sampleInput(formData, SAMPLE_DATA_OPERATION.createConfirmation);
  if (input.error) return { ok: false, message: input.error };
  let intentId = null;
  try {
    const before = await getSampleDataOperationStatus();
    if (!before.canCreateField) return { ok: false, message: "Field preflight changed or is blocked. Nothing was changed." };
    intentId = await logActionStrict({ staff, action: "airtable.sample_field.intent", targetTable: SAMPLE_DATA_OPERATION.table, targetId: SAMPLE_DATA_OPERATION.field, reason: input.reason, metadata: { operation_id: SAMPLE_DATA_OPERATION.id, field_state_before: before.field?.state } });
    const after = await createSampleCheckboxField();
    await logActionStrict({ staff, action: "airtable.sample_field.complete", targetTable: SAMPLE_DATA_OPERATION.table, targetId: SAMPLE_DATA_OPERATION.field, reason: input.reason, metadata: { intent_id: intentId, operation_id: SAMPLE_DATA_OPERATION.id, field_state_after: after.field.state } });
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
    return { ok: true, message: "Is_Sample was created and verified as a checkbox field." };
  } catch (error) {
    if (intentId) { try { await logActionStrict({ staff, action: "airtable.sample_field.failed", targetTable: SAMPLE_DATA_OPERATION.table, targetId: SAMPLE_DATA_OPERATION.field, reason: input.reason, metadata: { intent_id: intentId, operation_id: SAMPLE_DATA_OPERATION.id, error: error.message || "Unknown failure" } }); } catch (auditError) { console.error("Sample field failure audit also failed", auditError); } }
    return { ok: false, message: error.message || "The sample field operation failed." };
  }
}

export async function markSampleListings(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const input = sampleInput(formData, SAMPLE_DATA_OPERATION.markConfirmation);
  if (input.error) return { ok: false, message: input.error };
  let intentId = null;
  try {
    const before = await getSampleDataOperationStatus();
    if (!before.canMarkSamples) return { ok: false, message: "Sample-record preflight changed or is blocked. Nothing was changed." };
    const recordIds = before.samples.matched.map((record) => record.id);
    intentId = await logActionStrict({ staff, action: "airtable.sample_records.intent", targetTable: SAMPLE_DATA_OPERATION.table, targetId: SAMPLE_DATA_OPERATION.id, reason: input.reason, metadata: { operation_id: SAMPLE_DATA_OPERATION.id, record_ids: recordIds, expected_count: 7 } });
    const after = await markSevenSampleListings();
    await logActionStrict({ staff, action: "airtable.sample_records.complete", targetTable: SAMPLE_DATA_OPERATION.table, targetId: SAMPLE_DATA_OPERATION.id, reason: input.reason, metadata: { intent_id: intentId, operation_id: SAMPLE_DATA_OPERATION.id, record_ids: recordIds, marked_count: after.samples.marked.length } });
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
    return { ok: true, message: "All seven fixed sample listings were marked and verified." };
  } catch (error) {
    if (intentId) { try { await logActionStrict({ staff, action: "airtable.sample_records.failed", targetTable: SAMPLE_DATA_OPERATION.table, targetId: SAMPLE_DATA_OPERATION.id, reason: input.reason, metadata: { intent_id: intentId, operation_id: SAMPLE_DATA_OPERATION.id, error: error.message || "Unknown failure" } }); } catch (auditError) { console.error("Sample marking failure audit also failed", auditError); } }
    return { ok: false, message: error.message || "The sample marking operation failed." };
  }
}
export async function clearInvalidMediaFields(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const input = sampleInput(formData, PROPERTY_MEDIA_OPERATION.cleanupConfirmation);
  if (input.error) return { ok: false, message: input.error };
  const reviewedPlanHash = formData.get("planHash")?.toString();
  let intentId = null;
  try {
    const before = await getPropertyMediaOperationStatus();
    if (!before.canClean || before.planHash !== reviewedPlanHash) return { ok: false, message: "Media preflight changed or is blocked. Nothing was cleared." };
    intentId = await logActionStrict({ staff, action: "airtable.property_media_cleanup.intent", targetTable: PROPERTY_MEDIA_OPERATION.table, targetId: PROPERTY_MEDIA_OPERATION.id, reason: input.reason, metadata: { plan_hash: before.planHash, unsafe_entries: before.unsafe.map(({ recordId, slug, field, actualKind }) => ({ recordId, slug, field, actualKind })) } });
    const result = await clearInvalidPropertyMedia(reviewedPlanHash);
    await logActionStrict({ staff, action: "airtable.property_media_cleanup.complete", targetTable: PROPERTY_MEDIA_OPERATION.table, targetId: PROPERTY_MEDIA_OPERATION.id, reason: input.reason, metadata: { intent_id: intentId, plan_hash_before: result.before.planHash, cleared_count: result.before.unsafe.length, retained_count: result.after.retained.length } });
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
    return { ok: true, message: `Cleared ${result.before.unsafe.length} invalid media field value(s) and verified the catalog.` };
  } catch (error) {
    if (intentId) { try { await logActionStrict({ staff, action: "airtable.property_media_cleanup.failed", targetTable: PROPERTY_MEDIA_OPERATION.table, targetId: PROPERTY_MEDIA_OPERATION.id, reason: input.reason, metadata: { intent_id: intentId, error: error.message || "Unknown failure" } }); } catch (auditError) { console.error("Media cleanup failure audit also failed", auditError); } }
    return { ok: false, message: error.message || "The media cleanup operation failed." };
  }
}

export async function attestRetainedMedia(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const input = sampleInput(formData, PROPERTY_MEDIA_OPERATION.attestConfirmation);
  if (input.error) return { ok: false, message: input.error };
  const reviewedPlanHash = formData.get("planHash")?.toString();
  const status = await getPropertyMediaOperationStatus();
  if (!status.canAttest || status.planHash !== reviewedPlanHash) return { ok: false, message: "The retained-media review changed or still contains invalid values." };
  await logActionStrict({ staff, action: "airtable.property_media_retained.attested", targetTable: PROPERTY_MEDIA_OPERATION.table, targetId: PROPERTY_MEDIA_OPERATION.id, reason: input.reason, metadata: { plan_hash: status.planHash, retained: status.retained.map(({ recordId, slug, field, expectedKind }) => ({ recordId, slug, field, expectedKind })), retained_count: status.retained.length } });
  revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
  return { ok: true, message: `Recorded owner authorization for ${status.retained.length} retained media value(s).` };
}
export async function reconcileLifecycleCandidate(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const decision = formData.get("decision")?.toString();
  const expectedConfirmation = decision === "restore_live"
    ? LIFECYCLE_RECONCILIATION_OPERATION.restoreConfirmation
    : decision === "unpublish" ? LIFECYCLE_RECONCILIATION_OPERATION.unpublishConfirmation : null;
  if (!expectedConfirmation) return { ok: false, message: "Choose an allowlisted reconciliation action." };
  const input = sampleInput(formData, expectedConfirmation);
  if (input.error) return { ok: false, message: input.error };
  const airtableRecordId = formData.get("airtableRecordId")?.toString();
  const reviewHash = formData.get("reviewHash")?.toString();
  if (!airtableRecordId || !reviewHash) return { ok: false, message: "The reviewed candidate reference is missing." };
  let intentId = null;
  try {
    intentId = await logActionStrict({ staff, action: `property.lifecycle_reconciliation.${decision}.intent`, targetTable: "properties", targetId: airtableRecordId, reason: input.reason, metadata: { operation_id: LIFECYCLE_RECONCILIATION_OPERATION.id, review_hash: reviewHash, decision } });
    const result = decision === "restore_live"
      ? await restoreReviewedPublicLifecycle({ airtableRecordId, expectedReviewHash: reviewHash, actorId: staff.id, reason: input.reason })
      : await unpublishReviewedAirtableRecord({ airtableRecordId, expectedReviewHash: reviewHash });
    await logActionStrict({ staff, action: `property.lifecycle_reconciliation.${decision}.complete`, targetTable: "properties", targetId: result.after?.propertyId || result.propertyId || airtableRecordId, reason: input.reason, metadata: { intent_id: intentId, operation_id: LIFECYCLE_RECONCILIATION_OPERATION.id, review_hash: reviewHash, decision, slug: result.after?.slug || result.slug } });
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/cms"); revalidatePath("/dashboard/audit");
    return { ok: true, message: decision === "restore_live" ? "Supabase lifecycle, canonical slug, routing, and Airtable visibility now verify together." : "The drifted Airtable record was unpublished and verified." };
  } catch (error) {
    if (intentId) { try { await logActionStrict({ staff, action: `property.lifecycle_reconciliation.${decision}.failed`, targetTable: "properties", targetId: airtableRecordId, reason: input.reason, metadata: { intent_id: intentId, operation_id: LIFECYCLE_RECONCILIATION_OPERATION.id, review_hash: reviewHash, decision, error: error.message || "Unknown failure" } }); } catch (auditError) { console.error("Lifecycle reconciliation failure audit also failed", auditError); } }
    return { ok: false, message: error.message || "Lifecycle reconciliation failed." };
  }
}

export async function cleanInvalidSampleChildSpaces(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const input = sampleInput(formData, SAMPLE_CHILD_SPACE_OPERATION.confirmationPhrase);
  if (input.error) return { ok: false, message: input.error };
  const reviewedPlanHash = formData.get("planHash")?.toString();
  let intentId = null;
  try {
    const before = await getSampleChildSpaceOperationStatus();
    if (!before.canClean || before.planHash !== reviewedPlanHash) return { ok: false, message: "Sample child-space preflight changed or is blocked. Nothing was removed." };
    intentId = await logActionStrict({ staff, action: "airtable.sample_child_spaces.intent", targetTable: SAMPLE_CHILD_SPACE_OPERATION.table, targetId: SAMPLE_CHILD_SPACE_OPERATION.id, reason: input.reason, metadata: { plan_hash: before.planHash, invalid: before.invalid.map(({ recordId, slug, unitId, name, reason }) => ({ recordId, slug, unitId, name, reason })) } });
    const result = await removeInvalidSampleChildSpaces(reviewedPlanHash);
    await logActionStrict({ staff, action: "airtable.sample_child_spaces.complete", targetTable: SAMPLE_CHILD_SPACE_OPERATION.table, targetId: SAMPLE_CHILD_SPACE_OPERATION.id, reason: input.reason, metadata: { intent_id: intentId, plan_hash_before: result.before.planHash, removed_count: result.before.invalid.length } });
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
    return { ok: true, message: `Removed ${result.before.invalid.length} invalid sample child-space row(s) and verified the seven-property allowlist.` };
  } catch (error) {
    if (intentId) { try { await logActionStrict({ staff, action: "airtable.sample_child_spaces.failed", targetTable: SAMPLE_CHILD_SPACE_OPERATION.table, targetId: SAMPLE_CHILD_SPACE_OPERATION.id, reason: input.reason, metadata: { intent_id: intentId, error: error.message || "Unknown failure" } }); } catch (auditError) { console.error("Sample child-space failure audit also failed", auditError); } }
    return { ok: false, message: error.message || "Sample child-space cleanup failed." };
  }
}
function pilotRegistryInput(formData, confirmationKey) {
  const confirmation = formData.get("confirmation")?.toString().trim();
  const reason = formData.get("reason")?.toString().trim();
  const expected = PILOT_CONFIRMATIONS[confirmationKey];
  if (confirmation !== expected) return { error: `Type ${expected} exactly.` };
  if (!reason || reason.length < 12) return { error: "Add an operational reason of at least 12 characters." };
  return { reason };
}

async function runPilotRegistryAction({ staff, admin, action, targetTable, targetId, reason, metadata, operation, successMessage }) {
  let intentId = null;
  try {
    intentId = await logActionStrict({ staff, action: `${action}.intent`, targetTable, targetId, reason, metadata });
    const result = await operation();
    await logActionStrict({ staff, action: `${action}.complete`, targetTable, targetId: result?.id || result?.user_id || targetId, reason,
      metadata: { ...metadata, intent_id: intentId, verified_result: result } });
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
    return { ok: true, message: successMessage };
  } catch (error) {
    if (intentId) {
      try { await logActionStrict({ staff, action: `${action}.failed`, targetTable, targetId, reason,
        metadata: { ...metadata, intent_id: intentId, error: error.message || "Unknown failure" } }); }
      catch (auditError) { console.error("Pilot registry failure audit also failed", auditError); }
    }
    revalidatePath("/dashboard/operations");
    return { ok: false, message: error.message || "Pilot registry operation failed." };
  }
}

export async function createPilotCohort(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const input = pilotRegistryInput(formData, "create");
  if (input.error) return { ok: false, message: input.error };
  const cohortKey = formData.get("cohortKey")?.toString().trim().toLowerCase();
  const payload = { cohortKey, name: formData.get("name")?.toString(), startsAt: formData.get("startsAt")?.toString(), endsAt: formData.get("endsAt")?.toString() };
  const admin = createAdminClient();
  return runPilotRegistryAction({ staff, admin, action: "pilot.cohort.create", targetTable: "pilot_cohorts", targetId: cohortKey || "invalid", reason: input.reason,
    metadata: { cohort_key: cohortKey }, operation: () => createPilotCohortRecord(admin, staff.id, payload), successMessage: "Pilot cohort created and verified." });
}

export async function enrollPilotParticipant(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const input = pilotRegistryInput(formData, "enroll");
  if (input.error) return { ok: false, message: input.error };
  const payload = { cohortId: formData.get("cohortId")?.toString(), userId: formData.get("userId")?.toString(), roles: formData.getAll("roles").map(String) };
  const admin = createAdminClient();
  return runPilotRegistryAction({ staff, admin, action: "pilot.participant.enroll", targetTable: "pilot_participants", targetId: payload.userId || "invalid", reason: input.reason,
    metadata: { cohort_id: payload.cohortId, roles: payload.roles }, operation: () => enrollPilotParticipantRecord(admin, staff.id, payload), successMessage: "Tester enrolled by verified user ID." });
}

export async function changePilotCohortStatus(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const command = formData.get("command")?.toString();
  const input = pilotRegistryInput(formData, command);
  if (input.error) return { ok: false, message: input.error };
  const cohortId = formData.get("cohortId")?.toString();
  const admin = createAdminClient();
  return runPilotRegistryAction({ staff, admin, action: `pilot.cohort.${command}`, targetTable: "pilot_cohorts", targetId: cohortId || "invalid", reason: input.reason,
    metadata: { command }, operation: () => changePilotCohortStatusRecord(admin, staff.id, { cohortId, command }), successMessage: command === "activate" ? "Pilot cohort activated." : "Pilot cohort closed after active-membership verification." });
}

export async function offboardPilotParticipant(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const input = pilotRegistryInput(formData, "offboard");
  if (input.error) return { ok: false, message: input.error };
  const payload = { cohortId: formData.get("cohortId")?.toString(), userId: formData.get("userId")?.toString(), cleanupNote: formData.get("cleanupNote")?.toString() };
  const admin = createAdminClient();
  return runPilotRegistryAction({ staff, admin, action: "pilot.participant.offboard", targetTable: "pilot_participants", targetId: payload.userId || "invalid", reason: input.reason,
    metadata: { cohort_id: payload.cohortId }, operation: () => offboardPilotParticipantRecord(admin, staff.id, payload), successMessage: "Tester offboarded; account deletion remains separately verified." });
}

export async function confirmPilotAccountDeletion(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const input = pilotRegistryInput(formData, "confirmDeletion");
  if (input.error) return { ok: false, message: input.error };
  const payload = { cohortId: formData.get("cohortId")?.toString(), userId: formData.get("userId")?.toString() };
  const admin = createAdminClient();
  return runPilotRegistryAction({ staff, admin, action: "pilot.participant.account_deletion_confirm", targetTable: "pilot_participants", targetId: payload.userId || "invalid", reason: input.reason,
    metadata: { cohort_id: payload.cohortId }, operation: () => confirmPilotAccountDeletionRecord(admin, payload), successMessage: "Missing Auth account verified and deletion evidence recorded." });
}

function transferPreviewForClient(status) {
  const summarize = (items) => items.map(({ label, table, count }) => ({ label, table, count }));
  return {
    target: status.target,
    eligible: summarize(status.eligible),
    blocked: summarize(status.blocked),
    retained: summarize(status.retained),
    notDeployed: status.notDeployed,
    planHash: status.planHash,
    canExecute: status.canExecute,
  };
}

export async function runDemoAuthorityTransfer(previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const command = formData.get("command")?.toString();
  const targetEmail = formData.get("targetEmail")?.toString();
  const admin = createAdminClient();

  if (command === "dry_run") {
    try {
      const status = await getDemoAuthorityTransferStatus({ admin, targetEmail });
      await logActionStrict({
        staff,
        action: "demo.authority_transfer.preview",
        targetTable: "properties",
        targetId: status.target.id,
        metadata: {
          operation_id: DEMO_AUTHORITY_TRANSFER_OPERATION.id,
          source_id: status.sourceId,
          target_email: status.target.email,
          plan_hash: status.planHash,
          eligible: status.eligible.map(({ table, count }) => ({ table, count })),
          blocked: status.blocked.map(({ table, count }) => ({ table, count })),
          retained: status.retained.map(({ table, count }) => ({ table, count })),
        },
      });
      revalidatePath("/dashboard/audit");
      return { ok: true, message: "Dry-run completed and recorded. No authority changed.", preview: transferPreviewForClient(status) };
    } catch (error) {
      return { ok: false, message: error.message || "The ownership dry-run failed.", preview: null };
    }
  }

  if (command !== "execute") return { ok: false, message: "Choose the allowlisted dry-run or execute action.", preview: null };
  const confirmation = formData.get("confirmation")?.toString().trim();
  const reason = formData.get("reason")?.toString().trim();
  const planHash = formData.get("planHash")?.toString();
  if (confirmation !== DEMO_AUTHORITY_TRANSFER_OPERATION.confirmationPhrase) return { ok: false, message: `Type ${DEMO_AUTHORITY_TRANSFER_OPERATION.confirmationPhrase} exactly.`, preview: null };
  if (!reason || reason.length < 12) return { ok: false, message: "Add an operational reason of at least 12 characters.", preview: null };
  let intentId = null;
  try {
    const before = await getDemoAuthorityTransferStatus({ admin, targetEmail });
    if (!before.canExecute || before.planHash !== planHash) return { ok: false, message: "The reviewed plan changed or contains blocked authority. Run the dry-run again.", preview: transferPreviewForClient(before) };
    intentId = await logActionStrict({ staff, action: "demo.authority_transfer.execute.intent", targetTable: "properties", targetId: before.target.id, reason,
      metadata: { operation_id: DEMO_AUTHORITY_TRANSFER_OPERATION.id, source_id: before.sourceId, target_email: before.target.email, plan_hash: before.planHash, property_ids: before.propertyIds, owner_route_count: before.routeCount } });
    const completed = await executeDemoAuthorityTransfer({ admin, targetEmail, expectedPlanHash: planHash });
    await logActionStrict({ staff, action: "demo.authority_transfer.execute.complete", targetTable: "properties", targetId: before.target.id, reason,
      metadata: { intent_id: intentId, operation_id: DEMO_AUTHORITY_TRANSFER_OPERATION.id, plan_hash: before.planHash, verified: completed.verified, result: completed.result } });
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
    return { ok: true, message: `Transferred and verified ${completed.verified.propertyCount} private demo properties.`, preview: null };
  } catch (error) {
    if (intentId) {
      try { await logActionStrict({ staff, action: "demo.authority_transfer.execute.failed", targetTable: "properties", targetId: targetEmail || "unknown", reason,
        metadata: { intent_id: intentId, operation_id: DEMO_AUTHORITY_TRANSFER_OPERATION.id, plan_hash: planHash, error: error.message || "Unknown failure" } }); }
      catch (auditError) { console.error("Demo authority transfer failure audit also failed", auditError); }
    }
    revalidatePath("/dashboard/operations"); revalidatePath("/dashboard/audit");
    return { ok: false, message: error.message || "The ownership transfer failed.", preview: null };
  }
}
