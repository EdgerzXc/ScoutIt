/**
 * ScoutIt VIA Contact Attribution & Priority Routing Engine (A-186)
 *
 * Implements the fundamental decoupling of:
 * 1. RANKING: Global algorithmic recommendation score.
 * 2. ATTRIBUTION: Demand generation source tracking (property-scoped, 30-day window).
 * 3. ROUTING: Visitor-specific priority cascade:
 *    USER_SELECTION -> ACTIVE_RELATIONSHIP -> VIA_ATTRIBUTION -> SCOUTIT_RANKING -> FALLBACK
 *
 * Reference: _SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/VIA_CONTACT_ATTRIBUTION_AND_ROUTING.md
 */

export const ROUTING_REASONS = Object.freeze({
  USER_SELECTION: "USER_SELECTION",
  ACTIVE_RELATIONSHIP: "ACTIVE_RELATIONSHIP",
  VIA_ATTRIBUTION: "VIA_ATTRIBUTION",
  SCOUTIT_RANKING: "SCOUTIT_RANKING",
  FALLBACK: "FALLBACK",
  ADMIN_OVERRIDE: "ADMIN_OVERRIDE",
});

export const VIA_STATUS = Object.freeze({
  VALID: "VALID",
  LIMITED: "LIMITED",
  INVALID: "INVALID",
});

export const DEFAULT_VIA_ATTRIBUTION_DAYS = 30;
export const VIA_ATTRIBUTION_WINDOW_MS = DEFAULT_VIA_ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000;
export const VIA_COOKIE_PREFIX = "scoutit_via_";

/**
 * Returns the property-scoped cookie name for anonymous visitor attribution.
 */
export function getViaCookieName(propertyId) {
  if (!propertyId) return `${VIA_COOKIE_PREFIX}global`;
  return `${VIA_COOKIE_PREFIX}${String(propertyId).toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
}

/**
 * Validates whether an attribution payload has expired.
 */
export function isAttributionExpired(attribution, now = Date.now()) {
  if (!attribution) return true;
  const expiresAt = attribution.expiresAt || attribution.expires_at;
  if (!expiresAt) return false;
  const expiryTime = typeof expiresAt === "number" ? expiresAt : new Date(expiresAt).getTime();
  return now >= expiryTime;
}

/**
 * Finds a matching contact in the eligible roster by id, recipientId, or broker_id.
 */
function findContactInRoster(contactId, roster = []) {
  if (!contactId || !Array.isArray(roster)) return null;
  const normalizedId = String(contactId).toLowerCase();
  return roster.find((c) => {
    const id = c.id || c.recipientId || c.broker_id || c.user_id;
    const slug = c.slug || c.public_slug;
    return (
      (id && String(id).toLowerCase() === normalizedId) ||
      (slug && String(slug).toLowerCase() === normalizedId)
    );
  }) || null;
}

/**
 * Resolves the primary contact using ScoutIt's 4-tier priority cascade:
 * Tier 1: Explicit User Selection (User Choice Always Wins)
 * Tier 2: Existing Active Relationship (Deal/viewing continuity)
 * Tier 3: Valid VIA Attribution (Position Zero promoter)
 * Tier 4: ScoutIt Organic Ranking (Top ranked eligible contact)
 * Tier 5: Fallback
 *
 * @param {Object} params
 * @param {Array} params.eligibleContacts - Pre-sorted list of eligible contacts
 * @param {string|null} params.requestedContactId - Explicit contact requested by user
 * @param {string|null} params.activeRelationshipContactId - Ongoing relationship broker ID
 * @param {Object|null} params.viaAttribution - Attribution context if present
 * @param {number} [params.now] - Current timestamp (epoch ms)
 * @returns {Object} { contact, reason, viaStatus, otherContacts }
 */
export function resolvePrimaryContact({
  eligibleContacts = [],
  requestedContactId = null,
  activeRelationshipContactId = null,
  viaAttribution = null,
  now = Date.now(),
} = {}) {
  const roster = Array.isArray(eligibleContacts) ? eligibleContacts : [];
  let viaStatus = viaAttribution ? VIA_STATUS.VALID : null;

  // Check attribution validity upfront if provided
  if (viaAttribution) {
    if (isAttributionExpired(viaAttribution, now)) {
      viaStatus = VIA_STATUS.INVALID;
    } else {
      const promoterId = viaAttribution.promoterId || viaAttribution.promoter_id || viaAttribution.contact_id;
      const promoterInRoster = findContactInRoster(promoterId, roster);
      if (!promoterInRoster) {
        viaStatus = VIA_STATUS.INVALID;
      } else if (viaAttribution.status === "limited" || promoterInRoster.can_receive_leads === false) {
        viaStatus = VIA_STATUS.LIMITED;
      }
    }
  }

  // Tier 1: Explicit User Choice
  if (requestedContactId) {
    const matched = findContactInRoster(requestedContactId, roster);
    if (matched) {
      return {
        contact: matched,
        reason: ROUTING_REASONS.USER_SELECTION,
        viaStatus,
        otherContacts: orderRemainingContacts(matched, roster),
      };
    }
  }

  // Tier 2: Existing Active Relationship Continuity
  if (activeRelationshipContactId) {
    const matched = findContactInRoster(activeRelationshipContactId, roster);
    if (matched) {
      return {
        contact: matched,
        reason: ROUTING_REASONS.ACTIVE_RELATIONSHIP,
        viaStatus,
        otherContacts: orderRemainingContacts(matched, roster),
      };
    }
  }

  // Tier 3: Valid VIA Attribution (Position Zero)
  if (viaAttribution && viaStatus === VIA_STATUS.VALID) {
    const promoterId = viaAttribution.promoterId || viaAttribution.promoter_id || viaAttribution.contact_id;
    const promoter = findContactInRoster(promoterId, roster);
    if (promoter) {
      return {
        contact: promoter,
        reason: ROUTING_REASONS.VIA_ATTRIBUTION,
        viaStatus: VIA_STATUS.VALID,
        otherContacts: orderRemainingContacts(promoter, roster),
      };
    }
  }

  // Tier 4: Normal ScoutIt Ranking (Preserves existing organic order)
  if (roster.length > 0) {
    const topRanked = roster[0];
    return {
      contact: topRanked,
      reason: ROUTING_REASONS.SCOUTIT_RANKING,
      viaStatus: viaAttribution ? VIA_STATUS.INVALID : null,
      otherContacts: orderRemainingContacts(topRanked, roster),
    };
  }

  // Tier 5: Fallback
  return {
    contact: null,
    reason: ROUTING_REASONS.FALLBACK,
    viaStatus: viaAttribution ? VIA_STATUS.INVALID : null,
    otherContacts: [],
  };
}

/**
 * Returns remaining contacts excluding the primary contact,
 * strictly preserving their organic ranking order.
 */
export function orderRemainingContacts(primaryContact, roster = []) {
  if (!primaryContact || !Array.isArray(roster)) return roster || [];
  const primaryId = String(primaryContact.id || primaryContact.recipientId || primaryContact.broker_id || "");
  return roster.filter((c) => {
    const id = String(c.id || c.recipientId || c.broker_id || "");
    return id !== primaryId;
  });
}

/**
 * Serializes attribution data into a tamper-resistant cookie payload string.
 */
export function serializeViaCookie({
  propertyId,
  promoterId,
  promoterSlug = null,
  promoterType = "broker",
  visitorId,
  firstSeenAt = Date.now(),
  expiresAt = Date.now() + VIA_ATTRIBUTION_WINDOW_MS,
}) {
  const payload = {
    pId: propertyId,
    prId: promoterId,
    slug: promoterSlug,
    type: promoterType,
    vId: visitorId,
    fs: firstSeenAt,
    exp: expiresAt,
  };
  return encodeURIComponent(JSON.stringify(payload));
}

/**
 * Parses and validates an attribution cookie payload.
 */
export function parseViaCookie(cookieStr) {
  if (!cookieStr) return null;
  try {
    const decoded = decodeURIComponent(cookieStr);
    const parsed = JSON.parse(decoded);
    if (!parsed || !parsed.prId || !parsed.exp) return null;
    return {
      propertyId: parsed.pId,
      promoterId: parsed.prId,
      promoterSlug: parsed.slug,
      promoterType: parsed.type || "broker",
      visitorId: parsed.vId,
      firstSeenAt: parsed.fs,
      expiresAt: parsed.exp,
    };
  } catch {
    return null;
  }
}
