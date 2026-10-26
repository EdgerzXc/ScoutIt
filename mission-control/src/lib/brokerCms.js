/**
 * Airtable BROKERS_CMS integration for Mission Control (A-256).
 * Manages listing, suspension/takedown, and PRC license verification for public brokers.
 */

const BASE_URL = "https://api.airtable.com/v0";
const BROKERS_TABLE = "BROKERS_CMS";

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
    const res = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Airtable BROKERS_CMS fetch failed: ${res.status} ${errText}`);
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

  const url = `${BASE_URL}/${baseId}/${BROKERS_TABLE}/${recordId}`;
  const res = await fetchImpl(url, {
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
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Airtable broker status update failed: ${res.status} ${errText}`);
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

  const url = `${BASE_URL}/${baseId}/${BROKERS_TABLE}/${recordId}`;
  const res = await fetchImpl(url, {
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
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Airtable broker PRC update failed: ${res.status} ${errText}`);
  }

  const cache = await runPurgeCache(purgeCacheFn);
  return { recordId, isVerified: Boolean(isVerified), cache };
}
