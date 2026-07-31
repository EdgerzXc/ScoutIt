import "server-only";
import { scanBuffer } from "./fileScan";

// B1 Stage-1 worker: pull pending file_scans rows, fetch each file from its
// (private) bucket with the service-role client, run the scan engine, write
// the verdict. Shared by the staff "Run scan now" action and the cron route.
//
// Files are NEVER deleted here — infected/suspicious files stay isolated in
// quarantine (no signed URL is ever issued for them), which preserves
// evidence and honors the no-deletions rule.

const BATCH_SIZE = 10;

export async function processPendingScans(admin) {
  const { data: pending, error } = await admin
    .from("file_scans")
    .select("id, bucket, storage_path, declared_mime, original_filename")
    .eq("scan_status", "pending_scan")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw new Error(`Failed to read scan queue: ${error.message}`);
  if (!pending || pending.length === 0) {
    return { processed: 0, clean: 0, suspicious: 0, infected: 0, errors: [] };
  }

  const summary = { processed: 0, clean: 0, suspicious: 0, infected: 0, errors: [] };

  for (const row of pending) {
    // Claim the row so a concurrent worker doesn't double-scan.
    const { data: claimed } = await admin
      .from("file_scans")
      .update({ scan_status: "scanning" })
      .eq("id", row.id)
      .eq("scan_status", "pending_scan")
      .select("id");
    if (!claimed || claimed.length === 0) continue; // someone else claimed it

    try {
      const { data: blob, error: dlError } = await admin.storage
        .from(row.bucket)
        .download(row.storage_path);
      if (dlError || !blob) throw new Error(dlError?.message || "download failed");

      const buffer = Buffer.from(await blob.arrayBuffer());
      const result = await scanBuffer(buffer, {
        declaredMime: row.declared_mime,
        filename: row.original_filename || row.storage_path,
      });

      await admin
        .from("file_scans")
        .update({
          scan_status: "scanned",
          scan_verdict: result.verdict,
          scan_engine: result.engine,
          scan_notes: result.notes,
          detected_mime: result.detectedMime,
          sha256: result.sha256,
          size_bytes: buffer.byteLength,
          scanned_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      summary.processed += 1;
      summary[result.verdict] += 1;
    } catch (err) {
      // Put it back in the queue so a later run retries; record why.
      await admin
        .from("file_scans")
        .update({
          scan_status: "pending_scan",
          scan_notes: `scan error: ${err.message}`,
        })
        .eq("id", row.id);
      summary.errors.push(`${row.storage_path}: ${err.message}`);
    }
  }

  return summary;
}
