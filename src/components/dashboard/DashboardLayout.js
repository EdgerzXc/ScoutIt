import Link from "next/link";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { ArrowLeft } from "lucide-react";

export default function DashboardLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-background text-text-primary flex flex-col pb-[100px] md:pb-24">
      <AtmosphereBackground variant="dashboard" />

      {/* Top Nav (Persistent) */}
      <header className="relative z-40 sticky top-0 bg-background/60 backdrop-blur-2xl border-b border-white/[0.04] px-4 py-3 md:px-6 md:py-4 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-text-secondary hover:text-gold-accent active:scale-[0.98] transition-all duration-300 ease-out min-h-11 px-2 -ml-2 rounded-lg hover:bg-surface-variant/40"
            title="Back to Workspace"
            aria-label="Back to Workspace"
          >
            <ArrowLeft size={16} className="text-gold-accent shrink-0" />
            <span className="font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-text-secondary hover:text-on-surface">Workspace</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <Link href="/dashboard" className="font-display-md text-xl md:text-2xl text-gold-accent tracking-tighter active:scale-[0.98] transition-all duration-300 ease-out group relative">
            <span className="absolute inset-0 bg-gold-accent/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative">S<span className="text-on-surface">cout</span>IT</span>
          </Link>
        </div>
        <div className="flex gap-6 items-center font-label-caps text-[12px] md:text-xs">
          <Link href="/dashboard" className="text-text-secondary hover:text-on-surface active:scale-[0.98] transition-all duration-300 ease-out">
            Dashboard
          </Link>
          <Link href="/dashboard/inbox" className="text-text-secondary hover:text-on-surface active:scale-[0.98] transition-all duration-300 ease-out">
            Inbox
          </Link>
          <Link href="/dashboard/calendar" className="text-text-secondary hover:text-on-surface active:scale-[0.98] transition-all duration-300 ease-out relative">
            Calendar
            <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-gold-accent rounded-full animate-pulse" />
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
