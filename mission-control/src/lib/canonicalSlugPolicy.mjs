const LOCKED_STATES = new Set([
  "live",
  "off_market",
  "staff_suspended",
  "permanently_removed",
]);

const LEGACY_LOCKED_PIPELINE_STATES = new Set([
  "approved",
  "archived",
  "off_market",
  "permanently_removed",
]);

export function hasLockedCanonicalUrl(property = {}) {
  if (String(property.canonical_slug || "").trim()) return true;

  const lifecycle = String(property.lifecycle_state || "").trim().toLowerCase();
  if (LOCKED_STATES.has(lifecycle)) return true;

  const pipeline = String(property.pipeline_status || "").trim().toLowerCase();
  return LEGACY_LOCKED_PIPELINE_STATES.has(pipeline);
}

export function titleChangeWouldDriftCanonicalUrl(property = {}, incomingTitle) {
  if (incomingTitle === undefined) return false;
  if (!hasLockedCanonicalUrl(property)) return false;
  return String(incomingTitle) !== String(property.title || "");
}

export function canonicalSlugFor(property = {}) {
  return String(property.canonical_slug || property.slug || "").trim() || null;
}
