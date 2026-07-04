import Link from "next/link";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";

export default function DashboardLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-background text-text-primary flex flex-col pb-[100px] md:pb-24">
      <AtmosphereBackground variant="dashboard" />

      {/* Top Nav (Persistent) */}
      <header className="relative z-40 sticky top-0 bg-background/90 backdrop-blur-md border-b border-surface-variant px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-display-md text-xl md:text-2xl text-gold-accent tracking-tighter text-glow">S<span className="text-on-surface">cout</span>IT</Link>
        </div>
        <div className="flex gap-4">
            <Link href="/dashboard" className="text-sm text-text-secondary hover:text-gold-accent">Dashboard</Link>
            <Link href="/dashboard/inbox" className="text-sm text-text-secondary hover:text-gold-accent">Inbox</Link>
            <Link href="/dashboard/calendar" className="text-sm text-text-secondary hover:text-gold-accent">Calendar</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
