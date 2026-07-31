// Instant skeleton for the Mission Inbox while the aggregate queries run.
export default function InboxLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[#121212] border border-white/5 rounded-xl p-5 space-y-3">
            <div className="h-5 w-40 bg-white/5 rounded" />
            <div className="h-3 w-56 bg-white/5 rounded" />
            <div className="h-4 w-full bg-white/5 rounded" />
            <div className="h-4 w-3/4 bg-white/5 rounded" />
            <div className="h-9 w-full bg-white/5 rounded-lg mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
