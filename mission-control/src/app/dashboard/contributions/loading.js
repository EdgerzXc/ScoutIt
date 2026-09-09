export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-64 rounded bg-white/5 animate-pulse" />
      <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      <p className="sr-only">Loading credited contributions.</p>
    </div>
  );
}
