"use client";

import { useLayoutEffect } from "react";
import { MARK_PATH, MARK_VIEWBOX } from "@/components/brand/markPath";
import styles from "./GlobalRecovery.module.css";

export default function GlobalError({ reset }) {
  useLayoutEffect(() => {
    // React can replace the root layout on the client without executing the
    // document script below. Restore the saved mode in that path as well.
    try {
      let mode = localStorage.getItem("scoutit_display_mode");
      if (!mode && localStorage.getItem("scoutit_accessibility_mode") === "high-contrast") {
        mode = "high-contrast";
      }
      document.body.classList.toggle("high-contrast", mode === "high-contrast");
      document.body.classList.toggle("light-mode", mode === "light");
    } catch {
      // Storage may be blocked; the document stays on its dark default.
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={styles.body} suppressHydrationWarning>
        {/* global-error replaces the root layout, so it must restore the
            stored lens choice before this self-contained document paints. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){try{var m=localStorage.getItem('scoutit_display_mode');if(!m){m=localStorage.getItem('scoutit_accessibility_mode')==='high-contrast'?'high-contrast':null;}if(m==='high-contrast')document.body.classList.add('high-contrast');else if(m==='light')document.body.classList.add('light-mode');}catch(e){}})();",
          }}
        />
        <div className={styles.panel} role="alert">
          <svg
            viewBox={MARK_VIEWBOX}
            width="48"
            height="48"
            role="img"
            aria-label="ScoutIt"
            className={styles.mark}
          >
            <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
          </svg>
          <div className={styles.eyebrow}>
            SYSTEM SHIELD · CRITICAL RECOVERY
          </div>
          <h1 className={styles.title}>
            Something went wrong
          </h1>
          <p className={styles.message}>
            A transient system recovery boundary was triggered on ScoutIt. Our telemetry stream has captured the state trace.
          </p>
          <button
            onClick={() => reset()}
            className={styles.button}
          >
            RELOAD APPLICATION STATE
          </button>
        </div>
      </body>
    </html>
  );
}
