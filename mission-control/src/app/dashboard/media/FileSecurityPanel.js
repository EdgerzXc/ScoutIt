"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Loader2, Download, RefreshCw } from "lucide-react";
import { runScanQueue, requestScannedDownload } from "./actions";

// B1 Stage 2/3 UI — the staff view of the file-scan pipeline.
// Only 'clean' files get a download button; suspicious/infected are shown
// quarantined with NO way to fetch them. Downloads go through the
// re-check server action and open a short-lived signed URL.
export default function FileSecurityPanel({ scans, tableReady }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState(null);

  if (!tableReady) {
    return (
      <div className="bg-[#121212] border border-white/5 rounded-xl p-6">
        <PanelHeader />
        <p className="text-xs text-white/70 mt-2">
          Scan pipeline code is live, waiting on the database migration
          (<span className="font-mono">0004_file_scan_pipeline.sql</span>) to create the
          quarantine bucket + <span className="font-mono">file_scans</span> table.
        </p>
      </div>
    );
  }

  const pending = scans.filter((s) => s.scan_status !== "scanned").length;
  const clean = scans.filter((s) => s.scan_verdict === "clean").length;
  const flagged = scans.filter(
    (s) => s.scan_verdict === "suspicious" || s.scan_verdict === "infected"
  ).length;

  const handleRunScan = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        await runScanQueue();
        setMessage("Scan pass complete.");
      } catch (err) {
        setMessage(`Scan failed: ${err.message}`);
      }
    });
  };

  const handleDownload = (scanId) => {
    setMessage(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("scanId", scanId);
        const result = await requestScannedDownload(fd);
        if (result?.url) {
          window.open(result.url, "_blank", "noopener,noreferrer");
          setMessage("Secure download link opened (valid 5 minutes).");
        }
      } catch (err) {
        setMessage(`Download blocked: ${err.message}`);
      }
    });
  };

  return (
    <div className="bg-[#121212] border border-white/5 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <PanelHeader />
        <button
          onClick={handleRunScan}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Run scan now
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-[12px] uppercase tracking-wide">
        <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
          {pending} awaiting scan
        </span>
        <span className="px-2 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400">
          {clean} clean
        </span>
        <span className="px-2 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-red-400">
          {flagged} quarantined
        </span>
      </div>

      {message && (
        <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          {message}
        </div>
      )}

      {scans.length === 0 ? (
        <p className="text-xs text-white/70">
          No files in the pipeline yet. Once uploads route through quarantine, they appear here.
        </p>
      ) : (
        <div className="divide-y divide-white/5">
          {scans.map((s) => (
            <div key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
              <VerdictBadge scan={s} />
              <div className="min-w-0 flex-1">
                <div className="text-white/80 text-xs truncate">
                  {s.original_filename || s.storage_path}
                </div>
                <div className="text-[12px] text-white/70 truncate">
                  {s.detected_mime || s.declared_mime || "type unknown"}
                  {s.scan_engine && ` · ${s.scan_engine}`}
                  {s.scanned_at && ` · scanned ${new Date(s.scanned_at).toLocaleString()}`}
                  {s.scan_notes && ` · ${s.scan_notes}`}
                </div>
              </div>
              {s.scan_verdict === "clean" ? (
                <button
                  onClick={() => handleDownload(s.id)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#E8AE3C]/10 hover:bg-[#E8AE3C]/20 border border-[#E8AE3C]/30 text-[#E8AE3C] transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Secure download
                </button>
              ) : (
                <span className="text-[12px] uppercase tracking-wide text-white/70">
                  {s.scan_status === "scanned" ? "no access" : "in queue"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PanelHeader() {
  return (
    <div>
      <h2 className="text-lg font-medium flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#E8AE3C]" />
        File Security
      </h2>
      <p className="text-[12px] uppercase tracking-wide text-white/70 mt-0.5">
        Quarantine → scan → clean-only access → re-check on download
      </p>
    </div>
  );
}

function VerdictBadge({ scan }) {
  if (scan.scan_status !== "scanned") {
    return <Loader2 className="w-4 h-4 text-white/70 shrink-0" />;
  }
  if (scan.scan_verdict === "clean") {
    return <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />;
  }
  if (scan.scan_verdict === "infected") {
    return <ShieldX className="w-4 h-4 text-red-400 shrink-0" />;
  }
  return <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />;
}
