// Instant skeleton for the Verification Center.
export default function VerificationLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-white/5 rounded-lg" />
      <div className="h-12 w-full bg-white/5 rounded-xl" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-[#121212] border border-white/5 rounded-xl p-5 space-y-3">
          <div className="h-5 w-56 bg-white/5 rounded" />
          <div className="h-3 w-40 bg-white/5 rounded" />
          <div className="h-9 w-full bg-white/5 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
