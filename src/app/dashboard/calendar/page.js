"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DeckPanel from "@/components/dashboard/DeckPanel";
import { deckNeighbors } from "@/lib/workspaceDeck";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import CalendarShell from "@/components/calendar/CalendarShell";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import WorkspaceCommandBar from "@/components/dashboard/WorkspaceCommandBar";
import { isPipelineRole } from "@/lib/workspaceDeck";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function CalendarInner() {
  const { currentUser } = useDashboard();
  const isPipeline = isPipelineRole(currentUser?.active_roles);
  const activeMode = isPipeline ? "owner" : "buyer";

  return (
    <DashboardLayout>
      {/* A-205 Workspace Deck: Calendar closes the deck — swipe-right returns
          to the Inbox for every role; the left end rubber-bands. */}
      <DeckPanel {...deckNeighbors("calendar", "owner")}>
      {/* Main container — pad the bottom on mobile so the calendar
          and availability editor clear the fixed bottom nav. */}
      <div className="flex flex-col w-full bg-background p-4 sm:p-6 pb-36 sm:pb-12">
        <div className="max-w-6xl mx-auto w-full flex flex-col flex-1 min-h-0">
          <div className="mb-4 flex items-center gap-3.5">
            <Link
              href="/dashboard"
              className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 border border-surface-variant rounded-full text-text-secondary hover:text-on-surface hover:border-gold-accent/50 transition shrink-0"
              title="Back to Workspace"
              aria-label="Back to Workspace"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className="font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-gold-accent block">
                ScoutIt schedule
              </span>
              <h1 className="font-headline-editorial text-3xl text-on-surface sm:text-4xl leading-tight">Viewings &amp; Calendar</h1>
            </div>
          </div>
          <p className="text-sm sm:text-base text-text-secondary -mt-1 mb-4">
            Live property viewings, personal events, and host availability in one place.
          </p>
          <WorkspaceCommandBar active="calendar" mode={activeMode} className="mb-5 w-full md:max-w-xl" />
          {/* Give the calendar surface real height to render month/week grids. */}
          <div className="flex flex-col min-h-[560px]">
            <CalendarShell />
          </div>
        </div>
      </div>
      </DeckPanel>
    </DashboardLayout>
  );
}

export default function CalendarPage() {
  return (
    <DashboardProvider>
      <VerifiedWorkspaceBoundary>
        <CalendarInner />
      </VerifiedWorkspaceBoundary>
    </DashboardProvider>
  );
}
