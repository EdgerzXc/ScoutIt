import { describe, expect, it } from "vitest";
import { atomicRAGChunks, publicRAGChunks } from "@/data/flow";
import {
  RETRIEVAL_CONTRACT_VERSION,
  buildMasterFlowCorpus,
  createRetrievalChunk,
  keywordSearch,
  planCorpusRebuild,
  reconcileMasterFlowCorpus,
} from "@/lib/retrieval/corpusContract";

const intelPath = (slug) => `/${["intel", slug].join("/")}`;

const base = {
  sourceSystem: "fixture",
  sourceType: "article",
  sourceId: "source-1",
  chunkKey: "0",
  sourceVersion: "v1",
  title: "Transit corridor briefing",
  content: "A source-grounded discussion of access near transit.",
};

describe("F-001 retrieval corpus contract", () => {
  it("fails closed for unknown corpus and unsafe public material", () => {
    expect(() => createRetrievalChunk({ ...base, corpus: "shared" })).toThrow(/unsupported retrieval corpus/i);
    expect(() => createRetrievalChunk({ ...base, corpus: "public", approved: false, releaseStatus: "PUBLIC_LIVE", canonicalUrl: intelPath("x") })).toThrow(/approved/i);
    expect(() => createRetrievalChunk({ ...base, corpus: "public", approved: true, releaseStatus: "PUBLIC_LIVE", canonicalUrl: intelPath("x"), isSample: true })).toThrow(/disclosure/i);
    expect(() => createRetrievalChunk({ ...base, corpus: "internal", allowedRoles: ["visitor"] })).toThrow(/recognized ScoutIt staff role/i);
  });

  it("creates stable traceable identities while content changes produce a new hash", () => {
    const first = createRetrievalChunk({ ...base, corpus: "internal", allowedRoles: ["staff"] });
    const changed = createRetrievalChunk({ ...base, corpus: "internal", allowedRoles: ["staff"], content: `${base.content} Updated.` });

    expect(first.contractVersion).toBe(RETRIEVAL_CONTRACT_VERSION);
    expect(first.chunkId).toBe(changed.chunkId);
    expect(first.contentHash).not.toBe(changed.contentHash);
    expect(first.sourceId).toBe("source-1");
  });

  it("re-indexes metadata-only access, provenance, route, and expiry changes", () => {
    const original = createRetrievalChunk({
      ...base,
      corpus: "public",
      approved: true,
      releaseStatus: "PUBLIC_LIVE",
      canonicalUrl: intelPath("source-1"),
      allowedRoles: ["public"],
      provenance: { reviewer: "fixture-a" },
    });
    const restricted = createRetrievalChunk({
      ...base,
      corpus: "public",
      approved: true,
      releaseStatus: "PUBLIC_LIVE",
      canonicalUrl: intelPath("source-1-revised"),
      allowedRoles: ["owner"],
      provenance: { reviewer: "fixture-b" },
      expiresAt: "2026-09-01T00:00:00.000Z",
    });

    expect(restricted.chunkId).toBe(original.chunkId);
    expect(restricted.contentHash).not.toBe(original.contentHash);
    expect(planCorpusRebuild([original], [restricted], { corpus: "public" }).upsert).toEqual([restricted]);
  });

  it("adapts the existing exports into isolated public and internal corpora", () => {
    const publicResult = reconcileMasterFlowCorpus(publicRAGChunks, { corpus: "public" });
    const internalResult = reconcileMasterFlowCorpus(atomicRAGChunks, { corpus: "internal" });
    const publicCorpus = publicResult.chunks;
    const internalCorpus = internalResult.chunks;

    expect(publicCorpus.length).toBeGreaterThan(0);
    expect(publicResult.rejected.length).toBeGreaterThan(0);
    expect(publicCorpus.length + publicResult.rejected.length).toBe(publicRAGChunks.length);
    expect(internalCorpus.length).toBeGreaterThan(0);
    expect(internalResult.rejected.length).toBeGreaterThan(0);
    expect(internalCorpus.length + internalResult.rejected.length).toBe(atomicRAGChunks.length);
    expect(publicCorpus.every((chunk) => chunk.corpus === "public" && chunk.allowedRoles.every((role) => !["staff", "admin"].includes(role)))).toBe(true);
    expect(internalCorpus.every((chunk) => chunk.corpus === "internal" && chunk.allowedRoles.includes("staff"))).toBe(true);
    expect(new Set([...publicCorpus, ...internalCorpus].map((chunk) => `${chunk.corpus}:${chunk.chunkId}`)).size).toBe(publicCorpus.length + internalCorpus.length);
  });

  it("refuses a public-labelled Master Flow chunk without explicit public visibility", () => {
    const unsafe = { ...publicRAGChunks[0], visibility: ["STAFF"] };
    expect(() => buildMasterFlowCorpus([unsafe], { corpus: "public" })).toThrow(/not public-safe/i);
  });

  it("tombstones removals and upserts only changed or new chunks within one corpus", () => {
    const oldA = createRetrievalChunk({ ...base, corpus: "internal", allowedRoles: ["staff"] });
    const oldB = createRetrievalChunk({ ...base, corpus: "internal", sourceId: "source-2", allowedRoles: ["staff"] });
    const changedA = createRetrievalChunk({ ...base, corpus: "internal", allowedRoles: ["staff"], content: "Changed source content." });
    const plan = planCorpusRebuild([oldA, oldB], [changedA], { corpus: "internal" });
    expect(plan.upsert.map((chunk) => chunk.chunkId)).toEqual([changedA.chunkId]);
    expect(plan.tombstone).toEqual([{ chunkId: oldB.chunkId, corpus: "internal", tombstoned: true, reason: "source_removed_or_visibility_changed" }]);
  });

  it("refuses mixed-corpus rebuild input", () => {
    const internal = createRetrievalChunk({ ...base, corpus: "internal", allowedRoles: ["staff"] });
    const publicChunk = createRetrievalChunk({ ...base, corpus: "public", approved: true, releaseStatus: "PUBLIC_LIVE", canonicalUrl: intelPath("source-1"), allowedRoles: ["public"] });
    expect(() => planCorpusRebuild([internal, publicChunk], [], { corpus: "internal" })).toThrow(/outside the internal corpus/i);
  });

  it("keeps keyword fallback corpus- and role-scoped", () => {
    const publicChunk = createRetrievalChunk({ ...base, corpus: "public", approved: true, releaseStatus: "PUBLIC_LIVE", canonicalUrl: intelPath("source-1"), allowedRoles: ["public"] });
    const internalChunk = createRetrievalChunk({ ...base, corpus: "internal", sourceId: "secret", allowedRoles: ["staff"], content: "Transit internal security notes." });

    expect(keywordSearch([publicChunk, internalChunk], "transit", { corpus: "public", role: "public" }).map((r) => r.chunk.chunkId)).toEqual([publicChunk.chunkId]);
    expect(keywordSearch([publicChunk, internalChunk], "security", { corpus: "public", role: "public" })).toEqual([]);
    expect(keywordSearch([publicChunk, internalChunk], "transit", { corpus: "public", role: "seeker" }).map((r) => r.chunk.chunkId)).toEqual([publicChunk.chunkId]);
    expect(keywordSearch([publicChunk, internalChunk], "security", { corpus: "internal", role: "staff" }).map((r) => r.chunk.chunkId)).toEqual([internalChunk.chunkId]);
  });

  it("keeps expired chunks out of keyword fallback", () => {
    const expired = createRetrievalChunk({
      ...base,
      corpus: "internal",
      allowedRoles: ["staff"],
      expiresAt: "2026-08-22T00:00:00.000Z",
    });

    expect(keywordSearch([expired], "transit", {
      corpus: "internal",
      role: "staff",
      now: "2026-08-23T00:00:00.000Z",
    })).toEqual([]);
  });
});
