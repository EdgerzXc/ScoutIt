"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import { crmFetch } from "@/lib/crmClient";

const DEFAULT_SCHEDULE = {
  monday: { active: true, start: "09:00", end: "17:00" },
  tuesday: { active: true, start: "09:00", end: "17:00" },
  wednesday: { active: true, start: "09:00", end: "17:00" },
  thursday: { active: true, start: "09:00", end: "17:00" },
  friday: { active: true, start: "09:00", end: "17:00" },
  saturday: { active: false, start: "09:00", end: "17:00" },
  sunday: { active: false, start: "09:00", end: "17:00" },
};

function CalendarInner() {
  const { addToast, currentUser } = useDashboard();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  // Real data: the same appointments the CRM Appointments tab reads
  // (GET /api/viewing-appointments) plus this user's saved weekly availability.
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmFetch("/api/viewing-appointments", { mockUserId: currentUser?.id });
      setAppointments(Array.isArray(res.appointments) ? res.appointments : []);
    } catch {
      setAppointments([]);
    }
    try {
      if (currentUser?.id) {
        const availRes = await crmFetch(`/api/availability?userId=${currentUser.id}`, { mockUserId: currentUser?.id });
        const saved = availRes?.config?.weekly_schedule;
        if (saved && Object.keys(saved).length > 0) {
          setSchedule({ ...DEFAULT_SCHEDULE, ...saved });
        }
      }
    } catch {
      /* no saved availability yet — keep defaults */
    }
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await crmFetch("/api/availability", {
        method: "POST",
        body: { weekly_schedule: schedule },
        mockUserId: currentUser?.id,
      });
      if (addToast) addToast("Availability saved!", "✅");
    } catch {
      if (addToast) addToast("Couldn't save availability — please try again.", "❌");
    } finally {
      setSaving(false);
    }
  };

  // Host-side confirm / decline, straight from the calendar. Mirrors the CRM
  // Appointments tab: only the host may confirm; either party may cancel.
  const updateAppointment = async (id, status) => {
    setUpdatingId(id);
    try {
      await crmFetch(`/api/viewing-appointments/${id}`, {
        method: "PATCH",
        body: { status },
        mockUserId: currentUser?.id,
      });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      if (addToast) addToast(status === "confirmed" ? "Viewing confirmed" : "Viewing declined", status === "confirmed" ? "✅" : "🚫");
    } catch {
      if (addToast) addToast("Couldn't update the viewing.", "❌");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Internal scroll container — pad the bottom on mobile so the last rows
          and Save button clear the fixed bottom nav (this page doesn't body-scroll). */}
      <div className="flex flex-col h-[calc(100vh-64px)] bg-background p-4 sm:p-6 pb-28 sm:pb-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full space-y-6 sm:space-y-8">

          <div>
            <h1 className="font-working-title text-2xl sm:text-3xl text-on-surface">Calendar &amp; Availability</h1>
            <p className="text-sm sm:text-base text-text-secondary mt-1 sm:mt-2">Manage your viewing schedules and block off dates.</p>
          </div>

          {/* Appointments Section */}
          <section className="bg-[#121212] border border-surface-variant rounded-lg p-4 sm:p-6">
            <h2 className="font-working-title text-xl text-on-surface mb-4">Upcoming Viewings</h2>
            
            {loading ? (
              <p className="text-text-muted">Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p className="text-text-muted">No upcoming viewings scheduled.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map(appt => {
                  const when = new Date(appt.scheduledAt).toLocaleString(undefined, {
                    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  });
                  const canRespond = appt.status === "pending" && appt.isHost;
                  return (
                    <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-surface-variant rounded bg-background">
                      <div>
                        <h3 className="font-working-title text-on-surface">{appt.propertyTitle}</h3>
                        <p className="text-sm text-text-secondary">Viewing with <strong>{appt.contactName}</strong> • {when}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {canRespond ? (
                          <>
                            <button
                              onClick={() => updateAppointment(appt.id, "cancelled")}
                              disabled={updatingId === appt.id}
                              className="text-xs text-error border border-error/30 px-3 py-1.5 rounded hover:bg-error/10 uppercase tracking-wider font-mono disabled:opacity-50"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => updateAppointment(appt.id, "confirmed")}
                              disabled={updatingId === appt.id}
                              className="text-xs text-background bg-gold-accent px-3 py-1.5 rounded hover:bg-gold-bright uppercase tracking-wider font-mono disabled:opacity-50"
                            >
                              Accept
                            </button>
                          </>
                        ) : (
                          <span className={`text-xs px-3 py-1.5 rounded uppercase tracking-wider font-mono border ${
                            appt.status === "confirmed" ? "text-gold-accent bg-gold-accent/10 border-gold-accent/20"
                            : appt.status === "cancelled" ? "text-error bg-error/10 border-error/20"
                            : appt.status === "completed" ? "text-text-secondary bg-surface-variant border-surface-variant"
                            : "text-text-secondary bg-surface-variant/40 border-surface-variant"
                          }`}>
                            {appt.status === "pending" ? "Awaiting host" : appt.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Availability Settings */}
          <section className="bg-[#121212] border border-surface-variant rounded-lg p-4 sm:p-6">
            <h2 className="font-working-title text-xl text-on-surface mb-2">Weekly Availability</h2>
            <p className="text-sm text-text-secondary mb-6">Set the standard hours you are available for live property viewings. Buyers can only request times within these windows.</p>
            
            <div className="space-y-4 max-w-xl">
              {Object.entries(schedule).map(([day, config]) => (
                <div key={day} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 p-3 border border-surface-variant/50 rounded bg-[#1a1a1a]">
                  <label className="flex items-center gap-2 w-full sm:w-32 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.active}
                      onChange={(e) => setSchedule({...schedule, [day]: { ...config, active: e.target.checked }})}
                      className="accent-gold-accent w-4 h-4"
                    />
                    <span className="capitalize text-sm text-on-surface">{day}</span>
                  </label>

                  {config.active ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="time"
                        value={config.start}
                        onChange={(e) => setSchedule({...schedule, [day]: { ...config, start: e.target.value }})}
                        className="flex-1 sm:flex-none min-w-0 bg-background border border-surface-variant rounded px-2 py-2 sm:py-1 text-sm text-on-surface focus:outline-none focus:border-gold-accent"
                      />
                      <span className="text-text-muted shrink-0">-</span>
                      <input
                        type="time"
                        value={config.end}
                        onChange={(e) => setSchedule({...schedule, [day]: { ...config, end: e.target.value }})}
                        className="flex-1 sm:flex-none min-w-0 bg-background border border-surface-variant rounded px-2 py-2 sm:py-1 text-sm text-on-surface focus:outline-none focus:border-gold-accent"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted italic">Unavailable</span>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-surface-variant">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-surface-variant hover:bg-surface-variant/80 text-on-surface px-6 py-2 rounded text-sm font-working-title transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Settings"}
                </button>
              </div>
            </div>
          </section>

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
