"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";

const REQUIRED_COLUMNS = ["title", "type", "location"];
const VALID_CATEGORIES = new Set(["residential", "commercial", "str", "hospitality", "restaurants", "venues"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORBIDDEN_DETAIL_KEYS = new Set(["__proto__", "constructor", "prototype", "Owner_Ref", "Pipeline_Status"]);
const MAX_CSV_BYTES = 2 * 1024 * 1024;
const MAX_CSV_ROWS = 500;

function sanitizeFormulaInjection(value) {
  if (typeof value !== "string") return value;
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function parseCurrencyPrice(raw) {
  const str = raw?.toString().trim();
  if (!str) return { value: null, valid: true };
  const cleaned = str.replace(/^(?:PHP|USD|EUR|₱|\$)\s*/i, "").replace(/,/g, "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return { value: null, valid: false };
  }
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) {
    return { value: null, valid: false };
  }
  return { value: num, valid: true };
}

function isSafeHttpUrl(raw) {
  const str = raw?.toString().trim();
  if (!str) return null;
  try {
    const u = new URL(str);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function parseRowDetails(row) {
  const details = {};
  if (row.details?.toString().trim()) {
    let parsedDetails;
    try {
      parsedDetails = JSON.parse(row.details.toString().trim());
    } catch {
      return { error: "Invalid JSON in details column" };
    }
    if (!parsedDetails || typeof parsedDetails !== "object" || Array.isArray(parsedDetails)) {
      return { error: "details column must be a JSON object" };
    }
    for (const [k, v] of Object.entries(parsedDetails)) {
      if (FORBIDDEN_DETAIL_KEYS.has(k)) continue;
      Object.defineProperty(details, k, {
        value: v,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  }
  const numericFields = ["floor_sqm", "lot_sqm", "beds", "baths", "parking", "year_built", "rental_rate"];
  for (const field of numericFields) {
    const raw = row[field]?.toString().trim();
    if (!raw) continue;
    const { value, valid } = parseCurrencyPrice(raw);
    if (valid && value !== null) details[field] = value;
  }
  const textFields = ["price_status", "furnishing", "tenure", "title_status"];
  for (const field of textFields) {
    const raw = row[field]?.toString().trim();
    if (raw) details[field] = raw.slice(0, 200);
  }
  return { details };
}

/**
 * Bulk-imports a CSV of properties as pending rows in the Review Queue.
 * Shaped for React's useActionState — first arg is the previous state,
 * unused here beyond the signature.
 * @param {unknown} _prevState
 * @param {FormData} formData
 */
export async function importPropertiesCsv(_prevState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const file = formData.get("file");
  if (!file || typeof file === "string" || file.size === 0) {
    return { success: false, error: "Choose a CSV file first." };
  }
  if (file.size > MAX_CSV_BYTES) {
    return { success: false, error: "CSV file exceeds the 2 MB maximum size limit." };
  }

  const text = await file.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

  if (parsed.errors?.length) {
    const first = parsed.errors[0];
    return {
      success: false,
      error: `Couldn't parse that CSV (row ${first.row ?? "?"}).`,
    };
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return { success: false, error: "That CSV has no data rows." };
  }
  if (rows.length > MAX_CSV_ROWS) {
    return { success: false, error: `CSV exceeds the maximum limit of ${MAX_CSV_ROWS} rows per batch.` };
  }

  const toInsert = [];
  const failedRows = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const missing = REQUIRED_COLUMNS.filter((col) => !row[col]?.toString().trim());
    if (missing.length > 0) {
      failedRows.push({ row: rowNum, reason: `Missing ${missing.join(", ")}` });
      return;
    }

    const rawCategory = (row.space_category ?? row.type)?.toString().trim().toLowerCase();
    const spaceCategory = rawCategory && VALID_CATEGORIES.has(rawCategory) ? rawCategory : null;
    if (row.space_category?.toString().trim() && !spaceCategory) {
      failedRows.push({ row: rowNum, reason: `Unsupported space_category "${row.space_category}"` });
      return;
    }

    const parsedPrice = parseCurrencyPrice(row.price);
    if (!parsedPrice.valid) {
      failedRows.push({ row: rowNum, reason: "Invalid price format" });
      return;
    }

    const rawOwnerId = row.owner_id?.toString().trim() || null;
    if (rawOwnerId && !UUID_RE.test(rawOwnerId)) {
      failedRows.push({ row: rowNum, reason: "Invalid owner_id UUID" });
      return;
    }

    const safeMediaLink = isSafeHttpUrl(row.media_link);
    if (safeMediaLink === undefined) {
      failedRows.push({ row: rowNum, reason: "Invalid media_link URL scheme (must be http/https)" });
      return;
    }

    const parsedDetails = parseRowDetails(row);
    if (parsedDetails.error) {
      failedRows.push({ row: rowNum, reason: parsedDetails.error });
      return;
    }

    toInsert.push({
      title: row.title.trim().slice(0, 300),
      type: row.type.trim().slice(0, 100),
      ...(spaceCategory ? { space_category: spaceCategory } : {}),
      location: row.location.trim().slice(0, 500),
      price: parsedPrice.value,
      description: row.description?.toString().trim().slice(0, 5000) || null,
      media_link: safeMediaLink,
      owner_id: rawOwnerId,
      ...(Object.keys(parsedDetails.details).length > 0 ? { details: parsedDetails.details } : {}),
      moderation_status: "pending",
      pipeline_status: "pending",
      lifecycle_state: "draft",
    });
  });

  let insertedCount = 0;
  if (toInsert.length > 0) {
    const admin = createAdminClient();
    const { data, error } = await admin.from("properties").insert(toInsert).select("id");
    if (error) {
      return { success: false, error: "Bulk import insert failed." };
    }
    insertedCount = data?.length ?? 0;
  }

  await logActionStrict({
    staff,
    action: "property.bulk_import",
    targetTable: "properties",
    targetId: "batch",
    metadata: {
      filename: sanitizeFormulaInjection(file.name),
      totalRows: rows.length,
      inserted: insertedCount,
      failed: failedRows.length,
    },
  });

  revalidatePath("/dashboard/cms");

  return {
    success: true,
    totalRows: rows.length,
    inserted: insertedCount,
    failedRows,
  };
}
