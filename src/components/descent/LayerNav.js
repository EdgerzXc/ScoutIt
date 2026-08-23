"use client";

import Link from "next/link";

import ScoutItWordmark from "@/components/brand/ScoutItWordmark";
import AmbientRail from "@/components/layout/ambient/AmbientRail";
import styles from "@/components/descent/layerChrome.module.css";

const LAYER_PLAIN = {
  Orbit: "Orbit",
  Stratosphere: "Intel",
  Metropolis: "Explore",
  Crust: "Network",
  Mantle: "Discover",
  Core: "Workspace",
};

function NavPill({ href, label, dir }) {
  const previous = dir === "prev";
  const plain = LAYER_PLAIN[label];

  return (
    <Link
      href={href}
      className={styles.pill}
      aria-label={`${previous ? "Previous" : "Next"} layer: ${label}${plain ? ` — ${plain}` : ""}`}
    >
      {previous && <span className={`${styles.arrow} ${styles.arrowPrev}`} aria-hidden="true">←</span>}
      <span className={styles.pillLabel}>
        {label}
        {plain && <span className={styles.plain}> · {plain}</span>}
      </span>
      {!previous && <span className={`${styles.arrow} ${styles.arrowNext}`} aria-hidden="true">→</span>}
    </Link>
  );
}

export default function LayerNav({ prev = null, next = null, ambientContext = null }) {
  return (
    <nav className={styles.nav} aria-label="Layer navigation">
      <div className={styles.navEdge}>
        {prev && <NavPill href={prev.href} label={prev.label} dir="prev" />}
      </div>

      <ScoutItWordmark href="/" className={styles.brand} />

      <div className={styles.navEnd}>
        <div className={styles.ambient}>
          <AmbientRail user={null} context={ambientContext} />
        </div>
        {next && <NavPill href={next.href} label={next.label} dir="next" />}
      </div>
    </nav>
  );
}
