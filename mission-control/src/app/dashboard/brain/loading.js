// Instant skeleton for the Team Brain.
export default function BrainLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded-lg" />
      <div className="h-12 w-full bg-white/5 rounded-lg" />
      <div className="h-12 w-full bg-white/5 rounded-xl" />
      <div className="bg-[#121212] border border-white/5 rounded-xl p-6 space-y-3">
        <div className="h-4 w-40 bg-white/5 rounded" />
        <div className="h-4 w-full bg-white/5 rounded" />
        <div className="h-4 w-2/3 bg-white/5 rounded" />
      </div>
    </div>
  );
}
