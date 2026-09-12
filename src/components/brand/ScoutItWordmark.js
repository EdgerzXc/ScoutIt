import Link from "next/link";

import styles from "@/components/brand/ScoutItWordmark.module.css";

function Segments() {
  return (
    <>
      <span className={`${styles.gold} brand-s word-s`} aria-hidden="true">S</span>
      <span className={`${styles.white} brand-scout word-scout`} aria-hidden="true">cout</span>
      <span className={`${styles.gold} brand-it word-it`} aria-hidden="true">IT</span>
    </>
  );
}

/**
 * One visual and accessibility contract for ScoutIt brand lockups.
 *
 * `leading` renders before the letterforms, for lockups that pair the mark
 * with the wordmark. It sits inside the link so the whole lockup is one
 * target, and it is decorative — the accessible name stays "ScoutIt" alone,
 * so a screen reader does not announce the brand twice.
 */
export default function ScoutItWordmark({ href = null, className = "", children = null, leading = null }) {
  if (href) {
    return (
      <Link href={href} className={`${styles.mark} ${styles.link} ${className}`.trim()} aria-label="ScoutIt" data-scoutit-wordmark>
        {leading ? <span className={styles.leading}>{leading}</span> : null}
        <Segments />
        {children}
      </Link>
    );
  }

  return (
    <span className={`${styles.mark} ${className}`.trim()} role="img" aria-label="ScoutIt" data-scoutit-wordmark>
      {leading ? <span className={styles.leading}>{leading}</span> : null}
      <Segments />
      {children}
    </span>
  );
}
