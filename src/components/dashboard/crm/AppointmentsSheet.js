"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

export default function AppointmentsSheet({ appointments, onStatusUpdate }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleUpdate = async (id, status) => {
    setUpdatingId(id);
    if (onStatusUpdate) {
      await onStatusUpdate(id, status);
    }
    setUpdatingId(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed": return <span className="bg-success/10 text-success border border-success/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Confirmed</span>;
      case "cancelled": return <span className="bg-error/10 text-error border border-error/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Cancelled</span>;
      case "completed": return <span className="bg-surface-variant text-text-secondary border border-surface-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Completed</span>;
      default: return <span className="bg-gold-accent/10 text-gold-accent border border-gold-accent/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Pending</span>;
    }
  };

  // Grouping logic (simplified)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const nextWeekStart = new Date(todayStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const groups = {
    "Today": [],
    "This Week": [],
    "Later": [],
    "Past": []
  };

  appointments.forEach(appt => {
    const date = new Date(appt.scheduledAt);
    if (date < todayStart) {
      groups["Past"].push(appt);
    } else if (date >= todayStart && date < tomorrowStart) {
      groups["Today"].push(appt);
    } else if (date >= tomorrowStart && date < nextWeekStart) {
      groups["This Week"].push(appt);
    } else {
      groups["Later"].push(appt);
    }
  });

  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pb-10">
      {Object.entries(groups).map(([label, appts]) => {
        if (appts.length === 0) return null;
        return (
          <div key={label}>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="font-label-caps text-xs tracking-widest uppercase text-text-secondary">{label}</h3>
              <div className="flex-1 h-px bg-surface-variant"></div>
            </div>
            
            <div className="flex flex-col gap-3">
              {appts.map(appt => {
                const date = new Date(appt.scheduledAt);
                return (
                  <div key={appt.id} className="bg-surface-alt border border-surface-variant rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-gold-accent/40">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(appt.status)}
                        <span className="font-working-title text-sm text-on-surface">{appt.propertyTitle}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-text-muted" />
                          <span>{date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-text-muted" />
                          <span>{date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-text-muted" />
                          <span>With: <strong className="text-on-surface">{appt.contactName}</strong></span>
                        </div>
                      </div>
                      
                      {appt.notes && (
                        <div className="mt-3 text-xs text-text-muted italic border-l-2 border-surface-variant pl-2">
                          "{appt.notes}"
                        </div>
                      )}
                    </div>

                    {appt.status === "pending" && appt.isHost && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdate(appt.id, "cancelled")}
                          disabled={updatingId === appt.id}
                          className="px-3 py-1.5 rounded border border-error/30 text-error hover:bg-error/10 transition-colors text-xs font-working-title flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Decline
                        </button>
                        <button 
                          onClick={() => handleUpdate(appt.id, "confirmed")}
                          disabled={updatingId === appt.id}
                          className="px-3 py-1.5 rounded border border-success/30 text-success hover:bg-success/10 transition-colors text-xs font-working-title flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle size={14} /> Confirm
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-text-muted">
          <Calendar size={48} className="mb-4 opacity-20" />
          <p className="font-working-title">No appointments scheduled.</p>
        </div>
      )}
    </div>
  );
}
