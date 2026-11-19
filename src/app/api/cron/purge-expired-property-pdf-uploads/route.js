import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { withCronEventLog } from "@/lib/cronEventLog";
import { PRIVATE_QUEUE_BUCKET, propertyPdfUploadPath } from "@/lib/propertyQueueStorage";

const BATCH_SIZE = 40;
const SIGNING_GRACE_MS = 15 * 60 * 1000;

export const GET = withCronEventLog("purge-expired-property-pdf-uploads", async (request) => {
  const denied = authorizeCronRequest(request);
  if (denied) return denied;
  if (!supabaseAdmin) return NextResponse.json({ error: "PDF cleanup is unavailable." }, { status: 503 });

  try {
    const cutoff = new Date(Date.now() - SIGNING_GRACE_MS).toISOString();
    const { data: intents, error: intentError } = await supabaseAdmin.from("property_pdf_uploads")
      .select("id, owner_id").lte("expires_at", cutoff).order("expires_at").limit(BATCH_SIZE);
    if (intentError) throw intentError;
    if (!intents?.length) return NextResponse.json({ cleared: 0 });

    const paths = intents.map((intent) => propertyPdfUploadPath(intent.owner_id, intent.id));
    const { data: adopted, error: sourceError } = await supabaseAdmin.from("properties")
      .select("pdf_source_url").in("pdf_source_url", paths);
    if (sourceError) throw sourceError;

    const activePaths = new Set((adopted || []).map((draft) => draft.pdf_source_url));
    const abandoned = paths.filter((path) => !activePaths.has(path));
    if (abandoned.length) {
      const { error: deleteError } = await supabaseAdmin.storage.from(PRIVATE_QUEUE_BUCKET).remove(abandoned);
      if (deleteError) throw deleteError;
    }

    const { error: clearError } = await supabaseAdmin.from("property_pdf_uploads")
      .delete().in("id", intents.map((intent) => intent.id)).lte("expires_at", cutoff);
    if (clearError) throw clearError;

    return NextResponse.json({ cleared: intents.length, preservedSources: activePaths.size });
  } catch (error) {
    console.error("[pdf-upload-cleanup] Run failed:", error?.code || error?.statusCode || error?.name);
    return NextResponse.json({ error: "Could not clean up expired PDF uploads." }, { status: 500 });
  }
});
