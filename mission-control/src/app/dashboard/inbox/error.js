"use client";

// Route-level error boundary for the Mission Inbox.
export default function InboxError({ error, reset }) {
  return (
    <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-6">
      <h2 className="text-sm font-medium text-red-400 mb-1">Mission Inbox failed to load</h2>
      <p className="text-xs text-white/70 mb-4">{error?.message || "Unknown error"}</p>
      <button
        onClick={reset}
        className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
