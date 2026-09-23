import { describe, expect, it } from "vitest";
import { matchesJourneyStage, stageForSignal, validJourneyStage } from "../layerTwoJourney";

const now = new Date(2026, 8, 22, 12);

describe("Layer 2 building stages", () => {
  it("uses a real date for opening and an explicit completion for finished", () => {
    expect(stageForSignal({ lifecycle: "planned" }, now)).toBe("planned");
    expect(stageForSignal({ lifecycle: "construction", openingDate: "2026-09-25" }, now)).toBe("opening");
    expect(stageForSignal({ lifecycle: "construction", openingDate: "2026-12-25" }, now)).toBe("building");
    expect(stageForSignal({ lifecycle: "completed", openingDate: "2026-09-22" }, now)).toBe("finished");
  });

  it("does not call an old target date finished or assign a stage to ordinary articles", () => {
    expect(stageForSignal({ lifecycle: "construction", openingDate: "2026-09-01" }, now)).toBe("building");
    expect(stageForSignal({ status: "PERMIT FILED" }, now)).toBe(null);
    expect(matchesJourneyStage({ status: "PERMIT FILED" }, "finished", now)).toBe(false);
    expect(matchesJourneyStage({ status: "PERMIT FILED" }, "all", now)).toBe(true);
    expect(validJourneyStage("nonsense")).toBe("all");
  });
});
