export const metadata = {
  title: "Owner Tutorial — Submit to Publish | ScoutIt",
  description: "Step-by-step: private draft, address-only geocode, RESA declaration, publish, slug lock, inbox.",
};

const STEPS = [
  ["01", "Start a private draft", "Dashboard → Owner mode → New listing. Saves to Supabase only."],
  ["02", "Type the address, skip the pin", "Street + district is enough. Server geocodes via Mapbox."],
  ["03", "State your relationship", "Owner / manager / broker + sovereignty tick (RESA RA 9646)."],
  ["04", "Hit publish", "POST /api/dashboard/publish. Preparing → Syncing → LIVE."],
  ["05", "Airtable goes live, slug locks", "Canonical slug is read back and frozen."],
  ["06", "Answer threads, stay fresh", "Connects land in your inbox. Completeness is ranking."],
];

export default function OwnerPublishTutorialPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 24px 80px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontSize: 12,
          color: "var(--accent-bright)",
        }}
      >
        Owner tutorial · Submit to publish · 48s
      </p>
      <h1
        style={{
          fontSize: "clamp(28px, 4vw, 52px)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          margin: "16px 0 8px",
          textAlign: "center",
        }}
      >
        Publish your space, step by step
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 28, textAlign: "center", maxWidth: 640 }}>
        Press play. Six steps, mapped to the live product — no guesswork.
      </p>
      <video
        controls
        preload="metadata"
        playsInline
        style={{
          width: "min(960px, 100%)",
          aspectRatio: "16 / 9",
          borderRadius: 16,
          border: "1px solid var(--accent-muted)",
          backgroundColor: "var(--bg)",
          boxShadow: "0 40px 90px var(--shadow-2xl)",
        }}
      >
        <source src="/video/tutorials/owner-publish-tutorial.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <ol
        style={{
          width: "min(960px, 100%)",
          marginTop: 32,
          display: "grid",
          gap: 12,
          listStyle: "none",
          padding: 0,
        }}
      >
        {STEPS.map(([n, title, body]) => (
          <li
            key={n}
            style={{
              border: "1px solid var(--accent-muted)",
              borderRadius: 12,
              padding: "14px 18px",
              background: "var(--surface-alt)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.12em",
                color: "var(--accent-bright)",
              }}
            >
              {n}
            </span>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{title}</div>
            <div style={{ opacity: 0.7, fontSize: 14, marginTop: 2 }}>{body}</div>
          </li>
        ))}
      </ol>
      <a
        href="/dashboard"
        style={{
          marginTop: 32,
          fontFamily: "var(--font-mono)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontSize: 13,
          color: "var(--accent-bright)",
          textDecoration: "none",
          border: "1px solid var(--accent-muted)",
          padding: "12px 28px",
          borderRadius: 999,
        }}
      >
        Open dashboard →
      </a>
    </main>
  );
}
