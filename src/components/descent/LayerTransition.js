"use client";

import Link from "next/link";

import styles from "@/components/descent/layerChrome.module.css";
import { useSimpleMode } from "@/hooks/useSimpleMode";
import { chapterSubtitleVisible } from "@/lib/simpleModeSurfaces";

// A-083 phase 5 — the descent layers, lightest touch.
//
// Specification 6.6: "The rule removes teaser paragraphs and chapter subtitles
// and nothing else. Do NOT alter the layer chain, numbering or navigation."
//
// So the teaser sentence is `description` and Simple omits it. The layer
// number, the altitude, the name, the arrow and the link itself are core and
// untouched — the chain still reads Orbit 01 → Core 06 in both modes, and the
// section's own aria-label is unchanged, so the accessible name of the
// navigation never depends on the reading mode.
export default function LayerTransition({ nextNum, nextName, nextHref, teaser, altitude }) {
  const simple = useSimpleMode();

  return (
    <section className={styles.transition} aria-label={`Continue to ${nextName}`}>
      <div className={styles.transitionInner}>
        <div className={styles.transitionDivider} aria-hidden="true" />
        <span className={styles.transitionKicker}>Continue cascading descent</span>
        <Link href={nextHref} className={styles.transitionLink}>
          <span className={styles.transitionBadgeRow}>
            <span className={styles.transitionNum}>Layer {nextNum}</span>
            {altitude && <span className={styles.altitude}>{altitude}</span>}
          </span>
          <span className={styles.transitionName}>{nextName}</span>
          {chapterSubtitleVisible(teaser, simple) && (
            <span className={styles.transitionTeaser}>{teaser}</span>
          )}
          <span className={styles.transitionArrow} aria-hidden="true">↓</span>
        </Link>
      </div>
    </section>
  );
}
