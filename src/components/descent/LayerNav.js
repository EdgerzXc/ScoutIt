"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import ScoutItMark from "@/components/brand/ScoutItMark";
import ScoutItWordmark from "@/components/brand/ScoutItWordmark";
import AmbientRail from "@/components/layout/ambient/AmbientRail";
import styles from "@/components/descent/layerChrome.module.css";

export const DESCENT_LAYERS = [
  { num: "01", id: "orbit", label: "Orbit", plain: "Orbit", href: "/layer/orbit" },
  { num: "02", id: "stratosphere", label: "Stratosphere", plain: "Intel", href: "/layer/stratosphere" },
  { num: "03", id: "metropolis", label: "Metropolis", plain: "Explore", href: "/layer/metropolis" },
  { num: "04", id: "crust", label: "Crust", plain: "Network", href: "/layer/crust" },
  { num: "05", id: "mantle", label: "Mantle", plain: "Discover", href: "/layer/mantle" },
  { num: "06", id: "core", label: "Core", plain: "Workspace", href: "/layer/core" },
];

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
      aria-label={`${previous ? "Previous" : "Next"} layer: ${label}${plain ? ` · ${plain}` : ""}`}
    >
      {previous && (
        <span className={`${styles.arrow} ${styles.arrowPrev}`} aria-hidden="true">
          ←
        </span>
      )}
      <span className={styles.pillLabel}>
        {label}
        {plain && <span className={styles.plain}> · {plain}</span>}
      </span>
      <span className={styles.pillCompactLabel} aria-hidden="true">
        {previous ? "PREV" : "NEXT"}
      </span>
      {!previous && (
        <span className={`${styles.arrow} ${styles.arrowNext}`} aria-hidden="true">
          →
        </span>
      )}
    </Link>
  );
}

export default function LayerNav({
  layer = null,
  prev = undefined,
  next = undefined,
  ambientContext = null,
}) {
  const pathname = usePathname();

  // Find layer index either from explicit layer prop (number 1-6 or string id/label) or pathname
  let currentIdx = -1;
  if (typeof layer === "number") {
    currentIdx = layer - 1;
  } else if (typeof layer === "string") {
    const q = layer.trim().toLowerCase();
    currentIdx = DESCENT_LAYERS.findIndex(
      (l) => l.id === q || l.label.toLowerCase() === q || l.num === q
    );
  } else if (pathname) {
    currentIdx = DESCENT_LAYERS.findIndex((l) => pathname.startsWith(l.href));
  }

  const autoPrev = currentIdx > 0 ? DESCENT_LAYERS[currentIdx - 1] : null;
  const autoNext =
    currentIdx >= 0 && currentIdx < DESCENT_LAYERS.length - 1
      ? DESCENT_LAYERS[currentIdx + 1]
      : null;

  const resolvedPrev = prev !== undefined ? prev : autoPrev;
  const resolvedNext = next !== undefined ? next : autoNext;

  return (
    <nav className={styles.nav} aria-label="Layer navigation">
      <div className={styles.navEdge}>
        {resolvedPrev && (
          <NavPill
            href={resolvedPrev.href}
            label={resolvedPrev.label}
            dir="prev"
          />
        )}
      </div>

      <ScoutItWordmark
        href="/"
        className={styles.brand}
        leading={<ScoutItMark />}
      />

      <div className={styles.navEnd}>
        <div className={styles.ambient}>
          <AmbientRail user={null} context={ambientContext} />
        </div>
        {resolvedNext && (
          <NavPill
            href={resolvedNext.href}
            label={resolvedNext.label}
            dir="next"
          />
        )}
      </div>
    </nav>
  );
}
