"use client";

import { useEffect } from "react";
import Link from "next/link";
import ScoutItMark from "@/components/brand/ScoutItMark";
import { sanitizeError, errorReference } from "@/lib/sanitizeError";
import { reportError } from "@/lib/reportError";

export default function HubsError({ error, reset }) {
  useEffect(() => {
    reportError({
      kind: "crash",
      message: error?.message,
      stack: error?.stack,
      context: { digest: error?.digest, boundary: "app/hubs/error.js" },
    }).catch(() => {});
  }, [error]);

  const message = sanitizeError(error);
  const reference = errorReference(error);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16 bg-[#0d0d0d]">
      <div className="max-w-md w-full text-center p-8 rounded-2xl bg-[#141414] border border-white/10 shadow-2xl" role="alert">
        <div className="flex justify-center mb-4">
          <ScoutItMark size={40} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] mb-2">
          Transit Hub Interrupted
        </p>
        <h2 className="font-serif text-2xl text-white mb-3">
          Unable to display transit sector
        </h2>
        <p className="text-white/60 text-sm leading-relaxed mb-6">
          {message || "The transit hub dossier could not be loaded."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-[#0d0d0d] font-bold text-sm px-6 py-3 rounded-full transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
          <Link
            href="/property"
            className="border border-white/15 hover:border-white/30 text-white/70 hover:text-white text-sm px-6 py-3 rounded-full transition-colors"
          >
            Directory Home
          </Link>
        </div>
        <p className="font-mono text-xs text-white/60 tracking-wider">
          Ref: {reference}
        </p>
      </div>
    </div>
  );
}
