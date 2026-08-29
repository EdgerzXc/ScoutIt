import { describe, expect, it } from 'vitest';
import { buildRecordChart, ENCODINGS, MAX_UNIT_TICKS } from '@/lib/brokerRecordChart';
import { buildScoutItRecord, METRIC_STATES, RECORD_STATES } from '@/lib/brokerMetrics';

// Marco Villanueva's live seeded shape: 6 transactions, 17/19 answered, 38 min.
const marco = {
  completedTransactions: 6,
  responseRateNumerator: 17,
  responseRateDenominator: 19,
  medianResponseMinutes: 38,
  responseSample: 19,
  calculatedAt: new Date().toISOString(),
  policyVersion: 'v1',
};

// Isabella Reyes: real activity, sample of 3 — below the publication floor.
const isabella = {
  completedTransactions: 1,
  responseRateNumerator: 2,
  responseRateDenominator: 3,
  medianResponseMinutes: 95,
  responseSample: 3,
  calculatedAt: new Date().toISOString(),
  policyVersion: 'v1',
};

const chartFor = (snapshot) => buildRecordChart(buildScoutItRecord({ lookup: { ok: true, snapshot } }));
const row = (chart, key) => chart.rows.find((r) => r.key === key);

describe('A-037 record chart encoding', () => {
  it('never places the three metrics on one shared scale', () => {
    // The defining constraint. A count, a percentage and a duration share no
    // axis; drawing them as comparable magnitudes is the most common charting
    // error there is. Each row must carry its own encoding.
    const chart = chartFor(marco);
    const encodings = chart.rows.map((r) => r.encoding);
    expect(new Set(encodings).size).toBe(3);
    expect(row(chart, 'transactions').encoding).toBe(ENCODINGS.UNITS);
    expect(row(chart, 'responseRate').encoding).toBe(ENCODINGS.METER);
    expect(row(chart, 'medianResponse').encoding).toBe(ENCODINGS.FIGURE);
  });

  it('meters the response rate against 100, the only real limit present', () => {
    const rate = row(chartFor(marco), 'responseRate');
    expect(rate.fill).toBeCloseTo(0.89, 2);
    expect(rate.display).toBe('89%');
    expect(rate.context).toBe('of 19 inquiries answered');
  });

  it('gives the duration no bar, because it has no sourced maximum', () => {
    // Regression guard for the reasoning in the module header: any denominator
    // for "38 minutes" would be a benchmark ScoutIt never published.
    const median = row(chartFor(marco), 'medianResponse');
    expect(median.fill).toBeNull();
    expect(median.ticks).toBeNull();
    expect(median.display).toBe('38 min');
  });

  it('draws one tick per transaction, inventing no scale', () => {
    const txn = row(chartFor(marco), 'transactions');
    expect(txn.ticks).toBe(6);
    expect(txn.overflowCount).toBe(0);
    expect(txn.display).toBe('6');
  });

  it('caps ticks and reports the remainder instead of drawing a wall', () => {
    const chart = chartFor({ ...marco, completedTransactions: 47 });
    const txn = row(chart, 'transactions');
    expect(txn.ticks).toBe(MAX_UNIT_TICKS);
    expect(txn.overflowCount).toBe(47 - MAX_UNIT_TICKS);
    // The true figure is never lost — the reader still sees 47.
    expect(txn.display).toBe('47');
  });
});

describe('A-037 suppression can never become a bar', () => {
  it('draws nothing for a below-floor sample', () => {
    // Isabella's 2-of-3 is real but unpublishable. If it ever rendered as a
    // 67% meter the page would be asserting a figure the authority refused.
    const chart = chartFor(isabella);
    const rate = row(chart, 'responseRate');
    expect(rate.state).toBe(METRIC_STATES.LOW_SAMPLE);
    expect(rate.encoding).toBe(ENCODINGS.ABSENT);
    expect(rate.fill).toBeNull();
    expect(rate.display).toBeNull();
    expect(rate.note).toBe('Too few to publish');
  });

  it('still shows her one publishable metric', () => {
    // Suppression is per-metric, not per-broker.
    const txn = row(chartFor(isabella), 'transactions');
    expect(txn.encoding).toBe(ENCODINGS.UNITS);
    expect(txn.ticks).toBe(1);
  });

  it('emits no fill or ticks for any non-published metric, whatever the state', () => {
    for (const snapshot of [
      { ...marco, responseRateDenominator: 0, responseRateNumerator: 0 },
      { ...marco, medianResponseMinutes: null, responseSample: 0 },
      { ...marco, completedTransactions: 0 },
    ]) {
      for (const r of chartFor(snapshot).rows) {
        if (r.state !== METRIC_STATES.PUBLISHED) {
          expect(r.fill).toBeNull();
          expect(r.ticks).toBeNull();
        }
      }
    }
  });

  it('clamps a fill that could otherwise overflow its track', () => {
    // A numerator above its denominator is rejected by a CHECK constraint in
    // the database, so this cannot arrive from Supabase — the clamp exists so
    // a future caller or a seeded fixture cannot paint outside the meter.
    const chart = chartFor({ ...marco, responseRateNumerator: 40, responseRateDenominator: 19 });
    expect(row(chart, 'responseRate').fill).toBeLessThanOrEqual(1);
  });
});

describe('A-037 record-level states', () => {
  it('withholds the chart entirely when nothing qualifies', () => {
    const chart = buildRecordChart(buildScoutItRecord({ lookup: { ok: true, snapshot: null } }));
    expect(chart.state).toBe(RECORD_STATES.BUILDING);
    expect(chart.hasChart).toBe(false);
    // An empty instrument looks more authoritative than the honest sentence
    // the record already carries, so the caller renders that instead.
  });

  it('withholds the chart when the authority could not be read', () => {
    const chart = buildRecordChart(buildScoutItRecord({ lookup: { ok: false } }));
    expect(chart.state).toBe(RECORD_STATES.UNAVAILABLE);
    expect(chart.hasChart).toBe(false);
  });

  it('survives a malformed record without throwing', () => {
    for (const bad of [null, undefined, {}, { metrics: null }]) {
      const chart = buildRecordChart(bad);
      expect(chart.hasChart).toBe(false);
      expect(chart.rows).toEqual([]);
    }
  });

  it('keeps the chart when only some metrics publish', () => {
    const chart = chartFor(isabella);
    expect(chart.hasChart).toBe(true);
    expect(chart.publishedCount).toBe(1);
  });

  it('LOAD-BEARING: any publishable metric guarantees the chart renders', () => {
    // A-037 removed the numeric list from the detail panel because the chart
    // now carries the figures. That is only safe while this holds: if a record
    // could have a publishable metric and no chart, the number would be shown
    // nowhere at all. Exhaustive over which metrics qualify.
    const variants = [
      marco,
      isabella,
      { ...marco, responseRateDenominator: 0, responseRateNumerator: 0 },
      { ...marco, medianResponseMinutes: null, responseSample: 0 },
      { ...marco, completedTransactions: 0 },
      { ...marco, completedTransactions: 0, responseRateDenominator: 0, responseRateNumerator: 0 },
      { ...isabella, completedTransactions: 0 },
    ];

    for (const snapshot of variants) {
      const record = buildScoutItRecord({ lookup: { ok: true, snapshot } });
      const chart = buildRecordChart(record);
      const anyPublishable = record.metrics.some((m) => m.state === METRIC_STATES.PUBLISHED);
      if (anyPublishable) expect(chart.hasChart).toBe(true);
      // And the converse the panel depends on: no publishable metric means the
      // record is BUILDING, whose panel copy is prose, not a list of figures.
      if (!anyPublishable) expect(record.state).toBe(RECORD_STATES.BUILDING);
    }
  });
});
