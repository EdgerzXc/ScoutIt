/**
 * Stale Queue Temp Object & Draft Purge Lifecycle
 * Cleans up abandoned or hung ai_drafting uploads older than maxAgeHours.
 */
export async function purgeStaleQueueDocs(supabaseAdmin, { maxAgeHours = 24, tempBucket = "property_photos" } = {}) {
  if (!supabaseAdmin) return { purged: 0, errors: [] };

  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

  try {
    const { data: staleRows, error: fetchErr } = await supabaseAdmin
      .from("properties")
      .select("id, owner_id, pdf_source_url, details")
      .eq("pipeline_status", "ai_drafting")
      .lt("created_at", cutoff);

    if (fetchErr || !staleRows || staleRows.length === 0) {
      return { purged: 0, errors: fetchErr ? [fetchErr.message] : [] };
    }

    let purgedCount = 0;
    const errors = [];

    for (const row of staleRows) {
      const storagePath = row.pdf_source_url || row.details?.temp_storage_path;
      if (storagePath) {
        try {
          await supabaseAdmin.storage.from(tempBucket).remove([storagePath]);
        } catch (removeErr) {
          errors.push(`Storage delete failed for ${row.id}: ${removeErr.message}`);
        }
      }

      const { error: updateErr } = await supabaseAdmin
        .from("properties")
        .update({
          pipeline_status: "quarantined",
          details: {
            ...(row.details || {}),
            quarantine_reason: `Stale intake TTL expired (abandoned > ${maxAgeHours}h)`,
            quarantined_at: new Date().toISOString(),
          },
        })
        .eq("id", row.id);

      if (updateErr) {
        errors.push(`Status update failed for ${row.id}: ${updateErr.message}`);
      } else {
        purgedCount += 1;
      }
    }

    return { purged: purgedCount, errors };
  } catch (err) {
    console.error("[queueMaintenance] purgeStaleQueueDocs unexpected error:", err);
    return { purged: 0, errors: [err?.message || String(err)] };
  }
}

/**
 * A-317: Orphan Photo GC Lifecycle
 * Scans property_photos storage bucket for stale temporary or orphan files older than maxAgeHours.
 */
export async function purgeOrphanPhotos(supabaseAdmin, { maxAgeHours = 24, bucket = "property_photos" } = {}) {
  if (!supabaseAdmin) return { checked: 0, purged: 0, errors: [] };
  const cutoffMs = Date.now() - maxAgeHours * 60 * 60 * 1000;
  try {
    const { data: files, error: listErr } = await supabaseAdmin.storage.from(bucket).list("", { limit: 100 });
    if (listErr || !files) return { checked: 0, purged: 0, errors: listErr ? [listErr.message] : [] };

    const orphans = files.filter((f) => {
      const createdMs = f.created_at ? new Date(f.created_at).getTime() : 0;
      return createdMs && createdMs < cutoffMs && (f.name.startsWith("orphan_") || f.name.includes("_temp_"));
    });

    if (orphans.length === 0) return { checked: files.length, purged: 0, errors: [] };

    const toRemove = orphans.map((o) => o.name);
    const { error: removeErr } = await supabaseAdmin.storage.from(bucket).remove(toRemove);
    return {
      checked: files.length,
      purged: removeErr ? 0 : toRemove.length,
      errors: removeErr ? [removeErr.message] : [],
    };
  } catch (err) {
    console.error("[queueMaintenance] purgeOrphanPhotos unexpected error:", err);
    return { checked: 0, purged: 0, errors: [err?.message || String(err)] };
  }
}
