"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";
import { parseSynthesis, scoreCompleteness } from "@/lib/ingestSchema";
import { processPendingScans } from "@/lib/scanWorker";
import { sha256Hex } from "@/lib/fileScan";
import { updateBoundPropertyImage } from "@/lib/airtable";
import { canSynthesizeListing, getPropertyBinding, isLiveProperty, isProtectedProperty, matchPropertySnapshot } from "@/lib/propertyPublication.mjs";
import { publicMediaUrl } from "@/lib/publicMediaUrl.mjs";

const PROPERTY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (!PROPERTY_ID.test(propertyId || "")) return { error: "Select a valid property draft." };

  // Throws a friendly message if the pasted JSON is unusable.
  let synthesis;
  try {
    synthesis = parseSynthesis(rawJson);
  } catch (error) {
    return { error: error.message };
  }
  const { patch, detailsPatch, confidence, gaps, warnings } = synthesis;

  const admin = createAdminClient();

  // Read current row so we merge (never clobber) the details blob.
  const { data: current, error: readErr } = await admin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();
  if (readErr || !current) return { error: "Could not load the property draft." };
  if (!canSynthesizeListing(current)) {
    return { error: current.creation_source === "pdf_assisted"
      ? "Use the PDF review queue for this draft."
      : "Synthesis is available for drafts awaiting first approval." };
  }

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
    pipeline_status: current.creation_source === "pdf_assisted" ? "pending" : "draft_ready_for_review",
    completeness_score: scoreCompleteness(nextRow, detailsPatch),
  };

  const query = admin.from("properties").update(update).eq("id", propertyId);
  const { data: saved, error } = await matchPropertySnapshot(query, current, ["creation_source", "pdf_verified"]).select("id").maybeSingle();
  if (error || !saved) return { error: "The draft changed while saving. Reload it and retry." };

  await logAction({
    staff,
    action: "property.synthesize",
    targetTable: "properties",
    targetId: propertyId,
    reason: confidence != null ? `Concierge synthesis (confidence ${confidence.toFixed(2)})` : "Concierge synthesis",
    metadata: { fields: Object.keys(patch), detailKeys: Object.keys(detailsPatch), gaps, warnings },
  });

  revalidatePath("/dashboard/media");
  return { ok: true, pdfReviewPending: current.creation_source === "pdf_assisted" };
}

/**
 * Edit the media / Spatial Vault link on a draft.
 * @param {FormData} formData
 */
export async function updateMedia(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const propertyId = formData.get("propertyId")?.toString();
  const input = formData.get("media_link")?.toString().trim() || "";
  const mediaLink = publicMediaUrl(input);
  if (!PROPERTY_ID.test(propertyId || "")) return { error: "Select a valid listing." };
  if (input && !mediaLink) return { error: "Use a public HTTPS link without a sign-in token." };

  const admin = createAdminClient();
  const { data: prop, error: readError } = await admin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .maybeSingle();

  if (readError || !prop) return { error: "Could not load the listing." };
  if (isProtectedProperty(prop)) return { error: "Use the protected review workflow for this listing." };
  const isLive = isLiveProperty(prop);
  const binding = isLive ? getPropertyBinding(prop) : null;
  if (isLive && !binding) return { error: "Verify this listing’s Airtable record before changing its public image." };

  const query = admin
    .from("properties")
    .update({ media_link: mediaLink })
    .eq("id", propertyId);
  const { data: saved, error } = await matchPropertySnapshot(query, prop, ["media_link"]).select("id").maybeSingle();
  if (error || !saved) return { error: "The listing changed while saving. Reload it and retry." };

  let warning = null;
  if (binding) {
    try {
      const cache = await updateBoundPropertyImage(binding, mediaLink);
      if (!cache.purged) warning = "Image saved. Check the public page before sharing it.";
    } catch (err) {
      console.warn("[MMC MEDIA] Airtable media sync warning:", err?.code || err?.name);
      warning = "Link saved privately. The public image update needs a retry.";
    }
  }

  await logAction({
    staff,
    action: "media.update",
    targetTable: "properties",
    targetId: propertyId,
    metadata: { media_link: mediaLink, recordId: binding?.recordId || null, public_sync_pending: Boolean(warning) },
  });

  revalidatePath("/dashboard/media");
  return { ok: true, warning, mediaLink };
}
