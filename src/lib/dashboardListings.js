// ═══════════════════════════════════════════════════════════════
// CATALOGUE RECORD → DASHBOARD LISTING
// A-081 + A-077 · full-stack gap audit, Part 4 / 2026-09-03
//
// ── WHY THIS IS ITS OWN MODULE ───────────────────────────────────────
// `DashboardContext.js` carried two byte-identical copies of this mapping
// (`:312-338` and `:1147-1173`). Both stamped every public Airtable record
// with a trust state nobody had established:
//
//   tag: 'LIVE', time: 'Verified', pipelineStatus: 'approved',
//   completenessScore: 100, verified: true,
//   signals: { ownerAge: 'Verified', ownerAgeClass: 'text-success',
//              accountAge: 'ScoutIt Verified', completeness: '100%' }
//
// It reached a real decision surface: `BrokerMode.js` renders
// `signals.accountAge` under the label **"Owner Tenure"**, so a broker
// deciding whether to take on a listing read "Owner Tenure: ScoutIt Verified"
// for every owner, always. Not a tenure, not a verification, and the same
// string for everybody.
//
// Somebody had already fixed the cell immediately beside it — Completeness
// calls `computeListingStrength()` with a comment saying `signals.completeness`
// is "a hardcoded placeholder (never derived from real fields)". One half of a
// two-cell panel was corrected and the other was left. Two copies of a mapping
// is how that happens, so there is now one.
//
// ── WHAT THE RECORD ACTUALLY ESTABLISHES ─────────────────────────────
// `tag: 'LIVE'` and `pipelineStatus: 'approved'` are kept, and they are not
// assumptions: `fetchProperties()` filters on `Approved_For_ScoutIt` before a
// record can appear in `/api/cms` at all, so being in this bundle *is* the
// approval record.
//
// Everything else is reported or absent:
//   · `verified` comes from `last_verified_date`, the same attestation A-067
//     made the property page report instead of assert.
//   · `completenessScore` is null. A catalogue record carries no completeness
//     column, and a listing whose completeness is unknown must say so.
//   · `signals.accountAge` is null. A catalogue record has no owner account —
//     its `ownerId` is the literal string 'scoutit-cms' — so owner tenure is
//     not merely missing, it does not exist.
//   · `ownerAge` / `ownerAgeClass` are gone. They had no consumer, and being
//     pre-styled `text-success` they were one JSX line from rendering a green
//     "Verified" nobody had earned.
// ═══════════════════════════════════════════════════════════════

/** What every surface says when a measurement is missing. A stated absence,
 *  never a number that looks computed. */
export const COMPLETENESS_UNKNOWN_LABEL = "Not recorded";

/**
 * The one fallback for a missing completeness score (A-077).
 *
 * There were three: `?? 50` in `DashboardContext.js` and `profileClient.js`,
 * `?? 0` in `OwnerPanel.js`, and a hardcoded `100` in the catalogue mapping.
 * 50 was the worst of them, because it is the value that looks measured.
 *
 * @returns {number|null} null when the score is unknown; a real 0 survives.
 */
export function completenessScoreOf(record) {
  const score = record?.completeness_score;
  if (score === null || score === undefined || score === "") return null;
  const parsed = Number(score);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Owner tenure, or a stated absence. Never the invented "New". */
export function ownerTenureLabel(accountAge) {
  return accountAge || COMPLETENESS_UNKNOWN_LABEL;
}

/** Map one `/api/cms` catalogue property into the dashboard listing shape. */
export function mapCatalogueListing(p) {
  return {
    id: p.id,
    slug: p.slug,
    type: p.property_type || 'Property',
    title: p.title,
    desc: '',
    loc: p.location || p.city,
    location: p.location || p.city,
    hasMedia: !!p.image,
    mediaLink: p.image,
    // A-100: price used to alias the tenure field, so the field briefing's
    // `listed_price ?? price` fallback printed a tenure ("For Lease") under
    // an "Asking price" label. A catalogue record carries no verified
    // dashboard price, so price is null; tenure and the owner-confirmed
    // listed price travel under their own names (the sheet already renders
    // a separate Tenure row from `listing.tenure`).
    price: null,
    tenure: p.tenure || null,
    listed_price: p.listed_price || null,
    // Read from the record: `fetchProperties` admits only rows where
    // `Approved_For_ScoutIt` is set, so presence here is the approval.
    tag: 'LIVE',
    tagClass: 'bg-success/20 text-success',
    pipelineStatus: 'approved',
    ownerId: 'scoutit-cms',
    spaceCategory: p.spaceCategory || p.property_type,
    details: {},
    // Reported, not asserted — the same attestation A-067 uses.
    verified: Boolean(p.last_verified_date),
    lastVerifiedDate: p.last_verified_date || null,
    time: p.last_verified_date ? 'Verified' : 'Unverified',
    completenessScore: completenessScoreOf(p),
    coordinates: p.lat && p.lng ? `POINT(${p.lng} ${p.lat})` : null,
    signals: {
      // A catalogue record has no owner account, so there is no tenure to
      // report. Absent beats invented.
      accountAge: null,
    },
  };
}
