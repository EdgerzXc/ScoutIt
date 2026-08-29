// ═══════════════════════════════════════════════════════════════
// A-023 phase 4 — client recommendations, public projection.
//
// This module is pure. It decides two things and nothing else: what a
// recommendation is allowed to say publicly, and who it is allowed to name.
//
// State names here are deliberately distinct from
// `DOSSIER_REPRESENTATION_STATES`. That enum describes what the
// representations section can say; this one describes what the
// recommendations section can say. Reusing a name across two sections would
// read as one condition and is two.
// ═══════════════════════════════════════════════════════════════

const text = (value) => String(value ?? "").trim();

export const RECOMMENDATION_SECTION_STATES = Object.freeze({
  /** Linked, the authority answered, and something qualifies. */
  LISTED: "listed",
  /** Linked, the authority answered, and nothing qualifies. The only state
   *  that may assert the broker has no published recommendations. */
  NONE_PUBLISHABLE: "none_publishable",
  /** No Auth UUID backs this dossier, so recommendations are unknowable. */
  NOT_LINKED: "not_linked",
  /** The authority could not be read. Silence here is not an answer. */
  LOOKUP_FAILED: "lookup_failed",
});

export const ATTRIBUTION_MODES = Object.freeze({
  FULL_NAME: "full_name",
  INITIALS: "initials",
  ROLE_ONLY: "role_only",
  ANONYMOUS: "anonymous",
});

const ANONYMOUS_LABEL = "Anonymous client";

function initialsOf(name) {
  const parts = text(name)
    .split(/[\s-]+/)
    .filter(Boolean);
  if (!parts.length) return "";
  return parts
    .slice(0, 2)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join("");
}

/**
 * Resolve the public author label for one recommendation.
 *
 * The returned object carries the label and nothing that could reconstruct a
 * name the author did not consent to publish. An unrecognised attribution mode
 * resolves to anonymous: the gate is written as `=== known good` rather than
 * `!== bad` so a new mode added upstream cannot fail open (Rule 6).
 */
export function publicRecommendationAuthor(row) {
  const mode = text(row?.attribution_mode);
  const name = text(row?.author_display_name);
  const relationship = text(row?.relationship_type);

  if (mode === ATTRIBUTION_MODES.FULL_NAME && name) {
    return { label: name, mode: ATTRIBUTION_MODES.FULL_NAME };
  }
  if (mode === ATTRIBUTION_MODES.INITIALS) {
    const initials = initialsOf(name);
    return initials
      ? { label: initials, mode: ATTRIBUTION_MODES.INITIALS }
      : { label: ANONYMOUS_LABEL, mode: ATTRIBUTION_MODES.ANONYMOUS };
  }
  if (mode === ATTRIBUTION_MODES.ROLE_ONLY) {
    return relationship
      ? { label: relationship, mode: ATTRIBUTION_MODES.ROLE_ONLY }
      : { label: ANONYMOUS_LABEL, mode: ATTRIBUTION_MODES.ANONYMOUS };
  }
  return { label: ANONYMOUS_LABEL, mode: ATTRIBUTION_MODES.ANONYMOUS };
}

/**
 * A recommendation reaches the public dossier only when every one of these is
 * true. Each is an explicit positive check; none is inferred from absence.
 */
export function isPublishableRecommendation(row) {
  if (!row) return false;
  if (row.moderation_state !== "approved") return false;
  if (row.consent_granted !== true) return false;
  if (row.withdrawn_at) return false;
  if (row.disputed_at) return false;
  return Boolean(text(row.body));
}

function card(row) {
  const author = publicRecommendationAuthor(row);
  // A qualifying two-sided handshake is the only thing that earns the verified
  // label. Representation, acceptance, or broker assertion never do.
  const verified = Boolean(text(row.qualifying_handshake_id));

  return {
    id: text(row.id),
    author: author.label,
    attributionMode: author.mode,
    relationship: text(row.relationship_type),
    body: text(row.body),
    submittedAt: text(row.submitted_at) || null,
    verified,
    sourceLabel: verified ? "Verified ScoutIt connection" : "Client-submitted · unverified",
  };
}

/**
 * Build the public Client Recommendations section.
 *
 * @param authorityId  Auth UUID from `resolveBrokerAuthorityId`, or null.
 * @param lookup       `{ ok: true, recommendations }` or `{ ok: false }`.
 * @param now          ISO instant, injected so recency is testable (Rule 11).
 */
export function buildRecommendationSection({ authorityId = null, lookup = { ok: false } } = {}) {
  if (!authorityId) {
    return { state: RECOMMENDATION_SECTION_STATES.NOT_LINKED, cards: [], claimsEmptiness: false };
  }
  if (!lookup?.ok) {
    return { state: RECOMMENDATION_SECTION_STATES.LOOKUP_FAILED, cards: [], claimsEmptiness: false };
  }

  const cards = (lookup.recommendations || [])
    .filter(isPublishableRecommendation)
    .map(card)
    .sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));

  return {
    state: cards.length
      ? RECOMMENDATION_SECTION_STATES.LISTED
      : RECOMMENDATION_SECTION_STATES.NONE_PUBLISHABLE,
    cards,
    claimsEmptiness: cards.length === 0,
  };
}
