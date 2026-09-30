"use client";

// Flood/hazard risk indicator — PUBLIC, NEVER gated (per FIELD_VISIBILITY_MAP.md:
// "flood/hazard risk is decision-critical and is never gated"). Renders from the
// already-live Airtable fields `FloodRiskScore` (number) and `FloodZoneStatus` (text).
// No external data source wired yet — see HEATMAP_NOAH_INTEGRATION.md for the plan to
// populate real scores and add a visual map overlay.

const SEVERITY_BANDS = [
  { max: 25, label: "Low", color: "var(--green)" },
  { max: 50, label: "Moderate", color: "var(--yellow)" },
  { max: 75, label: "High", color: "var(--flood-high)" },
  { max: Infinity, label: "Severe", color: "var(--red)" },
];

function severityFor(score) {
  return SEVERITY_BANDS.find((b) => score <= b.max) || SEVERITY_BANDS[SEVERITY_BANDS.length - 1];
}

export default function FloodRiskBadge({ floodRiskScore, floodZoneStatus }) {
  const hasScore = floodRiskScore !== null && floodRiskScore !== undefined && floodRiskScore !== "" && Number(floodRiskScore) > 0;
  const hasStatus = floodZoneStatus && String(floodZoneStatus).trim() !== "";

  // Honest-blank rule: no data at all → render nothing, never invent a risk level.
  if (!hasScore && !hasStatus) return null;

  const severity = hasScore ? severityFor(Number(floodRiskScore)) : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "var(--surface2)", border: "0.5px solid var(--border-solid)", borderRadius: "4px", marginBottom: "16px" }}>
      <span
        style={{
          width: "9px",
          height: "9px",
          borderRadius: "50%",
          background: severity ? severity.color : "var(--text-muted)",
          boxShadow: severity ? `0 0 6px ${severity.color}` : "none",
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          Flood / Hazard Risk{severity ? ` — ${severity.label}` : ""}
        </span>
        {hasStatus && (
          <span style={{ fontFamily: "var(--font-display)", fontSize: "13px", color: "var(--text-primary)" }}>{floodZoneStatus}</span>
        )}
      </div>
    </div>
  );
}
