"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { DashboardProvider } from "@/context/DashboardContext";
import CalendarShell from "@/components/calendar/CalendarShell";

function CalendarInner() {
  return (
    <DashboardLayout>
      {/* Internal scroll container — pad the bottom on mobile so the calendar
          and availability editor clear the fixed bottom nav. */}
      <div className="flex flex-col h-[calc(100vh-64px)] bg-background p-4 sm:p-6 pb-28 sm:pb-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full flex flex-col flex-1 min-h-0">
          <div className="mb-4">
            <h1 className="font-working-title text-2xl sm:text-3xl text-on-surface">Calendar</h1>
            <p className="text-sm sm:text-base text-text-secondary mt-1">
              Your viewings, events, and weekly availability in one place.
            </p>
          </div>
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
      <CalendarInner />
    </DashboardProvider>
  );
}
