"use client";

import { useState, useEffect, useCallback } from "react";
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

/**
 * Weekly availability editor — the standard hours a host is bookable for live
 * viewings. Self-contained: loads and saves its own config via /api/availability.
 * (Lifted verbatim from the previous calendar page so behavior is unchanged.)
 * @param {{ userId: string, addToast?: (msg, icon)=>void }} props
 */
export default function AvailabilityPanel({ userId, addToast }) {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await crmFetch(`/api/availability?userId=${userId}`, { mockUserId: userId });
      const saved = res?.config?.weekly_schedule;
      if (saved && Object.keys(saved).length > 0) {
        setSchedule({ ...DEFAULT_SCHEDULE, ...saved });
      }
    } catch {
      /* no saved availability yet — keep defaults */
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await crmFetch("/api/availability", {
        method: "POST",
        body: { weekly_schedule: schedule },
        mockUserId: userId,
      });
      addToast?.("Availability saved!", "✅");
    } catch {
      addToast?.("Couldn't save availability — please try again.", "❌");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-[#121212] border border-surface-variant rounded-lg p-4 sm:p-6">
      <h2 className="font-working-title text-xl text-on-surface mb-2">Weekly Availability</h2>
      <p className="text-sm text-text-secondary mb-6">
        Set the standard hours you are available for live property viewings. Buyers can only request
        times within these windows.
      </p>

      <div className="space-y-4 max-w-xl">
        {Object.entries(schedule).map(([day, config]) => (
          <div
            key={day}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 p-3 border border-surface-variant/50 rounded bg-[#1a1a1a]"
          >
            <label className="flex items-center gap-2 w-full sm:w-32 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={config.active}
                onChange={(e) => setSchedule({ ...schedule, [day]: { ...config, active: e.target.checked } })}
                className="accent-gold-accent w-4 h-4"
              />
              <span className="capitalize text-sm text-on-surface">{day}</span>
            </label>

            {config.active ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="time"
                  value={config.start}
                  onChange={(e) => setSchedule({ ...schedule, [day]: { ...config, start: e.target.value } })}
                  className="flex-1 sm:flex-none min-w-0 bg-background border border-surface-variant rounded px-2 py-2 sm:py-1 text-sm text-on-surface focus:outline-none focus:border-gold-accent"
                />
                <span className="text-text-muted shrink-0">-</span>
                <input
                  type="time"
                  value={config.end}
                  onChange={(e) => setSchedule({ ...schedule, [day]: { ...config, end: e.target.value } })}
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
            onClick={handleSave}
            disabled={saving}
            className="bg-surface-variant hover:bg-surface-variant/80 text-on-surface px-6 py-2 rounded text-sm font-working-title transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </section>
  );
}
