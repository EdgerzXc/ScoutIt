"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0d0d0d",
          color: "#f0ede8",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: "40px 20px",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "540px",
            width: "100%",
            textAlign: "center",
            padding: "40px 32px",
            background: "rgba(18, 18, 18, 0.8)",
            border: "1px solid rgba(110, 83, 26, 0.3)",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#E8AE3C",
              marginBottom: "16px",
            }}
          >
            SYSTEM SHIELD · CRITICAL RECOVERY
          </div>
          <h1
            style={{
              color: "#f0ede8",
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 400,
              margin: "0 0 12px 0",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#8a8a8a",
              lineHeight: 1.6,
              fontSize: "14px",
              margin: "0 0 24px 0",
            }}
          >
            A transient system recovery boundary was triggered on ScoutIt. Our telemetry stream has captured the state trace.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#F7C64E",
              color: "#0d0d0d",
              border: "none",
              padding: "12px 28px",
              borderRadius: "6px",
              fontWeight: 700,
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms ease",
              boxShadow: "0 4px 14px rgba(247, 198, 78, 0.2)",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.97)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            RELOAD APPLICATION STATE
          </button>
        </div>
      </body>
    </html>
  );
}
