// ═══════════════════════════════════════════════════════════════
// A-023 phase 4 — ScoutIt contributions, public projection.
//
// A contribution is credit for work the broker published on ScoutIt. A-023
// requires each one to be inspectable, so a contribution whose artifact cannot
// be opened is not published at all: unverifiable credit for unnamed work is
// exactly the kind of claim this dossier exists to avoid (Rule 13).
//
// Contributions never touch the Scout Rating. Nothing in this projection
// carries a score, weight, or rank, and nothing downstream may add one.
//
// State names are deliberately distinct from the representation and
// recommendation section enums.
// ═══════════════════════════════════════════════════════════════

const text = (value) => String(value ?? "").trim();

export const CONTRIBUTION_SECTION_STATES = Object.freeze({
  /** Linked, the authority answered, and something qualifies. */
  LISTED: "listed",
  /** Linked, the authority answered, and nothing qualifies. */
  NONE_PUBLISHABLE: "none_publishable",
  /** No Auth UUID backs this dossier, so contributions are unknowable. */
  NOT_LINKED: "not_linked",
  /** The authority could not be read. */
  LOOKUP_FAILED: "lookup_failed",
});

export const CONTRIBUTION_KIND_LABELS = Object.freeze({
  question: "Answered question",
  correction: "Approved correction",
  briefing: "Published briefing",
  intel: "Credited intel",
});

function hasUnsafeHrefCharacters(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    // Space and below covers every C0 control and whitespace; 127 is DEL.
    if (code <= 32 || code === 127) return true;
  }
  return false;
}

/**
 * Resolve a contribution's artifact link.
 *
 * Only a site-internal absolute path qualifies. A scheme, a protocol-relative
 * `//host` prefix, or a backslash variant is rejected rather than normalised:
 * this value becomes an `href` on a public page, and the safe answer to an
 * unexpected shape is to publish nothing.
 */
export function resolveContributionHref(artifactPath) {
  const candidate = text(artifactPath);
  if (!candidate) return null;
  if (!candidate.startsWith("/")) return null;
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return null;
  // Whitespace or control characters inside an href are never legitimate here.
  if (hasUnsafeHrefCharacters(candidate)) return null;
  return candidate;
}

export function isPublishableContribution(row) {
  if (!row) return false;
  if (row.status !== "published") return false;
  if (!text(row.title)) return false;
  return resolveContributionHref(row.artifact_path) !== null;
}

function card(row) {
  return {
    id: text(row.id),
    kind: text(row.kind),
    kindLabel: CONTRIBUTION_KIND_LABELS[text(row.kind)] || "ScoutIt contribution",
    title: text(row.title),
    href: resolveContributionHref(row.artifact_path),
    publishedAt: text(row.published_at) || null,
  };
}

/**
 * Build the public ScoutIt Contributions section.
 *
 * @param authorityId  Auth UUID from `resolveBrokerAuthorityId`, or null.
 * @param lookup       `{ ok: true, contributions }` or `{ ok: false }`.
 */
export function buildContributionSection({ authorityId = null, lookup = { ok: false } } = {}) {
  if (!authorityId) {
    return { state: CONTRIBUTION_SECTION_STATES.NOT_LINKED, cards: [], claimsEmptiness: false };
  }
  if (!lookup?.ok) {
    return { state: CONTRIBUTION_SECTION_STATES.LOOKUP_FAILED, cards: [], claimsEmptiness: false };
  }

  const cards = (lookup.contributions || [])
    .filter(isPublishableContribution)
    .map(card)
    .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));

  return {
    state: cards.length
      ? CONTRIBUTION_SECTION_STATES.LISTED
      : CONTRIBUTION_SECTION_STATES.NONE_PUBLISHABLE,
    cards,
    claimsEmptiness: cards.length === 0,
  };
}
