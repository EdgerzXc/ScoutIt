import { describe, it, expect } from "vitest";
import {
  LIFECYCLE,
  todayISO,
  effectiveLifecycle,
  isPipelineSignal,
  filterByLifecycle,
  daysToOpening,
  isOverdue,
  evidenceDepth,
  timingLine,
  sortByAttention,
  pipelinePulse,
  normalizeLifecycleInput,
  normalizeOpeningDate,
  liveIntelToSignals,
  mergeLivePipeline,
} from "../pipelineLifecycle";

const noon = (y, m, d) => new Date(y, m - 1, d, 12, 0, 0);
const iso = (y, m, d) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

describe("pipelineLifecycle — status resolution", () => {
  it("reads planned and construction spellings", () => {
    const now = noon(2026, 9, 22);
    expect(effectiveLifecycle({ lifecycle: "planned" }, now)).toBe(LIFECYCLE.PLANNED);
    expect(effectiveLifecycle({ lifecycle: "construction" }, now)).toBe(LIFECYCLE.CONSTRUCTION);
    expect(effectiveLifecycle({ lifecycle: "Under Construction" }, now)).toBe(LIFECYCLE.CONSTRUCTION);
    expect(effectiveLifecycle({ lifecycle: "under_construction" }, now)).toBe(LIFECYCLE.CONSTRUCTION);
    expect(effectiveLifecycle({ lifecycle: "completed" }, now)).toBe(LIFECYCLE.COMPLETED);
  });

  it("an opening date of today wins over any stored lifecycle", () => {
    const now = noon(2026, 9, 22);
    expect(effectiveLifecycle({ lifecycle: "construction", openingDate: iso(2026, 9, 22) }, now))
      .toBe(LIFECYCLE.OPENING_TODAY);
    expect(effectiveLifecycle({ openingDate: iso(2026, 9, 22) }, now))
      .toBe(LIFECYCLE.OPENING_TODAY);
  });

  it("yesterday's opener graduates instead of rotting", () => {
    const now = noon(2026, 9, 22);
    expect(effectiveLifecycle({ lifecycle: "construction", openingDate: iso(2026, 9, 21) }, now))
      .toBe(LIFECYCLE.CONSTRUCTION);
    expect(effectiveLifecycle({ openingDate: iso(2026, 9, 21) }, now)).toBe(null);
  });

  it("tomorrow's opening is not today", () => {
    const now = noon(2026, 9, 22);
    expect(effectiveLifecycle({ openingDate: iso(2026, 9, 23) }, now)).toBe(null);
  });

  it("accepts datetime stamps as the same calendar day", () => {
    const now = noon(2026, 9, 22);
    expect(effectiveLifecycle({ openingDate: `${iso(2026, 9, 22)}T00:00:00.000Z` }, now))
      .toBe(LIFECYCLE.OPENING_TODAY);
    expect(daysToOpening({ openingDate: `${iso(2026, 9, 23)}T16:30:00+08:00` }, now)).toBe(1);
  });

  it("unknown shapes resolve to null, never a default", () => {
    const now = noon(2026, 9, 22);
    expect(effectiveLifecycle({}, now)).toBe(null);
    expect(effectiveLifecycle(null, now)).toBe(null);
    expect(effectiveLifecycle({ lifecycle: "soon" }, now)).toBe(null);
    expect(effectiveLifecycle({ openingDate: "next friday" }, now)).toBe(null);
    expect(effectiveLifecycle({ openingDate: "2026-13-45" }, now)).toBe(null);
    expect(isPipelineSignal({}, now)).toBe(false);
  });

  it("todayISO uses the local calendar day", () => {
    expect(todayISO(noon(2026, 1, 5))).toBe("2026-01-05");
  });
});

describe("pipelineLifecycle — defining logic", () => {
  const F = (over) => ({
    slug: "x",
    lifecycle: "construction",
    date: "September 2026",
    sourceName: "Gazette",
    ...over,
  });

  it("counts days to opening on the local calendar", () => {
    const now = noon(2026, 9, 22);
    expect(daysToOpening(F({ openingDate: iso(2026, 9, 22) }), now)).toBe(0);
    expect(daysToOpening(F({ openingDate: iso(2026, 9, 23) }), now)).toBe(1);
    expect(daysToOpening(F({ openingDate: iso(2026, 10, 22) }), now)).toBe(30);
    expect(daysToOpening(F({ openingDate: iso(2026, 9, 21) }), now)).toBe(-1);
    expect(daysToOpening(F({}), now)).toBe(null);
  });

  it("rejects impossible dates instead of counting to them", () => {
    const now = noon(2026, 9, 22);
    expect(daysToOpening(F({ openingDate: "2026-02-30" }), now)).toBe(null);
    expect(daysToOpening(F({ openingDate: "2026-13-01" }), now)).toBe(null);
    expect(daysToOpening(F({ openingDate: "soon" }), now)).toBe(null);
  });

  it("flags overdue records, not buildings", () => {
    const now = noon(2026, 9, 22);
    expect(isOverdue(F({ openingDate: iso(2026, 9, 21) }), now)).toBe(true);
    expect(isOverdue(F({ openingDate: iso(2026, 9, 22) }), now)).toBe(false);
    expect(isOverdue(F({ openingDate: iso(2026, 9, 23) }), now)).toBe(false);
    expect(isOverdue(F({}), now)).toBe(false);
    // opening-today is never overdue
    expect(isOverdue({ openingDate: iso(2026, 9, 22) }, now)).toBe(false);
  });

  it("separates sourced shells from thin ones", () => {
    expect(evidenceDepth(F({}))).toBe("sourced");
    expect(evidenceDepth({ slug: "y" })).toBe("thin");
    expect(evidenceDepth({ sourceName: "Gazette" })).toBe("thin");
  });

  it("writes an honest timing line, never countdown-to-nothing", () => {
    const now = noon(2026, 9, 22);
    expect(timingLine({ openingDate: iso(2026, 9, 22) }, now)).toBe("Opens today");
    expect(timingLine(F({ openingDate: iso(2026, 9, 23) }), now)).toBe("Opens tomorrow");
    expect(timingLine(F({ openingDate: iso(2026, 10, 1) }), now)).toBe("Opens in 9 days");
    expect(timingLine(F({}), now)).toBe("Timeline TBC");
  });

  it("sorts by attention: now, nearest dated, sourced, stable", () => {
    const now = noon(2026, 9, 22);
    const feed = [
      { slug: "planned-thin", lifecycle: "planned" },
      { slug: "opener", openingDate: iso(2026, 9, 22) },
      { slug: "far", lifecycle: "construction", openingDate: iso(2026, 12, 1), date: "x", sourceName: "y" },
      { slug: "near-thin", lifecycle: "construction", openingDate: iso(2026, 9, 25) },
      { slug: "plain", status: "FILED" },
    ];
    expect(sortByAttention(feed, now).map((s) => s.slug)).toEqual([
      "opener",
      "near-thin",
      "far",
      "planned-thin",
      "plain",
    ]);
  });

  it("prefers sourced shells on exact ties, stably", () => {
    const now = noon(2026, 9, 22);
    const feed = [
      { slug: "thin-a", lifecycle: "construction", openingDate: iso(2026, 10, 1) },
      { slug: "src-b", lifecycle: "construction", openingDate: iso(2026, 10, 1), date: "x", sourceName: "y" },
      { slug: "thin-c", lifecycle: "construction", openingDate: iso(2026, 10, 1) },
    ];
    expect(sortByAttention(feed, now).map((s) => s.slug)).toEqual(["src-b", "thin-a", "thin-c"]);
  });

  it("never reshuffles non-pipeline rows", () => {
    const now = noon(2026, 9, 22);
    const feed = [{ slug: "b" }, { slug: "a" }];
    expect(sortByAttention(feed, now).map((s) => s.slug)).toEqual(["b", "a"]);
  });

  it("pulses the whole set, silently when empty", () => {
    const now = noon(2026, 9, 22);
    expect(pipelinePulse([], now)).toEqual({ opening: 0, rising: 0, planned: 0, overdue: 0, total: 0, sample: null });
    const pulse = pipelinePulse(
      [
        { openingDate: iso(2026, 9, 22) },
        { lifecycle: "construction", openingDate: iso(2026, 9, 20) },
        { lifecycle: "planned" },
        {},
      ],
      now
    );
    expect(pulse).toEqual({ opening: 1, rising: 1, planned: 1, overdue: 1, total: 3, sample: null });
  });

  it("marks the pulse sample only when every counted row is one", () => {
    const now = noon(2026, 9, 22);
    const mk = (over) => ({ lifecycle: "planned", ...over });
    expect(pipelinePulse([mk({ isSample: true }), mk({ isSample: true })], now).sample).toBe("sample");
    expect(pipelinePulse([mk({ isSample: true }), mk({})], now).sample).toBe("mixed");
    expect(pipelinePulse([mk({}), mk({})], now).sample).toBe(null);
  });

  it("names a passed date as a record problem, never a building verdict", () => {
    const now = noon(2026, 9, 22);
    expect(timingLine({ lifecycle: "construction", openingDate: iso(2026, 9, 1) }, now))
      .toBe("Date passed · awaiting update");
  });
});

describe("pipelineLifecycle — staff input normalization (A-156)", () => {
  it("accepts the closed vocabulary, rejects everything else", () => {
    expect(normalizeLifecycleInput("planned")).toBe("planned");
    expect(normalizeLifecycleInput("Planned")).toBe("planned");
    expect(normalizeLifecycleInput("UNDER_CONSTRUCTION")).toBe("construction");
    expect(normalizeLifecycleInput("under construction")).toBe("construction");
    expect(normalizeLifecycleInput("finished")).toBe("completed");
    expect(normalizeLifecycleInput("")).toBe("");
    expect(normalizeLifecycleInput("none")).toBe("");
    expect(normalizeLifecycleInput("opening soon!!")).toBe("");
    expect(normalizeLifecycleInput(null)).toBe("");
  });

  it("accepts bare dates and datetimes, rejects near-misses", () => {
    expect(normalizeOpeningDate("2026-12-01")).toBe("2026-12-01");
    expect(normalizeOpeningDate("2026-12-01T00:00:00.000Z")).toBe("2026-12-01");
    expect(normalizeOpeningDate("next friday")).toBe("");
    expect(normalizeOpeningDate("2026-02-30")).toBe("");
    expect(normalizeOpeningDate("")).toBe("");
    expect(normalizeOpeningDate(null)).toBe("");
  });
});

describe("pipelineLifecycle — live merge (A-156)", () => {
  const now = noon(2026, 9, 22);
  const LIVE = [
    { slug: "live-tower", title: "Live Tower", category: "Commercial", city: "BGC", lifecycle: "Planned", openingDate: "2027-01-15", intelType: "PIPELINE WATCH", date: "September 2026", sourceName: "Registry" },
    { slug: "plain-article", title: "Plain", category: "Commercial", city: "BGC" },
    { slug: "bad-row", title: "", category: "Commercial", lifecycle: "planned" },
  ];

  it("projects only lifecycle-bearing rows, never inventing status", () => {
    const out = liveIntelToSignals(LIVE, now);
    expect(out.map((s) => s.slug)).toEqual(["live-tower"]);
    const row = out[0];
    expect(row.status).toBe("");
    expect(row.isSample).toBe(false);
    expect(row.lifecycle).toBe("planned");
    expect(row.openingDate).toBe("2027-01-15");
  });

  it("live records override mock samples on slug collision, order kept", () => {
    const mocks = [
      { slug: "live-tower", title: "Sample Tower" },
      { slug: "mock-only", title: "Mock" },
    ];
    const live = [{ slug: "live-tower", title: "Live Tower" }, { slug: "new-live", title: "New" }];
    expect(mergeLivePipeline(mocks, live).map((s) => s.slug)).toEqual([
      "live-tower",
      "mock-only",
      "new-live",
    ]);
    expect(mergeLivePipeline(mocks, live)[0].title).toBe("Live Tower");
    expect(mergeLivePipeline(mocks, [])).toEqual(mocks);
  });
});

describe("pipelineLifecycle — list filtering", () => {
  const feed = [
    { slug: "a", lifecycle: "planned" },
    { slug: "b", lifecycle: "construction" },
    { slug: "c" },
  ];

  it("filters to the requested lifecycle", () => {
    expect(filterByLifecycle(feed, LIFECYCLE.PLANNED).map((s) => s.slug)).toEqual(["a"]);
    expect(filterByLifecycle(feed, LIFECYCLE.CONSTRUCTION).map((s) => s.slug)).toEqual(["b"]);
  });

  it("an unrecognized filter never hides the feed", () => {
    expect(filterByLifecycle(feed, "all")).toHaveLength(3);
    expect(filterByLifecycle(feed, "opening soon!!")).toHaveLength(3);
    expect(filterByLifecycle(feed, undefined)).toHaveLength(3);
    expect(filterByLifecycle(null, LIFECYCLE.PLANNED)).toEqual([]);
  });
});
