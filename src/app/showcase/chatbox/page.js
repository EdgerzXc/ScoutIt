import MockupChatbox from "@/components/chat/MockupChatbox";
import Link from "next/link";
import { ArrowLeft, Inbox, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Chatbox & Three-State Inbox Mockup · ScoutIt",
  description: "Interactive mockup of ScoutIt's three-state inbox (Waiting, Active, Declined) and Connect spend receipt overlay.",
  alternates: { canonical: "/showcase/chatbox" },
  robots: { index: false, follow: false },
};

export default function MockupChatboxPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Top Ease-of-Use Navigation Bar */}
      <header className="sticky top-0 z-30 w-full px-6 py-3.5 bg-surface/90 border-b border-border-subtle backdrop-blur-md flex items-center justify-between">
        <Link
          href="/showcase"
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-gold-accent transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Orbit Showcase</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/inbox"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-alt border border-surface-variant hover:border-gold-accent text-xs font-mono text-text-secondary hover:text-gold-accent transition"
          >
            <Inbox size={13} />
            <span>Open Real Inbox</span>
            <ExternalLink size={11} className="opacity-60" />
          </Link>
        </div>
      </header>
      <div className="flex-1">
        <MockupChatbox />
      </div>
    </div>
  );
}
