import Link from "next/link";
import "./not-found.css";

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

    </div>
  );
}
