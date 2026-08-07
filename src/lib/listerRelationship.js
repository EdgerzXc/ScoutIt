// ─────────────────────────────────────────────────────────────────────────
// LISTER RELATIONSHIP DECLARATION
// NEW_IDEAS.md §34.3 · NEW_IDEAS_2.md §50
//
// Before a listing publishes, whoever is publishing it must declare their
// relationship to the property.
//
// WHY: RESA Law RA 9646 exists to eliminate colorum agents — unlicensed or
// unauthorised people listing property without the owner's consent. Today a
// broker can list any building on ScoutIt and the real title holder never
// knows. The declaration is what makes §37's "Claim This Property" flow
// meaningful: a broker's listing is PROVISIONAL until the owner asserts.
//
// ⚠️ INTERNAL ONLY. Never render on a public card, never include in the
// /api/cms payload, never expose in a broker-facing briefing. It exists for
// Mission Control, dispute resolution, and deciding whether to offer the
// claim CTA.
// ─────────────────────────────────────────────────────────────────────────

/**
 * The three tiers. Order matters — it descends by authority, and the UI
 * renders them in this order so the strongest claim is the first thing read.
 */
export const LISTER_RELATIONSHIPS = [
  {
    value: "owner",
    label: "Direct Property Owner",
    icon: "🏠",
    detail: "You hold the title — TCT, CCT or OCT.",
    /** Highest authority: nobody else can claim over this without a dispute. */
    authority: 3,
  },
  {
    value: "property_manager",
    label: "Authorized Property Manager",
    icon: "🏢",
    detail: "You operate or lease this asset on the owner's behalf, with their authorisation.",
    authority: 2,
  },
  {
    value: "authorized_broker",
    label: "Verified Broker with Owner Authority",
    icon: "💼",
    detail: "You are PRC-licensed and hold documented authorisation from the owner to list.",
    authority: 1,
  },
];

export const LISTER_RELATIONSHIP_VALUES = LISTER_RELATIONSHIPS.map((r) => r.value);

/**
 * The disclaimer text, verbatim from §34.3.
 *
 * ⚠️ If you change a single word of this, BUMP THE VERSION. The stored record
 * says which version a user agreed to; silently editing the text would make
 * every historical acknowledgment a record of something nobody actually saw —
 * and the whole point of storing a version is evidentiary.
 */
export const DISCLAIMER_VERSION = "v1";

export const OWNER_SOVEREIGNTY_DISCLAIMER =
  "ScoutIt operates under strict Owner Sovereignty. If you are a Property " +
  "Manager or Broker listing on behalf of an owner, the verified title holder " +
  "retains full right to claim, re-assign, or manage this property file at any " +
  "time with proof of ownership.";

/**
 * Validates a submitted declaration.
 *
 * @param {string} relationship
 * @param {boolean} agreed - did they tick the disclaimer?
 * @returns {{ok: true, relationship: string, agreementRecord: object} | {ok: false, error: string}}
 */
export function validateDeclaration(relationship, agreed) {
  if (!LISTER_RELATIONSHIP_VALUES.includes(relationship)) {
    return { ok: false, error: "Select how you are related to this property." };
  }
  if (agreed !== true) {
    return { ok: false, error: "You must acknowledge the Owner Sovereignty terms to publish." };
  }
  return {
    ok: true,
    relationship,
    // Timestamped and versioned — see the column comment. A bare `true` would
    // record that they agreed but not to what, or when.
    agreementRecord: {
      agreed: true,
      timestamp: new Date().toISOString(),
      disclaimer_version: DISCLAIMER_VERSION,
    },
  };
}

/**
 * Legacy → canonical spellings for a relationship value.
 *
 * `/api/property/claim` hardcoded a SECOND vocabulary — 'direct_owner',
 * 'authorized_manager', 'authorized_broker' — of which only the third matched
 * this module. Migration `20260806000006` unifies the database on the canonical
 * values; this map exists so an old client, a queued request or a hand-written
 * curl call cannot 400 during the changeover.
 *
 * ⚠️ This is a RAMP, not an interface. Nothing new should ever emit the legacy
 * spellings. See NEW_IDEAS_2.md §55.
 */
export const LEGACY_RELATIONSHIP_ALIASES = Object.freeze({
  direct_owner: "owner",
  authorized_manager: "property_manager",
  authorized_broker: "authorized_broker",
});

/**
 * Normalise any accepted spelling to the canonical one.
 * Returns null for anything unrecognised — never a guess, and never a default.
 * An unrecognised relationship must fail validation, not quietly become
 * "owner", which would manufacture the strongest possible claim out of a typo.
 */
export function canonicalRelationship(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (LISTER_RELATIONSHIP_VALUES.includes(trimmed)) return trimmed;
  return LEGACY_RELATIONSHIP_ALIASES[trimmed] || null;
}

/**
 * Should "Claim This Property" be offered on this listing? (§37.2)
 *
 * Yes when the listing is NOT owner-declared — i.e. a broker or manager put it
 * up, or nobody ever declared. That last case matters: every listing created
 * before 2026-08-06 has `lister_relationship = NULL`, and those are exactly
 * the ones most likely to need claiming, since nobody was ever asked.
 *
 * ⚠️ Deliberately does NOT treat NULL as "owner". Assuming ownership from
 * silence is the failure this whole feature exists to prevent.
 *
 * @param {{lister_relationship?: string|null, owner_verified?: boolean}} property
 * @returns {boolean}
 */
export function isClaimable(property) {
  if (!property) return false;
  // Already verified to a real owner — needs the dispute process, not a claim.
  if (property.owner_verified === true) return false;
  return property.lister_relationship !== "owner";
}

/**
 * Human label for a stored value. Returns null for unknown/absent rather than
 * inventing one — an undeclared listing must read as undeclared.
 */
export function relationshipLabel(value) {
  const found = LISTER_RELATIONSHIPS.find((r) => r.value === value);
  return found ? found.label : null;
}

/**
 * True when the stored agreement record is usable evidence.
 *
 * A record missing its timestamp or version is not evidence of anything, so
 * it is treated as absent rather than accepted for the sake of tidiness.
 */
export function hasValidAgreement(record) {
  if (!record || typeof record !== "object") return false;
  if (record.agreed !== true) return false;
  if (!record.timestamp || Number.isNaN(new Date(record.timestamp).getTime())) return false;
  return typeof record.disclaimer_version === "string" && record.disclaimer_version.length > 0;
}
