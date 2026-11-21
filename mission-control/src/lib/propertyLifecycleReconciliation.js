import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  airtableOperationRequest,
  getAirtableOperationConfiguration,
  loadPropertyCmsTableSchema,
  SAMPLE_PROPERTY_SLUGS,
} from "./sampleDataOperation";
import {
  REVIEW_PROPERTY_COLUMNS,
  WITHDRAWAL_AUDIT,
  isCanonicalAddress,
  isRecordId,
  publicationReviewSnapshot,
  reviewRecord,
} from "./propertyLifecycleReview.mjs";

const API = "https://api.airtable.com/v0";
const RECORD_FIELDS = ["Slug", "Title", "Location", "Approved_For_ScoutIt", "Is_Sample"];
export const LIFECYCLE_RECONCILIATION_OPERATION = "property.public_lifecycle_reconciliation.v1";

const groupsOf = (values, size) => Array.from({ length: Math.ceil(values.length / size) },
  (_, index) => values.slice(index * size, (index + 1) * size));
const reviewHash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex").toUpperCase();
const normalizedAddress = (value) => typeof value === "string" ? value.trim().toLowerCase() : null;

function recordEndpoint(tableId, recordId) {
  const { baseId } = getAirtableOperationConfiguration();
  return [API, baseId, tableId, ...(recordId ? [recordId] : [])].join("/");
}

async function airtable(url, options) {
  return airtableOperationRequest(url, { ...options, signal: AbortSignal.timeout(5000), redirect: "error" });
}

function recordEvidence(record) {
  return [record.id, record.createdTime ?? null, ...RECORD_FIELDS.map((field) => record.fields?.[field] ?? null)];
}

async function loadAirtableProperties(tableId) {
  const records = [];
  const cursors = new Set();
  let offset = null;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    for (const field of RECORD_FIELDS) params.append("fields[]", field);
    if (offset) params.set("offset", offset);
    const page = await airtable(recordEndpoint(tableId) + "?" + params);
    if (!Array.isArray(page.records) || (page.offset && cursors.has(page.offset))) {
      throw new Error("Could not verify the complete Airtable catalogue.");
    }
    records.push(...page.records);
    offset = page.offset || null;
    if (offset) cursors.add(offset);
  } while (offset);
  return records;
}

async function loadRows(admin, table, columns, column, values) {
  const rows = [];
  for (const group of groupsOf(values, 40)) {
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await admin.from(table).select(columns).in(column, group).order("id").range(offset, offset + 99);
      if (error || !Array.isArray(data)) {
        if (table === "properties" && (error?.code === "42703" || error?.code === "PGRST204")) {
          throw new Error("Publication identity migrations are required before reviewing links.");
        }
        throw new Error("Could not verify listing and historical address evidence.");
      }
      rows.push(...data);
      if (data.length < 100) break;
    }
  }
  return rows;
}

function indexProperties(propertyGroups) {
  const byAddress = new Map();
  const byRecord = new Map();
  for (const property of propertyGroups.flat()) {
    for (const slug of new Set([normalizedAddress(property.slug), normalizedAddress(property.canonical_slug)])) {
      if (!slug) continue;
      if (!byAddress.has(slug)) byAddress.set(slug, new Map());
      byAddress.get(slug).set(property.id, property);
    }
    const recordId = property.publication_external_record_id;
    if (recordId) {
      if (!byRecord.has(recordId)) byRecord.set(recordId, new Map());
      byRecord.get(recordId).set(property.id, property);
    }
  }
  return { byAddress, byRecord };
}

async function loadReviews(admin) {
  const table = await loadPropertyCmsTableSchema();
  const records = await loadAirtableProperties(table.id);
  const publicRecords = records.filter((record) => record.fields?.Approved_For_ScoutIt === true);
  const slugs = [...new Set(publicRecords.map((record) => normalizedAddress(record.fields?.Slug)).filter(isCanonicalAddress))];
  const recordIds = [...new Set(publicRecords.map((record) => record.id).filter(isRecordId))];
  const slugCounts = new Map();
  for (const record of records) {
    const slug = normalizedAddress(record.fields?.Slug);
    if (slug) slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
  }

  const columns = REVIEW_PROPERTY_COLUMNS.join(", ");
  const [canonical, mutable, bindings, history, redirects] = await Promise.all([
    loadRows(admin, "properties", columns, "canonical_slug", slugs),
    loadRows(admin, "properties", columns, "slug", slugs),
    loadRows(admin, "properties", columns, "publication_external_record_id", recordIds),
    loadRows(admin, "property_slug_history", "old_slug", "old_slug", slugs),
    loadRows(admin, "property_slug_redirects", "old_slug", "old_slug", slugs),
  ]);
  const { byAddress, byRecord } = indexProperties([canonical, mutable, bindings]);
  const reserved = new Set([...history, ...redirects].map((row) => normalizedAddress(row.old_slug)));
  const reviews = [];
  for (const group of groupsOf(publicRecords, 6)) {
    reviews.push(...await Promise.all(group.map(async (record) => {
      const slug = record.fields?.Slug;
      const normalized = normalizedAddress(slug);
      const matches = new Map(byAddress.get(normalized));
      for (const [id, property] of byRecord.get(record.id) || []) matches.set(id, property);
      const reviewedProperties = [...matches.values()];
      const sample = record.fields?.Is_Sample === true || record.fields?.Is_Sample === "true" || SAMPLE_PROPERTY_SLUGS.includes(normalized);
      const evidence = {
        record, properties: reviewedProperties, duplicatePublicAddress: slugCounts.get(normalized) > 1,
        historicalAddress: reserved.has(normalized), sample,
      };
      let result = reviewRecord(evidence);
      let routing = result.property ? "unchecked" : "missing_property";
      if (result.requiresRouting) {
        const { data, error } = await admin.rpc("get_property_lead_recipients", {
          p_property_id: result.property.id, p_preferred_broker_id: null,
        });
        routing = error ? "unavailable" : Array.isArray(data) && data.length ? "present" : "empty";
        result = reviewRecord({ ...evidence, routing });
      }
      const property = result.property;
      const snapshot = property ? publicationReviewSnapshot(property) : null;
      const candidate = {
        airtableRecordId: record.id,
        slug: slug || null,
        title: record.fields?.Title || "Untitled property",
        location: record.fields?.Location || null,
        propertyId: property?.id || null,
        privateTitle: property?.title || null,
        privateLocation: property?.location || null,
        lifecycle: property?.lifecycle_state || null,
        pipeline: property?.pipeline_status || null,
        canonicalSlug: property?.canonical_slug || null,
        routing,
        state: result.state,
        actions: result.actions,
        reviewHash: reviewHash({
          table: table.id, record: recordEvidence(record), snapshot, routing, state: result.state,
        }),
      };
      return { candidate, snapshot, record };
    })));
  }
  return { table, reviews };
}

export async function getLifecycleReconciliationStatus() {
  const admin = createAdminClient();
  const [{ table, reviews }, pending] = await Promise.all([loadReviews(admin), loadPendingCatalogueRefreshes(admin)]);
  const candidates = reviews.map(({ candidate }) => candidate);
  return {
    table: { id: table.id, name: table.name },
    candidates,
    ready: candidates.filter((item) => item.state === "ready"),
    retained: candidates.filter((item) => item.state === "sample"),
    issues: candidates.filter((item) => !["ready", "sample"].includes(item.state)),
    pending,
  };
}

async function loadPendingCatalogueRefreshes(admin) {
  const { data, error } = await admin.from("mission_control_actions")
    .select("action, metadata").in("action", [WITHDRAWAL_AUDIT.complete, WITHDRAWAL_AUDIT.refreshed])
    .order("created_at", { ascending: false }).limit(50);
  if (error || !Array.isArray(data)) return { available: false, entries: [] };

  const reviewed = new Set();
  const entries = [];
  for (const { action, metadata } of data) {
    const id = metadata?.intent_id;
    if (!id || reviewed.has(id) || metadata.operation_id !== LIFECYCLE_RECONCILIATION_OPERATION) continue;
    reviewed.add(id);
    if (action === WITHDRAWAL_AUDIT.complete && metadata.shared_cache_purged === false && isCanonicalAddress(metadata.slug)) {
      entries.push({ intentId: id, slug: metadata.slug });
    }
  }
  return { available: true, entries };
}

async function readReviewedRecord(tableId, candidate, reviewed) {
  const record = await airtable(recordEndpoint(tableId, candidate.airtableRecordId));
  if (reviewHash(recordEvidence(record)) !== reviewHash(recordEvidence(reviewed))) {
    throw new Error("The Airtable record changed. Refresh before applying a resolution.");
  }
  return record;
}

export async function applyReviewedLifecycle({ airtableRecordId, expectedReviewHash, actorId, reason, decision, recordIntent }) {
  const admin = createAdminClient();
  const { table, reviews } = await loadReviews(admin);
  const reviewed = reviews.find(({ candidate }) => candidate.airtableRecordId === airtableRecordId);
  const candidate = reviewed?.candidate;
  if (!candidate || candidate.reviewHash !== expectedReviewHash || !candidate.actions.includes(decision)) {
    throw new Error("The listing changed or this resolution is unavailable. Refresh the review.");
  }
  await recordIntent(candidate, table.id);
  await readReviewedRecord(table.id, candidate, reviewed.record);

  if (decision === "unpublish") {
    const endpoint = recordEndpoint(table.id, airtableRecordId);
    const result = await airtable(endpoint, {
      method: "PATCH",
      body: JSON.stringify({ fields: { Approved_For_ScoutIt: false }, typecast: false }),
    });
    if (!confirmedWithdrawal(result, candidate) || !confirmedWithdrawal(await airtable(endpoint), candidate)) {
      throw new Error("Airtable did not confirm removal of the reviewed listing. Check its status before retrying.");
    }
  } else {
    const { data, error } = await admin.rpc("reconcile_property_publication", {
      p_property_id: candidate.propertyId,
      p_actor_id: actorId,
      p_decision: decision,
      p_record_id: airtableRecordId,
      p_slug: candidate.slug,
      p_expected: reviewed.snapshot,
      p_reason: reason,
    });
    if (error || data?.state !== "saved" || data.propertyId !== candidate.propertyId || data.recordId !== airtableRecordId) {
      throw new Error("Could not confirm the reviewed change. Refresh before retrying.");
    }
  }
  return candidate;
}

function confirmedWithdrawal(record, { airtableRecordId, slug }) {
  return record.id === airtableRecordId && record.fields?.Slug === slug &&
    (record.fields.Approved_For_ScoutIt === false || record.fields.Approved_For_ScoutIt === undefined);
}

export async function verifyWithdrawnReview(airtableRecordId, slug, tableId) {
  if (!isRecordId(airtableRecordId) || !isCanonicalAddress(slug)) return false;
  const table = await loadPropertyCmsTableSchema();
  if (table.id !== tableId) return false;
  return confirmedWithdrawal(await airtable(recordEndpoint(table.id, airtableRecordId)), { airtableRecordId, slug });
}
