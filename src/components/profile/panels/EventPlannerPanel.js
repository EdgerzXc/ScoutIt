"use client";

import { CalendarDays, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EventPlannerPanel({
  userId,
  isAvailable,
  isOwnView = false,
  specialties = [],
}) {
  const [available, setAvailable] = useState(isAvailable ?? true);
  const [saving, setSaving] = useState(false);

  const toggleAvailability = async () => {
    if (!isOwnView) return;
    const next = !available;
    setAvailable(next);
    setSaving(true);
    const { error } = await supabase
      .from("user_profiles")
      .update({ provider_availability: next, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) setAvailable(available);
    setSaving(false);
  };

  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarDays size={14} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <span style={panelLabel}>Event Designer &amp; Planner</span>
        </div>
        {isOwnView && (
          <button
            onClick={toggleAvailability}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: "none", border: "none", padding: 0 }}
            aria-label={available ? "Mark as unavailable" : "Mark as available"}
          >
            {available ? (
              <ToggleRight size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
            ) : (
              <ToggleLeft size={20} strokeWidth={1.5} color="var(--text-secondary)" />
            )}
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: available ? "var(--accent)" : "var(--text-secondary)", letterSpacing: "0.06em" }}>
              {available ? "Available" : "Unavailable"}
            </span>
          </button>
        )}
        {!isOwnView && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              letterSpacing: "0.08em",
              color: available ? "var(--accent)" : "var(--text-secondary)",
              textTransform: "uppercase",
            }}
          >
            {available ? "Accepting briefs" : "Briefs paused"}
          </span>
        )}
      </div>

      <div style={scopeBox}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Sparkles size={13} style={{ color: "var(--accent)" }} />
          <strong style={scopeHeading}>Venue Activation &amp; Space Planning</strong>
        </div>
        <p style={scopeText}>
          Coordinates operational venue briefs, spatial layout transformations, and guest journey staging for high-stakes commercial and private events.
        </p>
      </div>

      {specialties && specialties.length > 0 && (
        <div style={chipsContainer}>
          {specialties.map((s) => (
            <span key={s} style={chipStyle}>{s}</span>
          ))}
        </div>
      )}
    </section>
  );
}

const panelStyle = {
  background: "linear-gradient(165deg, var(--surface2), var(--surface))",
  border: "1px solid var(--border-subtle)",
  borderRadius: 6,
  padding: 24,
};

const panelHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 20,
};

const panelLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--accent)",
};

const scopeBox = {
  background: "rgba(0,0,0,0.25)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 4,
  padding: "14px 16px",
};

const scopeHeading = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-primary)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const scopeText = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  margin: 0,
};

const chipsContainer = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 14,
};

const chipStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-secondary)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 3,
  padding: "3px 8px",
  letterSpacing: "0.05em",
};
