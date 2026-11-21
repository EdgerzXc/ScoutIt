import { fetchWithRetry } from "@/lib/fetchWithRetry";

const AIRTABLE_BASE_URL = "https://api.airtable.com/v0";
const TABLE = "PROPERTIES_CMS";

function formulaString(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

/**
 * Mirror a verified freshness timestamp to the one public Airtable record.
 * This helper never writes Slug: Airtable's formula field is lookup-only.
 */
export async function stampAirtableFreshness({
  slug,
  recordId,
  isoDate,
  apiKey = process.env.AIRTABLE_API_KEY,
  baseId = process.env.AIRTABLE_BASE_ID,
}) {
  if (!apiKey || !baseId) return { ok: false, reason: "missing_configuration" };
  if (!slug || !/^rec[A-Za-z0-9]+$/.test(recordId || "") || !isoDate) {
    return { ok: false, reason: "missing_identity" };
  }

  try {
    const formula = `{Slug}='${formulaString(slug)}'`;
    const params = `filterByFormula=${encodeURIComponent(formula)}&maxRecords=2`;
    const findRes = await fetchWithRetry(
      `${AIRTABLE_BASE_URL}/${baseId}/${TABLE}?${params}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      { circuit: "airtable-freshness" },
    );
    if (!findRes.ok) return { ok: false, reason: "lookup_failed", status: findRes.status };

    const found = await findRes.json();
    if (!found?.records?.length) return { ok: false, reason: "record_not_found" };
    if (found.records.length !== 1 || found.records[0]?.id !== recordId) {
      return { ok: false, reason: "binding_mismatch" };
    }

    const patchRes = await fetchWithRetry(
      `${AIRTABLE_BASE_URL}/${baseId}/${TABLE}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: { Last_Verified_Date: isoDate },
          typecast: true,
        }),
      },
      { circuit: "airtable-freshness", idempotent: true },
    );
    if (!patchRes.ok) return { ok: false, reason: "patch_failed", status: patchRes.status };
    const updated = await patchRes.json();
    if (updated?.id !== recordId) return { ok: false, reason: "patch_unconfirmed" };

    return { ok: true, recordId };
  } catch (error) {
    console.error("[airtable freshness] sync failed:", error);
    return { ok: false, reason: "request_failed" };
  }
}
