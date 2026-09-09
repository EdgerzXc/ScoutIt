"use client";

export default function Error({ error, reset }) {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-3">
      <h1 className="text-lg text-white/90">Contributions could not be loaded</h1>
      <p className="text-xs text-white/70">
        {error?.message || "An unexpected error occurred."} Nothing was credited or withdrawn.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-lg text-sm border border-white/15 text-white/70 hover:border-white/30 hover:text-white transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
