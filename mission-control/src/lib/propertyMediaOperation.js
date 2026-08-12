import "server-only";

import { createHash } from "node:crypto";
import { classifyPropertyMedia } from "./propertyMediaPolicy.mjs";
import {
  airtableOperationRequest,
  getAirtableOperationConfiguration,
  loadPropertyCmsTableSchema,
} from "./sampleDataOperation";

const API = "https://api.airtable.com/v0";
const MEDIA_FIELDS = Object.freeze({
  Video_URL: "youtube",
  Virtual_Tour_URL: "matterport",
  Luma_3D_Map_URL: "luma",
  Drone_Heatmap_URL: "image",
});

export const PROPERTY_MEDIA_OPERATION = Object.freeze({
  id: "airtable.property_media_review.v1",
  table: "PROPERTIES_CMS",
  cleanupConfirmation: "CLEAR INVALID MEDIA FIELDS",
  attestConfirmation: "ATTEST RETAINED MEDIA URLS",
});

async function loadMediaRecords(tableId) {
  const config = getAirtableOperationConfiguration();
  const records = [];
  let offset = null;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    for (const field of ["Slug", "Title", "Approved_For_ScoutIt", ...Object.keys(MEDIA_FIELDS)]) params.append("fields[]", field);
    if (offset) params.set("offset", offset);
    const page = await airtableOperationRequest(`${API}/${config.baseId}/${tableId}?${params}`);
    records.push(...(page.records || []));
    offset = page.offset || null;
  } while (offset);
  return records;
}

async function loadMediaTable() {
  try {
    return await loadPropertyCmsTableSchema();
  } catch (error) {
    // The current Airtable token can read/write records but may deliberately
    // lack schema.bases:read. Fixed field reads below still fail closed on a
    // missing/renamed field, so the operation remains drift-safe without
    // requiring broader token authority.
    console.warn("Property media schema metadata unavailable; using the fixed table contract.", error.message);
    return {
      id: PROPERTY_MEDIA_OPERATION.table,
      name: PROPERTY_MEDIA_OPERATION.table,
      fields: Object.keys(MEDIA_FIELDS).map((name) => ({ name })),
    };
  }
}

function reviewEntries(records) {
  const entries = [];
  for (const record of records) {
    for (const [field, expectedKind] of Object.entries(MEDIA_FIELDS)) {
      const value = record.fields?.[field];
      if (!value) continue;
      const classification = classifyPropertyMedia(value);
      entries.push({
        recordId: record.id,
        slug: record.fields?.Slug || "",
        title: record.fields?.Title || "Untitled property",
        approved: record.fields?.Approved_For_ScoutIt === true,
        field,
        value: String(value),
        expectedKind,
        actualKind: classification.kind,
        safe: classification.kind === expectedKind,
      });
    }
  }
  return entries;
}

function planHash(entries) {
  const stable = entries.map(({ recordId, field, value, expectedKind, actualKind, safe }) => ({ recordId, field, value, expectedKind, actualKind, safe }))
    .sort((a, b) => `${a.recordId}:${a.field}`.localeCompare(`${b.recordId}:${b.field}`));
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex").toUpperCase();
}

export async function getPropertyMediaOperationStatus() {
  const table = await loadMediaTable();
  const missingFields = Object.keys(MEDIA_FIELDS).filter((name) => !(table.fields || []).some((field) => field.name === name));
  if (missingFields.length) {
    return { table: { id: table.id, name: table.name }, missingFields, entries: [], unsafe: [], retained: [], planHash: null, canClean: false, canAttest: false };
  }
  const entries = reviewEntries(await loadMediaRecords(table.id));
  const unsafe = entries.filter((entry) => !entry.safe);
  const retained = entries.filter((entry) => entry.safe);
  return {
    table: { id: table.id, name: table.name }, missingFields: [], entries, unsafe, retained,
    planHash: planHash(entries), canClean: unsafe.length > 0, canAttest: unsafe.length === 0 && retained.length > 0,
  };
}

export async function clearInvalidPropertyMedia(expectedPlanHash) {
  const before = await getPropertyMediaOperationStatus();
  if (!before.canClean || !before.planHash || before.planHash !== expectedPlanHash) {
    throw new Error("The media review changed or has no invalid values. Nothing was cleared.");
  }
  const updates = new Map();
  for (const entry of before.unsafe) {
    const fields = updates.get(entry.recordId) || {};
    fields[entry.field] = null;
    updates.set(entry.recordId, fields);
  }
  const records = [...updates.entries()].map(([id, fields]) => ({ id, fields }));
  const config = getAirtableOperationConfiguration();
  for (let index = 0; index < records.length; index += 10) {
    await airtableOperationRequest(`${API}/${config.baseId}/${before.table.id}`, {
      method: "PATCH",
      body: JSON.stringify({ records: records.slice(index, index + 10), typecast: false }),
    });
  }
  const after = await getPropertyMediaOperationStatus();
  if (after.unsafe.length) throw new Error("Airtable returned, but invalid media values remain.");
  return { before, after };
}
