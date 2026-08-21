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

const PIPELINE_LIFECYCLE_MAP = Object.freeze({
  approved: PROPERTY_LIFECYCLE_STATES.LIVE,
  archived: PROPERTY_LIFECYCLE_STATES.OFF_MARKET,
  off_market: PROPERTY_LIFECYCLE_STATES.OFF_MARKET,
  ai_drafting: PROPERTY_LIFECYCLE_STATES.PDF_VERIFICATION,
  pdf_verification: PROPERTY_LIFECYCLE_STATES.PDF_VERIFICATION,
  staff_suspended: PROPERTY_LIFECYCLE_STATES.STAFF_SUSPENDED,
  suspended: PROPERTY_LIFECYCLE_STATES.STAFF_SUSPENDED,
  permanently_removed: PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED,
  draft: PROPERTY_LIFECYCLE_STATES.DRAFT,
  pending: PROPERTY_LIFECYCLE_STATES.DRAFT,
  rejected: PROPERTY_LIFECYCLE_STATES.DRAFT,
});

export function normalizeLifecycleState(property = {}) {
  const pipelineStatus = String(property.pipeline_status || "").trim().toLowerCase();
  if (pipelineStatus) {
    // pipeline_status is the only authority for whether a Supabase listing is
    // live. Unknown values fail closed instead of trusting a stale mirror.
    return PIPELINE_LIFECYCLE_MAP[pipelineStatus] || PROPERTY_LIFECYCLE_STATES.DRAFT;
  }

  // Compatibility only for rows that predate pipeline_status. New writes keep
  // lifecycle_state as a descriptive mirror, never as public-live authority.
  const legacyState = String(property.lifecycle_state || "").trim().toLowerCase();
  if (VALID_STATES.has(legacyState)) return legacyState;
  return PROPERTY_LIFECYCLE_STATES.DRAFT;
}

export function isMarketVisible(property = {}) {
  return String(property.pipeline_status || "").trim().toLowerCase() === "approved";
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
  if (isMarketVisible(property)) return true;
  return isOffMarket(property) && property.quietly_open_to_offers === true;
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
