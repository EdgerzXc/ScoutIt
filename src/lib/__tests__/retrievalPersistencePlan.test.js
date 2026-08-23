import { describe, expect, it } from "vitest";
import { createRetrievalChunk, keywordSearch } from "@/lib/retrieval/corpusContract";
import {
  applyPersistencePlanFixture,
  buildPersistencePlan,
  verifyPersistenceReadBack,
} from "@/lib/retrieval/persistencePlan";

const NOW = "2026-08-23T08:00:00.000Z";
const intelPath = (slug) => `/${["intel", slug].join("/")}`;

const base = {
  corpus: "internal",
  sourceSystem: "fixture",
  sourceType: "briefing",
  sourceId: "source-1",
  sourceVersion: "v1",
  title: "Transit corridor briefing",
  content: "Source-grounded transit access notes.",
  allowedRoles: ["staff"],
};

function chunk(overrides = {}) {
  return createRetrievalChunk({ ...base, chunkKey: "0", ...overrides });
}

describe("F-001 fixture-backed persistence planning", () => {
  it("produces no write operations for an unchanged snapshot", () => {
    const existing = chunk();
    const plan = buildPersistencePlan([existing], [existing], { corpus: "internal", now: NOW });

    expect(plan.plannedAt).toBe(NOW);
    expect(plan.upsertDocuments).toEqual([]);
    expect(plan.upsertChunks).toEqual([]);
    expect(plan.tombstoneChunks).toEqual([]);
    expect(plan.tombstoneDocuments).toEqual([]);
  });

  it("emits database-shaped document and chunk rows without embeddings", () => {
    const existing = chunk();
    const changed = chunk({ content: "Updated transit access notes.", sourceVersion: "v2" });
    const plan = buildPersistencePlan([existing], [changed], { corpus: "internal", now: NOW });

    expect(plan.upsertDocuments).toHaveLength(1);
    expect(plan.upsertDocuments[0].row).toMatchObject({
      contract_version: "1.0.0",
      corpus: "internal",
      source_id: "source-1",
      source_version: "v2",
      allowed_roles: ["staff"],
      tombstoned_at: null,
    });
    expect(plan.upsertChunks[0].row).toMatchObject({
      stable_chunk_id: changed.chunkId,
      content_hash: changed.contentHash,
      embedding: null,
      tombstoned_at: null,
    });
  });

  it("tombstones a removed chunk but keeps its document while sibling chunks remain", () => {
    const first = chunk({ chunkKey: "0" });
    const sibling = chunk({ chunkKey: "1", content: "A second source section." });
    const plan = buildPersistencePlan([first, sibling], [sibling], { corpus: "internal", now: NOW });

    expect(plan.tombstoneChunks).toEqual([{
      stable_chunk_id: first.chunkId,
      corpus: "internal",
      tombstoned_at: NOW,
      tombstone_reason: "source_removed_or_visibility_changed",
    }]);
    expect(plan.tombstoneDocuments).toEqual([]);
    expect(plan.upsertDocuments).toHaveLength(1);
    expect(plan.upsertDocuments[0].row.content).toBe(sibling.content);
  });

  it("tombstones the document only when its final chunk disappears", () => {
    const removed = chunk();
    const plan = buildPersistencePlan([removed], [], { corpus: "internal", now: NOW });

    expect(plan.tombstoneDocuments).toHaveLength(1);
    expect(plan.tombstoneDocuments[0]).toMatchObject({
      tombstoned_at: NOW,
      tombstone_reason: "source_removed_or_visibility_changed",
    });
  });

  it("simulates deletion read-back and keeps keyword fallback from seeing tombstones", () => {
    const visible = chunk({ sourceId: "visible", content: "Transit market evidence." });
    const removed = chunk({ sourceId: "removed", content: "Transit confidential draft." });
    const expected = [visible];
    const plan = buildPersistencePlan([visible, removed], expected, { corpus: "internal", now: NOW });
    const readBack = applyPersistencePlanFixture([visible, removed], plan);

    expect(verifyPersistenceReadBack(readBack, expected, { corpus: "internal" })).toEqual({
      valid: true,
      missing: [],
      stale: [],
      mismatched: [],
      wrongCorpus: [],
    });
    expect(keywordSearch(readBack, "confidential", { corpus: "internal", role: "staff" })).toEqual([]);
    expect(keywordSearch(readBack, "market", { corpus: "internal", role: "staff" })).toHaveLength(1);
  });

  it("fails read-back verification for stale, missing, changed, or wrong-corpus active rows", () => {
    const expected = chunk();
    const changed = { ...expected, contentHash: "0".repeat(64) };
    const stale = chunk({ sourceId: "stale" });
    const wrongCorpus = { ...chunk({ sourceId: "wrong" }), corpus: "public" };
    const result = verifyPersistenceReadBack([changed, stale, wrongCorpus], [expected], { corpus: "internal" });

    expect(result.valid).toBe(false);
    expect(result.mismatched).toEqual([expected.chunkId]);
    expect(result.stale).toContain(stale.chunkId);
    expect(result.wrongCorpus).toEqual([wrongCorpus.chunkId]);
  });

  it("refuses duplicate identities, mixed corpora, and invalid clocks", () => {
    const internal = chunk();
    const publicChunk = createRetrievalChunk({
      ...base,
      corpus: "public",
      chunkKey: "public",
      approved: true,
      releaseStatus: "PUBLIC_LIVE",
      canonicalUrl: intelPath("source-1"),
      allowedRoles: ["public"],
    });

    expect(() => buildPersistencePlan([internal, internal], [], { corpus: "internal", now: NOW })).toThrow(/duplicate chunk ID/i);
    expect(() => buildPersistencePlan([internal], [publicChunk], { corpus: "internal", now: NOW })).toThrow(/outside the internal corpus/i);
    expect(() => buildPersistencePlan([], [], { corpus: "internal", now: "not-a-date" })).toThrow(/valid ISO timestamp/i);
  });
});
