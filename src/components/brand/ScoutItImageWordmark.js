/**
 * ImageResponse/Satori-safe ScoutIt wordmark. Generated images do not inherit
 * browser stylesheets, so their root must define --accent and --text-primary.
 */
export default function ScoutItImageWordmark({ fontSize = 72, fontWeight = 800, letterSpacing = "-0.02em" }) {
  const shared = { fontSize, fontWeight, letterSpacing, lineHeight: 1 };
  return (
    <div style={{ display: "flex", alignItems: "baseline", fontFamily: "sans-serif" }}>
      <span style={{ ...shared, color: "var(--accent)" }}>S</span>
      <span style={{ ...shared, color: "var(--text-primary)" }}>cout</span>
      <span style={{ ...shared, color: "var(--accent)" }}>IT</span>
    </div>
  );
}
