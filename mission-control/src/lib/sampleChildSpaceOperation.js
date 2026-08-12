import "server-only";

import { createHash } from "node:crypto";
import { cleanSampleChildSpaces } from "./sampleChildSpacePolicy.mjs";
import { SAMPLE_PROPERTY_SLUGS, airtableOperationRequest, getAirtableOperationConfiguration } from "./sampleDataOperation";

const API = "https://api.airtable.com/v0";

export const SAMPLE_CHILD_SPACE_OPERATION = Object.freeze({
  id: "airtable.sample_child_space_cleanup.v1",
  table: "PROPERTIES_CMS",
  confirmationPhrase: "REMOVE INVALID SAMPLE SPACES",
});

async function loadRecords() {
  const config = getAirtableOperationConfiguration();
  const records = [];
  let offset = null;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    for (const field of ["Slug", "Title", "SpaceCategory", "Units_JSON"]) params.append("fields[]", field);
    if (offset) params.set("offset", offset);
    const page = await airtableOperationRequest(`${API}/${config.baseId}/${SAMPLE_CHILD_SPACE_OPERATION.table}?${params}`);
    records.push(...(page.records || []));
    offset = page.offset || null;
  } while (offset);
  return records;
}

function parseRecord(record) {
  const slug = String(record.fields?.Slug || "").trim();
  let units;
  try { units = JSON.parse(record.fields?.Units_JSON || "[]"); }
  catch { return { recordId: record.id, slug, title: record.fields?.Title || slug, parseError: true, units: [], retained: [], removed: [] }; }
  if (!Array.isArray(units)) return { recordId: record.id, slug, title: record.fields?.Title || slug, parseError: true, units: [], retained: [], removed: [] };
  const review = cleanSampleChildSpaces(units);
  return { recordId: record.id, slug, title: record.fields?.Title || slug, category: record.fields?.SpaceCategory || "", parseError: false, units, ...review };
}

function hashPlan(records) {
  const stable = records.flatMap((record) => record.removed.map((entry) => ({
    recordId: record.recordId, slug: record.slug, index: entry.index,
    id: entry.unit?.id || null, name: entry.unit?.name || "", reason: entry.reason,
  }))).sort((a, b) => `${a.slug}:${a.index}`.localeCompare(`${b.slug}:${b.index}`));
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex").toUpperCase();
}

export async function getSampleChildSpaceOperationStatus() {
  const all = await loadRecords();
  const relevant = all.filter((record) => SAMPLE_PROPERTY_SLUGS.includes(String(record.fields?.Slug || "").trim()));
  const counts = new Map();
  for (const record of relevant) counts.set(record.fields.Slug, (counts.get(record.fields.Slug) || 0) + 1);
  const missing = SAMPLE_PROPERTY_SLUGS.filter((slug) => !counts.has(slug));
  const duplicates = [...counts].filter(([, count]) => count !== 1).map(([slug]) => slug);
  const records = relevant.map(parseRecord);
  const parseErrors = records.filter((record) => record.parseError).map((record) => record.slug);
  const invalid = records.flatMap((record) => record.removed.map((entry) => ({
    recordId: record.recordId, slug: record.slug, title: record.title, category: record.category,
    index: entry.index, unitId: entry.unit?.id || null, name: entry.unit?.name || "", reason: entry.reason,
  })));
  const planHash = hashPlan(records);
  return { table: SAMPLE_CHILD_SPACE_OPERATION.table, records, invalid, missing, duplicates, parseErrors, planHash,
    canClean: invalid.length > 0 && !missing.length && !duplicates.length && !parseErrors.length };
}

export async function removeInvalidSampleChildSpaces(expectedPlanHash) {
  const before = await getSampleChildSpaceOperationStatus();
  if (!before.canClean || before.planHash !== expectedPlanHash) throw new Error("The sample child-space review changed or is blocked. Nothing was removed.");
  const updates = before.records.filter((record) => record.removed.length).map((record) => ({
    id: record.recordId, fields: { Units_JSON: JSON.stringify(record.retained) },
  }));
  const config = getAirtableOperationConfiguration();
  for (let index = 0; index < updates.length; index += 10) {
    await airtableOperationRequest(`${API}/${config.baseId}/${SAMPLE_CHILD_SPACE_OPERATION.table}`, {
      method: "PATCH", body: JSON.stringify({ records: updates.slice(index, index + 10), typecast: false }),
    });
  }
  const after = await getSampleChildSpaceOperationStatus();
  if (after.invalid.length || after.parseErrors.length) throw new Error("Airtable returned, but invalid sample child spaces remain.");
  return { before, after };
}

