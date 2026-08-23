import "server-only";

import {
  RETRIEVAL_CORPORA,
  canRetrieveChunk,
  keywordSearch,
} from "@/lib/retrieval/corpusContract";

const PUBLIC_RELEASE_STATES = new Set(["PUBLIC_LIVE", "LIMITED_LIVE"]);
const INTERNAL_ROLES = new Set(["staff", "admin", "agent", "ops_manager", "super_admin"]);
const EXTERNAL_ROLES = new Set(["public", "visitor", "seeker", "owner", "broker", "provider", "enterprise"]);
const PRICE_KEYS = new Set(["listed_price", "listedPrice", "searchPrice", "price", "price_status", "priceStatus"]);

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeRequest({ corpus, role }) {
  const normalizedCorpus = requiredString(corpus, "corpus").toLowerCase();
  const normalizedRole = requiredString(role, "role").toLowerCase();
  if (!Object.values(RETRIEVAL_CORPORA).includes(normalizedCorpus)) {
    throw new TypeError(`Unsupported retrieval corpus: ${normalizedCorpus}`);
  }
  const permittedRoles = normalizedCorpus === RETRIEVAL_CORPORA.INTERNAL ? INTERNAL_ROLES : EXTERNAL_ROLES;
  if (!permittedRoles.has(normalizedRole)) {
    throw new TypeError(`${normalizedRole} cannot retrieve the ${normalizedCorpus} corpus.`);
  }
  return { corpus: normalizedCorpus, role: normalizedRole };
}

function sourceKey(value) {
  return `${String(value?.sourceType || "").toLowerCase()}:${String(value?.sourceId || "")}`;
}

function normalizedSet(values) {
  return new Set((Array.isArray(values) ? values : values ? [values] : [])
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean));
}

function validNumber(value) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function priceNumber(source) {
  const raw = source.searchPrice ?? source.listed_price ?? source.listedPrice ?? source.price;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const match = String(raw || "").replaceAll(",", "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function distanceKm(origin, source) {
  const lat1 = validNumber(origin?.lat);
  const lon1 = validNumber(origin?.lng);
  const lat2 = validNumber(source?.lat);
  const lon2 = validNumber(source?.lng);
  if ([lat1, lon1, lat2, lon2].some((value) => value === null)) return null;
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isPublicSourceSafe(source, chunk) {
  if (source?.approved !== true || !PUBLIC_RELEASE_STATES.has(source?.releaseStatus)) return false;
  if (source.canonicalUrl !== chunk.canonicalUrl) return false;
  if (source.retrievalEligible === false) return false;

  if (String(source.sourceType || "").toLowerCase() === "property") {
    const pipeline = String(source.pipelineStatus || source.pipeline_status || "").toLowerCase();
    const lifecycle = String(source.lifecycleState || source.lifecycle_state || "").toLowerCase();
    // Match the canonical lifecycle contract: once pipeline status exists it
    // is authoritative, and a stale descriptive lifecycle mirror cannot win.
    if (pipeline ? pipeline !== "approved" : lifecycle !== "live") return false;
  }
  return true;
}

function matchesStructuredFilters(source, filters = {}) {
  const categories = normalizedSet(filters.categories);
  if (categories.size && !categories.has(String(source.category || source.spaceCategory || "").toLowerCase())) return false;

  const locations = normalizedSet(filters.locations);
  if (locations.size) {
    const sourceLocations = normalizedSet([source.city, source.location, source.region]);
    if (![...locations].some((location) => sourceLocations.has(location))) return false;
  }

  const lifecycleStates = normalizedSet(filters.lifecycleStates);
  if (lifecycleStates.size) {
    const pipeline = String(source.pipelineStatus || source.pipeline_status || "").toLowerCase();
    const lifecycle = String(source.lifecycleState || source.lifecycle_state || "").toLowerCase();
    const authoritativeState = pipeline || lifecycle;
    if (!lifecycleStates.has(authoritativeState)) return false;
  }

  if (filters.radius) {
    const maxKm = validNumber(filters.radius.km);
    const distance = distanceKm(filters.radius, source);
    if (maxKm === null || maxKm < 0 || distance === null || distance > maxKm) return false;
  }

  if (filters.priceBand) {
    const price = priceNumber(source);
    const min = validNumber(filters.priceBand.min);
    const max = validNumber(filters.priceBand.max);
    if (price === null || (min !== null && price < min) || (max !== null && price >= max)) return false;
  }

  return true;
}

function safePublicResult({ chunk, source, score, mode }) {
  const metadata = {};
  for (const [key, value] of Object.entries(source.publicMetadata || {})) {
    if (!PRICE_KEYS.has(key)) metadata[key] = value;
  }
  return Object.freeze({
    chunkId: chunk.chunkId,
    sourceId: chunk.sourceId,
    sourceType: chunk.sourceType,
    title: source.title || chunk.title,
    excerpt: chunk.content,
    canonicalUrl: chunk.canonicalUrl,
    category: source.category || source.spaceCategory || null,
    city: source.city || null,
    isSample: chunk.isSample,
    sampleDisclosure: chunk.sampleDisclosure,
    metadata,
    score,
    mode,
  });
}

function safeInternalResult({ chunk, score, mode }) {
  return Object.freeze({
    chunkId: chunk.chunkId,
    sourceId: chunk.sourceId,
    sourceType: chunk.sourceType,
    title: chunk.title,
    content: chunk.content,
    provenance: chunk.provenance,
    reviewedAt: chunk.reviewedAt,
    expiresAt: chunk.expiresAt,
    score,
    mode,
  });
}

async function vetCandidates(candidates, context) {
  const output = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const chunk = candidate?.chunk;
    if (!canRetrieveChunk(chunk, context)) continue;
    if (seen.has(chunk.chunkId)) continue;

    const source = context.sources.get(sourceKey(chunk));
    if (!source) continue;
    if (context.corpus === RETRIEVAL_CORPORA.PUBLIC && !isPublicSourceSafe(source, chunk)) continue;
    if (!matchesStructuredFilters(source, context.filters)) continue;

    const decision = await context.authorizeSource({
      corpus: context.corpus,
      role: context.role,
      chunk,
      source,
    });
    if (decision !== true) continue;

    seen.add(chunk.chunkId);
    output.push(context.corpus === RETRIEVAL_CORPORA.PUBLIC
      ? safePublicResult({ chunk, source, score: candidate.score, mode: context.mode })
      : safeInternalResult({ chunk, score: candidate.score, mode: context.mode }));
    if (output.length >= context.limit) break;
  }
  return output;
}

/**
 * Local fixture coordinator for F-001. A future persistence adapter may supply
 * ranked database rows, but it cannot bypass this post-ranking authorization.
 * No route, embedding provider, or database connection is opened here.
 */
export async function coordinateFixtureRetrieval({
  corpus,
  role,
  query,
  semanticCandidates = [],
  fallbackChunks = [],
  sourceSnapshots = [],
  filters = {},
  authorizeSource,
  limit = 6,
  now = new Date(),
} = {}) {
  const request = normalizeRequest({ corpus, role });
  requiredString(query, "query");
  if (typeof authorizeSource !== "function") {
    throw new TypeError("authorizeSource must be a server-owned entitlement function.");
  }
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 6, 25));
  const sources = new Map(sourceSnapshots.map((source) => [sourceKey(source), source]));
  if (sources.size !== sourceSnapshots.length) {
    throw new TypeError("sourceSnapshots must have unique sourceType/sourceId identities.");
  }

  const baseContext = { ...request, now, filters, authorizeSource, limit: boundedLimit, sources };
  const semantic = await vetCandidates(semanticCandidates, { ...baseContext, mode: "semantic" });
  if (semantic.length) return Object.freeze({ mode: "semantic", results: semantic });

  const keywordCandidates = keywordSearch(fallbackChunks, query, {
    corpus: request.corpus,
    role: request.role,
    limit: 25,
    now,
  });
  const keyword = await vetCandidates(keywordCandidates, { ...baseContext, mode: "keyword" });
  return Object.freeze({ mode: keyword.length ? "keyword" : "empty", results: keyword });
}
