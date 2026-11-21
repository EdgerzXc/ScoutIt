import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { withCronEventLog } from "@/lib/cronEventLog";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { VIDEO_BUCKET } from "@/lib/conciergeVideo";

const BATCH_SIZE = 40;
const MAX_BATCHES = 8;
const COMPLETION_GRACE_MS = 15 * 60 * 1000;

export const GET = withCronEventLog("purge-expired-concierge-videos", async (request) => {
  const denied = authorizeCronRequest(request);
  if (denied) return denied;
  if (!supabaseAdmin) return NextResponse.json({ error: "Video cleanup is unavailable." }, { status: 503 });

  const cutoff = new Date(Date.now() - COMPLETION_GRACE_MS).toISOString();
  let cleared = 0;
  let backlogPending = false;
  try {
    for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
      const { data: candidates, error: lookupError } = await supabaseAdmin.from("concierge_video_uploads")
        .select("id, storage_path").is("completed_at", null).lte("expires_at", cutoff)
        .order("expires_at").order("id").limit(BATCH_SIZE + 1);
      // The worker can deploy before the separately approved intake migration.
      if (lookupError?.code === "PGRST205" || lookupError?.code === "42P01") {
        return NextResponse.json({ error: "Video cleanup schema is unavailable." }, { status: 503 });
      }
      if (lookupError) throw lookupError;
      if (!candidates.length) break;

      const expired = candidates.slice(0, BATCH_SIZE);
      backlogPending = candidates.length > BATCH_SIZE;
      const { error: storageError } = await supabaseAdmin.storage.from(VIDEO_BUCKET)
        .remove(expired.map((upload) => upload.storage_path));
      if (storageError) throw storageError;

      const { data: removed, error: deletionError } = await supabaseAdmin.from("concierge_video_uploads")
        .delete().in("id", expired.map((upload) => upload.id))
        .is("completed_at", null).lte("expires_at", cutoff).select("id");
      if (deletionError) throw deletionError;
      cleared += removed.length;
      if (!backlogPending) break;
    }
    return NextResponse.json({ cleared, backlogPending });
  } catch (error) {
    console.error("[concierge video cleanup] Run failed", error?.code || error?.name || "Error");
    return NextResponse.json({ error: "Could not clean up expired video uploads.", cleared }, { status: 500 });
  }
});
