"use client";

// Flood/hazard risk indicator — PUBLIC, NEVER gated (per FIELD_VISIBILITY_MAP.md:
// "flood/hazard risk is decision-critical and is never gated"). Renders from the
// already-live Airtable fields `FloodRiskScore` (number) and `FloodZoneStatus` (text).
// No external data source wired yet — see HEATMAP_NOAH_INTEGRATION.md for the plan to
// populate real scores and add a visual map overlay.

const SEVERITY_BANDS = [
  { max: 25, label: "Low", color: "#4caf7d" },
  { max: 50, label: "Moderate", color: "#e8c84a" },
  { max: 75, label: "High", color: "#e8934a" },
  { max: Infinity, label: "Severe", color: "#e8644a" },
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
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "#161616", border: "0.5px solid #262626", borderRadius: "4px", marginBottom: "16px" }}>
      <span
        style={{
          width: "9px",
          height: "9px",
          borderRadius: "50%",
          background: severity ? severity.color : "#5a5a5a",
          boxShadow: severity ? `0 0 6px ${severity.color}` : "none",
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: "9.5px", color: "#c8c8c8", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          Flood / Hazard Risk{severity ? ` — ${severity.label}` : ""}
        </span>
        {hasStatus && (
          <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#f0ede8" }}>{floodZoneStatus}</span>
        )}
      </div>
    </div>
  );
}
