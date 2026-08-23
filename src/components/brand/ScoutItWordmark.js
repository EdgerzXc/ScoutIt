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

/** One visual and accessibility contract for ScoutIt brand lockups. */
export default function ScoutItWordmark({ href = null, className = "", children = null }) {
  if (href) {
    return (
      <Link href={href} className={`${styles.mark} ${styles.link} ${className}`.trim()} aria-label="ScoutIt" data-scoutit-wordmark>
        <Segments />
        {children}
      </Link>
    );
  }

  return (
    <span className={`${styles.mark} ${className}`.trim()} role="img" aria-label="ScoutIt" data-scoutit-wordmark>
      <Segments />
      {children}
    </span>
  );
}
