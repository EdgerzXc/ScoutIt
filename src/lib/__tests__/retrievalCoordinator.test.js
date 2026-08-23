import { beforeAll, describe, expect, it, vi } from "vitest";
import { createRetrievalChunk } from "@/lib/retrieval/corpusContract";

vi.mock("server-only", () => ({}));

let coordinateFixtureRetrieval;
beforeAll(async () => {
  ({ coordinateFixtureRetrieval } = await import("@/lib/retrieval/retrievalCoordinator.server"));
});

const NOW = "2026-08-23T08:00:00.000Z";

function publicChunk(overrides = {}) {
  return createRetrievalChunk({
    corpus: "public",
    sourceSystem: "airtable",
    sourceType: "property",
    sourceId: "property-1",
    chunkKey: "overview",
    sourceVersion: "v1",
    title: "Transit-led office",
    content: "A Grade A office near the rail interchange.",
    approved: true,
    releaseStatus: "PUBLIC_LIVE",
    canonicalUrl: "/property/transit-office",
    allowedRoles: ["public"],
    ...overrides,
  });
}

function internalChunk(overrides = {}) {
  return createRetrievalChunk({
    corpus: "internal",
    sourceSystem: "scoutit_brain",
    sourceType: "brain_doc",
    sourceId: "brain-1",
    chunkKey: "overview",
    sourceVersion: "v1",
    title: "Internal corridor review",
    content: "Confidential transit corridor assessment.",
    allowedRoles: ["staff"],
    provenance: { path: "_SCOUTIT_BRAIN/example.md", reviewer: "ops" },
    ...overrides,
  });
}

function publicSource(overrides = {}) {
  return {
    sourceType: "property",
    sourceId: "property-1",
    title: "Transit-led office",
    canonicalUrl: "/property/transit-office",
    approved: true,
    releaseStatus: "PUBLIC_LIVE",
    pipelineStatus: "approved",
    category: "Commercial",
    city: "Taguig",
    lat: 14.5547,
    lng: 121.0215,
    listed_price: "Php 8,500,000",
    publicMetadata: { grade: "A", listed_price: "must-not-leak" },
    ...overrides,
  };
}

const allow = async () => true;

describe("F-001 server-only retrieval coordinator", () => {
  it("applies authoritative filters after semantic ranking and never serializes price", async () => {
    const chunk = publicChunk();
    const result = await coordinateFixtureRetrieval({
      corpus: "public",
      role: "public",
      query: "office",
      semanticCandidates: [{ chunk, score: 0.98 }],
      sourceSnapshots: [publicSource()],
      filters: {
        categories: ["Commercial"],
        locations: ["Taguig"],
        radius: { lat: 14.5547, lng: 121.0215, km: 1 },
        priceBand: { min: 1_000_000, max: 10_000_000 },
      },
      authorizeSource: allow,
      now: NOW,
    });

    expect(result.mode).toBe("semantic");
    expect(result.results).toHaveLength(1);
    expect(result.results[0].metadata).toEqual({ grade: "A" });
    expect(JSON.stringify(result)).not.toMatch(/8,500,000|must-not-leak|listed_price/i);
  });

  it("rejects stale lifecycle, route drift, filter mismatches, and denied entitlements", async () => {
    const chunk = publicChunk();
    const fixtures = [
      publicSource({ pipelineStatus: "off_market", lifecycleState: "off_market" }),
      publicSource({ canonicalUrl: "/property/drifted" }),
      publicSource({ category: "Hospitality" }),
    ];

    for (const source of fixtures) {
      const result = await coordinateFixtureRetrieval({
        corpus: "public",
        role: "public",
        query: "office",
        semanticCandidates: [{ chunk, score: 1 }],
        sourceSnapshots: [source],
        filters: { categories: ["Commercial"] },
        authorizeSource: allow,
        now: NOW,
      });
      expect(result).toEqual({ mode: "empty", results: [] });
    }

    const denied = await coordinateFixtureRetrieval({
      corpus: "public",
      role: "public",
      query: "office",
      semanticCandidates: [{ chunk, score: 1 }],
      sourceSnapshots: [publicSource()],
      authorizeSource: async () => false,
      now: NOW,
    });
    expect(denied).toEqual({ mode: "empty", results: [] });
  });

  it("falls back through the same corpus, source, filter, and entitlement checks", async () => {
    const publicSafe = publicChunk();
    const internalSecret = internalChunk();
    const result = await coordinateFixtureRetrieval({
      corpus: "public",
      role: "seeker",
      query: "transit",
      semanticCandidates: [],
      fallbackChunks: [internalSecret, publicSafe],
      sourceSnapshots: [
        publicSource(),
        { sourceType: "brain_doc", sourceId: "brain-1" },
      ],
      filters: { locations: ["Taguig"] },
      authorizeSource: allow,
      now: NOW,
    });

    expect(result.mode).toBe("keyword");
    expect(result.results.map((item) => item.sourceId)).toEqual(["property-1"]);
    expect(JSON.stringify(result)).not.toMatch(/confidential|brain-1/i);
  });

  it("makes cross-corpus semantic leakage impossible even from a compromised ranker", async () => {
    const publicSafe = publicChunk();
    const internalSecret = internalChunk();
    const result = await coordinateFixtureRetrieval({
      corpus: "public",
      role: "public",
      query: "corridor",
      semanticCandidates: [
        { chunk: internalSecret, score: 1 },
        { chunk: publicSafe, score: 0.5 },
      ],
      fallbackChunks: [internalSecret, publicSafe],
      sourceSnapshots: [
        publicSource(),
        { sourceType: "brain_doc", sourceId: "brain-1" },
      ],
      authorizeSource: allow,
      now: NOW,
    });

    expect(result.results.map((item) => item.sourceId)).toEqual(["property-1"]);
    expect(JSON.stringify(result)).not.toContain("brain-1");
  });

  it("preserves reviewed provenance internally and rejects public roles", async () => {
    const chunk = internalChunk({ reviewedAt: "2026-08-22T00:00:00.000Z" });
    await expect(coordinateFixtureRetrieval({
      corpus: "internal",
      role: "public",
      query: "corridor",
      semanticCandidates: [{ chunk, score: 1 }],
      sourceSnapshots: [{ sourceType: "brain_doc", sourceId: "brain-1" }],
      authorizeSource: allow,
      now: NOW,
    })).rejects.toThrow(/cannot retrieve the internal corpus/i);

    const result = await coordinateFixtureRetrieval({
      corpus: "internal",
      role: "staff",
      query: "corridor",
      semanticCandidates: [{ chunk, score: 1 }],
      sourceSnapshots: [{ sourceType: "brain_doc", sourceId: "brain-1" }],
      authorizeSource: allow,
      now: NOW,
    });
    expect(result.results[0]).toMatchObject({
      provenance: { path: "_SCOUTIT_BRAIN/example.md", reviewer: "ops" },
      reviewedAt: "2026-08-22T00:00:00.000Z",
    });
  });

  it("fails closed without a server-owned entitlement function", async () => {
    await expect(coordinateFixtureRetrieval({
      corpus: "public",
      role: "public",
      query: "office",
      semanticCandidates: [{ chunk: publicChunk(), score: 1 }],
      sourceSnapshots: [publicSource()],
      now: NOW,
    })).rejects.toThrow(/server-owned entitlement function/i);
  });
});
