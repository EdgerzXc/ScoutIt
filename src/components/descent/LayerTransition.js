import Link from "next/link";

import styles from "@/components/descent/layerChrome.module.css";

export default function LayerTransition({ nextNum, nextName, nextHref, teaser, altitude }) {
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
          <span className={styles.transitionTeaser}>{teaser}</span>
          <span className={styles.transitionArrow} aria-hidden="true">↓</span>
        </Link>
      </div>
    </section>
  );
}
