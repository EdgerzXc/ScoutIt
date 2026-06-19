"use client";

import Link from "next/link";
import { Camera, Image, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PhotographerPanel({ projects = [], userId, isAvailable, isOwnView = false }) {
  const [available, setAvailable] = useState(isAvailable ?? true);
  const [saving, setSaving] = useState(false);

  const isEmpty = !projects || projects.length === 0;

  const toggleAvailability = async () => {
    if (!isOwnView) return;
    const next = !available;
    setAvailable(next);
    setSaving(true);
    await supabase
      .from("user_profiles")
      .update({ provider_availability: next, updated_at: new Date().toISOString() })
      .eq("id", userId);
    setSaving(false);
  };

  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Camera size={14} strokeWidth={1.5} color="#ffb800" />
          <span style={panelLabel}>Photographer</span>
        </div>
        {isOwnView && (
          <button
            onClick={toggleAvailability}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: "none", border: "none", padding: 0 }}
            aria-label={available ? "Mark as unavailable" : "Mark as available"}
          >
            {available ? (
              <ToggleRight size={20} strokeWidth={1.5} color="#ffb800" />
            ) : (
              <ToggleLeft size={20} strokeWidth={1.5} color="var(--text-secondary)" />
            )}
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: available ? "#ffb800" : "var(--text-secondary)", letterSpacing: "0.06em" }}>
              {available ? "Available" : "Unavailable"}
            </span>
          </button>
        )}
        {!isOwnView && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: available ? "#4caf7d" : "var(--text-secondary)",
              textTransform: "uppercase",
              border: `1px solid ${available ? "rgba(76,175,125,0.3)" : "rgba(255,255,255,0.08)"}`,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {available ? "Available" : "Unavailable"}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div style={emptyState}>
          <p style={emptyText}>Add your first portfolio item to start showcasing your work.</p>
          <Link href="/dashboard" style={emptyCta}>Upload Work</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Image size={12} strokeWidth={1.5} color="var(--text-secondary)" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-secondary)" }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div style={portfolioGrid}>
            {projects.slice(0, 6).map((p) => (
              <div key={p.id} style={portfolioCell}>
                {p.cover_image ? (
                  <img
                    src={p.cover_image}
                    alt={p.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Camera size={16} strokeWidth={1.5} color="rgba(255,255,255,0.15)" />
                  </div>
                )}
                <div style={portfolioCellLabel}>{p.title}</div>
              </div>
            ))}
          </div>

          {projects.length > 6 && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-secondary)" }}>
              +{projects.length - 6} more projects
            </span>
          )}
        </div>
      )}
    </section>
  );
}

const panelStyle = {
  background: "#161616",
  border: "1px solid rgba(255,255,255,0.05)",
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
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#ffb800",
};

const portfolioGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 6,
};

const portfolioCell = {
  position: "relative",
  aspectRatio: "1 / 1",
  background: "#1e1e1e",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 3,
  overflow: "hidden",
};

const portfolioCellLabel = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "4px 6px",
  background: "rgba(0,0,0,0.7)",
  fontFamily: "var(--font-body)",
  fontSize: 9,
  color: "rgba(255,255,255,0.7)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const emptyState = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 12,
  padding: "8px 0",
};

const emptyText = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--text-secondary)",
  fontStyle: "italic",
  lineHeight: 1.6,
};

const emptyCta = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "#ffb800",
  letterSpacing: "0.06em",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};
