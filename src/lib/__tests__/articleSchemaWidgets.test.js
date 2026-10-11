import { describe, it, expect } from "vitest";
import {
  buildingSpecsBlock,
  unitMixBlock,
  transitCorridorBlock,
  comparisonMatrixBlock,
  articleBlocksSchema,
  parseArticleBlocks,
  ingestedArticleSchema,
} from "@/lib/articleSchema";

describe("Universal Article Schema - Interactive Building Widgets (A-195)", () => {
  it("validates buildingSpecsBlock correctly", () => {
    const validBlock = {
      type: "building_specs",
      title: "The Estate Makati — Verified Specifications",
      developer: "SMDC & Federal Land",
      architect: "Foster + Partners",
      completionYear: "2025",
      heightMeters: 276,
      floorCount: 54,
      elevators: "High-Speed Destination Dispatch",
      powerRedundancy: "100% Dual-Feed N+1",
      leedStatus: "LEED Gold",
      district: "Ayala Avenue, Makati",
      gfa: "98,000 m²",
    };

    const parsed = buildingSpecsBlock.safeParse(validBlock);
    expect(parsed.success).toBe(true);
    expect(parsed.data.type).toBe("building_specs");
    expect(parsed.data.developer).toBe("SMDC & Federal Land");
    expect(parsed.data.heightMeters).toBe(276);
  });

  it("validates unitMixBlock correctly with item array", () => {
    const validUnitMix = {
      type: "unit_mix",
      title: "Unit Mix & Space Architecture",
      totalUnits: 188,
      units: [
        {
          type: "2BR Executive Suite",
          areaSqm: 151,
          priceRange: "₱85M – ₱98M",
          efficiency: "88% Usable",
          highlights: ["Private Foyer", "3.2m Ceiling"],
        },
        {
          type: "3BR Sky Villa",
          areaSqm: 224,
          priceRange: "₱135M – ₱160M",
        },
      ],
    };

    const parsed = unitMixBlock.safeParse(validUnitMix);
    expect(parsed.success).toBe(true);
    expect(parsed.data.units).toHaveLength(2);
    expect(parsed.data.units[0].areaSqm).toBe(151);
  });

  it("validates transitCorridorBlock correctly with hubs", () => {
    const validTransit = {
      type: "transit_corridor",
      title: "Ayala Transit Infrastructure",
      corridorName: "Makati Transit Corridor",
      walkScore: 94,
      transitHubs: [
        {
          name: "Ayala Station MRT-3",
          distanceMeters: 450,
          walkMinutes: 5,
          transitType: "MRT-3 Commuter Rail",
          status: "Operational",
        },
      ],
    };

    const parsed = transitCorridorBlock.safeParse(validTransit);
    expect(parsed.success).toBe(true);
    expect(parsed.data.transitHubs).toHaveLength(1);
    expect(parsed.data.transitHubs[0].distanceMeters).toBe(450);
  });

  it("validates comparisonMatrixBlock correctly with benchmark items", () => {
    const validMatrix = {
      type: "comparison_matrix",
      title: "District Valuation Matrix",
      benchmarkCategory: "Ultra-Luxury Residential Towers",
      items: [
        {
          name: "The Estate Makati",
          developer: "SMDC & Federal Land",
          ratePerSqm: "₱620,000/m²",
          efficiency: "90%",
          yearBuilt: 2025,
          badge: "SUBJECT PROPERTY",
        },
        {
          name: "Discovery Primea",
          ratePerSqm: "₱480,000/m²",
        },
      ],
    };

    const parsed = comparisonMatrixBlock.safeParse(validMatrix);
    expect(parsed.success).toBe(true);
    expect(parsed.data.items).toHaveLength(2);
  });

  it("parses JSON array of blocks containing interactive widgets via parseArticleBlocks", () => {
    const jsonStr = JSON.stringify([
      { type: "heading", level: 2, text: "Overview" },
      { type: "paragraph", text: "Introduction paragraph text." },
      {
        type: "building_specs",
        title: "Building Specs",
        developer: "Rockwell Land",
        floorCount: 56,
      },
      {
        type: "unit_mix",
        units: [{ type: "1BR", areaSqm: 64 }],
      },
    ]);

    const result = parseArticleBlocks(jsonStr);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(4);
    expect(result[2].type).toBe("building_specs");
    expect(result[3].type).toBe("unit_mix");
  });

  it("validates a full article envelope with interactive widgets through ingestedArticleSchema", () => {
    const fullArticle = {
      title: "The Estate Makati Architectural Analysis",
      slug: "the-estate-makati-analysis",
      category: "Residential",
      intelType: "BRIEFING",
      city: "Makati",
      excerpt: "Deep dive into structural engineering and transit proximity.",
      lead: "Foster + Partners delivers ultra-luxury scarcity.",
      recommendation: "Target 3BR corner units for prime capital preservation.",
      blocks: [
        { type: "paragraph", text: "Introductory commentary." },
        {
          type: "building_specs",
          title: "The Estate Makati",
          developer: "SMDC",
          heightMeters: 276,
        },
        {
          type: "transit_corridor",
          transitHubs: [
            { name: "Ayala Station", distanceMeters: 450, walkMinutes: 5, transitType: "MRT" },
          ],
        },
      ],
    };

    const parsed = ingestedArticleSchema.safeParse(fullArticle);
    expect(parsed.success).toBe(true);
    expect(parsed.data.slug).toBe("the-estate-makati-analysis");
  });
});
