/**
 * VIA promoter eligibility (A-193) — pure, dependency-free, safe on client and server.
 *
 * A VIA priority link grants "Position Zero" lead routing, so it must be grounded in
 * an authorised relationship to THAT property (RESA RA 9646), never a global user
 * label and never a string someone typed into a box.
 *
 * Capability matrix, highest authority first:
 *   1. owner     — properties.owner_id === user
 *   2. broker    — property_broker_representations.status === 'active' for user
 *   3. operator  — property_units.operator_id === user, or an enabled
 *                  open_gate_role_listings row (role 'operator') for user
 *   4. nobody    — everyone else gets the clean public canonical link
 */

export const PROMOTER_TYPES = Object.freeze(["owner", "broker", "operator"]);

const NOT_ELIGIBLE = Object.freeze({
  eligible: false,
  promoterType: null,
  promoterId: null,
  unitId: null,
});

const same = (a, b) => a != null && b != null && String(a) === String(b);

/**
 * Classify a caller's relationship to one property.
 *
 * @param {Object} input
 * @param {string|null} input.userId
 * @param {{ owner_id?: string|null }|null} input.property
 * @param {{ broker_id?: string, status?: string }|null} [input.representation] caller's representation row
 * @param {Array<{ id?: string, operator_id?: string|null }>} [input.operatorUnits] units of this property
 * @param {Array<{ recipient_id?: string, role?: string, enabled?: boolean, unit_id?: string|null }>} [input.roleListings]
 * @returns {{ eligible: boolean, promoterType: string|null, promoterId: string|null, unitId: string|null }}
 */
export function classifyPromoterRelationship({
  userId,
  property,
  representation = null,
  operatorUnits = [],
  roleListings = [],
} = {}) {
  if (!userId || !property) return { ...NOT_ELIGIBLE };

  if (same(property.owner_id, userId)) {
    return { eligible: true, promoterType: "owner", promoterId: String(userId), unitId: null };
  }

  if (
    representation &&
    same(representation.broker_id, userId) &&
    representation.status === "active"
  ) {
    return { eligible: true, promoterType: "broker", promoterId: String(userId), unitId: null };
  }

  const ownedUnit = (operatorUnits || []).find((u) => same(u?.operator_id, userId));
  if (ownedUnit) {
    return {
      eligible: true,
      promoterType: "operator",
      promoterId: String(userId),
      unitId: ownedUnit.id ?? null,
    };
  }

  const listing = (roleListings || []).find(
    (l) => l?.role === "operator" && l?.enabled === true && same(l?.recipient_id, userId)
  );
  if (listing) {
    return {
      eligible: true,
      promoterType: "operator",
      promoterId: String(userId),
      unitId: listing.unit_id ?? null,
    };
  }

  return { ...NOT_ELIGIBLE };
}

/**
 * URL-safe promoter slug. Deterministic for a given (name, id) so repeated lookups
 * never mint a second link for the same person.
 *
 * @param {string|null|undefined} displayName
 * @param {string|number|null|undefined} promoterId
 * @param {string} [promoterType]
 */
export function buildPromoterSlug(displayName, promoterId, promoterType = "broker") {
  const base = String(displayName || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  if (base) return base;
  const tail = String(promoterId || "").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8);
  return tail ? `${promoterType}-${tail}` : promoterType;
}

/**
 * Suffix used when a slug is already held by a different promoter on the same
 * property (UNIQUE (property_id, slug)). Stable per promoter id.
 */
export function disambiguatePromoterSlug(slug, promoterId) {
  const tail = String(promoterId || "").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 6);
  return tail ? `${slug}-${tail}` : slug;
}
