import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  airtableOperationRequest,
  getAirtableOperationConfiguration,
  loadPropertyCmsTableSchema,
} from "./sampleDataOperation";

const API = "https://api.airtable.com/v0";

export const LIFECYCLE_RECONCILIATION_OPERATION = Object.freeze({
  id: "property.public_lifecycle_reconciliation.v1",
  restoreConfirmation: "RESTORE REVIEWED PUBLIC LIFECYCLE",
  unpublishConfirmation: "UNPUBLISH DRIFTED AIRTABLE RECORD",
});

async function loadAirtableProperties(tableId) {
  const config = getAirtableOperationConfiguration();
  const records = [];
  let offset = null;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    for (const field of ["Slug", "Title", "Approved_For_ScoutIt", "Is_Sample"]) params.append("fields[]", field);
    if (offset) params.set("offset", offset);
    const page = await airtableOperationRequest(`${API}/${config.baseId}/${tableId}?${params}`);
    records.push(...(page.records || []));
    offset = page.offset || null;
  } while (offset);
  return records;
}

function candidateHash(candidate) {
  const stable = {
    airtableRecordId: candidate.airtableRecordId,
    slug: candidate.slug,
    propertyId: candidate.propertyId,
    lifecycle: candidate.lifecycle,
    pipeline: candidate.pipeline,
    canonicalSlug: candidate.canonicalSlug,
    routingState: candidate.routingState,
    state: candidate.state,
  };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex").toUpperCase();
}

export async function getLifecycleReconciliationStatus() {
  const table = await loadPropertyCmsTableSchema();
  const publicRecords = (await loadAirtableProperties(table.id)).filter((record) => record.fields?.Approved_For_ScoutIt === true && record.fields?.Slug);
  const slugs = publicRecords.map((record) => record.fields.Slug);
  const admin = createAdminClient();
  const { data: properties, error } = await admin.from("properties")
    .select("id, slug, canonical_slug, canonical_slug_locked_at, lifecycle_state, pipeline_status, moderation_status, owner_id, published_at")
    .in("slug", slugs);
  if (error) throw new Error("Supabase lifecycle reconciliation preflight failed.");

  const candidates = [];
  for (const record of publicRecords) {
    const slug = record.fields.Slug;
    const property = (properties || []).find((item) => item.slug === slug) || null;
    let routingState = "missing_property";
    if (property) {
      const { data: recipients, error: routingError } = await admin.rpc("get_property_lead_recipients", {
        p_property_id: property.id,
        p_preferred_broker_id: null,
      });
      routingState = routingError ? "unavailable" : (recipients || []).length ? "present" : "empty";
    }
    let state = "ready";
    if (!property) state = "missing_supabase";
    else if (property.canonical_slug && property.canonical_slug !== slug) state = "canonical_conflict";
    else if (property.lifecycle_state === "permanently_removed") state = "permanently_removed";
    else if (property.lifecycle_state === "staff_suspended") state = "staff_suspended";
    else if (!property.owner_id || routingState !== "present") state = "routing_unavailable";
    else if (property.lifecycle_state !== "live" || property.pipeline_status !== "approved" || property.canonical_slug !== slug) state = "restorable";

    const candidate = {
      airtableRecordId: record.id,
      slug,
      title: record.fields.Title || "Untitled property",
      isSample: record.fields.Is_Sample === true,
      propertyId: property?.id || null,
      lifecycle: property?.lifecycle_state || null,
      pipeline: property?.pipeline_status || null,
      canonicalSlug: property?.canonical_slug || null,
      canonicalSlugLockedAt: property?.canonical_slug_locked_at || null,
      publishedAt: property?.published_at || null,
      ownerPresent: Boolean(property?.owner_id),
      routingState,
      state,
    };
    candidate.reviewHash = candidateHash(candidate);
    candidates.push(candidate);
  }
  return { table: { id: table.id, name: table.name }, candidates, ready: candidates.filter((item) => item.state === "ready"), issues: candidates.filter((item) => item.state !== "ready") };
}

export async function restoreReviewedPublicLifecycle({ airtableRecordId, expectedReviewHash, actorId, reason }) {
  const status = await getLifecycleReconciliationStatus();
  const candidate = status.candidates.find((item) => item.airtableRecordId === airtableRecordId);
  if (!candidate || candidate.state !== "restorable" || candidate.reviewHash !== expectedReviewHash) {
    throw new Error("The reviewed lifecycle candidate changed or cannot be restored safely.");
  }
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: updated, error } = await admin.from("properties").update({
    canonical_slug: candidate.slug,
    canonical_slug_locked_at: candidate.canonicalSlugLockedAt || now,
    lifecycle_state: "live",
    pipeline_status: "approved",
    moderation_status: "approved",
    published_at: candidate.publishedAt || now,
    withdrawn_at: null,
    quietly_open_to_offers: false,
  }).eq("id", candidate.propertyId).select("id, slug, canonical_slug, lifecycle_state, pipeline_status").single();
  if (error || !updated) throw new Error("Supabase rejected the reviewed lifecycle restoration.");

  const operationKey = `mc-public-reconcile:${candidate.propertyId}:${candidate.airtableRecordId}`;
  const { error: eventError } = await admin.from("property_lifecycle_events").upsert({
    property_id: candidate.propertyId,
    operation_key: operationKey,
    from_state: candidate.lifecycle,
    to_state: "live",
    actor_id: actorId,
    reason,
    metadata: { airtable_record_id: candidate.airtableRecordId, public_slug: candidate.slug, source: LIFECYCLE_RECONCILIATION_OPERATION.id },
  }, { onConflict: "operation_key", ignoreDuplicates: true });
  if (eventError) throw new Error("Lifecycle changed, but append-only reconciliation evidence needs repair.");

  const after = await getLifecycleReconciliationStatus();
  const verified = after.candidates.find((item) => item.airtableRecordId === airtableRecordId);
  if (verified?.state !== "ready") throw new Error("Lifecycle update returned, but public trust verification is not ready.");
  return { before: candidate, after: verified, operationKey };
}

export async function unpublishReviewedAirtableRecord({ airtableRecordId, expectedReviewHash }) {
  const status = await getLifecycleReconciliationStatus();
  const candidate = status.candidates.find((item) => item.airtableRecordId === airtableRecordId);
  if (!candidate || candidate.state === "ready" || candidate.reviewHash !== expectedReviewHash) {
    throw new Error("The reviewed public drift candidate changed or is already ready.");
  }
  const config = getAirtableOperationConfiguration();
  await airtableOperationRequest(`${API}/${config.baseId}/${status.table.id}/${candidate.airtableRecordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Approved_For_ScoutIt: false }, typecast: false }),
  });
  const after = await getLifecycleReconciliationStatus();
  if (after.candidates.some((item) => item.airtableRecordId === airtableRecordId)) {
    throw new Error("Airtable returned, but the drifted record remains public.");
  }
  return candidate;
}
