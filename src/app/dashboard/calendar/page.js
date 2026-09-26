"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { DashboardProvider } from "@/context/DashboardContext";
import CalendarShell from "@/components/calendar/CalendarShell";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import WorkspaceCommandBar from "@/components/dashboard/WorkspaceCommandBar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function CalendarInner() {
  return (
    <DashboardLayout>
      {/* Main container — pad the bottom on mobile so the calendar
          and availability editor clear the fixed bottom nav. */}
      <div className="flex flex-col w-full bg-background p-4 sm:p-6 pb-28 sm:pb-6">
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
          <WorkspaceCommandBar active="calendar" className="mb-5 w-full md:max-w-xl" />
          {/* Give the calendar surface real height to render month/week grids. */}
          <div className="flex flex-col min-h-[560px]">
            <CalendarShell />
          </div>
        </div>
      </div>
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
