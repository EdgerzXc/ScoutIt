import { describe, it, expect } from "vitest";
import {
  DEVELOPMENT_BLUEPRINTS,
  listAvailableAgentBlueprints,
  getBlueprintById,
  computeTransitCorridorData,
  generateAutonomousIntelBriefing,
  validateGeneratedArticle,
} from "@/lib/ai/autonomousIntelAgent";

describe("Autonomous Intel Article Agent Bot (A-195)", () => {
  it("provides pre-configured architectural blueprints for major Philippine developments", () => {
    const blueprints = listAvailableAgentBlueprints();
    expect(blueprints.length).toBeGreaterThanOrEqual(4);

    const ids = blueprints.map((b) => b.id);
    expect(ids).toContain("the-estate-makati");
    expect(ids).toContain("aurelia-residences-bgc");
    expect(ids).toContain("proscenium-at-rockwell");
    expect(ids).toContain("megaworld-uptown-modern");
  });

  it("retrieves blueprint by id or slug correctly", () => {
    const estate = getBlueprintById("the-estate-makati");
    expect(estate).not.toBeNull();
    expect(estate.developer).toBe("SMDC & Federal Land");
    expect(estate.architect).toBe("Foster + Partners");

    const aurelia = getBlueprintById("aurelia-residences-bgc-skyline-dominance");
    expect(aurelia).not.toBeNull();
    expect(aurelia.id).toBe("aurelia-residences-bgc");

    expect(getBlueprintById("nonexistent-development")).toBeNull();
  });

  it("calculates realistic non-zero transit corridor distances and walk times", () => {
    const estate = getBlueprintById("the-estate-makati");
    const computed = computeTransitCorridorData(estate.coordinates, estate.transitNodes);

    expect(computed).toHaveLength(estate.transitNodes.length);
    for (const hub of computed) {
      expect(hub.distanceMeters).toBeGreaterThan(0);
      expect(hub.walkMinutes).toBeGreaterThan(0);
      expect(typeof hub.name).toBe("string");
      expect(typeof hub.transitType).toBe("string");
    }
  });

  it("generates a complete, validated article with all 4 interactive building widgets", async () => {
    const result = await generateAutonomousIntelBriefing({
      blueprintId: "the-estate-makati",
      dryRun: true,
    });

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.metadata.blueprintId).toBe("the-estate-makati");

    const { article } = result;
    expect(article.title).toContain("The Estate Makati");
    expect(article.slug).toBe("the-estate-makati-ultra-luxury-engineering");
    expect(article.category).toBe("Residential");
    expect(article.intelType).toBe("BRIEFING");
    expect(article.city).toBe("Makati");
    expect(article.lead).toBeTruthy();
    expect(article.recommendation).toBeTruthy();

    // Check blocks
    const blockTypes = article.blocks.map((b) => b.type);
    expect(blockTypes).toContain("heading");
    expect(blockTypes).toContain("paragraph");
    expect(blockTypes).toContain("building_specs");
    expect(blockTypes).toContain("transit_corridor");
    expect(blockTypes).toContain("unit_mix");
    expect(blockTypes).toContain("comparison_matrix");
    expect(blockTypes).toContain("stat");
    expect(blockTypes).toContain("quote");

    // Validate with validateGeneratedArticle
    const validation = validateGeneratedArticle(article);
    expect(validation.valid).toBe(true);
  });

  it("supports generating commercial briefings with subway connectivity (Uptown Modern)", async () => {
    const result = await generateAutonomousIntelBriefing({
      blueprintId: "megaworld-uptown-modern",
      dryRun: false,
    });

    expect(result.success).toBe(true);
    const { article } = result;
    expect(article.category).toBe("Commercial");
    expect(article.intelType).toBe("COMMERCIAL SIGNAL");

    const transitBlock = article.blocks.find((b) => b.type === "transit_corridor");
    expect(transitBlock).toBeDefined();
    expect(transitBlock.transitHubs.some((h) => h.name.includes("Subway"))).toBe(true);
  });
});
