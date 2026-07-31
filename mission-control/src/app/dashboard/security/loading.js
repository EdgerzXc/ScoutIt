// Instant skeleton for the Security Center while server queries run.
export default function SecurityLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-white/5 rounded-lg" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-[#121212] border border-white/5 rounded-xl p-6 space-y-3">
          <div className="h-5 w-48 bg-white/5 rounded" />
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-3/4 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  );
}
