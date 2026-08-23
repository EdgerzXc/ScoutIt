import { createHash } from "node:crypto";
import {
  RETRIEVAL_CONTRACT_VERSION,
  planCorpusRebuild,
} from "@/lib/retrieval/corpusContract";

const TOMBSTONE_REASON = "source_removed_or_visibility_changed";

function isoTimestamp(value) {
  const timestamp = value instanceof Date ? value.toISOString() : value;
  if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
    throw new TypeError("now must be a valid ISO timestamp or Date.");
  }
  return new Date(timestamp).toISOString();
}

function documentKey(chunk) {
  return [chunk.corpus, chunk.sourceSystem, chunk.sourceType, chunk.sourceId]
    .map(encodeURIComponent)
    .join(":");
}

function assertUniqueChunkIds(chunks, collection) {
  const seen = new Set();
  for (const chunk of chunks || []) {
    if (seen.has(chunk?.chunkId)) {
      throw new TypeError(`${collection} contains duplicate chunk ID ${chunk?.chunkId}.`);
    }
    seen.add(chunk?.chunkId);
  }
}

function documentRow(chunks) {
  const ordered = [...chunks].sort((a, b) => a.chunkKey.localeCompare(b.chunkKey));
  const first = ordered[0];
  const content = ordered.map((chunk) => chunk.content).join("\n\n");
  const contentHash = createHash("sha256")
    .update(JSON.stringify(ordered.map((chunk) => [chunk.chunkId, chunk.contentHash])), "utf8")
    .digest("hex");

  return {
    contract_version: RETRIEVAL_CONTRACT_VERSION,
    corpus: first.corpus,
    source_system: first.sourceSystem,
    source_type: first.sourceType,
    source_id: first.sourceId,
    source_version: first.sourceVersion,
    title: first.title,
    content,
    content_hash: contentHash,
    canonical_url: first.canonicalUrl,
    approved: first.approved,
    release_status: first.releaseStatus,
    allowed_roles: first.allowedRoles,
    is_sample: first.isSample,
    sample_disclosure: first.sampleDisclosure,
    provenance: first.provenance || {},
    source_updated_at: first.sourceUpdatedAt,
    reviewed_at: first.reviewedAt,
    expires_at: first.expiresAt,
    tombstoned_at: null,
    tombstone_reason: null,
  };
}

/**
 * Produces database-shaped operations without opening a database connection.
 * Document references use the migration's natural unique key and are resolved
 * to UUIDs only by a future, owner-approved persistence adapter.
 */
export function buildPersistencePlan(previousChunks = [], nextChunks = [], {
  corpus,
  now = new Date(),
} = {}) {
  assertUniqueChunkIds(previousChunks, "previousChunks");
  assertUniqueChunkIds(nextChunks, "nextChunks");
  const timestamp = isoTimestamp(now);
  const rebuild = planCorpusRebuild(previousChunks, nextChunks, { corpus });
  const nextByDocument = new Map();

  for (const chunk of nextChunks) {
    const key = documentKey(chunk);
    const chunks = nextByDocument.get(key) || [];
    chunks.push(chunk);
    nextByDocument.set(key, chunks);
  }

  const removedChunkIds = new Set(rebuild.tombstone.map((entry) => entry.chunkId));
  const removedDocumentKeys = new Set(
    previousChunks.filter((chunk) => removedChunkIds.has(chunk.chunkId)).map(documentKey),
  );
  const affectedDocumentKeys = new Set([
    ...rebuild.upsert.map(documentKey),
    ...[...removedDocumentKeys].filter((key) => nextByDocument.has(key)),
  ]);
  const upsertDocuments = [...affectedDocumentKeys].map((key) => ({
    key,
    row: documentRow(nextByDocument.get(key)),
  }));
  const upsertChunks = rebuild.upsert.map((chunk) => ({
    documentKey: documentKey(chunk),
    chunk,
    row: {
      stable_chunk_id: chunk.chunkId,
      chunk_key: chunk.chunkKey,
      content: chunk.content,
      content_hash: chunk.contentHash,
      embedding: null,
      expires_at: chunk.expiresAt,
      tombstoned_at: null,
      tombstone_reason: null,
    },
  }));
  const tombstoneChunks = rebuild.tombstone.map((entry) => ({
    stable_chunk_id: entry.chunkId,
    corpus: entry.corpus,
    tombstoned_at: timestamp,
    tombstone_reason: entry.reason,
  }));

  const tombstoneDocuments = [...removedDocumentKeys]
    .filter((key) => !nextByDocument.has(key))
    .map((key) => ({
      key,
      tombstoned_at: timestamp,
      tombstone_reason: TOMBSTONE_REASON,
    }));

  return Object.freeze({
    contractVersion: RETRIEVAL_CONTRACT_VERSION,
    corpus: rebuild.corpus,
    plannedAt: timestamp,
    upsertDocuments,
    upsertChunks,
    tombstoneChunks,
    tombstoneDocuments,
  });
}

/** Applies a plan to in-memory chunks so deletion and read-back behavior can be tested. */
export function applyPersistencePlanFixture(previousChunks = [], plan) {
  const state = new Map(previousChunks.map((chunk) => [chunk.chunkId, { ...chunk }]));

  for (const entry of plan.tombstoneChunks) {
    const existing = state.get(entry.stable_chunk_id);
    if (existing) {
      state.set(entry.stable_chunk_id, {
        ...existing,
        tombstoned: true,
        tombstonedAt: entry.tombstoned_at,
        tombstoneReason: entry.tombstone_reason,
      });
    }
  }
  for (const entry of plan.upsertChunks) {
    state.set(entry.chunk.chunkId, { ...entry.chunk, tombstoned: false });
  }

  return [...state.values()].sort((a, b) => a.chunkId.localeCompare(b.chunkId));
}

/** Verifies that the active fixture state exactly matches the expected corpus snapshot. */
export function verifyPersistenceReadBack(actualChunks = [], expectedChunks = [], { corpus } = {}) {
  planCorpusRebuild([], expectedChunks, { corpus });
  const active = actualChunks.filter((chunk) => chunk.tombstoned !== true);
  const wrongCorpus = active
    .filter((chunk) => chunk.corpus !== corpus)
    .map((chunk) => chunk.chunkId);
  const actual = new Map(active.map((chunk) => [chunk.chunkId, chunk]));
  const expected = new Map(expectedChunks.map((chunk) => [chunk.chunkId, chunk]));
  const missing = [...expected.keys()].filter((chunkId) => !actual.has(chunkId));
  const stale = [...actual.keys()].filter((chunkId) => !expected.has(chunkId));
  const mismatched = [...expected.entries()]
    .filter(([chunkId, chunk]) => actual.has(chunkId) && actual.get(chunkId).contentHash !== chunk.contentHash)
    .map(([chunkId]) => chunkId);

  return {
    valid: missing.length === 0 && stale.length === 0 && mismatched.length === 0 && wrongCorpus.length === 0,
    missing,
    stale,
    mismatched,
    wrongCorpus,
  };
}
