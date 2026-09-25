import Link from "next/link";

import InfoTip from "@/components/ui/InfoTip";
import styles from "@/components/descent/layerChrome.module.css";

// missionTipId (optional): when the mission paragraph is trimmed to one
// line, its explanation moves behind a "?" mark instead of leaving the page.
// Copy lives in the infoTips registry, never here.
export default function LayerHeader({ layerNum, layerName, title, description, missionText, missionTipId, ctaText, ctaHref }) {
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
              <p className={styles.missionText}>
                {missionText}
                {missionTipId && (
                  <>
                    {" "}
                    <InfoTip tipId={missionTipId} label="About this layer's mission" />
                  </>
                )}
              </p>
            </section>
          )}
        </div>
      </div>
    </header>
  );
}
