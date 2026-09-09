import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { RECORD_STATES } from "@/lib/brokerMetrics";
import { recordPanelPresentation } from "@/lib/brokerRecordPanel";

// A-039 — A-037 moved the three figures out of the left column's SCOUTIT RECORD
// box and into the at-a-glance chart beside the advisor's name. The box kept
// only its provenance sentence, so a full-size bordered panel under the avatar
// carried one line of small print, and the page showed the heading
// SCOUTIT RECORD twice.
//
// The sentence is load-bearing and could not simply be deleted: it is the
// provenance declaration A-023 requires of every public card, AND it is where
// the BUILDING and UNAVAILABLE states explain themselves in words when no
// chart renders.
//
// The resolution taken is A-039's option 2 — keep the copy, drop the duplicate
// heading and the bordered frame, and only where the duplication actually
// exists. Options 1 and 3 both decide what the left column is *for*, which
// A-039 reserves for the owner.

const read = (p) => fs.readFileSync(p, "utf8");
const IDENTITY = "src/components/brokers/BrokerDossierIdentity.js";

describe("A-039 · the heading appears once, and only where the chart also renders", () => {
  it("drops the panel's badge when figures are published, because the chart carries the heading", () => {
    const shown = recordPanelPresentation({ state: RECORD_STATES.QUALIFIED });
    expect(shown.showBadge).toBe(false);
    expect(shown.framed).toBe(false);
  });

  it("keeps the badge and the frame when no chart renders — the panel IS the record then", () => {
    for (const state of [RECORD_STATES.BUILDING, RECORD_STATES.UNAVAILABLE]) {
      const presentation = recordPanelPresentation({ state });
      expect(presentation.showBadge).toBe(true);
      expect(presentation.framed).toBe(true);
      expect(presentation.explains).toBe(true);
    }
  });

  it("treats a stale record as publishing figures — the chart renders for it too", () => {
    const stale = recordPanelPresentation({ state: RECORD_STATES.STALE });
    expect(stale.showBadge).toBe(false);
    expect(stale.explains).toBe(false);
  });

  it("falls back to the explaining, framed form for an unknown state", () => {
    // A state nobody anticipated must not silently render an unlabelled note.
    expect(recordPanelPresentation({ state: "something-new" }).showBadge).toBe(true);
    expect(recordPanelPresentation(null).showBadge).toBe(true);
    expect(recordPanelPresentation({}).showBadge).toBe(true);
    // Regression: RECORD_STATES has QUALIFIED, not PUBLISHED. Referring to a
    // key that does not exist put `undefined` in the charted set, so a record
    // with no state at all rendered as if the chart were carrying its heading.
    expect(RECORD_STATES.PUBLISHED).toBeUndefined();
  });
});

describe("A-039 · the provenance declaration survives every state that publishes a figure", () => {
  it("keeps both provenance sentences in the component", () => {
    const source = read(IDENTITY);
    expect(source).toContain("Computed only from activity completed through ScoutIt");
    expect(source).toContain("Demonstration figures on an example profile");
  });

  it("keeps the BUILDING and UNAVAILABLE explanations", () => {
    const source = read(IDENTITY);
    expect(source).toContain("Qualified platform activity will appear here");
    expect(source).toContain("temporary read failure, not a statement that there is no activity");
  });

  it("derives the panel's presentation rather than hardcoding it", () => {
    const source = read(IDENTITY);
    expect(source).toContain("recordPanelPresentation");
  });
});

describe("A-039 · heading semantics stay intact (A-024 owns the one-H1 rule)", () => {
  it("the panel's label is a span, not a heading, so it cannot compete with the chart's h2", () => {
    const source = read(IDENTITY);
    // The component legitimately owns the page h1 (the advisor's name) and the
    // section h2s. What must never become a heading is the panel's own label.
    expect(source).toContain('<span className="icon-badge">SCOUTIT RECORD</span>');
    expect(source).not.toMatch(/<h[1-6][^>]*>\s*SCOUTIT RECORD/i);
    expect((source.match(/<h1[\s>]/g) || []).length).toBe(1);
  });

  it("the chart still owns the visible ScoutIt Record heading", () => {
    const chart = read("src/components/brokers/BrokerRecordChart.js");
    expect(chart).toContain('id="record-chart-heading"');
    expect(chart).toContain("ScoutIt Record");
  });
});
