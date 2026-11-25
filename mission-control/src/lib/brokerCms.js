/**
 * Airtable BROKERS_CMS integration for Mission Control (A-256).
 * Manages listing, suspension/takedown, and PRC license verification for public brokers.
 */

const BASE_URL = "https://api.airtable.com/v0";
const BROKERS_TABLE = "BROKERS_CMS";
const AIRTABLE_RECORD_ID_RE = /^rec[a-zA-Z0-9]{14}$/;
const AIRTABLE_TIMEOUT_MS = 12000;
const AIRTABLE_MAX_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function airtableBrokerFetch(url, options = {}, fetchImpl = fetch) {
  let lastResponse = null;
  let lastError = null;
  for (let attempt = 0; attempt <= AIRTABLE_MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetchImpl(url, {
        ...options,
        signal: AbortSignal.timeout(AIRTABLE_TIMEOUT_MS),
      });
      if (res.status !== 429 && res.status < 500) {
        return res;
      }
      lastResponse = res;
      if (attempt < AIRTABLE_MAX_RETRIES) {
        const retryAfter = Number(res.headers?.get?.("retry-after"));
        const delayMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 2000)
            : 250 * 2 ** attempt;
        await sleep(delayMs);
      }
    } catch (err) {
      lastError = err;
      if (attempt < AIRTABLE_MAX_RETRIES) {
        await sleep(250 * 2 ** attempt);
      }
    }
  }
  if (lastResponse) return lastResponse;
  throw lastError || new Error("Airtable BROKERS_CMS request failed.");
}

async function runPurgeCache(cacheFn) {
  if (typeof cacheFn === "function") return cacheFn();
  try {
    const mod = await import("./publicCatalogueCache.js");
    return await mod.purgePublicCatalogueCache();
  } catch {
    return { purged: false, detail: "Public catalogue cache purger not available in this environment" };
  }
}

/**
 * Fetch all records from BROKERS_CMS (both live and suspended).
 *
 * @param {string} apiKey
 * @param {string} baseId
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<Array<object>>}
 */
export async function fetchAirtableBrokers(apiKey, baseId, fetchImpl = fetch) {
  if (!apiKey || !baseId) throw new Error("fetchAirtableBrokers: missing Airtable credentials");

  const records = [];
  let offset = null;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);

    const url = `${BASE_URL}/${baseId}/${BROKERS_TABLE}?${params.toString()}`;
    const res = await airtableBrokerFetch(
      url,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      fetchImpl
    );

    if (!res.ok) {
      await res.text().catch(() => "");
      throw new Error(`Airtable BROKERS_CMS fetch failed (HTTP ${res.status}).`);
    }

    const data = await res.json();
    if (Array.isArray(data.records)) {
      records.push(...data.records);
    }
    offset = data.offset || null;
  } while (offset);

  return records;
}

/**
 * Toggle the Approved_For_Live_Site status on a broker record in BROKERS_CMS.
 * When set to false, takes down the broker from the public directory.
 *
 * @param {object} params
 * @param {string} params.apiKey
 * @param {string} params.baseId
 * @param {string} params.recordId
 * @param {boolean} params.isLive
 * @param {typeof fetch} [params.fetchImpl]
 * @param {Function} [params.purgeCacheFn]
 * @returns {Promise<{ recordId: string, isLive: boolean, cache: any }>}
 */
export async function setBrokerLiveStateInAirtable({
  apiKey,
  baseId,
  recordId,
  isLive,
  fetchImpl = fetch,
  purgeCacheFn,
}) {
  if (!apiKey || !baseId) throw new Error("setBrokerLiveState: missing Airtable credentials");
  if (!recordId) throw new Error("setBrokerLiveState: missing recordId");
  if (typeof recordId !== "string" || !AIRTABLE_RECORD_ID_RE.test(recordId)) {
    throw new Error("setBrokerLiveState: invalid Airtable recordId format");
  }

  const url = `${BASE_URL}/${baseId}/${BROKERS_TABLE}/${recordId}`;
  const res = await airtableBrokerFetch(
    url,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Approved_For_Live_Site: Boolean(isLive),
        },
      }),
    },
    fetchImpl
  );

  if (!res.ok) {
    await res.text().catch(() => "");
    throw new Error(`Airtable broker status update failed (HTTP ${res.status}).`);
  }

  const cache = await runPurgeCache(purgeCacheFn);
  return { recordId, isLive: Boolean(isLive), cache };
}

/**
 * Update PRC license verification in Airtable BROKERS_CMS.
 *
 * @param {object} params
 * @param {string} params.apiKey
 * @param {string} params.baseId
 * @param {string} params.recordId
 * @param {boolean} params.isVerified
 * @param {typeof fetch} [params.fetchImpl]
 * @param {Function} [params.purgeCacheFn]
 * @returns {Promise<{ recordId: string, isVerified: boolean, cache: any }>}
 */
export async function setBrokerLicenseVerifiedInAirtable({
  apiKey,
  baseId,
  recordId,
  isVerified,
  fetchImpl = fetch,
  purgeCacheFn,
}) {
  if (!apiKey || !baseId) throw new Error("setBrokerLicenseVerified: missing Airtable credentials");
  if (!recordId) throw new Error("setBrokerLicenseVerified: missing recordId");
  if (typeof recordId !== "string" || !AIRTABLE_RECORD_ID_RE.test(recordId)) {
    throw new Error("setBrokerLicenseVerified: invalid Airtable recordId format");
  }

  const url = `${BASE_URL}/${baseId}/${BROKERS_TABLE}/${recordId}`;
  const res = await airtableBrokerFetch(
    url,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          License_Verified: Boolean(isVerified),
        },
      }),
    },
    fetchImpl
  );

  if (!res.ok) {
    await res.text().catch(() => "");
    throw new Error(`Airtable broker PRC update failed (HTTP ${res.status}).`);
  }

  const cache = await runPurgeCache(purgeCacheFn);
  return { recordId, isVerified: Boolean(isVerified), cache };
}
