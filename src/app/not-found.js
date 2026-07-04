import Link from "next/link";

export const metadata = {
  title: "Signal Lost · ScoutIt",
};

export default function NotFound() {
  return (
    <div className="nf-root">
      <div className="nf-grid" aria-hidden="true">
        {Array.from({ length: 64 }).map((_, i) => (
          <span key={i} className="nf-dot" />
        ))}
      </div>

      <div className="nf-radar" aria-hidden="true">
        <div className="nf-ring nf-ring-1" />
        <div className="nf-ring nf-ring-2" />
        <div className="nf-ring nf-ring-3" />
        <div className="nf-pulse" />
      </div>

      <div className="nf-content">
        <span className="nf-layer-label">LAYER ∞ // UNCHARTED SPACE</span>
        <h1 className="nf-title">Signal Lost</h1>
        <p className="nf-sub">
          The coordinates you entered don&apos;t exist in our database.
          <br />
          The space may have moved — or it was never mapped.
        </p>

        <div className="nf-actions">
          <Link href="/" className="nf-btn-primary">← Return to Base</Link>
          <Link href="/discover" className="nf-btn-secondary">Explore Spaces</Link>
        </div>
      </div>

      <style>{`
        .nf-root {
          position: relative;
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: var(--font-geist-mono, monospace);
        }

        /* dot grid */
        .nf-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          grid-template-rows: repeat(8, 1fr);
          pointer-events: none;
        }
        .nf-dot {
          display: block;
          margin: auto;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(232, 174, 60, 0.12);
        }

        /* radar rings */
        .nf-radar {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .nf-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(232, 174, 60, 0.08);
        }
        .nf-ring-1 { width: 220px; height: 220px; }
        .nf-ring-2 { width: 420px; height: 420px; }
        .nf-ring-3 { width: 640px; height: 640px; }

        .nf-pulse {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent, #E8AE3C);
          box-shadow: 0 0 0 0 rgba(232, 174, 60, 0.6);
          animation: nf-ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes nf-ping {
          0%   { box-shadow: 0 0 0 0 rgba(232, 174, 60, 0.6); }
          70%  { box-shadow: 0 0 0 28px rgba(232, 174, 60, 0); }
          100% { box-shadow: 0 0 0 0 rgba(232, 174, 60, 0); }
        }

        /* content */
        .nf-content {
          position: relative;
          z-index: 10;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 32px 24px;
        }

        .nf-layer-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          color: var(--accent, #E8AE3C);
          text-transform: uppercase;
        }

        .nf-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(3rem, 8vw, 6rem);
          font-weight: 400;
          color: #f5f3ee;
          line-height: 1;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .nf-sub {
          font-size: 14px;
          line-height: 1.7;
          color: rgba(200, 200, 200, 0.6);
          max-width: 380px;
          letter-spacing: 0.01em;
        }

        .nf-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .nf-btn-primary {
          padding: 12px 28px;
          background: var(--accent, #E8AE3C);
          color: #0a0a0a;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 2px;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .nf-btn-primary:hover {
          background: var(--accent-bright, #F7C64E);
          transform: translateY(-1px);
        }

        .nf-btn-secondary {
          padding: 12px 28px;
          background: transparent;
          color: #f5f3ee;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 2px;
          transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .nf-btn-secondary:hover {
          border-color: var(--accent, #E8AE3C);
          color: var(--accent, #E8AE3C);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
