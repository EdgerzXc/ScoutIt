"use client";

import { useState } from "react";
import { Eye, Loader2, ShieldAlert } from "lucide-react";
import { getClaimDocumentUrlAction } from "@/app/dashboard/claims/actions";

export default function ClaimDocInspectButton({ docId, scanStatus }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isClean = scanStatus === "clean";

  if (!isClean) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[12px] text-amber-300/90 italic"
        title="Documents remain locked until malware scanning reports clean"
      >
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        Blocked until clean scan
      </span>
    );
  }

  const handleInspect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getClaimDocumentUrlAction(docId);
      if (!res?.ok || !res.url) {
        setError(res?.error || "Could not open document.");
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err?.message || "Failed to generate document link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleInspect}
        disabled={loading}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F7C64E] hover:bg-[#E8AE3C] text-black font-semibold text-[12px] tracking-wider uppercase transition-colors disabled:opacity-60 cursor-pointer"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
        {loading ? "Signing..." : "Inspect Document"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
