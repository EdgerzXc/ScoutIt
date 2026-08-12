import "server-only";

const AIRTABLE_API = "https://api.airtable.com/v0";
const AIRTABLE_META_API = `${AIRTABLE_API}/meta`;
const TABLE_NAME = "PROPERTIES_CMS";
const FIELD_NAME = "Is_Sample";

export const SAMPLE_PROPERTY_SLUGS = Object.freeze([
  "corner-unit-poblacion-strip",
  "cyber-sigma-tower-3",
  "one-ecom-center",
  "sea-breeze-loft-boracay-station-2",
  "the-foundry-warehouse-district-bgc",
  "the-meridian-hotel-cebu-it-park",
  "the-ridgeline-at-capitol-commons",
]);

export const SAMPLE_DATA_OPERATION = Object.freeze({
  id: "airtable.sample_inventory_contract.v1",
  table: TABLE_NAME,
  field: FIELD_NAME,
  createConfirmation: "CREATE IS SAMPLE FIELD",
  markConfirmation: "MARK SEVEN SAMPLE LISTINGS",
});

export function getAirtableOperationConfiguration() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  return {
    ready: Boolean(apiKey && baseId),
    apiKey,
    baseId,
    missing: [!apiKey ? "AIRTABLE_API_KEY" : null, !baseId ? "AIRTABLE_BASE_ID" : null].filter(Boolean),
  };
}

export async function airtableOperationRequest(url, options = {}) {
  const config = getAirtableOperationConfiguration();
  if (!config.ready) {
    throw new Error(`Mission Control Airtable operations are not configured: ${config.missing.join(", ")}.`);
  }
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Airtable rejected the fixed sample-data operation (HTTP ${response.status}).`);
  }
  return body;
}

export async function loadPropertyCmsTableSchema() {
  const config = getAirtableOperationConfiguration();
  const schema = await airtableOperationRequest(`${AIRTABLE_META_API}/bases/${config.baseId}/tables`);
  const matches = (schema.tables || []).filter((table) => table.name === TABLE_NAME);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${TABLE_NAME} table; found ${matches.length}.`);
  }
  return matches[0];
}

async function loadCatalog(tableId) {
  const config = getAirtableOperationConfiguration();
  const records = [];
  let offset = null;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    params.append("fields[]", "Slug");
    params.append("fields[]", "Title");
    params.append("fields[]", FIELD_NAME);
    if (offset) params.set("offset", offset);
    const page = await airtableOperationRequest(`${AIRTABLE_API}/${config.baseId}/${tableId}?${params}`);
    records.push(...(page.records || []));
    offset = page.offset || null;
  } while (offset);
  return records;
}

function classifyField(table) {
  const fields = (table.fields || []).filter((field) => field.name === FIELD_NAME);
  if (!fields.length) return { state: "missing", field: null };
  if (fields.length !== 1 || fields[0].type !== "checkbox") {
    return { state: "drift", field: fields[0] || null };
  }
  return { state: "ready", field: fields[0] };
}

function classifySamples(records) {
  const bySlug = new Map();
  for (const record of records) {
    const slug = String(record.fields?.Slug || "").trim();
    if (!SAMPLE_PROPERTY_SLUGS.includes(slug)) continue;
    const entries = bySlug.get(slug) || [];
    entries.push(record);
    bySlug.set(slug, entries);
  }
  const missing = SAMPLE_PROPERTY_SLUGS.filter((slug) => !bySlug.has(slug));
  const duplicates = [...bySlug.entries()].filter(([, entries]) => entries.length !== 1).map(([slug]) => slug);
  const matched = SAMPLE_PROPERTY_SLUGS.flatMap((slug) => bySlug.get(slug) || []);
  const marked = matched.filter((record) => record.fields?.[FIELD_NAME] === true);
  return { missing, duplicates, matched, marked, allMarked: marked.length === SAMPLE_PROPERTY_SLUGS.length };
}

export async function getSampleDataOperationStatus() {
  const config = getAirtableOperationConfiguration();
  if (!config.ready) {
    return { configuration: config, field: null, samples: null, canCreateField: false, canMarkSamples: false };
  }
  const table = await loadPropertyCmsTableSchema();
  const field = classifyField(table);
  const records = field.state === "ready" ? await loadCatalog(table.id) : [];
  const samples = field.state === "ready" ? classifySamples(records) : null;
  return {
    configuration: { ready: true, missing: [] },
    table: { id: table.id, name: table.name },
    field,
    samples,
    canCreateField: field.state === "missing",
    canMarkSamples: field.state === "ready" && !samples.missing.length && !samples.duplicates.length && !samples.allMarked,
  };
}

export async function createSampleCheckboxField() {
  const before = await getSampleDataOperationStatus();
  if (!before.canCreateField) throw new Error("The fixed field-create preflight is not green.");
  const config = getAirtableOperationConfiguration();
  await airtableOperationRequest(`${AIRTABLE_META_API}/bases/${config.baseId}/tables/${before.table.id}/fields`, {
    method: "POST",
    body: JSON.stringify({ name: FIELD_NAME, type: "checkbox", options: { icon: "check", color: "greenBright" } }),
  });
  const after = await getSampleDataOperationStatus();
  if (after.field?.state !== "ready") throw new Error("Airtable returned, but the checkbox field did not verify.");
  return after;
}

export async function markSevenSampleListings() {
  const before = await getSampleDataOperationStatus();
  if (!before.canMarkSamples) throw new Error("The fixed sample-marking preflight is not green.");
  const config = getAirtableOperationConfiguration();
  await airtableOperationRequest(`${AIRTABLE_API}/${config.baseId}/${before.table.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: before.samples.matched.map((record) => ({ id: record.id, fields: { [FIELD_NAME]: true } })),
      typecast: false,
    }),
  });
  const after = await getSampleDataOperationStatus();
  if (!after.samples?.allMarked) throw new Error("Airtable returned, but all seven sample records did not verify.");
  return after;
}
