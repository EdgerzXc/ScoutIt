import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildScoutItRecord } from "@/lib/brokerMetrics";

// ─────────────────────────────────────────────────────────────────────────
// A-065 — the ScoutIt Record's provenance note must be true.
//
// `broker_metric_snapshots.source` separates seeded demo figures from earned
// ones, and A-040 records it as load-bearing. It was: `serverBrokerMetrics`
// computed `isExampleSeed` from it, and `buildScoutItRecord` then dropped the
// flag, so the panel asserted "Computed only from activity completed through
// ScoutIt" over figures that were seeded.
//
// Two seeded snapshots were live when this was found, one carrying 11
// completed transactions and a 44/48 response rate.
// ─────────────────────────────────────────────────────────────────────────

const PANEL = "src/components/brokers/BrokerDossierIdentity.js";
const CHART = "src/components/brokers/BrokerRecordChart.js";
const LOADER = "src/lib/serverBrokerMetrics.js";
const readFile = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

const snapshot = (overrides = {}) => ({
  brokerId: "b1",
  completedTransactions: 11,
  responseRateNumerator: 44,
  responseRateDenominator: 48,
  medianResponseMinutes: 26,
  responseSample: 48,
  lastTransactionAt: "2026-08-20T00:00:00.000Z",
  calculatedAt: "2026-08-31T00:00:00.000Z",
  policyVersion: "v1",
  isExampleSeed: false,
  ...overrides,
});

const at = "2026-08-31T01:00:00.000Z";

describe("the record carries its own provenance", () => {
  it("marks a seeded snapshot as example seed", () => {
    const record = buildScoutItRecord({
      lookup: { ok: true, snapshot: snapshot({ isExampleSeed: true }) },
      now: at,
    });
    expect(record.isExampleSeed).toBe(true);
  });

  it("does not mark a computed snapshot", () => {
    const record = buildScoutItRecord({
      lookup: { ok: true, snapshot: snapshot() },
      now: at,
    });
    expect(record.isExampleSeed).toBe(false);
  });

  it("never reports a seeded record when there is no snapshot at all", () => {
    // BUILDING and UNAVAILABLE publish no figures, so they must not claim to
    // be demo scaffolding either — that would be a second false statement.
    const building = buildScoutItRecord({ lookup: { ok: true, snapshot: null }, now: at });
    expect(building.isExampleSeed).toBe(false);

    const unavailable = buildScoutItRecord({ lookup: { ok: false }, now: at });
    expect(unavailable.isExampleSeed).toBe(false);
  });

  it("carries the flag on every state that publishes a figure", () => {
    // A stale seeded record is still seeded; staleness must not reset it.
    const stale = buildScoutItRecord({
      lookup: {
        ok: true,
        snapshot: snapshot({ isExampleSeed: true, calculatedAt: "2026-01-01T00:00:00.000Z" }),
      },
      now: at,
    });
    expect(stale.isExampleSeed).toBe(true);
  });

  it("keeps the figures themselves untouched", () => {
    // The fix labels the numbers; it does not hide or alter them.
    const seeded = buildScoutItRecord({
      lookup: { ok: true, snapshot: snapshot({ isExampleSeed: true }) },
      now: at,
    });
    const computed = buildScoutItRecord({
      lookup: { ok: true, snapshot: snapshot() },
      now: at,
    });
    expect(seeded.metrics).toEqual(computed.metrics);
    expect(seeded.state).toBe(computed.state);
  });
});

describe("the loader still reads the column that decides this", () => {
  const code = readFile(LOADER);

  it("selects `source` and derives the flag from it", () => {
    expect(code).toContain('"source"');
    expect(code).toMatch(/isExampleSeed: row\.source === "example_seed"/);
  });
});

describe("the panel states the true provenance", () => {
  const markup = readFile(PANEL);

  it("branches on the flag rather than always claiming computation", () => {
    expect(markup).toMatch(/record\.isExampleSeed \?/);
  });

  it("says plainly that seeded figures were not computed from real activity", () => {
    expect(markup).toContain("not computed from real ScoutIt activity");
    expect(markup).toContain("Demonstration figures on an example profile");
  });

  it("keeps the original note for genuinely computed records", () => {
    expect(markup).toContain("Computed only from activity completed through ScoutIt");
  });

  it("corrects the chart footer too, so the page answers the question once", () => {
    // The panel note and the chart footer both state provenance. Fixing only
    // one leaves the page asserting two different things about the same
    // numbers — which is how this defect survived the first pass.
    const chart = readFile(CHART);
    expect(chart).toMatch(/record\.isExampleSeed/);
    expect(chart).toContain("not measured on real ScoutIt activity");
    expect(chart).toContain("Measured on ScoutIt activity only");
  });

  it("leaves no unconditional ScoutIt-activity claim anywhere on the record", () => {
    // A grep-style guard: every occurrence of the computed claim must sit
    // inside a branch that checked the flag.
    for (const path of [PANEL, CHART]) {
      const source = readFile(path);
      const claimAt = source.indexOf("Measured on ScoutIt activity only");
      const noteAt = source.indexOf("Computed only from activity completed through ScoutIt");
      const flagAt = source.indexOf("isExampleSeed");
      expect(flagAt).toBeGreaterThan(-1);
      if (claimAt > -1) expect(flagAt).toBeLessThan(claimAt);
      if (noteAt > -1) expect(flagAt).toBeLessThan(noteAt);
    }
  });

  it("never renders both notes at once", () => {
    // A ternary, not two independent conditionals — the panel must make one
    // statement about where the numbers came from.
    const seeded = markup.indexOf("Demonstration figures on an example profile");
    const computed = markup.indexOf("Computed only from activity completed through ScoutIt");
    const ternary = markup.indexOf("record.isExampleSeed ?");
    expect(ternary).toBeGreaterThan(-1);
    expect(ternary).toBeLessThan(seeded);
    expect(seeded).toBeLessThan(computed);
  });
});
