export const PROPERTY_LIFECYCLE_STATES = Object.freeze({
  DRAFT: "draft",
  PDF_VERIFICATION: "pdf_verification",
  LIVE: "live",
  OFF_MARKET: "off_market",
  STAFF_SUSPENDED: "staff_suspended",
  PERMANENTLY_REMOVED: "permanently_removed",
});

const VALID_STATES = new Set(Object.values(PROPERTY_LIFECYCLE_STATES));
const ENTITLED_TIERS = new Set(["cluster", "universe"]);

export function normalizeLifecycleState(property = {}) {
  const explicit = String(property.lifecycle_state || "").toLowerCase();
  if (VALID_STATES.has(explicit)) return explicit;

  // Compatibility mapping for rows created before the lifecycle migration.
  const pipelineStatus = String(property.pipeline_status || "").toLowerCase();
  if (pipelineStatus === "approved") return PROPERTY_LIFECYCLE_STATES.LIVE;
  if (pipelineStatus === "archived" || pipelineStatus === "off_market") {
    return PROPERTY_LIFECYCLE_STATES.OFF_MARKET;
  }
  if (pipelineStatus === "ai_drafting") {
    return PROPERTY_LIFECYCLE_STATES.PDF_VERIFICATION;
  }
  return PROPERTY_LIFECYCLE_STATES.DRAFT;
}

export function isMarketVisible(property = {}) {
  return normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.LIVE;
}

export function isOffMarket(property = {}) {
  return normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.OFF_MARKET;
}

export function isPermanentlyRemoved(property = {}) {
  return normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED;
}

export function canChangeDisplayTitle(property = {}) {
  // Airtable's current Slug formula is derived from Title. A title edit on a
  // row with a reserved canonical slug would therefore change the public URL.
  // Keep this guard until Airtable has an immutable canonical-slug field.
  const state = normalizeLifecycleState(property);
  return state !== PROPERTY_LIFECYCLE_STATES.LIVE &&
    state !== PROPERTY_LIFECYCLE_STATES.OFF_MARKET &&
    state !== PROPERTY_LIFECYCLE_STATES.STAFF_SUSPENDED &&
    state !== PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED;
}

export function canContactProperty(property = {}) {
  const state = normalizeLifecycleState(property);
  if (state === PROPERTY_LIFECYCLE_STATES.LIVE) return true;
  return state === PROPERTY_LIFECYCLE_STATES.OFF_MARKET && property.quietly_open_to_offers === true;
}

export function isEntitledOffMarketViewer({ tier, isOwner = false, lockerOpen = false } = {}) {
  if (isOwner) return true;
  if (lockerOpen) return true;
  return ENTITLED_TIERS.has(String(tier || "").toLowerCase());
}

export function buildFirstPublicationUpdate({ current = {}, computedSlug, now = new Date().toISOString() } = {}) {
  const canonicalSlug = current.canonical_slug || computedSlug;
  if (!canonicalSlug) throw new Error("Airtable must return a canonical slug before publication can complete");

  return {
    slug: canonicalSlug,
    canonical_slug: canonicalSlug,
    canonical_slug_locked_at: current.canonical_slug_locked_at || now,
    lifecycle_state: PROPERTY_LIFECYCLE_STATES.LIVE,
    pipeline_status: "approved",
    published_at: current.published_at || now,
  };
}

export function buildWithdrawUpdate({ now = new Date().toISOString() } = {}) {
  return {
    lifecycle_state: PROPERTY_LIFECYCLE_STATES.OFF_MARKET,
    pipeline_status: "off_market",
    withdrawn_at: now,
    // Contact must be opt-in. A withdrawal never silently opens a contact path.
    quietly_open_to_offers: false,
  };
}

export function buildPermanentRemovalUpdate({ actorId, reason, now = new Date().toISOString() } = {}) {
  return {
    lifecycle_state: PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED,
    pipeline_status: "permanently_removed",
    permanently_removed_at: now,
    permanently_removed_by: actorId || null,
    permanently_removed_reason: reason || "Owner requested retained market removal",
    quietly_open_to_offers: false,
  };
}

export function exactTitleMatches(input, title) {
  return typeof input === "string" && typeof title === "string" && input.trim() === title.trim();
}

export function getRedirectSlug(slug, redirects = []) {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized) return null;
  const redirect = redirects.find((item) => String(item.old_slug || "").toLowerCase() === normalized);
  return redirect?.current_slug || null;
}
