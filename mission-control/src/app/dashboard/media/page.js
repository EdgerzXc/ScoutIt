import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff } from "@/lib/rbac";
import { Video, Inbox, Gauge } from "lucide-react";
import IngestPanel from "./IngestPanel";
import FileSecurityPanel from "./FileSecurityPanel";

// Concierge Ingest — the staff workspace for turning raw owner uploads into
// structured listing data via AI instructions (human-in-the-loop), instead of
// an automatic API call. Reads the live `properties` drafts.
export default async function MediaIngestPage() {
  await getCurrentStaff(); // layout already gated; this asserts a session too.
  const admin = createAdminClient();

  const { data: drafts, error } = await admin
    .from("properties")
    .select(
      "id, title, location, space_category, price, description, media_link, details, completeness_score, pipeline_status, moderation_status, created_at"
    )
    .eq("moderation_status", "pending")
    .is("archived_at", null)
    .order("completeness_score", { ascending: true, nullsFirst: true })
    .limit(100);

  const rows = drafts ?? [];

  // B1 — file-scan pipeline state. Degrades gracefully until the
  // 0004_file_scan_pipeline migration creates the table.
  let scans = [];
  let scansTableReady = true;
  {
    const { data: scanRows, error: scanError } = await admin
      .from("file_scans")
      .select(
        "id, bucket, storage_path, original_filename, declared_mime, detected_mime, scan_status, scan_verdict, scan_engine, scan_notes, scanned_at"
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (scanError) {
      scansTableReady = false;
    } else {
      scans = scanRows ?? [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Concierge Ingest</h1>
          <p className="text-xs text-white/70 mt-1">
            Raw uploads awaiting synthesis. Hand each to your AI with the schema prompt, paste the
            result back, then send it to the review queue. Rawest drafts first.
          </p>
        </div>
        <span className="text-xs text-white/70 flex items-center gap-1.5">
          <Inbox className="w-3.5 h-3.5" />
          {rows.length} in queue
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Failed to load the ingest queue: {error.message}
        </div>
      )}

      <FileSecurityPanel scans={scans} tableReady={scansTableReady} />

      {rows.length === 0 && !error ? (
        <div className="bg-[#121212] border border-white/5 rounded-xl p-12 text-center flex flex-col items-center gap-3">
          <Video className="w-6 h-6 text-white/70" />
          <div className="text-sm text-white/70">
            Nothing waiting. New owner submissions land here for synthesis.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((p) => {
            const gaps = Array.isArray(p.details?.synthesis_gaps) ? p.details.synthesis_gaps : [];
            const confidence = p.details?.synthesis_confidence;
            return (
              <div key={p.id} className="bg-[#121212] border border-white/5 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-medium text-white truncate">
                        {p.title || <span className="text-white/70 italic">Untitled draft</span>}
                      </h2>
                      {p.space_category && (
                        <span className="text-[12px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                          {p.space_category}
                        </span>
                      )}
                      <span className="text-[12px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70 font-mono">
                        {p.pipeline_status || "raw"}
                      </span>
                    </div>
                    <div className="text-xs text-white/70 mt-1">
                      {p.location || "No location yet"}
                      {p.price != null && ` · ₱${Number(p.price).toLocaleString()}`}
                      {" · "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/70 shrink-0">
                    <Gauge className="w-3.5 h-3.5" />
                    <span className={completenessColor(p.completeness_score)}>
                      {p.completeness_score != null ? `${p.completeness_score}%` : "—"}
                    </span>
                  </div>
                </div>

                {p.description && (
                  <p className="text-xs text-white/70 mt-3 line-clamp-2">{p.description}</p>
                )}

                {(confidence != null || gaps.length > 0) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                    {confidence != null && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E8AE3C]/10 border border-[#E8AE3C]/20 text-[#E8AE3C]">
                        confidence {Number(confidence).toFixed(2)}
                      </span>
                    )}
                    {gaps.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                        {gaps.length} gap{gaps.length === 1 ? "" : "s"}: {gaps.slice(0, 4).join(", ")}
                        {gaps.length > 4 ? "…" : ""}
                      </span>
                    )}
                  </div>
                )}

                <IngestPanel property={p} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function completenessColor(score) {
  if (score == null) return "text-white/70";
  if (score >= 75) return "text-green-400";
  if (score >= 40) return "text-[#E8AE3C]";
  return "text-red-400";
}
