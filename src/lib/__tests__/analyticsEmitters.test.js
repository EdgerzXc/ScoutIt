import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A-146 (H batch): the tap funnel blind spots are wired. Render tests are
// impossible here (JSX in .js), so these pin the emitter call sites by reading
// source — the same convention as a096InterfaceContracts.

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("A-146 — blind-spot events are emitted", () => {
  it("reaction taps emit on receipt (both tap surfaces)", () => {
    for (const file of [
      "src/components/ui/ReactionButtons.js",
      "src/components/layout/BottomNav.js",
    ]) {
      const src = read(file);
      expect(src).toContain("GA_EVENTS.REACTION_TAPPED");
      expect(src).toContain("trackEvent(GA_EVENTS.REACTION_TAPPED, { property_id:");
    }
  });

  it("appeal submits emit on 201", () => {
    const src = read("src/components/dashboard/FAQPreflightPanel.js");
    expect(src).toContain("trackEvent(GA_EVENTS.APPEAL_SUBMITTED, { evidence_id:");
  });

  it("inquiry modal emits on open (send already emits on receipt)", () => {
    const src = read("src/components/property/InquiryModal.js");
    expect(src).toContain("trackEvent(GA_EVENTS.INQUIRY_STARTED, { property_slug:");
  });

  it("onboarding emits every step visit from one effect", () => {
    const src = read("src/app/onboarding/page.js");
    expect(src).toContain("trackEvent(GA_EVENTS.ONBOARDING_STEP, { step })");
  });

  it("mode switches emit on both surfaces", () => {
    expect(read("src/components/ui/FloatingToolbox.js")).toContain(
      "trackEvent(GA_EVENTS.DISPLAY_MODE_SWITCHED, { axis:",
    );
    expect(read("src/components/layout/BottomNav.js")).toContain(
      "trackEvent(GA_EVENTS.DISPLAY_MODE_SWITCHED, { axis:",
    );
  });

  it("a blocked share popup is not counted as a completed share", () => {
    const src = read("src/components/property/ShareModal.js");
    expect(src).toContain("const win = window.open(");
    expect(src).toContain("if (win) {");
  });
});
