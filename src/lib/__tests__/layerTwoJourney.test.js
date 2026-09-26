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

  it("identifies building vs trend articles correctly", () => {
    const buildingArticle = { lifecycle: "construction", title: "Torre Lorenzo Tower 2" };
    const trendArticle = {
      title: "Makati Green Building Mandate Expands to Retrofits",
      excerpt: "City ordinance requires existing commercial towers over 15 floors to comply.",
      category: "Market Intel",
      intelType: "MARKET INTEL",
    };

    expect(matchesJourneyStage(buildingArticle, "buildings", now)).toBe(true);
    expect(matchesJourneyStage(trendArticle, "buildings", now)).toBe(false);
    expect(matchesJourneyStage(trendArticle, "trends", now)).toBe(true);
    expect(matchesJourneyStage(buildingArticle, "trends", now)).toBe(false);
  });

  it("categorizes trend articles into specialized subcategories", () => {
    const zoningArticle = {
      title: "Makati Green Building Mandate",
      excerpt: "City ordinance and PEZA updates for commercial retrofits.",
    };
    const infraArticle = {
      title: "Subway Station Connectivity Map",
      excerpt: "New transit corridors linking BGC and Ortigas hubs.",
    };
    const capitalArticle = {
      title: "Siargao Land Rush Accelerates",
      excerpt: "Commercial yield expectations and land acquisitions surge.",
    };
    const demandArticle = {
      title: "BGC Villa Absorption Sets Record",
      excerpt: "High net worth seekers absorb prime residential inventory.",
    };

    expect(matchesJourneyStage(zoningArticle, "zoning", now)).toBe(true);
    expect(matchesJourneyStage(infraArticle, "infrastructure", now)).toBe(true);
    expect(matchesJourneyStage(capitalArticle, "capital", now)).toBe(true);
    expect(matchesJourneyStage(demandArticle, "demand", now)).toBe(true);

    // Cross-stage isolation
    expect(matchesJourneyStage(zoningArticle, "demand", now)).toBe(false);
    expect(matchesJourneyStage(infraArticle, "capital", now)).toBe(false);
  });
});

