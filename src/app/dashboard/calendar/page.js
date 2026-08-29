"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { DashboardProvider } from "@/context/DashboardContext";
import CalendarShell from "@/components/calendar/CalendarShell";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import WorkspaceCommandBar from "@/components/dashboard/WorkspaceCommandBar";

function CalendarInner() {
  return (
    <DashboardLayout>
      {/* Main container — pad the bottom on mobile so the calendar
          and availability editor clear the fixed bottom nav. */}
      <div className="flex flex-col w-full bg-background p-4 sm:p-6 pb-28 sm:pb-6">
        <div className="max-w-6xl mx-auto w-full flex flex-col flex-1 min-h-0">
          <div className="mb-4">
            <span className="font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-gold-accent">
              ScoutIt schedule
            </span>
            <h1 className="font-headline-editorial text-3xl text-on-surface sm:text-4xl">Viewings &amp; Calendar</h1>
            <p className="text-sm sm:text-base text-text-secondary mt-1">
              Live property viewings, personal events, and host availability in one place.
            </p>
          </div>
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
