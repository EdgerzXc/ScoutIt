"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";
import { parseSynthesis, scoreCompleteness } from "@/lib/ingestSchema";
import { processPendingScans } from "@/lib/scanWorker";
import { sha256Hex } from "@/lib/fileScan";

/** B1 Stage 1 — staff-triggered scan of the pending queue. */
export async function runScanQueue() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const admin = createAdminClient();
  const summary = await processPendingScans(admin);

  await logAction({
    staff,
    action: "filescan.run",
    targetTable: "file_scans",
    targetId: `batch(${summary.processed})`,
    metadata: summary,
  });

  revalidatePath("/dashboard/media");
}

/**
 * B1 Stage 3 — secure staff download with pre-download re-check.
 * Only 'clean' files ever get a URL. The file is re-hashed at download time:
 * if the bytes changed since the scan (tampering), access is refused and the
 * row is flipped to suspicious. URLs are SHORT-LIVED signed URLs (5 min),
 * never permanent/public. Every download is logged.
 * @param {FormData} formData
 */
export async function requestScannedDownload(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const scanId = formData.get("scanId")?.toString();
  if (!scanId) throw new Error("Missing scan id.");

  const admin = createAdminClient();
  const { data: scan, error } = await admin
    .from("file_scans")
    .select("*")
    .eq("id", scanId)
    .single();
  if (error || !scan) throw new Error(error?.message || "Scan record not found.");

  if (scan.scan_status !== "scanned" || scan.scan_verdict !== "clean") {
    throw new Error("This file is not cleared for download (not scanned clean).");
  }

  // Re-check: re-download + re-hash. Bytes must match the scanned hash.
  const { data: blob, error: dlError } = await admin.storage
    .from(scan.bucket)
    .download(scan.storage_path);
  if (dlError || !blob) throw new Error("File unavailable for re-verification.");
  const currentHash = sha256Hex(Buffer.from(await blob.arrayBuffer()));
  if (scan.sha256 && currentHash !== scan.sha256) {
    await admin
      .from("file_scans")
      .update({
        scan_verdict: "suspicious",
        scan_notes: `HASH MISMATCH at download time (was ${scan.sha256?.slice(0, 12)}…, now ${currentHash.slice(0, 12)}…) — possible tampering`,
      })
      .eq("id", scanId);
    await logAction({
      staff,
      action: "filescan.tamper_detected",
      targetTable: "file_scans",
      targetId: scanId,
      reason: "Hash mismatch at download time",
    });
    revalidatePath("/dashboard/media");
    throw new Error("File failed re-verification (hash changed since scan) — download blocked and file re-quarantined.");
  }

  const { data: signed, error: signError } = await admin.storage
    .from(scan.bucket)
    .createSignedUrl(scan.storage_path, 300); // 5 minutes
  if (signError || !signed?.signedUrl) throw new Error("Failed to issue download URL.");

  await admin
    .from("file_scans")
    .update({
      download_count: (scan.download_count ?? 0) + 1,
      last_downloaded_at: new Date().toISOString(),
      last_downloaded_by: staff.email,
    })
    .eq("id", scanId);

  await logAction({
    staff,
    action: "filescan.download",
    targetTable: "file_scans",
    targetId: scanId,
    metadata: { path: scan.storage_path, verdict: scan.scan_verdict },
  });

  revalidatePath("/dashboard/media");
  return { url: signed.signedUrl, expiresIn: 300 };
}

/**
 * Concierge Ingest: staff paste the AI's JSON output for a raw upload, and we
 * map it onto the property draft. Server-verified identity, fully logged.
 * @param {FormData} formData
 */
export async function saveSynthesis(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const propertyId = formData.get("propertyId")?.toString();
  const rawJson = formData.get("rawJson")?.toString();
  if (!propertyId) throw new Error("Missing property id.");

  // Throws a friendly message if the pasted JSON is unusable.
  const { patch, detailsPatch, confidence, gaps, warnings } = parseSynthesis(rawJson);

  const admin = createAdminClient();

  // Read current row so we merge (never clobber) the details blob.
  const { data: current, error: readErr } = await admin
    .from("properties")
    .select("id, title, location, space_category, price, description, media_link, details")
    .eq("id", propertyId)
    .single();
  if (readErr) throw new Error(readErr.message);

  const mergedDetails = {
    ...(current.details || {}),
    ...detailsPatch,
    ...(confidence != null ? { synthesis_confidence: confidence } : {}),
    ...(gaps.length ? { synthesis_gaps: gaps } : {}),
    synthesized_by: staff.email,
    synthesized_at: new Date().toISOString(),
  };

  const nextRow = { ...current, ...patch, details: mergedDetails };
  const update = {
    ...patch,
    details: mergedDetails,
    pipeline_status: "draft_ready_for_review",
    completeness_score: scoreCompleteness(nextRow, detailsPatch),
  };

  const { error } = await admin.from("properties").update(update).eq("id", propertyId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "property.synthesize",
    targetTable: "properties",
    targetId: propertyId,
    reason: confidence != null ? `Concierge synthesis (confidence ${confidence.toFixed(2)})` : "Concierge synthesis",
    metadata: { fields: Object.keys(patch), detailKeys: Object.keys(detailsPatch), gaps, warnings },
  });

  revalidatePath("/dashboard/media");
}

/**
 * Edit the media / Spatial Vault link on a draft.
 * @param {FormData} formData
 */
export async function updateMedia(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const propertyId = formData.get("propertyId")?.toString();
  const mediaLink = formData.get("media_link")?.toString().trim() || null;
  if (!propertyId) throw new Error("Missing property id.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("properties")
    .update({ media_link: mediaLink })
    .eq("id", propertyId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "media.update",
    targetTable: "properties",
    targetId: propertyId,
    metadata: { media_link: mediaLink },
  });

  revalidatePath("/dashboard/media");
}
