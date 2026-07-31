"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";

const REQUIRED_COLUMNS = ["title", "type", "location"];

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

  const text = await file.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

  if (parsed.errors?.length) {
    const first = parsed.errors[0];
    return {
      success: false,
      error: `Couldn't parse that CSV: ${first.message} (row ${first.row ?? "?"}).`,
    };
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return { success: false, error: "That CSV has no data rows." };
  }

  const toInsert = [];
  const failedRows = [];

  rows.forEach((row, index) => {
    const missing = REQUIRED_COLUMNS.filter((col) => !row[col]?.toString().trim());
    if (missing.length > 0) {
      failedRows.push({ row: index + 2, reason: `Missing ${missing.join(", ")}` });
      return;
    }
    toInsert.push({
      title: row.title.trim(),
      type: row.type.trim(),
      location: row.location.trim(),
      price: row.price?.toString().trim() ? Number(row.price) || null : null,
      description: row.description?.toString().trim() || null,
      media_link: row.media_link?.toString().trim() || null,
      owner_id: row.owner_id?.toString().trim() || null,
      moderation_status: "pending",
    });
  });

  let insertedCount = 0;
  if (toInsert.length > 0) {
    const admin = createAdminClient();
    const { data, error } = await admin.from("properties").insert(toInsert).select("id");
    if (error) {
      return { success: false, error: `Insert failed: ${error.message}` };
    }
    insertedCount = data?.length ?? 0;
  }

  await logAction({
    staff,
    action: "property.bulk_import",
    targetTable: "properties",
    targetId: "batch",
    metadata: {
      filename: file.name,
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
