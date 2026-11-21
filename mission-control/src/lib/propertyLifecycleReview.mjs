export const REVIEW_PROPERTY_COLUMNS = [
  "id", "slug", "canonical_slug", "canonical_slug_locked_at", "title", "location", "owner_id",
  "publication_external_record_id", "publication_sync_state", "lifecycle_state", "pipeline_status",
  "moderation_status", "published_at", "archived_at", "withdrawn_at", "permanently_removed_at",
  "quietly_open_to_offers",
];

export const LIFECYCLE_REVIEW_ACTIONS = Object.freeze({
  bind_record: { label: "Save verified Airtable binding", confirmation: "BIND VERIFIED AIRTABLE RECORD" },
  restore_live: { label: "Repair Supabase lifecycle", confirmation: "RESTORE REVIEWED PUBLIC LIFECYCLE" },
  unpublish: { label: "Remove from public catalogue", confirmation: "UNPUBLISH DRIFTED AIRTABLE RECORD" },
});

export const WITHDRAWAL_AUDIT = Object.freeze({
  intent: "property.lifecycle_reconciliation.unpublish.intent",
  complete: "property.lifecycle_reconciliation.unpublish.complete",
  refreshed: "property.lifecycle_reconciliation.unpublish.cache_refreshed",
});

export const isRecordId = (value) => typeof value === "string" && /^rec[A-Za-z0-9]+$/.test(value);
export const isCanonicalAddress = (value) => typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,219}$/.test(value);
export const normalizeReviewText = (value) => typeof value === "string"
  ? value.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase()
  : "";

const ACTIONS_BY_STATE = {
  unbound: ["bind_record"],
  restorable: ["restore_live"],
  missing_supabase: ["unpublish"],
  withdrawn: ["unpublish"],
  staff_suspended: ["unpublish"],
  permanently_removed: ["unpublish"],
};

export function publicationReviewSnapshot(property) {
  return Object.fromEntries(REVIEW_PROPERTY_COLUMNS.map((key) => [key, property[key] ?? null]));
}

export function reviewRecord({
  record, properties, duplicatePublicAddress, historicalAddress, sample, routing = "unchecked", now = Date.now(),
}) {
  const slug = record.fields?.Slug;
  const property = properties.length === 1 ? properties[0] : null;
  const bound = property?.publication_external_record_id;
  const title = record.fields?.Title;
  const location = record.fields?.Location;
  let state;

  if (sample) state = "sample";
  else if (!isRecordId(record.id) || !isCanonicalAddress(slug)) state = "invalid_public_address";
  else if (duplicatePublicAddress || properties.length > 1) state = "ambiguous";
  else if (historicalAddress) state = "reserved_address";
  else if (!property) {
    const createdAt = Date.parse(record.createdTime);
    state = Number.isFinite(createdAt) && now - createdAt >= 15 * 60 * 1000 ? "missing_supabase" : "publication_unverified";
  }
  else if (property.publication_sync_state) state = "publication_pending";
  else if (bound && bound !== record.id) state = "binding_conflict";
  else if (property.canonical_slug !== slug) state = "canonical_conflict";
  else if (property.permanently_removed_at || [property.lifecycle_state, property.pipeline_status].includes("permanently_removed")) {
    state = bound ? "permanently_removed" : "protected_unbound";
  } else if ([property.lifecycle_state, property.pipeline_status, property.moderation_status].some((status) => ["staff_suspended", "suspended"].includes(status))) {
    state = bound ? "staff_suspended" : "protected_unbound";
  } else if (property.archived_at || property.withdrawn_at ||
      [property.lifecycle_state, property.pipeline_status, property.moderation_status].some((status) => ["archived", "off_market"].includes(status))) {
    state = bound ? "withdrawn" : "protected_unbound";
  } else if (property.pipeline_status !== "approved" || !["approved", "pending"].includes(property.moderation_status) ||
      !property.published_at || !property.canonical_slug_locked_at || property.quietly_open_to_offers !== false) {
    state = "publication_unverified";
  } else if (!bound && (!normalizeReviewText(title) || normalizeReviewText(title) !== normalizeReviewText(property.title) ||
      !normalizeReviewText(location) || normalizeReviewText(location) !== normalizeReviewText(property.location))) {
    state = "details_conflict";
  } else if (!property.owner_id || !["present", "unchecked"].includes(routing)) state = "routing_unavailable";
  else if (!bound) state = property.lifecycle_state === "live" ? "unbound" : "publication_unverified";
  else if (property.lifecycle_state === "live") state = "ready";
  else state = property.lifecycle_state === "draft" ? "restorable" : "publication_unverified";

  return {
    state,
    actions: ACTIONS_BY_STATE[state] || [],
    requiresRouting: ["ready", "unbound", "restorable"].includes(state),
    property,
  };
}
