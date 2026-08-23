import Link from "next/link";

import styles from "@/components/descent/layerChrome.module.css";

export default function LayerHeader({ layerNum, layerName, title, description, missionText, ctaText, ctaHref }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.headerTop}>
          <span className={styles.kicker}>{`Layer ${layerNum} // ${layerName}`}</span>
        </div>

        <div className={styles.headerSplit}>
          <div className={styles.headerLead}>
            <h1 className={styles.title}>{title}</h1>
            {description && <p className={styles.description}>{description}</p>}
            {ctaText && ctaHref && (
              <Link href={ctaHref} className={styles.primaryCta}>{ctaText}</Link>
            )}
          </div>

          {missionText && (
            <section className={styles.mission} aria-label="Layer mission">
              <h2 className={styles.missionLabel}>Mission</h2>
              <p className={styles.missionText}>{missionText}</p>
            </section>
          )}
        </div>
      </div>
    </header>
  );
}
