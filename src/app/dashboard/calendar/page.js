"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";

function CalendarInner() {
  const { addToast } = useDashboard();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Availability Settings
  const [schedule, setSchedule] = useState({
    monday: { active: true, start: "09:00", end: "17:00" },
    tuesday: { active: true, start: "09:00", end: "17:00" },
    wednesday: { active: true, start: "09:00", end: "17:00" },
    thursday: { active: true, start: "09:00", end: "17:00" },
    friday: { active: true, start: "09:00", end: "17:00" },
    saturday: { active: false, start: "09:00", end: "17:00" },
    sunday: { active: false, start: "09:00", end: "17:00" },
  });

  useEffect(() => {
    // Simulated fetch from /api/availability
    setTimeout(() => {
      setAppointments([
        { id: 1, property: "The Paragon Tower", guest: "John Doe", time: "Tomorrow at 2:00 PM", status: "pending" },
        { id: 2, property: "BGC Corporate Center", guest: "Alice Smith", time: "Friday at 10:00 AM", status: "confirmed" }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSaveSettings = async () => {
    // In a real app: POST to /api/availability
    if (addToast) addToast("Availability saved!", "✅");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] bg-background p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full space-y-8">
          
          <div>
            <h1 className="font-working-title text-3xl text-on-surface">Calendar & Availability</h1>
            <p className="text-text-secondary mt-2">Manage your viewing schedules and block off dates.</p>
          </div>

          {/* Appointments Section */}
          <section className="bg-[#121212] border border-surface-variant rounded-lg p-6">
            <h2 className="font-working-title text-xl text-on-surface mb-4">Upcoming Viewings</h2>
            
            {loading ? (
              <p className="text-text-muted">Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p className="text-text-muted">No upcoming viewings scheduled.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map(appt => (
                  <div key={appt.id} className="flex items-center justify-between p-4 border border-surface-variant rounded bg-background">
                    <div>
                      <h3 className="font-working-title text-on-surface">{appt.property}</h3>
                      <p className="text-sm text-text-secondary">Viewing with <strong>{appt.guest}</strong> • {appt.time}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {appt.status === 'pending' ? (
                        <>
                          <button className="text-xs text-error border border-error/30 px-3 py-1.5 rounded hover:bg-error/10 uppercase tracking-wider font-mono">Decline</button>
                          <button className="text-xs text-background bg-gold-accent px-3 py-1.5 rounded hover:bg-gold-bright uppercase tracking-wider font-mono">Accept</button>
                        </>
                      ) : (
                        <span className="text-xs text-gold-accent bg-gold-accent/10 px-3 py-1.5 rounded uppercase tracking-wider font-mono border border-gold-accent/20">
                          Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Availability Settings */}
          <section className="bg-[#121212] border border-surface-variant rounded-lg p-6">
            <h2 className="font-working-title text-xl text-on-surface mb-2">Weekly Availability</h2>
            <p className="text-sm text-text-secondary mb-6">Set the standard hours you are available for live property viewings. Buyers can only request times within these windows.</p>
            
            <div className="space-y-4 max-w-xl">
              {Object.entries(schedule).map(([day, config]) => (
                <div key={day} className="flex items-center gap-4 p-3 border border-surface-variant/50 rounded bg-[#1a1a1a]">
                  <label className="flex items-center gap-2 w-32 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={config.active}
                      onChange={(e) => setSchedule({...schedule, [day]: { ...config, active: e.target.checked }})}
                      className="accent-gold-accent"
                    />
                    <span className="capitalize text-sm text-on-surface">{day}</span>
                  </label>

                  {config.active ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="time" 
                        value={config.start}
                        onChange={(e) => setSchedule({...schedule, [day]: { ...config, start: e.target.value }})}
                        className="bg-background border border-surface-variant rounded px-2 py-1 text-sm text-on-surface focus:outline-none focus:border-gold-accent"
                      />
                      <span className="text-text-muted">-</span>
                      <input 
                        type="time" 
                        value={config.end}
                        onChange={(e) => setSchedule({...schedule, [day]: { ...config, end: e.target.value }})}
                        className="bg-background border border-surface-variant rounded px-2 py-1 text-sm text-on-surface focus:outline-none focus:border-gold-accent"
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
                  className="bg-surface-variant hover:bg-surface-variant/80 text-on-surface px-6 py-2 rounded text-sm font-working-title transition-colors"
                >
                  Save Settings
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
