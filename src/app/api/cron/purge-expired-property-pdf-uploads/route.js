import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { withCronEventLog } from "@/lib/cronEventLog";
import { PRIVATE_QUEUE_BUCKET, propertyPdfUploadPath } from "@/lib/propertyQueueStorage";

const BATCH_SIZE = 40;
const MAX_BATCHES = 8;
const SIGNING_GRACE_MS = 15 * 60 * 1000;

export const GET = withCronEventLog("purge-expired-property-pdf-uploads", async (request) => {
  const denied = authorizeCronRequest(request);
  if (denied) return denied;
  if (!supabaseAdmin) return NextResponse.json({ error: "PDF cleanup is unavailable." }, { status: 503 });

  let cleared = 0;
  let preservedSources = 0;
  let backlogPending = false;
  try {
    const cutoff = new Date(Date.now() - SIGNING_GRACE_MS).toISOString();
    for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
      const { data: candidates, error: intentError } = await supabaseAdmin.from("property_pdf_uploads")
        .select("id, owner_id").lte("expires_at", cutoff).order("expires_at").order("id").limit(BATCH_SIZE + 1);
      if (intentError) throw intentError;
      backlogPending = candidates.length > BATCH_SIZE;
      if (!candidates.length) break;

      const intents = candidates.slice(0, BATCH_SIZE).map((intent) => ({
        id: intent.id,
        path: propertyPdfUploadPath(intent.owner_id, intent.id),
      }));
      const { data: adopted, error: sourceError } = await supabaseAdmin.from("properties")
        .select("pdf_source_url").in("pdf_source_url", intents.map((intent) => intent.path));
      if (sourceError) throw sourceError;

      const activePaths = new Set(adopted.map((draft) => draft.pdf_source_url));
      const abandoned = intents.filter((intent) => !activePaths.has(intent.path)).map((intent) => intent.path);
      if (abandoned.length) {
        const { error: deleteError } = await supabaseAdmin.storage.from(PRIVATE_QUEUE_BUCKET).remove(abandoned);
        if (deleteError) throw deleteError;
      }

      const { data: removed, error: clearError } = await supabaseAdmin.from("property_pdf_uploads")
        .delete().in("id", intents.map((intent) => intent.id)).lte("expires_at", cutoff).select("id");
      if (clearError) throw clearError;
      const removedIds = new Set(removed.map((intent) => intent.id));
      cleared += removedIds.size;
      preservedSources += intents.filter((intent) => removedIds.has(intent.id) && activePaths.has(intent.path)).length;
      if (!backlogPending) break;
    }

    return NextResponse.json({ cleared, preservedSources, backlogPending });
  } catch (error) {
    console.error("[pdf-upload-cleanup] Run failed:", error?.code || error?.statusCode || error?.name);
    return NextResponse.json({ error: "Could not clean up expired PDF uploads.", cleared, preservedSources }, { status: 500 });
  }
});
