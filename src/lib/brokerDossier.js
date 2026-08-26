// ═══════════════════════════════════════════════════════════════
// A-023 phase 2 — the one allowlisted public broker projection.
//
// Two boundaries this module owns, both of which cost a real defect:
//
//  1. **Nothing reaches the browser that ScoutIt cannot source.** Phase 1 took
//     the legacy Airtable composites (Rating, Closures, SubscriptionLabel) off
//     the screen, but `/api/cms` kept shipping them in the payload, so an
//     unsupported 92.5 "rating" was still public — a gate the client evaluates
//     is a suggestion (Rule 5).
//
//  2. **Absence is never reported as a count.** A dossier whose id is not a
//     Supabase Auth UUID has no link to the representation authority at all.
//     "We looked and there are none" and "we cannot look" render identically
//     unless the projection says which one happened (Rule 3, Rule 14).
//
// State names here are deliberately distinct from `REPRESENTATION_STATES` in
// `brokerRepresentation.js`. That enum describes one representation row; this
// one describes what the public section is able to say. An overlapping
// `UNAVAILABLE` in both would read as the same condition and is not.
// ═══════════════════════════════════════════════════════════════

import { isActiveRosterBroker, sortRoster } from "@/lib/brokerRepresentation";

export const DOSSIER_REPRESENTATION_STATES = Object.freeze({
  /** The dossier is linked and the authority returned eligible rows. */
  LISTED: "listed",
  /** The dossier is linked, the authority answered, and nothing qualifies. */
  NONE_ELIGIBLE: "none_eligible",
  /** No Auth UUID backs this dossier, so representations are unknowable. */
  NOT_LINKED: "not_linked",
  /** The authority could not be read. Last known state is not a claim. */
  LOOKUP_FAILED: "lookup_failed",
});

/**
 * Everything the public dossier is allowed to publish about a broker.
 * Adding a key here makes it public — there is no second gate downstream.
 */
export const PUBLIC_BROKER_IDENTITY_KEYS = Object.freeze([
  "id",
  "name",
  "title",
  "specialty",
  "location",
  "bio",
  "image",
  "license",
  "licenseVerified",
  "clearanceTier",
  "niche",
  "isExample",
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (value) => String(value ?? "").trim();

/**
 * Resolve the dossier's link to the Supabase representation authority.
 *
 * The link is the identifier itself: Airtable's `BrokerID` carries the broker's
 * Supabase Auth UUID. When that field is blank, `fetchBrokers` falls back to the
 * Airtable record id (`rec…`), which is NOT an Auth identity — such a dossier is
 * unlinked, and must say so rather than render an empty roster.
 *
 * Never resolve by name or email. Both are mutable and neither is an identity.
 */
export function resolveBrokerAuthorityId(dossierId) {
  const candidate = text(dossierId).toLowerCase();
  return UUID_PATTERN.test(candidate) ? candidate : null;
}

/** Strip an Airtable broker record down to the publishable identity. */
export function publicBrokerIdentity(broker) {
  if (!broker) return null;
  const id = text(broker.id);
  const name = text(broker.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    title: text(broker.title),
    specialty: text(broker.specialty),
    location: text(broker.location),
    bio: text(broker.bio),
    image: text(broker.image),
    license: text(broker.license),
    licenseVerified: broker.licenseVerified === true,
    clearanceTier: text(broker.clearanceTier),
    niche: Array.isArray(broker.niche) ? broker.niche.map(text).filter(Boolean) : [],
    isExample: broker.isExample === true,
  };
}

function representationCard(property) {
  const slug = text(property?.slug);
  if (!slug) return null;
  return {
    slug,
    title: text(property.title),
    category: text(property.spaceCategory),
    location: text(property.location),
    image: text(property.image),
    href: `/property/${slug}`,
  };
}

/**
 * Build the Current Representations section.
 *
 * @param authorityId          Auth UUID from `resolveBrokerAuthorityId`, or null.
 * @param lookup               `{ ok: true, representations }` or `{ ok: false }`.
 * @param propertiesByAuthorityId  Map of Supabase property id → public catalog
 *                             record. A property absent from this map is not
 *                             public, so its representation is not public either.
 * @param now                  ISO instant, injected so expiry is testable (Rule 11).
 */
export function buildRepresentationSection({
  authorityId = null,
  lookup = { ok: false },
  propertiesByAuthorityId = new Map(),
  now = new Date().toISOString(),
} = {}) {
  if (!authorityId) {
    return { state: DOSSIER_REPRESENTATION_STATES.NOT_LINKED, cards: [], claimsEmptiness: false };
  }
  if (!lookup?.ok) {
    return { state: DOSSIER_REPRESENTATION_STATES.LOOKUP_FAILED, cards: [], claimsEmptiness: false };
  }

  const eligible = (lookup.representations || [])
    .filter((representation) => text(representation?.broker_id).toLowerCase() === authorityId)
    .filter((representation) => isActiveRosterBroker(representation, now));

  const cards = sortRoster(eligible)
    .map((representation) => representationCard(propertiesByAuthorityId.get(representation.property_id)))
    .filter(Boolean);

  return cards.length > 0
    ? { state: DOSSIER_REPRESENTATION_STATES.LISTED, cards, claimsEmptiness: false }
    : { state: DOSSIER_REPRESENTATION_STATES.NONE_ELIGIBLE, cards: [], claimsEmptiness: true };
}
