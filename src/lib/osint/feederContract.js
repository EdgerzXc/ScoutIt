import { createHash } from "node:crypto";

import { createRetrievalChunk } from "@/lib/retrieval/corpusContract";

export const OSINT_FEEDER_CONTRACT_VERSION = "1.0.0";
export const OSINT_REVIEW_STATES = Object.freeze({
  PENDING: "pending_review",
  QUARANTINED: "quarantined",
});

const REQUIRED_PERSISTENCE_COLUMNS = Object.freeze([
  "adapter_id",
  "adapter_version",
  "captured_at",
  "content_hash",
  "external_id",
  "review_state",
  "source_published_at",
]);
const REGISTERED_ADAPTERS = new WeakSet();

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function isoTimestamp(value, field) {
  const timestamp = requiredString(value, field);
  const milliseconds = Date.parse(timestamp);
  if (Number.isNaN(milliseconds)) {
    throw new TypeError(`${field} must be a valid timestamp.`);
  }
  return new Date(milliseconds).toISOString();
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalSourceUrl(value, adapter) {
  const parsed = new URL(requiredString(value, "sourceUrl"));
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new TypeError("sourceUrl must be a credential-free HTTPS URL.");
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowed = adapter.allowedHosts.some((host) => (
    hostname === host || hostname.endsWith(`.${host}`)
  ));
  if (!allowed) {
    throw new TypeError(`sourceUrl host is outside adapter ${adapter.id}'s allowlist.`);
  }
  if (adapter.isSample && !hostname.endsWith(".example")) {
    throw new TypeError("Fixture adapters may only use reserved .example source URLs.");
  }

  parsed.hash = "";
  parsed.hostname = hostname;
  parsed.searchParams.sort();
  return parsed.toString();
}

function normalizeGeography(value) {
  const city = requiredString(value?.city, "geography.city");
  const region = requiredString(value?.region, "geography.region");
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new TypeError("geography.lat must be between -90 and 90.");
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new TypeError("geography.lng must be between -180 and 180.");
  }
  return Object.freeze({ city, region, lat, lng });
}

function normalizeSignal(item, adapter, capturedAt) {
  const externalId = requiredString(item?.externalId, "externalId");
  const title = requiredString(item?.title, "title").replace(/\s+/g, " ");
  const content = requiredString(item?.content, "content").replace(/\s+/g, " ");
  const sourceUrl = canonicalSourceUrl(item?.sourceUrl, adapter);
  const sourcePublishedAt = isoTimestamp(item?.sourcePublishedAt, "sourcePublishedAt");
  const geography = normalizeGeography(item?.geography);
  const signalId = sha256(`${adapter.id}\n${externalId}\n${sourceUrl}`);
  const contentHash = sha256(`${title}\n${content}`);

  return Object.freeze({
    contractVersion: OSINT_FEEDER_CONTRACT_VERSION,
    signalId,
    externalId,
    publisher: adapter.publisher,
    title,
    content,
    sourceUrl,
    sourcePublishedAt,
    capturedAt,
    contentHash,
    geography,
    reviewState: OSINT_REVIEW_STATES.PENDING,
    adapter: Object.freeze({ id: adapter.id, version: adapter.version }),
    isSample: adapter.isSample,
    sampleDisclosure: adapter.sampleDisclosure,
    revision: 1,
  });
}

export function createOsintSourceAdapter(input) {
  const id = requiredString(input?.id, "adapter.id");
  const version = requiredString(input?.version, "adapter.version");
  const publisher = requiredString(input?.publisher, "adapter.publisher");
  const publisherKind = requiredString(input?.publisherKind, "adapter.publisherKind");
  const isSample = input?.isSample === true;
  const sampleDisclosure = input?.sampleDisclosure?.trim() || null;
  const allowedHosts = [...new Set((input?.allowedHosts || [])
    .map((host) => String(host).trim().toLowerCase())
    .filter(Boolean))];

  if (typeof input?.fetchSignals !== "function") {
    throw new TypeError("adapter.fetchSignals must be a function.");
  }
  if (allowedHosts.length === 0) {
    throw new TypeError("adapter.allowedHosts must contain at least one host.");
  }
  if (isSample && publisherKind !== "invented_fixture") {
    throw new TypeError("Fixture adapters require publisherKind invented_fixture.");
  }
  if (isSample && (!sampleDisclosure || !/sample|fictional|invented/i.test(sampleDisclosure))) {
    throw new TypeError("Fixture adapters require an explicit sample disclosure.");
  }
  if (isSample && allowedHosts.some((host) => !host.endsWith(".example"))) {
    throw new TypeError("Fixture adapters may only allow reserved .example hosts.");
  }

  const adapter = Object.freeze({
    id,
    version,
    publisher,
    publisherKind,
    allowedHosts: Object.freeze(allowedHosts),
    isSample,
    sampleDisclosure,
    fetchSignals: input.fetchSignals,
  });
  REGISTERED_ADAPTERS.add(adapter);
  return adapter;
}

function quarantine(item, adapter, reason, index) {
  return Object.freeze({
    contractVersion: OSINT_FEEDER_CONTRACT_VERSION,
    adapter: Object.freeze({ id: adapter.id, version: adapter.version }),
    externalId: typeof item?.externalId === "string" ? item.externalId.trim() || null : null,
    reviewState: OSINT_REVIEW_STATES.QUARANTINED,
    reason,
    itemIndex: index,
  });
}

function dryRunResult(status, adapter, values = {}) {
  return Object.freeze({
    contractVersion: OSINT_FEEDER_CONTRACT_VERSION,
    mode: "fixture_dry_run",
    status,
    adapter: Object.freeze({ id: adapter.id, version: adapter.version }),
    accepted: Object.freeze(values.accepted || []),
    unchanged: Object.freeze(values.unchanged || []),
    quarantined: Object.freeze(values.quarantined || []),
    failures: Object.freeze(values.failures || []),
    persistence: Object.freeze({
      writes: 0,
      ready: false,
      missingColumns: REQUIRED_PERSISTENCE_COLUMNS,
    }),
  });
}

export async function runOsintFixtureDryRun({
  adapter,
  existingSignals = [],
  now = new Date(),
} = {}) {
  if (!REGISTERED_ADAPTERS.has(adapter) || !adapter.isSample) {
    throw new TypeError("Only explicit fixture adapters may use the local dry-run runner.");
  }
  const capturedAt = isoTimestamp(
    now instanceof Date ? now.toISOString() : String(now),
    "now"
  );

  let fetched;
  try {
    fetched = await adapter.fetchSignals({ dryRun: true, capturedAt });
  } catch (error) {
    return dryRunResult("error", adapter, {
      failures: [{ stage: "adapter_fetch", reason: error instanceof Error ? error.message : "Unknown adapter error." }],
    });
  }
  if (!Array.isArray(fetched)) {
    return dryRunResult("error", adapter, {
      failures: [{ stage: "adapter_fetch", reason: "Adapter output must be an array." }],
    });
  }
  if (fetched.length === 0) return dryRunResult("empty", adapter);

  const accepted = [];
  const unchanged = [];
  const quarantined = [];
  const existingById = new Map(existingSignals
    .filter((signal) => signal?.signalId)
    .map((signal) => [signal.signalId, signal]));
  const knownContent = new Map(existingSignals
    .filter((signal) => signal?.contentHash && signal?.signalId)
    .map((signal) => [signal.contentHash, signal.signalId]));
  const batchIds = new Set();

  fetched.forEach((item, index) => {
    let signal;
    try {
      signal = normalizeSignal(item, adapter, capturedAt);
    } catch (error) {
      quarantined.push(quarantine(item, adapter, error.message, index));
      return;
    }

    if (batchIds.has(signal.signalId)) {
      quarantined.push(quarantine(item, adapter, "Duplicate signal identity in adapter batch.", index));
      return;
    }
    batchIds.add(signal.signalId);

    const prior = existingById.get(signal.signalId);
    if (prior?.contentHash === signal.contentHash) {
      unchanged.push(Object.freeze({ signalId: signal.signalId, contentHash: signal.contentHash }));
      return;
    }
    const contentOwner = knownContent.get(signal.contentHash);
    if (contentOwner && contentOwner !== signal.signalId) {
      quarantined.push(quarantine(item, adapter, "Duplicate content belongs to another signal identity.", index));
      return;
    }

    const revision = prior ? Number(prior.revision || 1) + 1 : 1;
    const acceptedSignal = Object.freeze({ ...signal, revision });
    accepted.push(acceptedSignal);
    knownContent.set(signal.contentHash, signal.signalId);
  });

  const status = accepted.length > 0
    ? "ready_for_review"
    : quarantined.length > 0
      ? "quarantine_only"
      : "unchanged";
  return dryRunResult(status, adapter, { accepted, unchanged, quarantined });
}

export function buildInternalOsintRetrievalChunks(signals, { allowedRoles = ["staff", "admin"] } = {}) {
  if (!Array.isArray(signals)) throw new TypeError("signals must be an array.");

  return signals.map((signal) => {
    if (signal?.contractVersion !== OSINT_FEEDER_CONTRACT_VERSION) {
      throw new TypeError("Signal is outside the current OSINT feeder contract.");
    }
    if (signal.reviewState !== OSINT_REVIEW_STATES.PENDING) {
      throw new TypeError("Only pending-review OSINT signals can enter the internal corpus.");
    }
    return createRetrievalChunk({
      corpus: "internal",
      sourceSystem: "scoutit_osint_feeder",
      sourceType: "raw_osint_signal",
      sourceId: signal.signalId,
      chunkKey: `revision-${signal.revision}`,
      sourceVersion: `${signal.adapter.id}@${signal.adapter.version}`,
      title: signal.title,
      content: signal.content,
      canonicalUrl: signal.sourceUrl,
      allowedRoles,
      isSample: signal.isSample,
      sampleDisclosure: signal.sampleDisclosure,
      provenance: {
        publisher: signal.publisher,
        externalId: signal.externalId,
        sourceUrl: signal.sourceUrl,
        sourcePublishedAt: signal.sourcePublishedAt,
        capturedAt: signal.capturedAt,
        contentHash: signal.contentHash,
        geography: signal.geography,
        reviewState: signal.reviewState,
        adapter: signal.adapter,
      },
      sourceUpdatedAt: signal.capturedAt,
    });
  });
}
