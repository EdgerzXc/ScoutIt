import { METRIC_STATES, RECORD_STATES, RESPONSE_WINDOW_HOURS } from "@/lib/brokerMetrics";

/**
 * A-037 — the at-a-glance encoding for the ScoutIt Record.
 *
 * All derivation lives here rather than in the component because this repo
 * writes JSX in `.js` files and cannot render-test a component (see ACTIVE.md).
 * Putting the arithmetic in a plain module is what makes the chart testable at
 * all, so the component stays a dumb renderer of what this returns.
 *
 * ## Why the three metrics are not one bar chart
 *
 * They carry incompatible units — a count, a percentage, and a duration. Placing
 * them on one axis is the single most common charting error: `6`, `89` and `38`
 * would be drawn as comparable magnitudes when they share no scale at all. Each
 * row therefore gets its own encoding, chosen by what the number actually is:
 *
 * | Metric | Encoding | Why |
 * |---|---|---|
 * | Completed transactions | unit ticks | A count has no natural maximum. One tick is one transaction, so nothing is invented. |
 * | Response rate | meter | A true ratio against a real limit (100%). The only honest bar of the three. |
 * | Median response time | figure only | Has no sourced maximum. See below. |
 *
 * ## Why median response time has no bar
 *
 * The only defensible denominator is the 24-hour eligibility window the metric
 * is defined against — and a median of 38 minutes inside 1,440 renders as 2.6%
 * of a track, a sliver that reads as "almost nothing" when it means "fast". Any
 * friendlier maximum (4 hours? 2?) would be a benchmark ScoutIt never published,
 * and a number repeated in a UI acquires authority it never earned (Rule 12).
 * So the duration is shown as a figure with its window named in words.
 *
 * A row is only ever drawn when its metric is PUBLISHED. A suppressed, pending
 * or unreadable metric returns `fill: null` and `ticks: null`, so a low-sample
 * value can never be smuggled onto the page as a bar (Rule 3).
 */

/** Beyond this many ticks the row states the count instead of drawing it. */
export const MAX_UNIT_TICKS = 12;

export const ENCODINGS = Object.freeze({
  UNITS: "units",
  METER: "meter",
  FIGURE: "figure",
  ABSENT: "absent",
});

const ABSENT_NOTE = {
  [METRIC_STATES.LOW_SAMPLE]: "Too few to publish",
  [METRIC_STATES.PENDING]: "Not yet recorded",
  [METRIC_STATES.UNAVAILABLE]: "Unavailable",
};

/** Short labels. The detail panel carries the full wording and the method note. */
const SHORT_LABEL = {
  transactions: "Transactions",
  responseRate: "Response rate",
  medianResponse: "Median reply",
};

const clamp01 = (n) => Math.min(1, Math.max(0, n));

function encodeMetric(metric) {
  const label = SHORT_LABEL[metric.key] || metric.label;
  const base = {
    key: metric.key,
    label,
    state: metric.state,
    sample: metric.sample ?? null,
    fill: null,
    ticks: null,
    overflowCount: 0,
    display: null,
    context: null,
  };

  if (metric.state !== METRIC_STATES.PUBLISHED) {
    return { ...base, encoding: ENCODINGS.ABSENT, note: ABSENT_NOTE[metric.state] || "Unavailable" };
  }

  if (metric.key === "transactions") {
    const count = Math.max(0, Math.trunc(Number(metric.value) || 0));
    return {
      ...base,
      encoding: ENCODINGS.UNITS,
      display: metric.display,
      ticks: Math.min(count, MAX_UNIT_TICKS),
      overflowCount: Math.max(0, count - MAX_UNIT_TICKS),
      context: "completed through ScoutIt",
    };
  }

  if (metric.key === "responseRate") {
    const percent = Number(metric.value);
    return {
      ...base,
      encoding: ENCODINGS.METER,
      display: metric.display,
      fill: clamp01(percent / 100),
      context: `of ${metric.sample} inquiries answered`,
    };
  }

  // medianResponse, and any future metric with no sourced maximum.
  return {
    ...base,
    encoding: ENCODINGS.FIGURE,
    display: metric.display,
    context: `within the ${RESPONSE_WINDOW_HOURS}-hour window`,
  };
}

/**
 * Build the chart model for a ScoutIt Record.
 *
 * @param record  the object returned by `buildScoutItRecord`.
 * @returns `{ state, rows, publishedCount, hasChart }`. `hasChart` is false when
 *          there is nothing truthful to draw, so the caller renders the record's
 *          own explanatory copy instead of an empty frame.
 */
export function buildRecordChart(record) {
  if (!record || !Array.isArray(record.metrics)) {
    return { state: RECORD_STATES.UNAVAILABLE, rows: [], publishedCount: 0, hasChart: false };
  }

  const rows = record.metrics.map(encodeMetric);
  const publishedCount = rows.filter((row) => row.encoding !== ENCODINGS.ABSENT).length;

  return {
    state: record.state,
    rows,
    publishedCount,
    // A frame with three "Unavailable" rows communicates less than the record's
    // own sentence, so the chart withholds itself rather than showing an
    // impressive-looking empty instrument.
    hasChart: publishedCount > 0,
  };
}
