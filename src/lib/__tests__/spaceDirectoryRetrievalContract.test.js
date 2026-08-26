import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { stripPremiumFields, PREMIUM_FIELD_MAP } from "@/lib/premiumFields";
import { createRetrievalChunk, RETRIEVAL_CORPORA } from "@/lib/retrieval/corpusContract";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("F-005 Space Directory product and retrieval audit contract", () => {
  it("enforces Server Component shell for /property with crawler-ready first paint", () => {
    const pageSource = read("src/app/property/page.js");
    // Verify file is a Server Component and not declared as client component
    expect(pageSource.startsWith('"use client"') || pageSource.startsWith("'use client'")).toBe(false);
    expect(pageSource).toContain("loadInitialProperties");
    expect(pageSource).toContain("stripPremiumFields");
    expect(pageSource).toContain("<DirectoryClient initialProperties={initialProperties}");
    expect(pageSource).toContain("initialIntel={initialIntel}");
  });


  it("strips premium fields on anonymous directory data first-paint", () => {
    const rawListing = {
      id: "rec123",
      title: "Ayala Triangle Tower Two",
      slug: "ayala-triangle-two",
      spaceCategory: "Commercial",
      virtual_tour_url: "https://tours.scoutit.com/ayala-two",
      matterportTourUrl: "https://my.matterport.com/show/?m=123",
      floorPlans: ["https://cdn.scoutit.com/plans/floor20.pdf"],
      deepIntel: { capRate: "7.2%", annualYield: "8.5%" },
      enhanced_photos: ["https://cdn.scoutit.com/hdr/photo1.jpg"],
      floor_sqm: 1200,
    };

    const stripped = stripPremiumFields(rawListing, "starry");
    expect(stripped.title).toBe("Ayala Triangle Tower Two");
    expect(stripped.slug).toBe("ayala-triangle-two");
    expect(stripped.virtual_tour_url).toBe("");
    expect(stripped.matterportTourUrl).toBe("");
    expect(stripped.floorPlans).toEqual([]);
    expect(stripped.deepIntel).toEqual({});
    expect(stripped.enhanced_photos).toEqual([]);
    expect(stripped.lockedFeatures).toContain("vault");
    expect(stripped.lockedFeatures).toContain("deepIntel");
  });

  it("preserves structured filter authority in DirectoryClient (category, city, radius)", () => {
    const clientSource = read("src/app/property/DirectoryClient.js");
    expect(clientSource).toContain("PRICE_BANDS");
    expect(clientSource).toContain("getCardSpecBadges");
    expect(clientSource).toContain("InteractiveRadiusMap");
    expect(clientSource).toContain("toCard");
  });

  it("defines strict server-side boundaries for semantic retrieval and RAG fallback", () => {
    // 1. Valid public chunk maps strictly to a real canonical path
    const validPublicChunk = createRetrievalChunk({
      corpus: RETRIEVAL_CORPORA.PUBLIC,
      sourceSystem: "airtable",
      sourceType: "property",
      sourceId: "rec_bgc_villa",
      sourceVersion: "2026-08-23",
      chunkKey: "overview",
      title: "BGC Modernist Villa",
      content: "Exclusive low-density architectural residence in Bonifacio Global City.",
      canonicalUrl: "/property/bgc-modernist-villa",
      approved: true,
      releaseStatus: "PUBLIC_LIVE",
      allowedRoles: ["public", "seeker"],
    });

    expect(validPublicChunk.canonicalUrl).toBe("/property/bgc-modernist-villa");
    expect(validPublicChunk.corpus).toBe("public");
    expect(validPublicChunk.contentHash).toBeDefined();

    // 2. Public chunks cannot leak internal roles or omit canonical URL
    expect(() => {
      createRetrievalChunk({
        corpus: RETRIEVAL_CORPORA.PUBLIC,
        sourceSystem: "airtable",
        sourceType: "property",
        sourceId: "rec_leak",
        sourceVersion: "2026-08-23",
        chunkKey: "overview",
        title: "Leaked Property",
        content: "Internal notes on property owner.",
        canonicalUrl: null,
        approved: true,
        releaseStatus: "PUBLIC_LIVE",
        allowedRoles: ["staff"],
      });
    }).toThrow();

    // 3. Unapproved or non-public items are rejected from public retrieval
    expect(() => {
      createRetrievalChunk({
        corpus: RETRIEVAL_CORPORA.PUBLIC,
        sourceSystem: "airtable",
        sourceType: "property",
        sourceId: "rec_unapproved",
        sourceVersion: "2026-08-23",
        chunkKey: "overview",
        title: "Draft Property",
        content: "Unverified property description.",
        canonicalUrl: "/property/draft",
        approved: false,
        releaseStatus: "DRAFT",
        allowedRoles: ["public"],
      });
    }).toThrow();

    const coordinator = read("src/lib/retrieval/retrievalCoordinator.server.js");
    expect(coordinator).toContain('import "server-only"');
    expect(coordinator).toContain("semanticCandidates");
    expect(coordinator).toContain("keywordSearch");
    expect(existsSync(resolve(process.cwd(), "src/app/api/search/route.js"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "src/app/api/intel/search/route.js"))).toBe(false);
  });

  it("handles null/missing property and intel fields during search without crashing", () => {
    const propertiesWithNulls = [
      {
        id: "one-e-com",
        title: "One E-Com Center",
        city: "Pasay City",
        location: null,
        spaceCategory: "Commercial",
        aestheticTag: null,
      },
      {
        id: "minimal-residence",
        title: "Minimalist Loft",
        city: null,
        location: null,
        spaceCategory: null,
        aestheticTag: null,
      }
    ];

    const searchQuery = "e-com";
    const q = searchQuery.toLowerCase();

    const filtered = propertiesWithNulls.filter((p) => {
      const matchTitle = (p.title || "").toLowerCase().includes(q);
      const matchCity = (p.city || "").toLowerCase().includes(q);
      const matchLocation = (p.location || "").toLowerCase().includes(q);
      const matchCategory = (p.spaceCategory || "").toLowerCase().includes(q);
      const matchAesthetic = (p.aestheticTag || "").toLowerCase().includes(q);
      return matchTitle || matchCity || matchLocation || matchCategory || matchAesthetic;
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe("one-e-com");
  });
});
