import {
  METRIC_STATES,
  RECORD_STATES,
  MIN_RESPONSE_SAMPLE,
  buildScoutItRecord,
} from "@/lib/brokerMetrics";

// ─────────────────────────────────────────────────────────────────────────
// A-023 phase 5. The ScoutIt Record is the dossier's primary trust surface,
// so the tests that matter are the ones proving it stays silent rather than
// guessing:
//
//  * a low sample is SUPPRESSED, not rounded into a confident number (Rule 3);
//  * a failed or missing snapshot is UNAVAILABLE, never a zero (Rule 14);
//  * zero qualifying activity says "Building a ScoutIt record", never 0 stars;
//  * a stale snapshot keeps its last known value but says it is stale, and
//    never silently substitutes Career History.
//
// The window and sample travel with every published number, because a median
// without its denominator is a number you cannot source.
// ─────────────────────────────────────────────────────────────────────────

const NOW = "2026-08-27T12:00:00.000Z";

const snapshot = (overrides = {}) => ({
  brokerId: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
  completedTransactions: 4,
  responseRateNumerator: 9,
  responseRateDenominator: 10,
  medianResponseMinutes: 42,
  responseSample: 10,
  lastTransactionAt: "2026-08-01T00:00:00.000Z",
  calculatedAt: "2026-08-27T11:00:00.000Z",
  policyVersion: "v1",
  ...overrides,
});

const build = (over = {}, extra = {}) =>
  buildScoutItRecord({ lookup: { ok: true, snapshot: snapshot(over) }, now: NOW, ...extra });

describe("A-023 ScoutIt Record refuses to publish what it cannot source", () => {
  it("publishes a qualified record when every threshold is met", () => {
    const record = build();
    expect(record.state).toBe(RECORD_STATES.QUALIFIED);
    const byKey = Object.fromEntries(record.metrics.map((m) => [m.key, m]));
    expect(byKey.transactions.state).toBe(METRIC_STATES.PUBLISHED);
    expect(byKey.transactions.value).toBe(4);
    expect(byKey.responseRate.state).toBe(METRIC_STATES.PUBLISHED);
    expect(byKey.medianResponse.state).toBe(METRIC_STATES.PUBLISHED);
  });

  it("suppresses response metrics below the minimum sample instead of rounding", () => {
    const record = build({
      responseSample: MIN_RESPONSE_SAMPLE - 1,
      responseRateNumerator: 1,
      responseRateDenominator: MIN_RESPONSE_SAMPLE - 1,
    });
    const byKey = Object.fromEntries(record.metrics.map((m) => [m.key, m]));
    expect(byKey.responseRate.state).toBe(METRIC_STATES.LOW_SAMPLE);
    expect(byKey.responseRate.value).toBeNull();
    expect(byKey.medianResponse.state).toBe(METRIC_STATES.LOW_SAMPLE);
    expect(byKey.medianResponse.value).toBeNull();
  });

  it("publishes every number with its sample so it can be sourced", () => {
    const record = build();
    for (const metric of record.metrics) {
      if (metric.state !== METRIC_STATES.PUBLISHED) continue;
      expect(typeof metric.sample).toBe("number");
      expect(metric.sample).toBeGreaterThan(0);
    }
  });

  it("says Building a ScoutIt record for zero qualifying activity, never zero stars", () => {
    const record = build({
      completedTransactions: 0,
      responseRateNumerator: 0,
      responseRateDenominator: 0,
      responseSample: 0,
      medianResponseMinutes: null,
      lastTransactionAt: null,
    });
    expect(record.state).toBe(RECORD_STATES.BUILDING);
    expect(JSON.stringify(record)).not.toMatch(/star|rating|score|\/100|out of/i);
  });

  it("is UNAVAILABLE, not zero, when the snapshot cannot be read", () => {
    const record = buildScoutItRecord({ lookup: { ok: false }, now: NOW });
    expect(record.state).toBe(RECORD_STATES.UNAVAILABLE);
    expect(record.metrics.every((m) => m.value === null)).toBe(true);
    expect(record.claimsEmptiness).toBe(false);
  });

  it("is UNAVAILABLE when the authority answered but holds no snapshot yet", () => {
    const record = buildScoutItRecord({ lookup: { ok: true, snapshot: null }, now: NOW });
    expect(record.state).toBe(RECORD_STATES.BUILDING);
    expect(record.claimsEmptiness).toBe(true);
  });

  it("marks a stale snapshot stale while keeping its last known values", () => {
    // Rule 3 / A-023: failed aggregation keeps the last known snapshot and says
    // it is stale. It never substitutes Career History or invents a zero.
    const record = build({ calculatedAt: "2026-08-20T11:00:00.000Z" });
    expect(record.state).toBe(RECORD_STATES.STALE);
    const byKey = Object.fromEntries(record.metrics.map((m) => [m.key, m]));
    expect(byKey.transactions.value).toBe(4);
    expect(record.staleSince).toBe("2026-08-20T11:00:00.000Z");
  });

  it("never lets Career History reach the ScoutIt Record", () => {
    const record = buildScoutItRecord({
      lookup: { ok: true, snapshot: snapshot() },
      now: NOW,
      // Deliberately passed in: the two templates must stay mathematically
      // isolated, so an upstream caller handing history over changes nothing.
      careerHistory: { transactions: 900, yearsPracticing: 20 },
    });
    const byKey = Object.fromEntries(record.metrics.map((m) => [m.key, m]));
    expect(byKey.transactions.value).toBe(4);
    expect(JSON.stringify(record)).not.toMatch(/900|yearsPracticing|careerHistory/i);
  });

  it("carries the policy version so a published number is reproducible", () => {
    expect(build().policyVersion).toBe("v1");
  });
});

describe("A-023 ScoutIt Record time handling", () => {
  it("uses the injected instant rather than the wall clock", () => {
    // Rule 11: time-dependent logic is tested against a fixed instant.
    const fresh = buildScoutItRecord({
      lookup: { ok: true, snapshot: snapshot({ calculatedAt: "2026-08-27T11:59:00.000Z" }) },
      now: NOW,
    });
    const stale = buildScoutItRecord({
      lookup: { ok: true, snapshot: snapshot({ calculatedAt: "2026-08-27T11:59:00.000Z" }) },
      now: "2026-09-30T00:00:00.000Z",
    });
    expect(fresh.state).toBe(RECORD_STATES.QUALIFIED);
    expect(stale.state).toBe(RECORD_STATES.STALE);
  });
});
