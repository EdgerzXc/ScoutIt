// Catch-all navigation skeleton for the dashboard segment: the sidebar
// (layout) stays put and the content area shows this INSTANTLY on click,
// while the target page's server queries run. Routes can override with their
// own loading.js (e.g. security/) — this is the default for all of them.
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 bg-white/5 rounded-lg" />
        <div className="h-4 w-24 bg-white/5 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-line rounded-xl p-5 space-y-3">
            <div className="h-4 w-28 bg-white/5 rounded" />
            <div className="h-8 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-surface border border-line rounded-xl p-6 space-y-3">
        <div className="h-5 w-44 bg-white/5 rounded" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 w-full bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}
