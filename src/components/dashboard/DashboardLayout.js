import Link from "next/link";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";

export default function DashboardLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-background text-text-primary flex flex-col pb-[100px] md:pb-24">
      <AtmosphereBackground variant="dashboard" />

      {/* Top Nav (Persistent) */}
      <header className="relative z-40 sticky top-0 bg-background/85 backdrop-blur-xl border-b border-surface-variant/70 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-display-md text-xl md:text-2xl text-gold-accent tracking-tighter text-glow active:scale-[0.97] transition-all duration-160 ease-out">
            S<span className="text-on-surface">cout</span>IT
          </Link>
        </div>
        <div className="flex gap-4 items-center font-mono text-xs tracking-wider uppercase">
          <Link href="/dashboard" className="text-text-secondary hover:text-gold-accent active:scale-[0.97] transition-all duration-160 ease-out">
            Dashboard
          </Link>
          <Link href="/dashboard/inbox" className="text-text-secondary hover:text-gold-accent active:scale-[0.97] transition-all duration-160 ease-out">
            Inbox
          </Link>
          <Link href="/dashboard/calendar" className="text-text-secondary hover:text-gold-accent active:scale-[0.97] transition-all duration-160 ease-out">
            Calendar
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
