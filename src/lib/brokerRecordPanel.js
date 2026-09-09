import { RECORD_STATES } from "@/lib/brokerMetrics";

// ═══════════════════════════════════════════════════════════════
// THE LEFT COLUMN'S RECORD PANEL — WHEN IT IS A PANEL, AND WHEN IT IS A NOTE
// A-039 · opened 2026-08-27 as A-037's carried-forward presentation issue
//
// A-037 moved the three figures out of the left column's SCOUTIT RECORD box
// and into the at-a-glance chart beside the advisor's name. The box kept only
// its provenance sentence, so a full-size bordered panel under the avatar
// carried one line of small print — and the page showed the heading
// SCOUTIT RECORD twice, once on the panel and once on the chart.
//
// ── WHY THE COPY COULD NOT SIMPLY BE DELETED ─────────────────────────
// The sentence does two jobs. It is the provenance declaration A-023 requires
// of every public card, and it is where the BUILDING and UNAVAILABLE states
// explain themselves in words — those are exactly the states where
// `BrokerRecordChart` returns null, so there is no chart to attach copy to.
// Deleting the panel would delete the only explanation those states have.
//
// ── WHY THIS OPTION ──────────────────────────────────────────────────
// A-039 offers three. Options 1 and 3 both decide what the left column is
// *for* — fold the note into the chart and drop the column's record role, or
// repurpose the column entirely — and A-039 reserves that composition decision
// for the owner: "not a tidy-up". Option 2 is the one that closes the defect
// without making that decision: keep the panel, stop it looking like a full
// box when it holds one line, and drop the heading only where it duplicates.
//
// ── THE DUPLICATION IS CONDITIONAL, SO THE FIX IS TOO ────────────────
// The chart renders only when at least one metric is publishable. In BUILDING
// and UNAVAILABLE it returns null, and then this panel is the *only* record
// surface on the page — so it keeps its badge and its frame. The duplicate
// heading exists only in the states where the chart is there to own it.
// An unknown state falls back to the explaining, framed form: a state nobody
// anticipated must not render as an unlabelled fragment of small print.
// ═══════════════════════════════════════════════════════════════

/** States where no chart renders, so this panel carries the record itself. */
const EXPLAINING_STATES = new Set([RECORD_STATES.BUILDING, RECORD_STATES.UNAVAILABLE]);

/** States where the chart renders and owns the heading. */
const CHARTED_STATES = new Set([RECORD_STATES.QUALIFIED, RECORD_STATES.STALE]);

/**
 * How the left column's record panel should present itself.
 *
 * @param {{state?: string}|null} record
 * @returns {{showBadge: boolean, framed: boolean, explains: boolean}}
 *   `explains` marks the states that carry their own wording because no chart
 *   renders for them.
 */
export function recordPanelPresentation(record) {
  const state = record?.state;

  if (CHARTED_STATES.has(state)) {
    // The chart beside the name already says SCOUTIT RECORD. Repeating it here
    // over a single line of provenance is the duplication A-039 reports.
    return { showBadge: false, framed: false, explains: false };
  }

  return { showBadge: true, framed: true, explains: EXPLAINING_STATES.has(state) };
}
