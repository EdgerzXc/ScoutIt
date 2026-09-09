// ═══════════════════════════════════════════════════════════════
// CREDITING A BROKER CONTRIBUTION — the staff-side rules
// A-069 · opened 2026-08-31
//
// ── WHY THIS SURFACE EXISTS ──────────────────────────────────────────
// `/api/broker/contributions` on the main site implements POST and PATCH,
// is requireAdmin-guarded and tested — and has no caller anywhere. The read
// side is fully wired: the dossier renders a "ScoutIt Contributions" section
// from `broker_contributions`. The three rows in that table were written
// straight into Supabase by an operator, which is the workaround this
// replaces. Rule 13: an endpoint with no producer is a plan, not a feature.
//
// ── WHY IT IS STAFF-ONLY, AND STAYS THAT WAY ─────────────────────────
// A contribution is ScoutIt crediting a broker for work ScoutIt published —
// an answered question, an approved correction, a briefing, credited intel.
// A broker-facing form would produce a self-declared claim wearing a
// platform-credited label, which is the exact distinction the dossier's
// provenance rules exist to preserve. Nothing in any payload may set the
// credited label; the label is derived from `kind` alone.
//
// ── WHY THIS LOGIC IS DUPLICATED, DELIBERATELY ───────────────────────
// `resolveContributionHref` also lives in the main site's
// `src/lib/brokerContributions.js`. Mission Control cannot import it: the two
// are separate deployments and the console's Vercel root is `mission-control`,
// with out-of-root files disabled. Calling the main site's API instead is the
// one thing `crossAppPolicy.mjs` forbids, and that decision is enforced by
// `test/cross-app-boundary.test.mjs`.
//
// So the rule is ported, and `test/broker-contribution-crediting.test.mjs`
// asserts the two implementations agree over a shared corpus — including every
// rejection case. A duplicated rule with no agreement test is how the two
// halves of a validation drift apart silently; this is the alternative
// available to us, not a preference.
// ═══════════════════════════════════════════════════════════════

const text = (value) => String(value ?? "").trim();

/** Kinds ScoutIt credits. The label is derived here and never accepted from
 *  a payload — a caller cannot mint its own credited wording. */
export const CONTRIBUTION_KIND_LABELS = Object.freeze({
  question: "Answered question",
  correction: "Approved correction",
  briefing: "Published briefing",
  intel: "Credited intel",
});

export const CONTRIBUTION_STATES = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  RETRACTED: "retracted",
});

export const CONTRIBUTION_EVENTS = Object.freeze({
  PUBLISHED: "contribution_published",
  RETRACTED: "contribution_retracted",
});

export const MAX_TITLE_LENGTH = 300;

function hasUnsafeHrefCharacters(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    // Space and below covers every C0 control and whitespace; 127 is DEL.
    if (code <= 32 || code === 127) return true;
  }
  return false;
}

/**
 * Resolve a contribution's artifact link. PORTED — see the header.
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
  if (hasUnsafeHrefCharacters(candidate)) return null;
  return candidate;
}

/** A broker authority id is an Auth UUID. Anything else is refused rather
 *  than coerced — crediting the wrong dossier is worse than refusing. */
export function resolveBrokerAuthorityId(value) {
  const candidate = text(value).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(candidate)
    ? candidate
    : null;
}

/**
 * Validate a crediting request. Returns `{ ok: true, value }` or
 * `{ ok: false, error }` — never a partially valid row.
 *
 * The artifact path is validated at WRITE time with the same rule the public
 * projection uses at RENDER time, so a row that would be silently dropped on
 * the dossier is refused here instead of being stored and never shown.
 */
export function validateCredit(input) {
  const brokerId = resolveBrokerAuthorityId(input?.brokerId);
  if (!brokerId) return { ok: false, error: "A broker Auth UUID is required." };

  const kind = text(input?.kind);
  if (!Object.hasOwn(CONTRIBUTION_KIND_LABELS, kind)) {
    return {
      ok: false,
      error: `Kind must be one of: ${Object.keys(CONTRIBUTION_KIND_LABELS).join(", ")}.`,
    };
  }

  const title = text(input?.title);
  if (!title || title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `A title of 1-${MAX_TITLE_LENGTH} characters is required.` };
  }

  const artifactPath = resolveContributionHref(input?.artifactPath);
  if (!artifactPath) {
    return {
      ok: false,
      error:
        "The artifact must be a site-internal absolute path, e.g. /intel/some-briefing. " +
        "A contribution whose work cannot be opened is not published at all.",
    };
  }

  const publish = input?.publish === true;

  return {
    ok: true,
    value: {
      broker_id: brokerId,
      kind,
      title,
      artifact_path: artifactPath,
      status: publish ? CONTRIBUTION_STATES.PUBLISHED : CONTRIBUTION_STATES.DRAFT,
      // The schema requires a date whenever status is 'published'.
      published_at: publish ? new Date().toISOString() : null,
    },
  };
}

/** The public label for a kind. Derived, never supplied. */
export function creditLabel(kind) {
  return CONTRIBUTION_KIND_LABELS[kind] || null;
}
