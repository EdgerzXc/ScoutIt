// ═══════════════════════════════════════════════════════════════
// A-023 phase 5 — the ScoutIt Record, public projection.
//
// This module is pure and its job is mostly to REFUSE. It converts one
// reproducible snapshot into the primary trust panel, and every branch that
// cannot source a number returns absence instead of a value:
//
//   * below the minimum sample  -> LOW_SAMPLE, value null (Rule 3)
//   * no snapshot / failed read -> UNAVAILABLE, never a zero (Rule 14)
//   * zero qualifying activity  -> "Building a ScoutIt record", never 0 stars
//   * a stale calculation       -> last known values, explicitly labelled stale
//
// Career History is deliberately NOT a parameter of any calculation here. The
// two templates stay mathematically isolated; a caller may pass history in and
// it will not reach a single published figure.
//
// State names are distinct from the representation, recommendation and
// contribution section enums on purpose.
// ═══════════════════════════════════════════════════════════════

/** Minimum closed inquiries before any response metric may be published. */
export const MIN_RESPONSE_SAMPLE = 5;

/** A snapshot older than this is shown, but labelled stale. */
export const SNAPSHOT_STALE_AFTER_HOURS = 36;

/** The response window the rate is measured against, published with it. */
export const RESPONSE_WINDOW_HOURS = 24;

export const METRIC_STATES = Object.freeze({
  /** Enough evidence; the value is published with its sample. */
  PUBLISHED: "published",
  /** Real evidence exists but is too thin to publish a figure from. */
  LOW_SAMPLE: "low_sample",
  /** No qualifying evidence has been recorded yet. */
  PENDING: "pending",
  /** The snapshot could not be read. Not a claim of zero. */
  UNAVAILABLE: "unavailable",
});

export const RECORD_STATES = Object.freeze({
  /** At least one metric is publishable. */
  QUALIFIED: "qualified",
  /** The authority answered and nothing qualifies yet. */
  BUILDING: "building",
  /** Values are real but the calculation is behind. */
  STALE: "stale",
  /** The authority could not be read. */
  UNAVAILABLE: "unavailable",
});

const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

function hoursBetween(fromIso, toIso) {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return Infinity;
  return (to - from) / 3600000;
}

function unavailableMetrics() {
  return [
    { key: "transactions", label: "Completed ScoutIt transactions" },
    { key: "responseRate", label: "Response rate" },
    { key: "medianResponse", label: "Median response time" },
  ].map((metric) => ({
    ...metric,
    state: METRIC_STATES.UNAVAILABLE,
    value: null,
    display: null,
    sample: null,
    note: null,
  }));
}

function transactionMetric(snapshot) {
  const completed = number(snapshot.completedTransactions);
  if (completed <= 0) {
    return {
      key: "transactions",
      label: "Completed ScoutIt transactions",
      state: METRIC_STATES.PENDING,
      value: null,
      display: null,
      sample: null,
      note: "Counts only two-sided transaction handshakes completed through ScoutIt.",
    };
  }
  return {
    key: "transactions",
    label: "Completed ScoutIt transactions",
    state: METRIC_STATES.PUBLISHED,
    value: completed,
    display: String(completed),
    sample: completed,
    note: "Two-sided transaction handshakes completed through ScoutIt.",
  };
}

function responseRateMetric(snapshot) {
  const denominator = number(snapshot.responseRateDenominator);
  const numerator = number(snapshot.responseRateNumerator);
  const base = {
    key: "responseRate",
    label: "Response rate",
    note: `Eligible inquiries answered within ${RESPONSE_WINDOW_HOURS} hours.`,
  };

  if (denominator <= 0) {
    return { ...base, state: METRIC_STATES.PENDING, value: null, display: null, sample: null };
  }
  if (denominator < MIN_RESPONSE_SAMPLE) {
    return {
      ...base,
      state: METRIC_STATES.LOW_SAMPLE,
      value: null,
      display: null,
      sample: denominator,
    };
  }
  const percent = Math.round((numerator / denominator) * 100);
  return {
    ...base,
    state: METRIC_STATES.PUBLISHED,
    value: percent,
    display: `${percent}%`,
    sample: denominator,
  };
}

function medianResponseMetric(snapshot) {
  const sample = number(snapshot.responseSample);
  const minutes = snapshot.medianResponseMinutes;
  const base = {
    key: "medianResponse",
    label: "Median response time",
    note: `Median across ${sample || "0"} eligible responses.`,
  };

  if (!Number.isFinite(Number(minutes)) || minutes === null || sample <= 0) {
    return { ...base, state: METRIC_STATES.PENDING, value: null, display: null, sample: null };
  }
  if (sample < MIN_RESPONSE_SAMPLE) {
    return { ...base, state: METRIC_STATES.LOW_SAMPLE, value: null, display: null, sample };
  }
  const total = Number(minutes);
  const display = total < 60 ? `${Math.round(total)} min` : `${(total / 60).toFixed(1)} hrs`;
  return { ...base, state: METRIC_STATES.PUBLISHED, value: total, display, sample };
}

/**
 * Build the primary ScoutIt Record panel.
 *
 * @param lookup  `{ ok: true, snapshot }` or `{ ok: false }`.
 * @param now     ISO instant, injected so staleness is testable (Rule 11).
 */
export function buildScoutItRecord({ lookup = { ok: false }, now = new Date().toISOString() } = {}) {
  if (!lookup?.ok) {
    return {
      state: RECORD_STATES.UNAVAILABLE,
      metrics: unavailableMetrics(),
      claimsEmptiness: false,
      staleSince: null,
      policyVersion: null,
    };
  }

  const snapshot = lookup.snapshot;
  if (!snapshot) {
    return {
      state: RECORD_STATES.BUILDING,
      metrics: unavailableMetrics().map((metric) => ({
        ...metric,
        state: METRIC_STATES.PENDING,
      })),
      claimsEmptiness: true,
      staleSince: null,
      policyVersion: null,
    };
  }

  const metrics = [
    transactionMetric(snapshot),
    responseRateMetric(snapshot),
    medianResponseMetric(snapshot),
  ];
  const anyPublished = metrics.some((metric) => metric.state === METRIC_STATES.PUBLISHED);
  const isStale =
    hoursBetween(snapshot.calculatedAt, now) > SNAPSHOT_STALE_AFTER_HOURS;

  let state = RECORD_STATES.BUILDING;
  if (anyPublished) state = isStale ? RECORD_STATES.STALE : RECORD_STATES.QUALIFIED;

  return {
    state,
    metrics,
    claimsEmptiness: !anyPublished,
    staleSince: isStale ? snapshot.calculatedAt || null : null,
    policyVersion: snapshot.policyVersion || null,
    lastTransactionAt: snapshot.lastTransactionAt || null,
  };
}
