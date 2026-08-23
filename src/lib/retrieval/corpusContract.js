import { createHash } from "node:crypto";

export const RETRIEVAL_CONTRACT_VERSION = "1.0.0";
export const RETRIEVAL_CORPORA = Object.freeze({
  PUBLIC: "public",
  INTERNAL: "internal",
});

const ALLOWED_CORPORA = new Set(Object.values(RETRIEVAL_CORPORA));
const PUBLIC_RELEASE_STATES = new Set(["PUBLIC_LIVE", "LIMITED_LIVE"]);
const EXTERNAL_ROLES = new Set(["public", "visitor", "seeker", "owner", "broker", "provider", "enterprise"]);
const INTERNAL_ROLES = new Set(["staff", "admin", "agent", "ops_manager", "super_admin"]);

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeCorpus(value) {
  const corpus = requiredString(value, "corpus").toLowerCase();
  if (!ALLOWED_CORPORA.has(corpus)) {
    throw new TypeError(`Unsupported retrieval corpus: ${corpus}`);
  }
  return corpus;
}

function stableKey({ sourceSystem, sourceType, sourceId, chunkKey }) {
  return [sourceSystem, sourceType, sourceId, chunkKey].map(encodeURIComponent).join(":");
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createRetrievalChunk(input) {
  const corpus = normalizeCorpus(input?.corpus);
  const sourceSystem = requiredString(input?.sourceSystem, "sourceSystem");
  const sourceType = requiredString(input?.sourceType, "sourceType");
  const sourceId = requiredString(input?.sourceId, "sourceId");
  const chunkKey = requiredString(input?.chunkKey, "chunkKey");
  const title = requiredString(input?.title, "title");
  const content = requiredString(input?.content, "content");
  const sourceVersion = requiredString(input?.sourceVersion, "sourceVersion");
  const canonicalUrl = input?.canonicalUrl?.trim() || null;
  const approved = input?.approved === true;
  const releaseStatus = input?.releaseStatus || null;
  const isSample = input?.isSample === true;
  const sampleDisclosure = input?.sampleDisclosure?.trim() || null;

  if (corpus === RETRIEVAL_CORPORA.PUBLIC) {
    if (!approved || !PUBLIC_RELEASE_STATES.has(releaseStatus)) {
      throw new TypeError("Public chunks require approved, publicly released source material.");
    }
    if (!canonicalUrl?.startsWith("/")) {
      throw new TypeError("Public chunks require a canonical ScoutIt path.");
    }
    if (isSample && !sampleDisclosure) {
      throw new TypeError("Sample public chunks require an explicit disclosure.");
    }
  }

  const roles = [...new Set((input?.allowedRoles || [])
    .map((role) => String(role).trim().toLowerCase())
    .filter(Boolean))].sort();

  if (roles.length === 0) {
    throw new TypeError(`${corpus} chunks require at least one allowed role.`);
  }
  if (corpus === RETRIEVAL_CORPORA.PUBLIC && roles.some((role) => !EXTERNAL_ROLES.has(role))) {
    throw new TypeError("Public chunks cannot grant internal roles.");
  }
  if (corpus === RETRIEVAL_CORPORA.INTERNAL && roles.some((role) => !INTERNAL_ROLES.has(role))) {
    throw new TypeError("Internal chunks require a recognized ScoutIt staff role.");
  }

  const contentHash = sha256(JSON.stringify({
    contractVersion: RETRIEVAL_CONTRACT_VERSION,
    corpus,
    sourceVersion,
    title,
    content,
    canonicalUrl,
    approved,
    releaseStatus,
    allowedRoles: roles,
    isSample,
    sampleDisclosure,
    provenance: input?.provenance || null,
    sourceUpdatedAt: input?.sourceUpdatedAt || null,
    reviewedAt: input?.reviewedAt || null,
    expiresAt: input?.expiresAt || null,
  }));

  return Object.freeze({
    contractVersion: RETRIEVAL_CONTRACT_VERSION,
    chunkId: stableKey({ sourceSystem, sourceType, sourceId, chunkKey }),
    corpus,
    sourceSystem,
    sourceType,
    sourceId,
    sourceVersion,
    chunkKey,
    title,
    content,
    contentHash,
    canonicalUrl,
    approved,
    releaseStatus,
    allowedRoles: roles,
    isSample,
    sampleDisclosure,
    provenance: input?.provenance || null,
    sourceUpdatedAt: input?.sourceUpdatedAt || null,
    reviewedAt: input?.reviewedAt || null,
    expiresAt: input?.expiresAt || null,
    tombstoned: false,
  });
}

function masterFlowContent(chunk) {
  return [
    chunk.title,
    chunk.purpose,
    chunk.description,
    ...(chunk.available_actions || []),
    ...(chunk.entry_conditions || []),
    ...(chunk.exceptions || []),
    ...(chunk.recovery_mechanisms || []),
    ...(chunk.claims || []).map((claim) => claim?.text),
  ].filter(Boolean).join("\n");
}

function masterFlowAllowedRoles(chunk, corpus) {
  if (corpus === RETRIEVAL_CORPORA.INTERNAL) return ["staff", "admin"];
  return [...new Set((chunk.visibility || [])
    .map((role) => String(role).toLowerCase())
    .map((role) => role === "visitor" ? "public" : role)
    .filter((role) => EXTERNAL_ROLES.has(role)))];
}

function adaptMasterFlowChunk(chunk, normalizedCorpus) {
  const isPublic = normalizedCorpus === RETRIEVAL_CORPORA.PUBLIC;
  const allowedRoles = masterFlowAllowedRoles(chunk, normalizedCorpus);
  const isPublicChunk = chunk?.securityClassification === "PUBLIC"
    && allowedRoles.length > 0
    && chunk?.status === "VERIFIED"
    && PUBLIC_RELEASE_STATES.has(chunk?.releaseStatus);

  if (isPublic && !isPublicChunk) {
    throw new TypeError(`Master Flow chunk ${chunk?.chunk_id || "unknown"} is not public-safe.`);
  }

  return createRetrievalChunk({
    corpus: normalizedCorpus,
    sourceSystem: "scoutit_master_flow",
    sourceType: chunk.source_type || "MASTER_FLOW_CHUNK",
    sourceId: chunk.canonical_id || chunk.chunk_id,
    chunkKey: chunk.chunk_id,
    sourceVersion: chunk.graph_version || "unknown",
    title: chunk.title,
    content: masterFlowContent(chunk),
    canonicalUrl: isPublic ? (chunk.route || "/") : null,
    approved: isPublic ? isPublicChunk : true,
    releaseStatus: chunk.releaseStatus || null,
    allowedRoles,
    provenance: {
      generator: "master-flow-export",
      evidence: chunk.evidence || [],
    },
    sourceUpdatedAt: chunk.last_verified_at || null,
  });
}

export function reconcileMasterFlowCorpus(chunks, { corpus }) {
  const normalizedCorpus = normalizeCorpus(corpus);
  if (!Array.isArray(chunks)) throw new TypeError("chunks must be an array.");

  const accepted = [];
  const rejected = [];
  for (const chunk of chunks) {
    try {
      accepted.push(adaptMasterFlowChunk(chunk, normalizedCorpus));
    } catch (error) {
      rejected.push({
        chunkId: chunk?.chunk_id || null,
        reason: error.message,
      });
    }
  }
  return { corpus: normalizedCorpus, chunks: accepted, rejected };
}

export function buildMasterFlowCorpus(chunks, { corpus }) {
  const result = reconcileMasterFlowCorpus(chunks, { corpus });
  if (result.rejected.length > 0) {
    throw new TypeError(result.rejected[0].reason);
  }
  return result.chunks;
}

export function planCorpusRebuild(previousChunks, nextChunks, { corpus }) {
  const normalizedCorpus = normalizeCorpus(corpus);
  const assertCorpus = (chunk, collection) => {
    if (chunk?.contractVersion !== RETRIEVAL_CONTRACT_VERSION || chunk?.corpus !== normalizedCorpus) {
      throw new TypeError(`${collection} contains a chunk outside the ${normalizedCorpus} corpus contract.`);
    }
    return chunk;
  };
  const previous = new Map(
    (previousChunks || []).map((chunk) => assertCorpus(chunk, "previousChunks"))
      .map((chunk) => [chunk.chunkId, chunk])
  );
  const next = new Map(
    (nextChunks || []).map((chunk) => assertCorpus(chunk, "nextChunks"))
      .map((chunk) => [chunk.chunkId, chunk])
  );

  const upsert = [...next.values()].filter((chunk) => {
    const existing = previous.get(chunk.chunkId);
    return !existing || existing.contentHash !== chunk.contentHash;
  });
  const tombstone = [...previous.values()]
    .filter((chunk) => !next.has(chunk.chunkId))
    .map((chunk) => ({
      chunkId: chunk.chunkId,
      corpus: normalizedCorpus,
      tombstoned: true,
      reason: "source_removed_or_visibility_changed",
    }));

  return { corpus: normalizedCorpus, upsert, tombstone };
}

export function keywordSearch(chunks, query, {
  corpus,
  role = "public",
  limit = 6,
  now = new Date(),
} = {}) {
  const normalizedCorpus = normalizeCorpus(corpus);
  const normalizedRole = requiredString(role, "role").toLowerCase();
  const terms = requiredString(query, "query").toLowerCase().split(/\s+/).filter(Boolean);
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  if (Number.isNaN(nowMs)) throw new TypeError("now must be a valid timestamp or Date.");

  return (chunks || [])
    .filter((chunk) => canRetrieveChunk(chunk, {
      corpus: normalizedCorpus,
      role: normalizedRole,
      now: nowMs,
    }))
    .map((chunk) => {
      const haystack = `${chunk.title}\n${chunk.content}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { chunk, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.chunkId.localeCompare(b.chunk.chunkId))
    .slice(0, Math.max(1, Math.min(Number(limit) || 6, 25)));
}

/**
 * Re-checks a candidate returned by any retrieval adapter. Semantic ranking is
 * never an authorization decision: every adapter result must pass this same
 * corpus, role, tombstone, and expiry boundary before source-level checks run.
 */
export function canRetrieveChunk(chunk, {
  corpus,
  role = "public",
  now = new Date(),
} = {}) {
  const normalizedCorpus = normalizeCorpus(corpus);
  const normalizedRole = requiredString(role, "role").toLowerCase();
  const nowMs = typeof now === "number"
    ? now
    : now instanceof Date
      ? now.getTime()
      : Date.parse(now);
  if (Number.isNaN(nowMs)) throw new TypeError("now must be a valid timestamp or Date.");

  return Boolean(
    chunk?.contractVersion === RETRIEVAL_CONTRACT_VERSION
    && chunk.corpus === normalizedCorpus
    && chunk.tombstoned !== true
    && (!chunk.expiresAt || Date.parse(chunk.expiresAt) > nowMs)
    && (chunk.allowedRoles?.includes("public") || chunk.allowedRoles?.includes(normalizedRole))
  );
}
