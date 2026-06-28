import Link from "next/link";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col pb-[100px] md:pb-24">
      {/* Top Nav (Persistent) */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-surface-variant px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-display-md text-xl md:text-2xl text-gold-accent tracking-tighter">S<span className="text-on-surface">cout</span>IT</Link>
        </div>
        <div className="flex gap-4">
            <Link href="/dashboard" className="text-sm text-text-secondary hover:text-gold-accent">Dashboard</Link>
            <Link href="/dashboard/inbox" className="text-sm text-text-secondary hover:text-gold-accent">Inbox</Link>
            <Link href="/dashboard/calendar" className="text-sm text-text-secondary hover:text-gold-accent">Calendar</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-0">
        {children}
      </main>
    </div>
  );
}
