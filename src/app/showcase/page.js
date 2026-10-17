import ShowcaseStage from "@/components/board/ShowcaseStage";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export const metadata = {
  alternates: { canonical: "/showcase" },
  title: "Orbit Rankings · ScoutIt",
  description: "The most-inquired Philippine properties, ranked across cosmic tiers: ScoutIT's Space Intelligence showcase.",
};

export default function ShowcasePage() {
  return (
    <main className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] overflow-x-hidden relative">
      <ShowcaseStage mode="full" />
      <div className="fixed bottom-6 right-6 z-40">
        <Link
          href="/showcase/chatbox"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface/90 border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-on-accent font-mono text-xs uppercase tracking-wider shadow-2xl backdrop-blur-md transition active:scale-95"
          title="Preview the three-state inbox and Connect spend receipt"
        >
          <MessageSquare size={14} />
          <span>Preview Inbox & Connect Receipt</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
