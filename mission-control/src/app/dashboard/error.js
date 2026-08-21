"use client";

// Catch-all error boundary for the dashboard segment: a failing module
// renders an in-panel error with a retry, instead of a full-screen crash.
export default function DashboardError({ error, reset }) {
  return (
    <div className="bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] rounded-xl p-6 max-w-xl">
      <h2 className="text-sm font-medium text-danger mb-1">This module hit an error</h2>
      <p className="text-xs text-white/70 mb-4 break-words">{error?.message || "Unknown error"}</p>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 transition-colors"
        >
          Back to Overview
        </a>
      </div>
    </div>
  );
}
